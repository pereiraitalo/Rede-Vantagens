# Rede+ Gestão — Programa Rede+ Vantagens (TJPA)

> **Sistema Integrado de CRM, Prospecção e Gestão de Parceiros Conveniados**  
> Tribunal de Justiça do Estado do Pará (TJPA)

---

## 🏛️ Sobre o Projeto

O **Rede+ Gestão** é uma plataforma institucional desenvolvida para estruturar, acelerar e auditar todo o ciclo de prospecção, adesão e acompanhamento de parceiros conveniados do **Programa Rede+ Vantagens** do Poder Judiciário do Estado do Pará.

A aplicação centraliza desde o mapeamento inicial do estabelecimento comercial/institucional até a formalização do processo administrativo, controle de benefícios concedidos a magistrados e servidores, histórico cronológico de contatos e geração de indicadores gerenciais.

---

## 🚀 Arquitetura & Tecnologias

- **Frontend & Core:** React 19, TypeScript, Vite (Arquitetura Single Page Application - SPA)
- **Estilização & UI:** Tailwind CSS v4, Lucide React, Motion
- **Banco de Dados & Autenticação:** Firebase Cloud Firestore & Firebase Authentication (SDK Modular v12)
- **Hospedagem Web:** Hostinger (Deploy contínuo via repositório GitHub / Servidor Web Apache/LiteSpeed com suporte a SPA)
- **Controle de Acesso (RBAC):** Níveis granulares (*Administrador*, *Gestor*, *Visualizador*)
- **Exportação de Relatórios:** Formatação tabular CSV UTF-8 com BOM (compatível nativamente com Microsoft Excel e LibreOffice Calc)

---

## 📁 Estrutura de Coleções do Firestore

| Coleção | Descrição | Política de Acesso |
| :--- | :--- | :--- |
| `partners` | Cadastro de parceiros, dados de processo, contatos e benefícios. | Leitura por autenticados; Escrita por Gestor/Admin. Deleção física bloqueada (Soft Delete via `isArchived`). |
| `partnerStatusHistory` | Histórico imutável de transições entre as 8 etapas regimentais. | Leitura por autenticados; Criação por Gestor/Admin; Edição e deleção proibidas (`allow update, delete: if false`). |
| `activities` | Registro de interações de prospecção (ligações, e-mails, reuniões, visitas). | Leitura por autenticados; Escrita por Gestor/Admin. |
| `categories` | Segmentos de atuação dos parceiros (Saúde, Educação, Gastronomia, etc.). | Leitura por autenticados; Gestão por Gestor/Admin. |
| `users` | Perfis de usuários e papéis de permissão no sistema. | Leitura por autenticados; Gestão de perfis restrita a Administrador. |
| `auditLogs` | Trilha de auditoria imutável de ações executadas no sistema. | Leitura por autenticados; Criação automática; Edição e deleção proibidas. |

---

## 🔒 Perfis de Acesso (RBAC)

1. **Administrador (`admin`):**
   - Acesso total ao sistema.
   - Gestão de equipe e concessão de níveis de acesso.
   - Criação, edição e inativação de categorias.
   - Consulta à trilha de auditoria completa.
2. **Gestor (`manager`):**
   - Cadastro e edição de parceiros.
   - Avanço e validação de etapas do funil de prospecção.
   - Registro de histórico de interações e agendamento de próximos contatos.
   - Emissão de relatórios e exportação de dados.
3. **Consulta / Visualizador (`viewer`):**
   - Consulta detalhada de parceiros e fichas 360°.
   - Visualização do painel de indicadores (Dashboard) e relatórios gerenciais.
   - Ações de alteração, criação e exclusão desabilitadas na interface e bloqueadas no backend pelo `firestore.rules`.

---

## 💻 1. Desenvolvimento Local

### Pré-requisitos
- Node.js versão **20 LTS** ou superior
- npm ou bun
- Conta e projeto ativo no [Firebase Console](https://console.firebase.google.com/)

### Passo a passo
1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/rede-mais-gestao-tjpa.git
   cd rede-mais-gestao-tjpa
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Inicie o servidor local de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará acessível em `http://localhost:3000`.

---

## ⚙️ 2. Configuração das Variáveis de Ambiente

Copie o modelo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

Preencha com as credenciais do seu aplicativo web registrado no Firebase Console (*Configurações do Projeto > Geral > Seus aplicativos*):

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789012"
VITE_FIREBASE_APP_ID="1:123456789012:web:abcdef"
VITE_FIRESTORE_DATABASE_ID="(default)"
```

> **Atenção:** Todas as variáveis de frontend iniciam com o prefixo `VITE_` e são públicas para a inicialização do SDK client-side. Nunca adicione chaves privadas de conta de serviço (*Service Account Key*) ou credenciais administrativas (`firebase-admin`) no código client-side.

---

## 🐙 3. Sincronização com o GitHub

1. Inicialize e envie o código para o seu repositório:
   ```bash
   git remote add origin https://github.com/seu-usuario/rede-mais-gestao-tjpa.git
   git branch -M main
   git push -u origin main
   ```
2. O arquivo `.gitignore` já está configurado para **impedir** o versionamento acidental de arquivos `.env`, logs, certificados e artefatos de build.

---

## 🌐 4. Importação e Deploy na Hostinger

A hospedagem do frontend será realizada na **Hostinger**, mantendo a persistência de dados no **Firebase Cloud Firestore**.

### Configuração no Painel da Hostinger (hPanel)

1. Acesse o **hPanel** da Hostinger > **Sites** > Selecione seu domínio ou crie um novo site.
2. Na seção **Avançado** ou **Git / Aplicação Web**:
   - Conecte sua conta do GitHub e selecione o repositório `rede-mais-gestao-tjpa`.
   - **Branch de Produção:** `main`
3. **Parâmetros de Build & Deploy:**
   - **Versão do Node.js:** `20.x` (ou superior)
   - **Comando de Instalação:** `npm install`
   - **Comando de Build:** `npm run build`
   - **Diretório Raiz / Diretório de Saída (Output Directory):** `dist`
4. **Variáveis de Ambiente (Environment Variables):**
   Adicione as seguintes variáveis no painel da Hostinger com os valores do seu projeto Firebase:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIRESTORE_DATABASE_ID`

---

## 🧭 5. Roteamento SPA na Hostinger (.htaccess)

Para que o recarregamento de página (*F5*) e links diretos funcionem perfeitamente em servidores Apache/LiteSpeed da Hostinger, o projeto inclui o arquivo `public/.htaccess` (copiado automaticamente para a raiz do diretório `dist` durante o build):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔐 6. Autorização do Domínio no Firebase Authentication

Para que o login e autenticação funcionem no domínio hospedado na Hostinger:

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Navegue até **Authentication** > **Settings** (Configurações) > aba **Authorized domains** (Domínios autorizados).
3. Clique em **Adicionar domínio** e insira o seu domínio de produção cadastrado na Hostinger (ex.: `redemais.tjpa.jus.br` ou `seu-dominio.com.br`).
4. Clique em **Salvar**.

---

## 🛡️ 7. Implantação das Regras e Índices do Firestore

A publicação dos arquivos estáticos na Hostinger **não** publica automaticamente as regras de segurança do banco. As regras e índices do Firestore devem ser implantados via Firebase CLI a partir da máquina de desenvolvimento ou esteira CI/CD:

```bash
# 1. Login na CLI do Firebase
npm install -g firebase-tools
firebase login

# 2. Selecione o projeto
firebase use seu-projeto-id

# 3. Implante as regras de segurança e índices compostos
npm run deploy:rules
# ou: firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🏢 8. Ambientes Isolados (Desenvolvimento vs. Produção)

Para manter total isolamento de dados:
1. **Ambiente de Desenvolvimento:** Crie um projeto Firebase secundário (ex.: `tjpa-redemais-dev`) e utilize as chaves desse projeto no `.env.local` na máquina de desenvolvimento.
2. **Ambiente de Produção:** Crie o projeto principal (ex.: `tjpa-redemais-prod`) e utilize as chaves dele no painel da Hostinger para a branch `main`.

---

## 💾 9. Backup e Restauração no Cloud Firestore

### Backup Manual via Google Cloud CLI
Execute o comando exportando as coleções para um bucket do Cloud Storage:
```bash
gcloud firestore export gs://SEU_BUCKET_DE_BACKUP/backups/$(date +%Y-%m-%d_%H%M%S) \
  --project=SEU_PROJECT_ID
```

### Restauração de Dados (Restore)
Para restaurar a partir de uma pasta de backup prévia:
```bash
gcloud firestore import gs://SEU_BUCKET_DE_BACKUP/backups/PASTA_DO_BACKUP \
  --project=SEU_PROJECT_ID
```

---

## 🧪 10. Checklist de Testes Pós-Deploy

Após a conclusão da implantação na Hostinger:

- [ ] **Acesso e Certificado SSL:** Acesse o site via HTTPS e confirme se o cadeado SSL está ativo e válido.
- [ ] **Autenticação:** Realize login e confirme se a sessão é persistida e o perfil do usuário sincronizado.
- [ ] **Persistência em Tempo Real:** Cadastre ou edite um parceiro e atualize a página (*F5*) para validar a leitura direta do Firestore.
- [ ] **Roteamento SPA:** Navegue entre Dashboard, Funil Kanban, Parceiros e Relatórios e atualize o navegador para confirmar que o `.htaccess` previne erros 404.
- [ ] **Exportação CSV:** Gere uma exportação tabular na tela de Relatórios e abra a planilha para confirmar acentuação e delimitação corretas.
- [ ] **Trilha de Auditoria:** Verifique na aba Administração se o log de auditoria registrou as alterações executadas.

---

## ⚖️ Licença e Direitos

Projeto desenvolvido para o **Tribunal de Justiça do Estado do Pará (TJPA)**. Todos os direitos reservados.
