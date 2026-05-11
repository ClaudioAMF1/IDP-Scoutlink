from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional
from datetime import datetime

# ── Perfis ────────────────────────────────────────────────

class PerfilTipoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None

class PerfilTipoCreate(PerfilTipoBase):
    pass

class PerfilTipoResponse(PerfilTipoBase):
    id: int

    class Config:
        from_attributes = True


# ── UELs ──────────────────────────────────────────────────

class UELBase(BaseModel):
    nome: str
    tipo: str = "Grupo"  # Grupo, Secao_Autonoma
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    endereco: Optional[str] = None
    distrito: Optional[str] = None
    numero: Optional[str] = None

class UELCreate(UELBase):
    pass

class UELResponse(UELBase):
    id: int

    class Config:
        from_attributes = True


# ── Notificações ──────────────────────────────────────────

class NotificacaoCreate(BaseModel):
    titulo: str
    descricao: str
    categoria: str  # Evento, Curso, Noticia, Malote
    autor_id: Optional[int] = None
    alvo_uel_id: Optional[int] = None  # Null = Todas
    alvo_perfil_id: Optional[int] = None  # Null = Todos

class NotificacaoResponse(BaseModel):
    id: int
    titulo: str
    descricao: str
    categoria: str
    autor_id: Optional[int] = None
    alvo_uel_id: Optional[int] = None
    alvo_perfil_id: Optional[int] = None
    data_criacao: datetime
    autor_nome: Optional[str] = None
    alvo_uel_nome: Optional[str] = None
    alvo_perfil_nome: Optional[str] = None

    class Config:
        from_attributes = True

class NotificacaoListItem(BaseModel):
    id: int
    titulo: str
    descricao: str
    categoria: str
    data_criacao: datetime
    autor_nome: Optional[str] = None
    alvo_uel_nome: Optional[str] = None
    alvo_perfil_nome: Optional[str] = None

    class Config:
        from_attributes = True


# ── Malotes (Novo modelo — pacotes para retirada) ────────

VALID_TIPOS_MALOTE = {
    "certificado", "distintivo_regional", "distintivo_nacional",
    "registro_escoteiro", "condecoracao", "reconhecimento_ramo", "outros"
}

VALID_STATUS_MALOTE = {"aguardando_retirada", "retirado"}

class MaloteCreate(BaseModel):
    uel_id: int
    tipo: str  # certificado, distintivo_regional, etc.
    descricao: Optional[str] = None

class MaloteUpdateStatus(BaseModel):
    status: str  # aguardando_retirada, retirado

class MaloteResponse(BaseModel):
    id: int
    uel_id: int
    uel_nome: Optional[str] = None
    tipo: str
    descricao: Optional[str] = None
    status: str
    data_registro: datetime
    data_retirada: Optional[datetime] = None

    class Config:
        from_attributes = True

class MaloteListItem(BaseModel):
    id: int
    uel_id: int
    uel_nome: Optional[str] = None
    tipo: str
    descricao: Optional[str] = None
    status: str
    data_registro: datetime
    data_retirada: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── TAAEC ─────────────────────────────────────────────────

class UelConvidadaBase(BaseModel):
    nome_uel: str
    nome_responsavel: str

class TaaecBase(BaseModel):
    nome_atividade: str
    uel_responsavel: str
    ramos_participantes: List[str]
    quant_jovens: int
    quant_adultos: int
    objetivos_educativos: str
    nivel_risco: str
    local_atividade: str
    url_localizador: str # Or HttpUrl later if STRICT validation is desired
    
    # Escotista Responsável
    escotista_nome: str
    escotista_email: EmailStr
    escotista_celular: str

    # Diretor / Autorizador
    diretor_nome: str
    diretor_cargo: str
    diretor_email: EmailStr
    diretor_celular: str
    
    # Nested UELs convidadas
    uels_convidadas: List[UelConvidadaBase] = []

class TaaecCreate(TaaecBase):
    pass

class UelConvidadaResponse(UelConvidadaBase):
    id: int
    taaec_id: int
    
    class Config:
        from_attributes = True

class TaaecResponse(TaaecBase):
    id: int
    doc_relatorio_path: Optional[str] = None
    doc_agenda_path: Optional[str] = None
    doc_outros_path: Optional[str] = None
    created_at: datetime
    uels_convidadas: List[UelConvidadaResponse] = []

    class Config:
        from_attributes = True


# ── Chamados ──────────────────────────────────────────────

class MensagemCreate(BaseModel):
    content: str

class MensagemResponse(BaseModel):
    id: int
    chamado_id: int
    sender_id: str
    sender_role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChamadoCreate(BaseModel):
    title: str
    category: str  # duvida, evento, administrativo
    message: str   # first message body

class ChamadoUpdateStatus(BaseModel):
    status: str  # aberto, em_andamento, resolvido

class ChamadoResponse(BaseModel):
    id: int
    supabase_user_id: str
    creator_name: Optional[str] = None
    title: str
    category: str
    status: str
    created_at: datetime
    updated_at: datetime
    mensagens: List[MensagemResponse] = []

    class Config:
        from_attributes = True

class ChamadoListItem(BaseModel):
    id: int
    supabase_user_id: str
    creator_name: Optional[str] = None
    title: str
    category: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Admin Management ─────────────────────────────────────

class AdminUserResponse(BaseModel):
    id: int
    supabase_user_id: str
    email: str
    full_name: Optional[str] = None
    is_admin: bool
    perfil_nome: Optional[str] = None
    uel_nome: Optional[str] = None

    class Config:
        from_attributes = True

class AdminToggle(BaseModel):
    is_admin: bool
