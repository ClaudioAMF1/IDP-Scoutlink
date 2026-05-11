from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.models import UEL
from app.api.schemas import UELCreate, UELResponse

router = APIRouter()

# Seed data: All 43 groups from https://escoteirosdf.org.br/escoteiros-do-df/grupos-escoteiros/
SEED_UELS = [
    # ÁGUAS CLARAS
    {"nome": "AVE BRANCA - 13°DF", "tipo": "Grupo", "distrito": "ÁGUAS CLARAS", "endereco": "Parque Ecológico de Águas Claras, s/n - Águas Claras, Brasília - DF, 71930-000", "latitude": -15.8350, "longitude": -48.0280, "numero": "13"},
    {"nome": "ÁGUAS CLARAS - 40°DF", "tipo": "Grupo", "distrito": "ÁGUAS CLARAS", "endereco": "Quadra 207, 10 - Águas Claras, Brasília - DF, 71929-540", "latitude": -15.8400, "longitude": -48.0300, "numero": "40"},
    {"nome": "VERA CRUZ - 56°DF", "tipo": "Grupo", "distrito": "ÁGUAS CLARAS", "endereco": "Parque Ecológico Águas Claras - Águas Claras, Brasília - DF, 71930-000", "latitude": -15.8340, "longitude": -48.0250, "numero": "56"},
    {"nome": "MOSQUETEIROS - 57°DF", "tipo": "Grupo", "distrito": "ÁGUAS CLARAS", "endereco": "Parque Ecológico Águas Claras, s/n - Águas Claras, Brasília - DF, 71930-000", "latitude": -15.8360, "longitude": -48.0270, "numero": "57"},
    # ALTO PARAÍSO DE GOIÁS
    {"nome": "LOBO DA CHAPADA - 20°DF", "tipo": "Grupo", "distrito": "ALTO PARAÍSO DE GOIÁS", "endereco": "Rua 3a, Quadra 10, APM 03 - Cidade Alta, Alto Paraíso de Goiás - GO, 73770-000", "latitude": -14.1360, "longitude": -47.5200, "numero": "20"},
    # ASA NORTE
    {"nome": "MORAES ANTAS - 1°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SGAN 916 - Asa Norte, Brasília - DF, 70790-160", "latitude": -15.7480, "longitude": -47.8960, "numero": "1"},
    {"nome": "MARECHAL RONDON - 4°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SGAN 909 Módulo B, s/n - Asa Norte, Brasília - DF, 70790-092", "latitude": -15.7450, "longitude": -47.8920, "numero": "4"},
    {"nome": "DO AR OLAVO BILAC - 10°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SGAN 609 - Asa Norte, Brasília - DF, 70830-403", "latitude": -15.7600, "longitude": -47.8700, "numero": "10"},
    {"nome": "BERNARDO SAYÃO - 14°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SGAN EQ 707/907, s/n - Asa Norte, Brasília - DF, 70790-000", "latitude": -15.7530, "longitude": -47.8850, "numero": "14"},
    {"nome": "VILLAGRAN CABRITA - 19°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SGAN 902/904, s/n - Asa Norte, Brasília - DF, 70790-025", "latitude": -15.7460, "longitude": -47.8940, "numero": "19"},
    {"nome": "DO MAR ALMIRANTE BENJAMIN SODRÉ - 23°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SCEN, Setor de Clubes e Esportivo Norte, Lote 11 - Asa Norte, Brasília - DF", "latitude": -15.7620, "longitude": -47.8540, "numero": "23"},
    {"nome": "SÃO MIGUEL - 48°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "EQN 303/304, s/n - Asa Norte, Brasília - DF, 70735-400", "latitude": -15.7660, "longitude": -47.8700, "numero": "48"},
    {"nome": "DO MAR CORSÁRIOS DO CERRADO - 61°DF", "tipo": "Grupo", "distrito": "ASA NORTE", "endereco": "SCEN Trecho 2, Lote 13/1 - Asa Norte, Brasília - DF, 70800-000", "latitude": -15.7640, "longitude": -47.8560, "numero": "61"},
    {"nome": "SEÇÃO AUTÔNOMA ALCATEIA MAX WOLF - 72°DF", "tipo": "Secao_Autonoma", "distrito": "ASA NORTE", "endereco": "SQN 113 A 306 - Asa Norte, Brasília - DF, 70763-010", "latitude": -15.7500, "longitude": -47.8760, "numero": "72"},
    # ASA SUL
    {"nome": "JOSÉ DE ANCHIETA - 11°DF", "tipo": "Grupo", "distrito": "ASA SUL", "endereco": "Parque Recreativo Sarah Kubitschek, s/n - Asa Sul, Brasília - DF", "latitude": -15.7960, "longitude": -47.8930, "numero": "11"},
    {"nome": "DOM PEDRO II - 12°DF", "tipo": "Grupo", "distrito": "ASA SUL", "endereco": "SGAS 609 - Asa Sul, Brasília - DF, 70000-000", "latitude": -15.8060, "longitude": -47.8970, "numero": "12"},
    {"nome": "ATOS DOIS - 60°DF", "tipo": "Grupo", "distrito": "ASA SUL", "endereco": "Templo Capelania Evangélica da PMDF, 04 - Asa Sul, Brasília - DF", "latitude": -15.8130, "longitude": -47.9080, "numero": "60"},
    # CIDADE ECLÉTICA
    {"nome": "MESTRE YOKAANAM - 33°DF", "tipo": "Grupo", "distrito": "CIDADE ECLÉTICA", "endereco": "Caixa Postal, 17 - Cidade Eclética, Santo Antônio do Descoberto - GO", "latitude": -16.0300, "longitude": -48.2600, "numero": "33"},
    # FORMOSA
    {"nome": "SEMEAR - 67°DF", "tipo": "Grupo", "distrito": "FORMOSA", "endereco": "Av. João Isper Gebrim, 1482 - Formosinha, Formosa - GO, 73801-620", "latitude": -15.5370, "longitude": -47.3360, "numero": "67"},
    # GAMA
    {"nome": "GÊNESIS - 22°DF", "tipo": "Grupo", "distrito": "GAMA", "endereco": "SCC Bloco 03, Lotes 21/39, Sala 106 - Gama, Brasília - DF", "latitude": -16.0050, "longitude": -48.0600, "numero": "22"},
    # GRANDE COLORADO
    {"nome": "GRANDE COLORADO - 37°DF", "tipo": "Grupo", "distrito": "GRANDE COLORADO", "endereco": "Cond. Solar de Athenas, Lote 1/2, Ed. Pontal, Sala 105 - Grande Colorado, Sobradinho - DF", "latitude": -15.6400, "longitude": -47.8400, "numero": "37"},
    # JARDIM BOTÂNICO
    {"nome": "SEÇÃO AUTÔNOMA ALCATEIA SÃO MIGUEL ARCANJO - 74°DF", "tipo": "Secao_Autonoma", "distrito": "JARDIM BOTÂNICO", "endereco": "Condomínio Solar Brasília, Quadra 3 - Jardim Botânico, Brasília - DF", "latitude": -15.8700, "longitude": -47.8200, "numero": "74"},
    # JARDINS MANGUEIRAL
    {"nome": "JARDINS MANGUEIRAL - 54°DF", "tipo": "Grupo", "distrito": "JARDINS MANGUEIRAL", "endereco": "Av. Mangueiral, Comércio Local 2 - Jardins Mangueiral, Brasília - DF, 71680-601", "latitude": -15.8650, "longitude": -47.7900, "numero": "54"},
    # LAGO NORTE
    {"nome": "LIS DO LAGO - 15°DF", "tipo": "Grupo", "distrito": "LAGO NORTE", "endereco": "SHIN EQL 4/6 Área Especial, s/n - Lago Norte, Brasília - DF", "latitude": -15.7350, "longitude": -47.8450, "numero": "15"},
    {"nome": "GAVIÃO REAL - 36°DF", "tipo": "Grupo", "distrito": "LAGO NORTE", "endereco": "SHIN Parque Vivencial II - Lago Norte, Brasília - DF, 71540-000", "latitude": -15.7300, "longitude": -47.8380, "numero": "36"},
    # LAGO SUL
    {"nome": "DO AR SALGADO FILHO - 9°DF", "tipo": "Grupo", "distrito": "LAGO SUL", "endereco": "SHIS QI 3, Conjunto 3 - Lago Sul, Brasília - DF, 71605-230", "latitude": -15.8270, "longitude": -47.8600, "numero": "9"},
    # NOROESTE
    {"nome": "SEÇÃO AUTÔNOMA ALCATÉIA NOROESTE - 62°DF", "tipo": "Secao_Autonoma", "distrito": "NOROESTE", "endereco": "SQNW 109 - Noroeste, Brasília - DF, 70686-150", "latitude": -15.7450, "longitude": -47.8900, "numero": "62"},
    # NÚCLEO BANDEIRANTE
    {"nome": "JK - 2°DF", "tipo": "Grupo", "distrito": "NÚCLEO BANDEIRANTE", "endereco": "3ª Av. Área Especial 4, Centro de Ensino Médio, 01 - Núcleo Bandeirante, Brasília - DF", "latitude": -15.8700, "longitude": -47.9700, "numero": "2"},
    {"nome": "HOKMA-GUARÁ - 35°DF", "tipo": "Grupo", "distrito": "NÚCLEO BANDEIRANTE", "endereco": "Setor JK, Lote D - Núcleo Bandeirante, Brasília - DF", "latitude": -15.8680, "longitude": -47.9720, "numero": "35"},
    # PARK WAY
    {"nome": "JOÃO XXIII - 7°DF", "tipo": "Grupo", "distrito": "PARK WAY", "endereco": "SMPW Quadra 1, Conjunto 5, Lote 01 - Park Way, Brasília - DF", "latitude": -15.8900, "longitude": -47.9500, "numero": "7"},
    {"nome": "BADEN-POWELL - 70°DF", "tipo": "Grupo", "distrito": "PARK WAY", "endereco": "SMPW Quadra 27, Conjunto 03, s/n - Park Way, Brasília - DF", "latitude": -15.8950, "longitude": -47.9450, "numero": "70"},
    # RECANTO DAS EMAS
    {"nome": "AZIMUTE 77 - 55°DF", "tipo": "Grupo", "distrito": "RECANTO DAS EMAS", "endereco": "BR 060 KM 0, Chácara 24 - Recanto das Emas, Brasília - DF", "latitude": -15.9150, "longitude": -48.0600, "numero": "55"},
    # RIACHO FUNDO
    {"nome": "SAGRADO CORAÇÃO DE JESUS - 69°DF", "tipo": "Grupo", "distrito": "RIACHO FUNDO", "endereco": "QS 2 Área Especial D, s/n - Riacho Fundo I, Brasília - DF", "latitude": -15.8800, "longitude": -48.0200, "numero": "69"},
    # SAMAMBAIA
    {"nome": "TRIBO JUDÁ - 43°DF", "tipo": "Grupo", "distrito": "SAMAMBAIA", "endereco": "QR 611 - Samambaia, Brasília - DF, 72331-600", "latitude": -15.8750, "longitude": -48.0850, "numero": "43"},
    {"nome": "SAMA-MBAE - 71°DF", "tipo": "Grupo", "distrito": "SAMAMBAIA", "endereco": "Quadra 101 - Samambaia, Brasília - DF", "latitude": -15.8700, "longitude": -48.0900, "numero": "71"},
    # SANTA MARIA
    {"nome": "SANTOS DUMONT - 68°DF", "tipo": "Grupo", "distrito": "SANTA MARIA", "endereco": "QRC 11, 08 - Santa Maria, Brasília - DF, 72592-111", "latitude": -16.0200, "longitude": -47.9900, "numero": "68"},
    # SETOR MILITAR URBANO
    {"nome": "CAIO MARTINS - 6°DF", "tipo": "Grupo", "distrito": "SETOR MILITAR URBANO", "endereco": "QRS/AE, SMU, 826 - Setor Militar Urbano, Brasília - DF", "latitude": -15.7900, "longitude": -47.9200, "numero": "6"},
    # SOBRADINHO
    {"nome": "JOÃO DE BARRO - 3°DF", "tipo": "Grupo", "distrito": "SOBRADINHO", "endereco": "Quadra 12, Área Reservada, 5 - Sobradinho, Brasília - DF", "latitude": -15.6520, "longitude": -47.7870, "numero": "3"},
    {"nome": "RK - 58°DF", "tipo": "Grupo", "distrito": "SOBRADINHO", "endereco": "Condomínio RK, s/n - Região dos Lagos (Sobradinho), Brasília - DF", "latitude": -15.6350, "longitude": -47.7700, "numero": "58"},
    {"nome": "CARCARÁ - 65°DF", "tipo": "Grupo", "distrito": "SOBRADINHO", "endereco": "Rodovia BR 020 KM 12, s/n - Sobradinho, Brasília - DF, 73050-000", "latitude": -15.6480, "longitude": -47.7950, "numero": "65"},
    # TAGUATINGA
    {"nome": "ROBERTO SIMONSEN - 5°DF", "tipo": "Grupo", "distrito": "TAGUATINGA", "endereco": "Setor F/Norte, Áreas Especiais, SESI, 23/24 - Taguatinga, Brasília - DF", "latitude": -15.8400, "longitude": -48.0500, "numero": "5"},
    # VALPARAÍSO
    {"nome": "CANAÃ - 52°DF", "tipo": "Grupo", "distrito": "VALPARAÍSO", "endereco": "Escola Municipal Marcus Antonio Salerno, Rua 7, s/n - Cidade Jardins, Valparaíso - GO", "latitude": -16.0700, "longitude": -47.9800, "numero": "52"},
    {"nome": "LUZ E TRABALHO - 25°DF", "tipo": "Grupo", "distrito": "VALPARAÍSO", "endereco": "Av. Senador Tancredo Neves, Etapa D, AE-01 - Valparaíso I - GO", "latitude": -16.0600, "longitude": -47.9700, "numero": "25"},
]

# Default profiles from documentation
SEED_PERFIS = [
    {"nome": "Membro Juvenil", "descricao": "Jovens associados ao grupo escoteiro"},
    {"nome": "Escotista", "descricao": "Adulto voluntário responsável pela aplicação do programa educativo"},
    {"nome": "Dirigente de UEL", "descricao": "Membro responsável por questões administrativas da UEL"},
    {"nome": "Pais / Responsáveis", "descricao": "Pais ou responsáveis legais dos membros juvenis"},
    {"nome": "Gestor - ER", "descricao": "Gestor do Escritório Regional"},
    {"nome": "Funcionário - ER", "descricao": "Funcionário do Escritório Regional"},
    {"nome": "Estagiário - ER", "descricao": "Estagiário do Escritório Regional"},
]


@router.get("/", response_model=List[UELResponse])
def list_uels(db: Session = Depends(get_db)):
    return db.query(UEL).order_by(UEL.nome).all()


@router.get("/{uel_id}", response_model=UELResponse)
def get_uel(uel_id: int, db: Session = Depends(get_db)):
    uel = db.query(UEL).filter(UEL.id == uel_id).first()
    if not uel:
        raise HTTPException(404, "UEL não encontrada")
    return uel


@router.post("/", response_model=UELResponse, status_code=status.HTTP_201_CREATED)
def create_uel(payload: UELCreate, db: Session = Depends(get_db)):
    uel = UEL(**payload.model_dump())
    db.add(uel)
    db.commit()
    db.refresh(uel)
    return uel


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_uels_and_perfis(db: Session = Depends(get_db)):
    """Popula as tabelas de UELs e Perfis com dados iniciais.
    Idempotente — pula registros que já existem (por nome)."""
    from app.models import PerfilTipo

    created_uels = 0
    for uel_data in SEED_UELS:
        exists = db.query(UEL).filter(UEL.nome == uel_data["nome"]).first()
        if not exists:
            db.add(UEL(**uel_data))
            created_uels += 1

    created_perfis = 0
    for perfil_data in SEED_PERFIS:
        exists = db.query(PerfilTipo).filter(PerfilTipo.nome == perfil_data["nome"]).first()
        if not exists:
            db.add(PerfilTipo(**perfil_data))
            created_perfis += 1

    db.commit()
    return {
        "message": "Seed concluído",
        "uels_criadas": created_uels,
        "perfis_criados": created_perfis,
        "total_uels": db.query(UEL).count(),
        "total_perfis": db.query(PerfilTipo).count(),
    }
