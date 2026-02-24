# Backend – Login (email e senha)

## Banco de dados recomendado: **PostgreSQL**

**Por quê:**

- **Relacional** – usuários, lista de desejos, pedidos etc. se modelam bem com tabelas e chaves estrangeiras.
- **Flexível** – tipos de dados variados (texto, números, datas, JSON/JSONB para campos extras).
- **Imagens** – o ideal é **não** guardar arquivo no banco; guarde só a **URL** (arquivo em Vercel Blob, AWS S3, Cloudinary, etc.). No PostgreSQL você usa `TEXT` ou `VARCHAR` para a URL.
- **Escala** – suporta muitas tabelas, índices e consultas complexas sem problema.
- **Vercel** – integra bem com **Neon** (Postgres serverless) ou **Vercel Postgres** (também Neon). Free tier suficiente para começar.

**Alternativa:** Supabase (PostgreSQL + Auth + Storage para imagens). Aqui o login foi implementado “na mão” (tabela `users`, JWT) para você ter controle total; depois você pode migrar ou adicionar Google/Facebook.

---

## Configuração

### 1. Criar o banco (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta (pode ser com GitHub).
2. Crie um projeto e anote a **connection string** (ex.: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`).
3. No painel do Neon, abra o **SQL Editor** e execute o conteúdo do arquivo **`backend/schema.sql`** (cria a tabela `users`).
4. Se a tabela `users` já existia antes (sem perfil), execute também **`backend/migrations/001_profile_fields.sql`** para adicionar os campos de perfil (foto, data de nascimento, cidade, estado, país, telefone).

### 2. Variáveis de ambiente

| Variável        | Obrigatória | Descrição |
|----------------|-------------|-----------|
| `DATABASE_URL` | Sim         | Connection string do PostgreSQL (Neon ou outro). |
| `JWT_SECRET`   | Sim (prod)  | Chave secreta para assinar os tokens. Gere uma string longa e aleatória. Em dev pode omitir (usa valor padrão). |

**Na Vercel:**  
Projeto → **Settings** → **Environment Variables** → adicione `DATABASE_URL` e `JWT_SECRET` (Production, Preview, Development se quiser).  
Para **upload de foto de perfil**: crie um **Blob store** no projeto (Storage → Create Database → Blob). A variável `BLOB_READ_WRITE_TOKEN` é criada automaticamente; use-a nas env vars do projeto.

**No Docker (dev):**  
No `docker-compose.dev.yml` você pode adicionar um `env_file: .env` ou passar as variáveis em `environment` para o serviço `backend`. Crie um `.env` na raiz (e coloque no `.gitignore`) com:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=sua-chave-secreta
```

---

## Endpoints da API

Base: em produção na Vercel é a mesma origem do site (ex.: `https://seu-projeto.vercel.app`). Em dev com Docker, o backend está em `http://localhost:3001`.

| Método | Rota            | Corpo (JSON)           | Descrição |
|--------|-----------------|------------------------|-----------|
| POST   | `/api/register` | `{ "email", "password", "name?" }` | Cria conta. Senha mínimo 6 caracteres. Retorna `{ user, token }`. |
| POST   | `/api/login`    | `{ "email", "password" }`          | Login. Retorna `{ user, token }`. |
| GET    | `/api/me`       | —                      | Dados do usuário logado (inclui perfil: nome, avatar_url, birth_date, city, state, country, phone). Header: `Authorization: Bearer <token>`. |
| PATCH  | `/api/me`       | `{ "name", "avatar_url", "birth_date", "city", "state", "country", "phone" }` | Atualiza perfil do usuário logado. Todos os campos são opcionais. |
| POST   | `/api/upload-avatar` | `{ "dataUrl": "data:image/jpeg;base64,..." }` (JSON). Header: `Authorization: Bearer <token>`. | Envia foto para o Vercel Blob e devolve a URL. Máx. 4 MB; JPEG, PNG, WebP ou GIF. |

**Respostas de erro comuns:**  
`400` – dados inválidos; `401` – email/senha incorretos ou token inválido; `409` – email já em uso; `503` – `DATABASE_URL` não configurada.

---

## Uso no frontend

- **Registro:** `POST /api/register` com `{ email, password, name }` → guarde o `token` (ex.: em memória, estado global ou `localStorage`).
- **Login:** `POST /api/login` com `{ email, password }` → guarde o `token`.
- **Rotas protegidas:** em toda requisição que exige login, envie o header:  
  `Authorization: Bearer <token>`  
  e use o `GET /api/me` para obter os dados atuais do usuário (ou validar o token).

Em produção (Vercel), use URLs relativas: `fetch('/api/login', { ... })`. Em dev (Docker), use `http://localhost:3001/api/login` ou uma variável `VITE_API_URL=http://localhost:3001`.

---

## Painel de controle (admin)

A rota `/painel` e a página "Painel de Controle" são restritas a usuários com `role = 'admin'` no banco.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/admin-check` | Header: `Authorization: Bearer <token>`. Confirma no **banco** se o usuário é admin. Retorna `200 { ok: true }` só para admins; `403` para demais. |

**Camadas de proteção:**

1. **Frontend (contexto):** se não houver usuário logado ou `user.role !== 'admin'`, a página redireciona para a home antes de mostrar qualquer conteúdo.
2. **Frontend (servidor):** a página chama `GET /api/admin-check` antes de renderizar o painel. Só mostra o conteúdo após o backend confirmar (role lido do banco). Assim, alterar o estado no cliente (ex.: dev tools) não concede acesso.
3. **Backend:** o endpoint `/api/admin-check` valida o JWT e consulta `users.role` no banco. O JWT **não** contém `role`; a permissão é sempre decidida no servidor a partir do banco.

**Vetores de ataque considerados:**

- **Alterar `user.role` no frontend:** o painel não renderiza até que `checkAdmin()` retorne sucesso; a API consulta o banco e retorna 403 para não admins.
- **Acessar `/painel` diretamente:** as mesmas verificações (contexto + `admin-check`) aplicam; sem token válido de admin, redireciona.
- **Forjar JWT com role:** o JWT só guarda `userId` e `email`; o backend nunca confia em role vindo do token, apenas no valor de `role` na tabela `users`.

**Recomendação:** em qualquer novo endpoint que sirva dados sensíveis só para admin (ex.: listar usuários, alterar produtos), repetir a mesma lógica: validar token e checar `role` no banco antes de responder.
