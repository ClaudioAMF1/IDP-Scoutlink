from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


# ── Tabelas de Domínio ────────────────────────────────────

class PerfilTipo(Base):
    """tb_perfil — Perfis e Funções (tipos de notificação que o usuário recebe)"""
    __tablename__ = "perfis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(String(500), nullable=True)

    usuarios: Mapped[list["Profile"]] = relationship("Profile", back_populates="perfil")


class UEL(Base):
    """tb_uel — Unidades Escoteiras Locais"""
    __tablename__ = "uels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), default="Grupo", nullable=False)  # Grupo, Secao_Autonoma
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)
    endereco: Mapped[str | None] = mapped_column(String(500), nullable=True)
    distrito: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)  # Ex: "13" for 13°DF

    usuarios: Mapped[list["Profile"]] = relationship("Profile", back_populates="uel")
    malotes: Mapped[list["Malote"]] = relationship("Malote", back_populates="uel")
    notificacoes: Mapped[list["Notificacao"]] = relationship("Notificacao", back_populates="alvo_uel", foreign_keys="Notificacao.alvo_uel_id")


# ── Gestão de Usuários ────────────────────────────────────

class Profile(Base):
    """tb_usuario — Usuários do sistema"""
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cpf: Mapped[str | None] = mapped_column(String(14), unique=True, nullable=True)
    registro: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Registro escoteiro (opcional)

    uel_id: Mapped[int | None] = mapped_column(ForeignKey("uels.id"), nullable=True)
    perfil_id: Mapped[int | None] = mapped_column(ForeignKey("perfis.id"), nullable=True)
    perfil_validado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    uel: Mapped["UEL | None"] = relationship("UEL", back_populates="usuarios")
    perfil: Mapped["PerfilTipo | None"] = relationship("PerfilTipo", back_populates="usuarios")


# ── Notificações e Comunicação ────────────────────────────

class Notificacao(Base):
    """tb_notificacao — Notificações e comunicados"""
    __tablename__ = "notificacoes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False)  # Evento, Curso, Noticia, Malote

    autor_id: Mapped[int | None] = mapped_column(ForeignKey("profiles.id"), nullable=True)
    alvo_uel_id: Mapped[int | None] = mapped_column(ForeignKey("uels.id"), nullable=True)  # Null = Todas
    alvo_perfil_id: Mapped[int | None] = mapped_column(ForeignKey("perfis.id"), nullable=True)  # Null = Todos

    data_criacao: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    autor: Mapped["Profile | None"] = relationship("Profile", foreign_keys=[autor_id])
    alvo_uel: Mapped["UEL | None"] = relationship("UEL", back_populates="notificacoes", foreign_keys=[alvo_uel_id])
    alvo_perfil: Mapped["PerfilTipo | None"] = relationship("PerfilTipo", foreign_keys=[alvo_perfil_id])
    leituras: Mapped[list["NotificacaoUsuario"]] = relationship("NotificacaoUsuario", back_populates="notificacao", cascade="all, delete-orphan")


class NotificacaoUsuario(Base):
    """tb_notificacao_usuario — Controle de leitura individual"""
    __tablename__ = "notificacao_usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    notificacao_id: Mapped[int] = mapped_column(ForeignKey("notificacoes.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    lida: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    data_leitura: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    notificacao: Mapped["Notificacao"] = relationship("Notificacao", back_populates="leituras")
    usuario: Mapped["Profile"] = relationship("Profile")


# ── TAAEC (funcionalidade extra, mantida) ─────────────────

class Taaec(Base):
    __tablename__ = "taaecs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome_atividade: Mapped[str] = mapped_column(String(255), nullable=False)
    uel_responsavel: Mapped[str] = mapped_column(String(255), nullable=False)
    ramos_participantes: Mapped[list[str]] = mapped_column(JSON, nullable=False)  # JSON list of strings
    quant_jovens: Mapped[int] = mapped_column(Integer, nullable=False)
    quant_adultos: Mapped[int] = mapped_column(Integer, nullable=False)
    objetivos_educativos: Mapped[str] = mapped_column(Text, nullable=False)
    nivel_risco: Mapped[str] = mapped_column(String(100), nullable=False)
    local_atividade: Mapped[str] = mapped_column(Text, nullable=False)
    url_localizador: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # Document URLs or paths (Optional based on the form, but let's assume nullable strings for now)
    doc_relatorio_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    doc_agenda_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    doc_outros_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Escotista Responsável
    escotista_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    escotista_email: Mapped[str] = mapped_column(String(255), nullable=False)
    escotista_celular: Mapped[str] = mapped_column(String(50), nullable=False)

    # Diretor / Autorizador
    diretor_nome: Mapped[str] = mapped_column(String(255), nullable=False)
    diretor_cargo: Mapped[str] = mapped_column(String(100), nullable=False)
    diretor_email: Mapped[str] = mapped_column(String(255), nullable=False)
    diretor_celular: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    uels_convidadas: Mapped[list["UelConvidada"]] = relationship("UelConvidada", back_populates="taaec", cascade="all, delete-orphan")


class UelConvidada(Base):
    __tablename__ = "taaec_uels_convidadas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    taaec_id: Mapped[int] = mapped_column(ForeignKey("taaecs.id", ondelete="CASCADE"), nullable=False)
    nome_uel: Mapped[str] = mapped_column(String(255), nullable=False)
    nome_responsavel: Mapped[str] = mapped_column(String(255), nullable=False)

    taaec: Mapped["Taaec"] = relationship("Taaec", back_populates="uels_convidadas")


# ── Atendimento (Chamados) ────────────────────────────────

class Chamado(Base):
    __tablename__ = "chamados"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # duvida, evento, administrativo
    status: Mapped[str] = mapped_column(String(50), default="aberto", nullable=False)  # aberto, em_andamento, resolvido

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    mensagens: Mapped[list["ChamadoMensagem"]] = relationship("ChamadoMensagem", back_populates="chamado", cascade="all, delete-orphan", order_by="ChamadoMensagem.created_at")


class ChamadoMensagem(Base):
    __tablename__ = "chamado_mensagens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    chamado_id: Mapped[int] = mapped_column(ForeignKey("chamados.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[str] = mapped_column(String(36), nullable=False)
    sender_role: Mapped[str] = mapped_column(String(50), nullable=False)  # associado, colaborador
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    chamado: Mapped["Chamado"] = relationship("Chamado", back_populates="mensagens")


# ── Logística — Malotes ───────────────────────────────────

class Malote(Base):
    """tb_malote — Pacotes para retirada no Escritório Regional"""
    __tablename__ = "malotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uel_id: Mapped[int] = mapped_column(ForeignKey("uels.id"), nullable=False)
    tipo: Mapped[str] = mapped_column(String(100), nullable=False)
    # Tipos: certificado, distintivo_regional, distintivo_nacional, registro_escoteiro,
    #        condecoracao, reconhecimento_ramo, outros
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="aguardando_retirada", nullable=False)
    # Status: aguardando_retirada, retirado

    data_registro: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    data_retirada: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    uel: Mapped["UEL"] = relationship("UEL", back_populates="malotes")
