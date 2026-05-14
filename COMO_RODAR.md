# ▶️ Como Rodar o ScoutLink (Guia Rápido)

Passo a passo para clonar e rodar **backend + app mobile + web** em qualquer máquina. Os `.env` já estão preenchidos no repo — basta seguir os comandos.

---

## 📋 Pré-requisitos

Instale uma vez (links diretos):

- [Node.js 18+](https://nodejs.org) (LTS)
- [Python 3.12](https://www.python.org/downloads/) — **importante: NÃO use 3.14**
- [Git](https://git-scm.com)
- [VS Code](https://code.visualstudio.com) (recomendado)
- **Expo Go** no celular:
  - [Android (Play Store)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)

Confirme no terminal:

```bash
node -v          # >= v18
python3.12 -V    # 3.12.x
git --version
```

> **Mac sem Python 3.12?** Instale com `brew install python@3.12` (e Homebrew com `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`).

---

## 📥 1. Clonar o projeto

```bash
git clone https://github.com/ClaudioAMF1/IDP-Scoutlink.git
cd IDP-Scoutlink
git checkout claude/scoutlink-final
code .
```

> Os arquivos `.env` já vêm preenchidos com as credenciais do Supabase. Você **não precisa** criar nem editar nada.

---

## 🐍 2. Backend (Terminal 1)

Abra o terminal do VS Code (`Ctrl + ç` ou `Cmd + ç` no Mac):

```bash
cd ScoutLink-PrucaoEmComputacao-main/backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Deve aparecer:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Deixe esse terminal aberto.**

---

## 🌱 3. Popular o banco (Terminal 2 — uma vez só)

Abra um **segundo terminal** (`Ctrl + Shift + ç`):

```bash
curl -X POST http://localhost:8000/api/uels/seed
```

✅ Retorna algo como `{"uels": 43, "perfis": 7}`.

Verifique:

```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/uels/ | head -50
```

Pode fechar esse terminal depois.

---

## 📱 4. App Mobile (Terminal 3)

Abra **outro terminal**:

```bash
cd ScoutLink-PrucaoEmComputacao-main/ScoutLink
npm install
npm start
```

> ⚠️ Use **`npm start`** (não `npx expo start`). O script detecta automaticamente o IP da sua rede Wi-Fi e atualiza o `.env` — assim funciona em qualquer máquina, em qualquer Wi-Fi.

✅ Vai aparecer o QR code e:

```
› Metro waiting on exp://192.168.X.X:8081
```

### Abrir no celular

- **Android:** Abra o **Expo Go** → "Scan QR code" → aponte para o QR.
- **iOS:** Abra o **Expo Go** → fique parado na tela inicial → aguarde 20–40s → o servidor aparece na lista de "Development servers" → toque nele.
  - Se não aparecer, tente: pare o servidor (`Ctrl + C`) e rode `npm start -- --tunnel` (ou use o hotspot do iPhone — passo bônus abaixo).

Espera 30s–2min na primeira vez (compilando bundle). App abre.

---

## 🌐 5. Painel Web (Terminal 4 — opcional)

Se quiser testar o painel administrativo:

```bash
cd ScoutLink-PrucaoEmComputacao-main/web
npm install
npm run dev
```

Acesse: <http://localhost:5173>

---

## 🧪 Roteiro de teste

Faça nessa ordem:

1. **Cadastro** no app:
   - Nome, email (use um real), senha (6+ caracteres)
   - Selecionar UEL (43 opções)
   - Selecionar Perfil (7 opções)
   - Cadastrar → Login automático
2. **Feed** → notificações carregam.
3. **Mapa** → permita localização → veja UELs do DF.
4. **Chamados** → crie um novo → mande mensagem.
5. **Perfil → Configurações → Notificações Push** → ligue o switch → permita no diálogo iOS/Android → 🔔 notificação pop-up aparece.
6. **Painel web (opcional):** crie uma notificação em "Comunicação" → faça refresh no Feed do app → aparece.

---

## 🛑 Como parar tudo

Em cada terminal, pressione `Ctrl + C`.

Para reabrir depois (sem repetir instalações):

```bash
# Terminal 1 (backend)
cd ScoutLink-PrucaoEmComputacao-main/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 (mobile)
cd ScoutLink-PrucaoEmComputacao-main/ScoutLink
npm start

# Terminal 3 (web, opcional)
cd ScoutLink-PrucaoEmComputacao-main/web
npm run dev
```

---

## 🔥 Bônus — Hotspot do iPhone (resolver problemas de rede)

Se a Wi-Fi tiver isolamento de cliente (rede de empresa, faculdade) e o Expo Go não detectar o servidor:

1. **iPhone** → Ajustes → **Acesso Pessoal** → ligar.
2. **Mac** → ícone Wi-Fi → conecte na rede do iPhone.
3. Pare o backend e o Expo, depois reinicie ambos (o `update-ip.js` detecta o novo IP automaticamente).
4. Abra o Expo Go → o servidor aparece na lista.

> Hotspot do celular **nunca** tem isolamento — sempre funciona.

---

## ❌ Problemas comuns

| Sintoma | Solução |
|---|---|
| `pg_config not found` ao `pip install` | Você está com Python 3.14. Use `python3.12 -m venv .venv` |
| Backend: `Connection refused` ao Supabase | Verifique que o `.env` está em `backend/` |
| App: `Network request failed` em todas as telas | Backend não está rodando, ou você usou `npx expo start` (use `npm start`) |
| Cadastro: dropdown de UEL/Perfil vazio | Rode o seed (passo 3) novamente |
| `xcrun simctl error 72` | Ignore — só significa que você não tem Xcode. Use o celular físico |
| Câmera iOS: "nenhum dado usável" | Abra direto pelo Expo Go (não pela câmera nativa) |
| ngrok: `remote gone away` | Use modo LAN normal (`npm start`) ou hotspot |
| Mudou de Wi-Fi e app parou de funcionar | Reinicie o `npm start` (detecta o novo IP) |

---

## 📚 Documentação adicional

- **`ScoutLink/PUBLICACAO.md`** — Guia manual de publicação nas lojas (EAS Build/Submit, TestFlight, OTA)
- **`README.md`** — Visão geral do projeto e arquitetura
- **`ScoutLink Documentação.pdf`** — Documentação dos requisitos do cliente

---

*ScoutLink — Região Escoteira do Distrito Federal — 2026*
