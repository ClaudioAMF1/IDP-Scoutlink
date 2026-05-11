from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db import get_db
from app.models import Chamado, ChamadoMensagem
from app.api.schemas import (
    ChamadoCreate, ChamadoResponse, ChamadoListItem,
    ChamadoUpdateStatus, MensagemCreate, MensagemResponse,
)

router = APIRouter()

VALID_CATEGORIES = {"duvida", "evento", "administrativo"}
VALID_STATUSES = {"aberto", "em_andamento", "resolvido"}


# ── POST /api/chamados/ ──────────────────────────────────
@router.post("/", response_model=ChamadoResponse, status_code=status.HTTP_201_CREATED)
def create_chamado(
    payload: ChamadoCreate,
    x_supabase_uid: str = Query(..., alias="user_id"),
    x_supabase_role: str = Query("associado", alias="user_role"),
    db: Session = Depends(get_db),
):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Categoria inválida. Use: {VALID_CATEGORIES}")

    chamado = Chamado(
        supabase_user_id=x_supabase_uid,
        title=payload.title,
        category=payload.category,
        status="aberto",
    )
    db.add(chamado)
    db.flush()

    msg = ChamadoMensagem(
        chamado_id=chamado.id,
        sender_id=x_supabase_uid,
        sender_role=x_supabase_role,
        content=payload.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(chamado)
    db.refresh(chamado)
    # Fetch from auth.users
    from sqlalchemy import text
    try:
        res = db.execute(text("SELECT raw_user_meta_data->>'full_name', email FROM auth.users WHERE id = :uid"), {"uid": x_supabase_uid}).fetchone()
        if res:
            chamado.creator_name = res[0] or res[1] or "Usuário Desconhecido"
        else:
            chamado.creator_name = "Usuário Desconhecido"
    except Exception:
        chamado.creator_name = "Usuário Desconhecido"
    return chamado


# ── GET /api/chamados/ ────────────────────────────────────
@router.get("/", response_model=List[ChamadoListItem])
def list_chamados(
    user_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    q = db.query(Chamado)
    if user_id:
        q = q.filter(Chamado.supabase_user_id == user_id)
    if status_filter and status_filter in VALID_STATUSES:
        q = q.filter(Chamado.status == status_filter)
    chamados = q.order_by(Chamado.created_at.desc()).all()
    if not chamados:
        return []

    uids = list({c.supabase_user_id for c in chamados})
    
    p_map = {}
    if uids:
        from sqlalchemy import text, bindparam
        try:
            stmt = text("SELECT id, raw_user_meta_data->>'full_name', email FROM auth.users WHERE id::text IN :uids")
            stmt = stmt.bindparams(bindparam('uids', expanding=True))
            res = db.execute(stmt, {"uids": uids}).fetchall()
            for row in res:
                p_map[str(row[0])] = row[1] or row[2] or "Usuário Desconhecido"
        except Exception as e:
            print("Error parsing auth.users in list_chamados:", e)
            pass

    for c in chamados:
        c.creator_name = p_map.get(c.supabase_user_id, "Usuário Desconhecido")
    return chamados


# ── GET /api/chamados/{id} ────────────────────────────────
@router.get("/{chamado_id}", response_model=ChamadoResponse)
def get_chamado(chamado_id: int, db: Session = Depends(get_db)):
    chamado = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not chamado:
        raise HTTPException(404, "Chamado não encontrado")
    
    from sqlalchemy import text
    try:
        res = db.execute(text("SELECT raw_user_meta_data->>'full_name', email FROM auth.users WHERE id = :uid"), {"uid": chamado.supabase_user_id}).fetchone()
        if res:
            chamado.creator_name = res[0] or res[1] or "Usuário Desconhecido"
        else:
            chamado.creator_name = "Usuário Desconhecido"
    except Exception:
        chamado.creator_name = "Usuário Desconhecido"
        
    return chamado


# ── PATCH /api/chamados/{id}/status ───────────────────────
@router.patch("/{chamado_id}/status", response_model=ChamadoResponse)
def update_chamado_status(
    chamado_id: int,
    payload: ChamadoUpdateStatus,
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"Status inválido. Use: {VALID_STATUSES}")

    chamado = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not chamado:
        raise HTTPException(404, "Chamado não encontrado")

    chamado.status = payload.status
    db.commit()
    db.refresh(chamado)
    
    from sqlalchemy import text
    try:
        res = db.execute(text("SELECT raw_user_meta_data->>'full_name', email FROM auth.users WHERE id = :uid"), {"uid": chamado.supabase_user_id}).fetchone()
        if res:
            chamado.creator_name = res[0] or res[1] or "Usuário Desconhecido"
        else:
            chamado.creator_name = "Usuário Desconhecido"
    except Exception:
        chamado.creator_name = "Usuário Desconhecido"
        
    return chamado


# ── POST /api/chamados/{id}/mensagens ─────────────────────
@router.post("/{chamado_id}/mensagens", response_model=MensagemResponse, status_code=status.HTTP_201_CREATED)
def add_mensagem(
    chamado_id: int,
    payload: MensagemCreate,
    sender_id: str = Query(...),
    sender_role: str = Query("associado"),
    db: Session = Depends(get_db),
):
    chamado = db.query(Chamado).filter(Chamado.id == chamado_id).first()
    if not chamado:
        raise HTTPException(404, "Chamado não encontrado")

    msg = ChamadoMensagem(
        chamado_id=chamado_id,
        sender_id=sender_id,
        sender_role=sender_role,
        content=payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
