from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.db import get_db
from app.models import Notificacao, NotificacaoUsuario, Profile, UEL, PerfilTipo
from app.api.schemas import NotificacaoCreate, NotificacaoResponse, NotificacaoListItem

router = APIRouter()

VALID_CATEGORIAS = {"Evento", "Curso", "Noticia", "Malote"}


def _enrich_notificacao(n: Notificacao) -> dict:
    """Converte uma Notificacao SQLAlchemy em dict com nomes resolvidos."""
    return {
        "id": n.id,
        "titulo": n.titulo,
        "descricao": n.descricao,
        "categoria": n.categoria,
        "autor_id": n.autor_id,
        "alvo_uel_id": n.alvo_uel_id,
        "alvo_perfil_id": n.alvo_perfil_id,
        "data_criacao": n.data_criacao,
        "autor_nome": n.autor.full_name if n.autor else None,
        "alvo_uel_nome": n.alvo_uel.nome if n.alvo_uel else None,
        "alvo_perfil_nome": n.alvo_perfil.nome if n.alvo_perfil else None,
    }


# ── POST /api/notificacoes/ ──────────────────────────────
@router.post("/", response_model=NotificacaoResponse, status_code=status.HTTP_201_CREATED)
def create_notificacao(payload: NotificacaoCreate, db: Session = Depends(get_db)):
    if payload.categoria not in VALID_CATEGORIAS:
        raise HTTPException(400, f"Categoria inválida. Use: {VALID_CATEGORIAS}")

    # Validate FK references if provided
    if payload.alvo_uel_id:
        uel = db.query(UEL).filter(UEL.id == payload.alvo_uel_id).first()
        if not uel:
            raise HTTPException(400, "UEL alvo não encontrada")

    if payload.alvo_perfil_id:
        perfil = db.query(PerfilTipo).filter(PerfilTipo.id == payload.alvo_perfil_id).first()
        if not perfil:
            raise HTTPException(400, "Perfil alvo não encontrado")

    if payload.autor_id:
        autor = db.query(Profile).filter(Profile.id == payload.autor_id).first()
        if not autor:
            raise HTTPException(400, "Autor (usuário responsável) não encontrado")

    notif = Notificacao(
        titulo=payload.titulo,
        descricao=payload.descricao,
        categoria=payload.categoria,
        autor_id=payload.autor_id,
        alvo_uel_id=payload.alvo_uel_id,
        alvo_perfil_id=payload.alvo_perfil_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Eager load relationships for response
    notif = (
        db.query(Notificacao)
        .options(joinedload(Notificacao.autor), joinedload(Notificacao.alvo_uel), joinedload(Notificacao.alvo_perfil))
        .filter(Notificacao.id == notif.id)
        .first()
    )

    return _enrich_notificacao(notif)


# ── GET /api/notificacoes/ ────────────────────────────────
@router.get("/", response_model=List[NotificacaoListItem])
def list_notificacoes(
    categoria: Optional[str] = None,
    uel_id: Optional[int] = None,
    perfil_id: Optional[int] = None,
    publico: Optional[bool] = Query(None, description="Se true, retorna apenas notícias gerais e eventos (para usuários deslogados)"),
    db: Session = Depends(get_db),
):
    q = db.query(Notificacao).options(
        joinedload(Notificacao.autor),
        joinedload(Notificacao.alvo_uel),
        joinedload(Notificacao.alvo_perfil),
    )

    if publico:
        # Usuário deslogado: apenas Noticia e Evento globais (sem UEL/perfil alvo)
        q = q.filter(
            Notificacao.categoria.in_(["Noticia", "Evento"]),
            Notificacao.alvo_uel_id.is_(None),
            Notificacao.alvo_perfil_id.is_(None),
        )
    else:
        if categoria and categoria in VALID_CATEGORIAS:
            q = q.filter(Notificacao.categoria == categoria)

        if uel_id:
            # Notificações para UEL específica OU para todas as UELs
            q = q.filter(
                (Notificacao.alvo_uel_id == uel_id) | (Notificacao.alvo_uel_id.is_(None))
            )

        if perfil_id:
            # Notificações para perfil específico OU para todos os perfis
            q = q.filter(
                (Notificacao.alvo_perfil_id == perfil_id) | (Notificacao.alvo_perfil_id.is_(None))
            )

    notifs = q.order_by(Notificacao.data_criacao.desc()).all()
    return [_enrich_notificacao(n) for n in notifs]


# ── GET /api/notificacoes/{id} ────────────────────────────
@router.get("/{notificacao_id}", response_model=NotificacaoResponse)
def get_notificacao(notificacao_id: int, db: Session = Depends(get_db)):
    notif = (
        db.query(Notificacao)
        .options(joinedload(Notificacao.autor), joinedload(Notificacao.alvo_uel), joinedload(Notificacao.alvo_perfil))
        .filter(Notificacao.id == notificacao_id)
        .first()
    )
    if not notif:
        raise HTTPException(404, "Notificação não encontrada")
    return _enrich_notificacao(notif)


# ── DELETE /api/notificacoes/{id} ─────────────────────────
@router.delete("/{notificacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notificacao(notificacao_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notificacao).filter(Notificacao.id == notificacao_id).first()
    if not notif:
        raise HTTPException(404, "Notificação não encontrada")
    db.delete(notif)
    db.commit()
