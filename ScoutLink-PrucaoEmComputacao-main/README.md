# ⚜️ ScoutLink

Plataforma Integrada da **Região Escoteira do Distrito Federal**.

Este repositório contém o código do **Aplicativo Mobile** (focado nos Associados), do **Painel Web** (focado nos Colaboradores) e do **Backend** (FastAPI).

---

## 📁 Estrutura do Projeto

```
ScoutLink-PrucaoEmComputacao/
├── ScoutLink/          # App Mobile (Expo / React Native)
├── web/                # Painel Web Administrativo (React / Vite)
├── backend/            # API REST (FastAPI / Python)
└── README.md
```

| Pasta | Stack | Público |
|---|---|---|
| `/ScoutLink` | Expo (React Native), TypeScript | Associados escoteiros |
| `/web` | React, Vite, TypeScript | Colaboradores do ER (equipe regional, diretoria) |
| `/backend` | FastAPI, SQLAlchemy, PostgreSQL (Supabase) | API compartilhada |

---

## 🧩 Módulos e Funcionalidades

### App Mobile (`/ScoutLink`)

| Módulo | Descrição | Requer Login? |
|---|---|---|
| **📢 Feed de Notícias** | Notificações filtradas por perfil e UEL do usuário | ❌ Público (parcial) |
| **🗺️ Mapa de UELs** | Mapa interativo com localização dos grupos escoteiros | ❌ Público |
| **💬 Chamados** | Canal de atendimento (dúvidas, eventos, administrativo) | ✅ Sim |
| **👤 Perfil** | Dados do associado, UEL, perfil escoteiro | ✅ Sim |
| **⚙️ Configurações** | Preferências do app | ✅ Sim |

> **Nota:** O Feed funciona **sem login**, mostrando apenas Notícias Gerais e Eventos públicos. Usuários logados veem o feed completo filtrado pelo seu perfil e UEL.

### Painel Web (`/web`)

| Módulo | Descrição |
|---|---|
| **📊 Dashboard** | Visão geral com contadores reais de notificações, chamados, malotes e UELs |
| **📢 Comunicação** | Disparo de notificações com filtro por tipo, UEL e perfil |
| **💬 Chamados** | Gerenciamento de chamados dos associados com chat em tempo real |
| **📦 Malotes** | Gestão de pacotes para retirada no Escritório Regional |
| **📝 TAAEC Digital** | Formulário digital do Termo de Autorização com geração de PDF |
| **🛡️ Admin** | Gerenciamento de permissões administrativas |

### Backend (`/backend`)

| Rota | Descrição |
|---|---|
| `GET /api/health` | Health check |
| `GET/POST /api/perfis/` | CRUD de tipos de perfil |
| `GET/POST /api/uels/` | CRUD de UELs |
| `POST /api/uels/seed` | Popula UELs e Perfis iniciais no banco |
| `GET/POST /api/notificacoes/` | Disparo e listagem de notificações |
| `GET/POST /api/chamados/` | Chamados de atendimento |
| `GET/POST /api/malotes/` | Gestão de malotes |
| `GET/POST /api/taaec/` | TAAEC Digital |
| `GET/PATCH /api/admin/users/` | Gerenciamento de admin |

---

## 🏗️ Modelo de Dados

### Tabelas principais

| Tabela | Model | Descrição |
|---|---|---|
| `perfis` | `PerfilTipo` | Tipos de perfil (Membro Juvenil, Escotista, Dirigente, etc.) |
| `uels` | `UEL` | Unidades Escoteiras Locais com coordenadas |
| `profiles` | `Profile` | Usuários do sistema (com FK para UEL e Perfil) |
| `notificacoes` | `Notificacao` | Comunicados e notificações |
| `notificacao_usuarios` | `NotificacaoUsuario` | Controle de leitura individual |
| `malotes` | `Malote` | Pacotes para retirada no ER |
| `chamados` | `Chamado` | Chamados de atendimento |
| `chamado_mensagens` | `ChamadoMensagem` | Mensagens de chat dos chamados |
| `taaecs` | `Taaec` | Termos de autorização de atividade |

### Perfis disponíveis

1. Membro Juvenil
2. Escotista
3. Dirigente de UEL
4. Pais / Responsáveis
5. Gestor - ER
6. Funcionário - ER
7. Estagiário - ER

> Os perfis determinam **quais notificações** o usuário receberá. O cadastro é feito por autoatribuição.

---

## 🔐 Autenticação

A autenticação é centralizada no **Supabase Auth**.

| Tipo | Plataforma | Comportamento |
|---|---|---|
| **Associado** | Mobile | Cadastro com Nome, Email, Senha, UEL, Perfil e Registro (opcional). Marcador `platform: 'mobile'` |
| **Colaborador** | Web | Login direto. Não pode ter marcador `mobile` ou role `associado` |

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- Python 3.10+
- Node.js 18+
- npm
- Um projeto no [Supabase](https://supabase.com) configurado
- Expo Go no celular (para testar o app mobile)

---

### 1. Backend (FastAPI)

```bash
# Entrar na pasta
cd backend

# Criar e ativar ambiente virtual
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# .venv\Scripts\activate    # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Editar o .env com suas credenciais do Supabase
# DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Iniciar o servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

O servidor estará em: `http://localhost:8000`

> **Importante:** Na primeira execução, as tabelas serão criadas automaticamente no banco de dados via `Base.metadata.create_all()`.

#### Seed de dados iniciais

Após o servidor estar rodando, execute o seed para popular UELs e Perfis:

```bash
curl -X POST http://localhost:8000/api/uels/seed
```

Isso criará as **43 UELs** do DF e os **7 perfis** definidos na documentação.

---

### 2. Painel Web (React/Vite)

```bash
cd web
npm install

# Configurar variáveis de ambiente
# Criar/editar o .env com:
# VITE_API_URL=http://localhost:8000
# VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
# VITE_SUPABASE_ANON_KEY=sua_anon_key

npm run dev
```

O painel estará em: `http://localhost:5173`

---

### 3. App Mobile (Expo)

```bash
cd ScoutLink
npm install

# Configurar variáveis de ambiente
# Editar o .env com:
# EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:8000
# EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

npm start
```

Escaneie o QR code com o Expo Go no celular.

> **Nota sobre o IP na Rede Local:** O `EXPO_PUBLIC_API_URL` deve usar o IP do seu computador na rede Wi-Fi (ex: `http://192.168.1.100:8000`) para que o celular consiga se conectar ao backend.

---

## 🧪 Testando as Funcionalidades

### 1. Verificar o Backend

```bash
# Health check
curl http://localhost:8000/api/health

# Seed de dados
curl -X POST http://localhost:8000/api/uels/seed

# Listar UELs
curl http://localhost:8000/api/uels/

# Listar Perfis
curl http://localhost:8000/api/perfis/

# Criar uma notificação de teste
curl -X POST http://localhost:8000/api/notificacoes/ \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Acampamento Regional 2026",
    "descricao": "O acampamento regional acontecerá no dia 15 de maio!",
    "categoria": "Evento"
  }'

# Listar notificações (modo público)
curl "http://localhost:8000/api/notificacoes/?publico=true"

# Criar um malote de teste
curl -X POST http://localhost:8000/api/malotes/ \
  -H "Content-Type: application/json" \
  -d '{
    "uel_id": 1,
    "tipo": "certificado",
    "descricao": "Certificados de conclusão do curso básico"
  }'

# Listar malotes
curl http://localhost:8000/api/malotes/
```

### 2. Testar o App Mobile

1. Abra o app no Expo Go
2. **Sem login**: O Feed deve exibir notificações públicas (Notícias e Eventos)
3. **Cadastro**: Toque em "Cadastrar", preencha os campos:
   - Nome, Email, Senha
   - Selecione uma UEL no seletor com busca
   - Selecione um Perfil
   - Registro escoteiro (opcional)
4. **Feed logado**: Após login, o feed será filtrado pelo seu perfil e UEL
5. **Perfil**: A tela de perfil deve exibir sua UEL e Perfil

### 3. Testar o Painel Web

1. Acesse `http://localhost:5173`
2. **Dashboard**: Deve exibir contadores reais
3. **Comunicação**: Criar e disparar notificações com filtro de UEL e perfil
4. **Malotes**: Criar malotes selecionando UEL e tipo
5. **Admin**: Visualizar e gerenciar permissões administrativas
6. **Chamados**: Gerenciar chamados dos associados

### 4. Acessar a Documentação da API (Swagger)

```
http://localhost:8000/docs
```

---

## 📄 Variáveis de Ambiente

### Backend (`backend/.env`)
```env
APP_NAME=ScoutLink API
APP_ENV=development
APP_DEBUG=true
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
CORS_ORIGINS=*,http://localhost:5173,http://localhost:8081
```

### Web (`web/.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

### Mobile (`ScoutLink/.env`)
```env
EXPO_PUBLIC_API_URL=http://SEU_IP:8000
EXPO_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

---

## 📚 Documentação

A documentação completa dos requisitos do cliente está em `ScoutLink Documentação.pdf` na raiz do projeto.

---

## 🛠️ Tecnologias

| Componente | Tecnologia |
|---|---|
| Mobile | React Native, Expo, TypeScript |
| Web | React, Vite, TypeScript |
| Backend | Python, FastAPI, SQLAlchemy |
| Banco de Dados | PostgreSQL (Supabase) |
| Autenticação | Supabase Auth |
| Geração de PDF | fpdf2 |

---

*IDP — Produção em Computação — 5° Semestre — 2026*
