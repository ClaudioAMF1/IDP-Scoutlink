from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.models import PerfilTipo
from app.api.schemas import PerfilTipoCreate, PerfilTipoResponse

router = APIRouter()


@router.get("/", response_model=List[PerfilTipoResponse])
def list_perfis(db: Session = Depends(get_db)):
    return db.query(PerfilTipo).order_by(PerfilTipo.id).all()


@router.get("/{perfil_id}", response_model=PerfilTipoResponse)
def get_perfil(perfil_id: int, db: Session = Depends(get_db)):
    perfil = db.query(PerfilTipo).filter(PerfilTipo.id == perfil_id).first()
    if not perfil:
        raise HTTPException(404, "Perfil não encontrado")
    return perfil


@router.post("/", response_model=PerfilTipoResponse, status_code=status.HTTP_201_CREATED)
def create_perfil(payload: PerfilTipoCreate, db: Session = Depends(get_db)):
    existing = db.query(PerfilTipo).filter(PerfilTipo.nome == payload.nome).first()
    if existing:
        raise HTTPException(400, "Perfil com esse nome já existe")
    perfil = PerfilTipo(nome=payload.nome, descricao=payload.descricao)
    db.add(perfil)
    db.commit()
    db.refresh(perfil)
    return perfil
