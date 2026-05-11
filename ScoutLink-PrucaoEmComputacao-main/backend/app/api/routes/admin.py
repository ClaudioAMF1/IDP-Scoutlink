from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.db import get_db
from app.models import Profile, PerfilTipo, UEL
from app.api.schemas import AdminUserResponse, AdminToggle

router = APIRouter()


def _enrich_admin(p: Profile) -> dict:
    return {
        "id": p.id,
        "supabase_user_id": p.supabase_user_id,
        "email": p.email,
        "full_name": p.full_name,
        "is_admin": p.is_admin,
        "perfil_nome": p.perfil.nome if p.perfil else None,
        "uel_nome": p.uel.nome if p.uel else None,
    }


# ── GET /api/admin/users — Lista usuários com permissões admin
@router.get("/users", response_model=List[AdminUserResponse])
def list_admin_users(db: Session = Depends(get_db)):
    admins = (
        db.query(Profile)
        .options(joinedload(Profile.perfil), joinedload(Profile.uel))
        .filter(Profile.is_admin == True)
        .order_by(Profile.full_name)
        .all()
    )
    return [_enrich_admin(a) for a in admins]


# ── GET /api/admin/users/all — Lista todos os usuários (para busca)
@router.get("/users/all", response_model=List[AdminUserResponse])
def list_all_users(db: Session = Depends(get_db)):
    users = (
        db.query(Profile)
        .options(joinedload(Profile.perfil), joinedload(Profile.uel))
        .order_by(Profile.full_name)
        .all()
    )
    return [_enrich_admin(u) for u in users]


# ── PATCH /api/admin/users/{profile_id}/toggle — Adicionar/Remover admin
@router.patch("/users/{profile_id}/toggle", response_model=AdminUserResponse)
def toggle_admin(profile_id: int, payload: AdminToggle, db: Session = Depends(get_db)):
    user = (
        db.query(Profile)
        .options(joinedload(Profile.perfil), joinedload(Profile.uel))
        .filter(Profile.id == profile_id)
        .first()
    )
    if not user:
        raise HTTPException(404, "Usuário não encontrado")

    user.is_admin = payload.is_admin
    db.commit()
    db.refresh(user)
    return _enrich_admin(user)
