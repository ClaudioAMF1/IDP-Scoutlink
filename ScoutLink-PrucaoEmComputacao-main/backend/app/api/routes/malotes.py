from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List

from app.db import get_db
from app.models import Malote, UEL
from app.api.schemas import (
    MaloteCreate, MaloteResponse, MaloteListItem,
    MaloteUpdateStatus, VALID_TIPOS_MALOTE, VALID_STATUS_MALOTE,
)

router = APIRouter()


def _enrich_malote(m: Malote) -> dict:
    """Converte um Malote SQLAlchemy em dict com nome da UEL."""
    return {
        "id": m.id,
        "uel_id": m.uel_id,
        "uel_nome": m.uel.nome if m.uel else None,
        "tipo": m.tipo,
        "descricao": m.descricao,
        "status": m.status,
        "data_registro": m.data_registro,
        "data_retirada": m.data_retirada,
    }


# ── POST /api/malotes/ ───────────────────────────────────
@router.post("/", response_model=MaloteResponse, status_code=status.HTTP_201_CREATED)
def create_malote(payload: MaloteCreate, db: Session = Depends(get_db)):
    if payload.tipo not in VALID_TIPOS_MALOTE:
        raise HTTPException(400, f"Tipo inválido. Use: {VALID_TIPOS_MALOTE}")

    uel = db.query(UEL).filter(UEL.id == payload.uel_id).first()
    if not uel:
        raise HTTPException(400, "UEL não encontrada")

    malote = Malote(
        uel_id=payload.uel_id,
        tipo=payload.tipo,
        descricao=payload.descricao,
        status="aguardando_retirada",
    )
    db.add(malote)
    db.commit()
    db.refresh(malote)

    malote = db.query(Malote).options(joinedload(Malote.uel)).filter(Malote.id == malote.id).first()
    return _enrich_malote(malote)


# ── GET /api/malotes/ ─────────────────────────────────────
@router.get("/", response_model=List[MaloteListItem])
def list_malotes(
    status_filter: Optional[str] = Query(None, alias="status"),
    tipo_filter: Optional[str] = Query(None, alias="tipo"),
    uel_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Malote).options(joinedload(Malote.uel))
    if status_filter and status_filter in VALID_STATUS_MALOTE:
        q = q.filter(Malote.status == status_filter)
    if tipo_filter and tipo_filter in VALID_TIPOS_MALOTE:
        q = q.filter(Malote.tipo == tipo_filter)
    if uel_id:
        q = q.filter(Malote.uel_id == uel_id)
    malotes = q.order_by(Malote.data_registro.desc()).all()
    return [_enrich_malote(m) for m in malotes]


# ── GET /api/malotes/{id} ─────────────────────────────────
@router.get("/{malote_id}", response_model=MaloteResponse)
def get_malote(malote_id: int, db: Session = Depends(get_db)):
    malote = db.query(Malote).options(joinedload(Malote.uel)).filter(Malote.id == malote_id).first()
    if not malote:
        raise HTTPException(404, "Malote não encontrado")
    return _enrich_malote(malote)


# ── PATCH /api/malotes/{id}/status ────────────────────────
@router.patch("/{malote_id}/status", response_model=MaloteResponse)
def update_malote_status(
    malote_id: int,
    payload: MaloteUpdateStatus,
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUS_MALOTE:
        raise HTTPException(400, f"Status inválido. Use: {VALID_STATUS_MALOTE}")

    malote = db.query(Malote).options(joinedload(Malote.uel)).filter(Malote.id == malote_id).first()
    if not malote:
        raise HTTPException(404, "Malote não encontrado")

    malote.status = payload.status
    if payload.status == "retirado":
        malote.data_retirada = datetime.utcnow()

    db.commit()
    db.refresh(malote)
    return _enrich_malote(malote)


# ── DELETE /api/malotes/{id} ──────────────────────────────
@router.delete("/{malote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_malote(malote_id: int, db: Session = Depends(get_db)):
    malote = db.query(Malote).filter(Malote.id == malote_id).first()
    if not malote:
        raise HTTPException(404, "Malote não encontrado")

    db.delete(malote)
    db.commit()
