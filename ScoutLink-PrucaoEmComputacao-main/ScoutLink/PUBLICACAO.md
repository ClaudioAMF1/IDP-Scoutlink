# 📱 Guia Manual de Publicação — App ScoutLink

Guia passo a passo para publicar o aplicativo **ScoutLink** (Expo / React Native) nas lojas **Google Play** e **App Store**, usando o **EAS Build** e o **EAS Submit**.

> Diretório de trabalho deste guia: `ScoutLink-PrucaoEmComputacao-main/ScoutLink/`

---

## 1. Pré-requisitos

### Contas e licenças
| Item | Onde obter | Custo |
|---|---|---|
| Conta **Expo (EAS)** | https://expo.dev | Grátis (build pago por uso ou plano) |
| **Google Play Console** | https://play.google.com/console | US$ 25 (taxa única) |
| **Apple Developer Program** | https://developer.apple.com | US$ 99 / ano |
| Acesso ao projeto **Supabase** de produção | https://supabase.com | — |

### Ferramentas locais
```bash
node --version          # >= 18
npm --version           # >= 9
npx expo --version      # CLI do Expo
npm i -g eas-cli        # CLI do EAS
eas --version
```

Faça login:
```bash
eas login
```

---

## 2. Configuração inicial do projeto

### 2.1 Vincular ao EAS (uma vez por projeto)
Na pasta `ScoutLink/`:
```bash
eas init
```
Isso cria/atualiza `app.json` com `extra.eas.projectId` (necessário para push notifications) e gera `eas.json`.

### 2.2 Ajustar identificadores em `app.json`
Edite **antes do primeiro build**:

```jsonc
{
  "expo": {
    "name": "ScoutLink",
    "slug": "ScoutLink",
    "version": "1.0.0",                    // versão visível (semver)
    "ios": {
      "bundleIdentifier": "br.org.escoteirosdf.scoutlink",
      "buildNumber": "1",                  // incrementar a cada submit iOS
      "supportsTablet": true
    },
    "android": {
      "package": "br.org.escoteirosdf.scoutlink",
      "versionCode": 1,                    // incrementar a cada submit Android
      "edgeToEdgeEnabled": true
    }
  }
}
```

> **Regra de ouro:** `version` é o que o usuário vê; `buildNumber`/`versionCode` é interno e **precisa subir** a cada submissão para a loja, ou ela rejeita.

### 2.3 Variáveis de ambiente de produção

O Expo lê `EXPO_PUBLIC_*` em **build time**. Crie um arquivo `.env.production` (não commitar) **ou** declare em `eas.json`:

```jsonc
// eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api-staging.scoutlink.org",
        "EXPO_PUBLIC_SUPABASE_URL": "https://SEU_PROJETO.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "anon_de_staging"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.scoutlink.org",
        "EXPO_PUBLIC_SUPABASE_URL": "https://SEU_PROJETO.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "anon_de_producao"
      }
    }
  },
  "submit": {
    "production": {
      "ios":     { "appleId": "voce@exemplo.com", "ascAppId": "1234567890", "appleTeamId": "ABCDE12345" },
      "android": { "serviceAccountKeyPath": "./play-service-account.json", "track": "internal" }
    }
  }
}
```

> Para **segredos** (chaves privadas, tokens), prefira `eas secret:create` em vez de colocar em `eas.json`. Eles ficam disponíveis como `process.env.XXX` durante o build.

---

## 3. Assets obrigatórios

Antes do submit, garanta que os arquivos estão em `assets/images/`:

| Arquivo | Tamanho | Onde é usado |
|---|---|---|
| `icon.png` | 1024×1024 (PNG sem transparência) | Ícone iOS / fallback Android |
| `adaptive-icon.png` ou `android-icon-foreground.png` | 1024×1024 | Ícone adaptativo Android |
| `splash-icon.png` | ≥ 1242×2436 recomendado | Splash screen |
| `favicon.png` | 48×48 | Build Web |

Para **screenshots das lojas** prepare separadamente:
- **Google Play**: 2–8 screenshots, mínimo 1080px no lado maior.
- **App Store**: 1 conjunto para iPhone 6.7" (1290×2796) e 1 para iPhone 6.5"/5.5".

---

## 4. Build de produção

### 4.1 Android (.aab para Google Play)
```bash
eas build --platform android --profile production
```
- Na primeira execução, o EAS oferece **gerar e armazenar o keystore** automaticamente. Aceite. Faça backup com:
  ```bash
  eas credentials
  ```
- Aguarde o build (~15–25 min). Ao final, baixe o `.aab` da URL exibida.

### 4.2 iOS (.ipa para App Store)
```bash
eas build --platform ios --profile production
```
- O EAS pedirá login Apple e cuidará de **provisioning profile** e **distribution certificate**.
- Saída: `.ipa` pronto para a App Store.

### 4.3 Build de ambas as plataformas em paralelo
```bash
eas build --platform all --profile production
```

---

## 5. Publicação na Google Play

### 5.1 Primeira publicação (manual, obrigatória)
1. Acesse https://play.google.com/console.
2. Crie um app novo → preencha:
   - Nome, idioma padrão, app/jogo, gratuito/pago.
3. Em **Configuração do app**, preencha **antes de qualquer envio**:
   - Política de privacidade (URL pública).
   - Acesso ao app (se exige login: descreva credenciais de teste).
   - Anúncios, classificação etária, público-alvo, segurança de dados.
4. Em **Versões → Testes internos**, crie uma versão e **faça upload manual do `.aab`** gerado no passo 4.1.
5. Adicione testadores por email, envie para análise interna (sai em minutos).
6. Quando estiver tudo verde, promova para **Produção**.

### 5.2 Publicações subsequentes (automáticas via EAS Submit)
1. Crie uma **Service Account** com permissão de publicação:
   - Play Console → *Configurações → Acesso à API* → Vincular ao Google Cloud → criar service account com papel **Service Account User** + permissão **Release manager** no Play Console.
   - Baixe o JSON e salve como `./play-service-account.json` (NÃO commit; adicione ao `.gitignore`).
2. Submeta:
   ```bash
   eas submit --platform android --profile production --latest
   ```
   `--latest` envia o último build de produção. O parâmetro `track` em `eas.json` define o canal (`internal`, `alpha`, `beta`, `production`).

---

## 6. Publicação na App Store

### 6.1 Pré-cadastro no App Store Connect
1. Acesse https://appstoreconnect.apple.com.
2. **Meus apps → +** → Novo app:
   - Plataforma: iOS
   - Nome, idioma principal, Bundle ID (= o do `app.json`)
   - SKU (qualquer identificador interno, ex.: `scoutlink-ios`)
3. Preencha:
   - Categoria, classificação etária, política de privacidade (URL), suporte.
   - Screenshots (6.7" + 6.5"/5.5").
   - Texto de "O que há de novo".

### 6.2 Submissão do build
```bash
eas submit --platform ios --profile production --latest
```
- O EAS sobe o `.ipa` via API e ele aparece em **TestFlight** após 5–30 min de processamento.
- Em **App Store Connect → seu app → Versão x.y.z**, selecione o build processado e clique em **Enviar para análise**.
- Tempo médio de revisão Apple: **24–48 horas**.

### 6.3 TestFlight (recomendado antes do release público)
1. Em **TestFlight**, adicione **testadores internos** (até 100 contas Apple do seu time).
2. Para **testadores externos** (até 10.000), Apple exige uma revisão rápida (~24 h).
3. Convide por email → testadores instalam o app TestFlight → recebem builds OTA.

---

## 7. Atualizações OTA (sem nova submissão à loja)

Para **mudanças apenas em JS/JSX/TSX** (sem alterar nativo), use **EAS Update**:

```bash
# Uma vez:
eas update:configure

# A cada release:
eas update --branch production --message "Hotfix do feed"
```

O app baixa a nova bundle na próxima abertura. **Não funciona** se você alterou plugins nativos, `app.json` (permissões, ícones) ou dependências nativas — nesses casos, é build + submit novo.

---

## 8. Checklist de pré-publicação

Marque cada item antes de submeter:

- [ ] `version` foi incrementada em `app.json`.
- [ ] `ios.buildNumber` e `android.versionCode` subiram (ou `autoIncrement: true` em `eas.json`).
- [ ] `EXPO_PUBLIC_API_URL` aponta para **produção**, não para `localhost` ou IP da Wi-Fi.
- [ ] `SUPABASE_*` são as chaves do **projeto de produção** (NUNCA o `service_role` no app cliente — só `anon`).
- [ ] Permissões em `app.json` têm justificativa (`NSLocationWhenInUseUsageDescription`, etc.).
- [ ] Ícones e splash screen revisados em 1024×1024.
- [ ] Testado o fluxo crítico (login → feed → chamado) em build de produção, não só Expo Go.
- [ ] Política de Privacidade publicada em URL acessível.
- [ ] Backup do `keystore` Android (`eas credentials`) guardado em local seguro.
- [ ] `play-service-account.json` no `.gitignore`.

---

## 9. Comandos rápidos (cheatsheet)

```bash
# Login
eas login

# Configurar (uma vez)
eas init
eas update:configure

# Builds
eas build --platform android --profile production
eas build --platform ios     --profile production
eas build --platform all     --profile preview     # build interno para testers

# Submissão
eas submit --platform android --profile production --latest
eas submit --platform ios     --profile production --latest

# OTA
eas update --branch production --message "Mensagem do release"

# Credenciais
eas credentials                # gerenciar keystore / certificados
eas secret:list                # ver segredos
eas secret:create --scope project --name SUPABASE_ANON_KEY --value "..."

# Diagnóstico
eas build:list
eas build:view <BUILD_ID>
npx expo-doctor                # verifica integridade do projeto
```

---

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Invalid bundle. Missing Push Notification Entitlement" | iOS sem capability de push | Em `app.json`, `ios.entitlements`/`ios.usesAppleSignIn` revisados; `eas build` regenera o profile |
| Build Android rejeitado por target SDK antigo | Play exige `targetSdkVersion` recente | Atualize o SDK do Expo (`expo upgrade`) e rebuilde |
| App Store: "Guideline 5.1.1 — Data Collection" | Falta declarar dados coletados | Preencher **App Privacy** no App Store Connect (Supabase Auth = email + dados de uso) |
| Push notifications não chegam em produção | `projectId` ausente em `app.json` | `eas init` e confirmar `extra.eas.projectId` |
| `EXPO_PUBLIC_*` indefinida no app publicado | Variável só existia em `.env` local | Mover para `eas.json` (`env`) ou `eas secret:create` |
| `versionCode` duplicado | Esqueceu de incrementar | Configurar `"autoIncrement": true` no profile de produção |

---

## 11. Referências oficiais

- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Submit: https://docs.expo.dev/submit/introduction/
- EAS Update (OTA): https://docs.expo.dev/eas-update/introduction/
- Google Play Console: https://support.google.com/googleplay/android-developer
- App Store Connect: https://developer.apple.com/app-store-connect/

---

*ScoutLink — Região Escoteira do Distrito Federal*
