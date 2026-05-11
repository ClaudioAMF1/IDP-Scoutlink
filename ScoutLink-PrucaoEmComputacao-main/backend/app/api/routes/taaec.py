import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Taaec, UelConvidada
from app.api.schemas import TaaecCreate, TaaecResponse
from app.core import pdf_generator

router = APIRouter()

@router.post("/", response_model=TaaecResponse, status_code=status.HTTP_201_CREATED)
def create_taaec(taaec_in: TaaecCreate, db: Session = Depends(get_db)):
    # Create the main TAAEC
    db_taaec = Taaec(
        nome_atividade=taaec_in.nome_atividade,
        uel_responsavel=taaec_in.uel_responsavel,
        ramos_participantes=taaec_in.ramos_participantes,
        quant_jovens=taaec_in.quant_jovens,
        quant_adultos=taaec_in.quant_adultos,
        objetivos_educativos=taaec_in.objetivos_educativos,
        nivel_risco=taaec_in.nivel_risco,
        local_atividade=taaec_in.local_atividade,
        url_localizador=taaec_in.url_localizador,
        escotista_nome=taaec_in.escotista_nome,
        escotista_email=taaec_in.escotista_email,
        escotista_celular=taaec_in.escotista_celular,
        diretor_nome=taaec_in.diretor_nome,
        diretor_cargo=taaec_in.diretor_cargo,
        diretor_email=taaec_in.diretor_email,
        diretor_celular=taaec_in.diretor_celular,
    )

    db.add(db_taaec)
    db.commit()
    db.refresh(db_taaec)

    # Create associated UELs Convidadas
    for uel in taaec_in.uels_convidadas:
        db_uel = UelConvidada(
            taaec_id=db_taaec.id,
            nome_uel=uel.nome_uel,
            nome_responsavel=uel.nome_responsavel
        )
        db.add(db_uel)

    db.commit()
    db.refresh(db_taaec)

    return db_taaec

@router.get("/{id}", response_model=TaaecResponse)
def get_taaec(id: int, db: Session = Depends(get_db)):
    db_taaec = db.query(Taaec).filter(Taaec.id == id).first()
    if not db_taaec:
        raise HTTPException(status_code=404, detail="TAAEC not found")
    return db_taaec

from fastapi.responses import FileResponse

@router.get("/{id}/pdf")
def get_taaec_pdf(id: int, db: Session = Depends(get_db)):
    db_taaec = db.query(Taaec).filter(Taaec.id == id).first()
    if not db_taaec:
        raise HTTPException(status_code=404, detail="TAAEC not found")
    
    # Generate the PDF
    pdf_path = pdf_generator.generate_taaec_pdf(db_taaec)
    
    return FileResponse(
        path=pdf_path, 
        filename=f"TAAEC_{db_taaec.id}.pdf", 
        media_type="application/pdf"
    )
