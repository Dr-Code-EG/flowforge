# ⚡ FlowForge

> A self-hosted workflow automation platform inspired by **n8n**.
> Runs on a server with Docker, on bare metal, **or directly on your phone via Termux**.

[العربية](#-بالعربية) · [English](#-english)

---

## 🌍 English

FlowForge lets you build, schedule, and run automations from a visual editor in your browser.
It ships with 30+ built-in nodes (HTTP, webhooks, schedule, IF/Switch/Merge, Code, OpenAI, Postgres, MySQL, MongoDB, Redis, Slack, Telegram, Discord, GitHub, Google Sheets, S3, FTP, RSS, CSV/JSON, …) and is designed to be installable in three different environments:

| Environment      | Database | Redis    | Setup                                                                |
| ---------------- | -------- | -------- | -------------------------------------------------------------------- |
| **Docker**       | Postgres | Yes      | `docker compose up -d` — production-ready                            |
| **Linux/macOS**  | SQLite   | optional | Manual install with `pnpm install && pnpm build && pnpm start:prod`  |
| **Android (Termux)** | SQLite   | none     | One-liner: `bash install-termux.sh`                                  |

Everything runs from **a single port (3000)** — the NestJS backend serves both the API _and_ the built Vue 3 frontend. There is no separate frontend process in production, which is what makes the Termux story practical.

### Highlights

- 🔐 Multi-user auth (JWT, bcrypt password hashing)
- 🔑 AES-256-GCM encrypted credentials at rest
- 🧠 30+ built-in nodes covering HTTP, flow control, transform, communication, databases, AI, storage
- ⏰ Cron / schedule triggers
- 🌐 Webhook triggers with optional `lastNode` response mode
- 🧮 n8n-compatible expression language (`{{ $json.foo }}`, `={{ ... }}`, `$node.Name`, `$now`, `$env`)
- 🧱 DAG execution engine with topological traversal and per-node I/O capture
- 🔌 Optional BullMQ queue mode (falls back to in-process when Redis is missing)
- 🪶 Dual database driver: SQLite by default, Postgres opt-in via env vars
- 📱 Mobile-responsive UI — usable on a phone screen (originally built for Termux)

---

### 🚀 Quick start — Docker

```bash
git clone https://github.com/Dr-Code-EG/flowforge.git
cd flowforge
docker compose up -d
# Open http://localhost:3000 — register the first user (it becomes the owner).
```

The compose stack starts FlowForge + Postgres + Redis. Your data is persisted in named volumes (`pgdata`, `redisdata`, `flowforge_data`).

### 🐍 Quick start — Termux (Android)

```bash
pkg update -y
pkg install -y git
git clone https://github.com/Dr-Code-EG/flowforge.git
cd flowforge
bash install-termux.sh
# Wait until you see "FlowForge backend listening on http://0.0.0.0:3000".
# Then open http://localhost:3000 in your phone's browser.
```

The installer handles Node.js + pnpm + system deps (libsqlite, openssl, clang…), generates a `.env` with random secrets, builds the frontend and backend, and starts the server. Re-running the script updates an existing checkout.

> Tip: if you want FlowForge to keep running when you minimize Termux, run `termux-wake-lock` before starting it.

### 💻 Quick start — Manual (Linux/macOS/Windows-WSL)

```bash
git clone https://github.com/Dr-Code-EG/flowforge.git
cd flowforge
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and ENCRYPTION_KEY to strong values.
corepack enable
pnpm install
pnpm --filter @flowforge/shared build
pnpm --filter @flowforge/frontend build
pnpm --filter @flowforge/backend build
cd packages/backend && node dist/main.js
```

Open `http://localhost:3000`.

---

### Repo layout

```
flowforge/
├─ packages/
│  ├─ shared/          # TypeScript types shared between FE and BE
│  ├─ backend/         # NestJS API + execution engine + node implementations
│  └─ frontend/        # Vue 3 + Vite + Vue Flow visual editor
├─ examples/           # Importable example workflows (JSON)
├─ install-termux.sh   # One-shot installer for Termux
├─ Dockerfile          # Multi-stage production image
├─ docker-compose.yml  # FlowForge + Postgres + Redis
└─ .env.example        # All configuration knobs
```

### Configuration (env vars)

| Variable           | Default                       | Description                                                       |
| ------------------ | ----------------------------- | ----------------------------------------------------------------- |
| `BACKEND_PORT`     | `3000`                        | HTTP port the server listens on.                                  |
| `JWT_SECRET`       | _required_                    | Secret used to sign auth tokens. Use a 64+ char random string.    |
| `JWT_EXPIRES_IN`   | `7d`                          | Token lifetime.                                                   |
| `ENCRYPTION_KEY`   | _required_                    | 32-byte (64 hex chars) AES-256 key for credential encryption.     |
| `DATABASE_TYPE`    | _autodetect_                  | `sqlite` (default) or `postgres`. Auto-set to `postgres` if `DATABASE_HOST` is provided. |
| `DATABASE_HOST`    | —                             | Postgres host. Leave empty to use SQLite.                         |
| `DATABASE_FILE`    | `./data/flowforge.sqlite`     | SQLite path (only used in SQLite mode).                           |
| `REDIS_HOST`       | —                             | Redis host (only needed when `EXECUTION_MODE=queue`).             |
| `EXECUTION_MODE`   | `regular`                     | `regular` runs in-process; `queue` uses BullMQ workers.           |
| `PUBLIC_URL`       | `http://localhost:3000`       | Base URL used to display webhook URLs in the UI.                  |
| `FRONTEND_DIST`    | _auto-detected_               | Override the path to `packages/frontend/dist` if needed.          |

### Nodes included

**Triggers:** Manual · Schedule (cron) · Webhook
**Core:** HTTP Request · Set · Code (JS) · IF · Switch · Merge · Split In Batches · Wait · NoOp
**Transform:** JSON · CSV · HTML Extract · RSS · Item Lists
**Communication:** Email (SMTP) · Slack · Telegram · Discord
**Databases:** Postgres · MySQL · MongoDB · Redis
**AI:** OpenAI (chat completion, also works with OpenAI-compatible endpoints)
**Apps & Storage:** GitHub · Google Sheets · AWS S3 (signed v4) · FTP

### Importing an example workflow

```bash
# 1. Login and grab the token:
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"…"}' | jq -r .token)

# 2. POST the workflow JSON:
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data @examples/01-http-to-slack.json
```

Then open the editor in your browser to wire up credentials and click **Activate**.

### Security notes

- **Always** set strong `JWT_SECRET` and `ENCRYPTION_KEY` in production. The defaults in `.env.example` are placeholders.
- The Code node uses Node.js `vm` for sandboxing — treat it the same as `eval`. Only allow trusted users to edit Code nodes.
- Credential blobs are stored encrypted (AES-256-GCM, per-credential IV+auth-tag). The encryption key is held only in the env, not in the database.
- The Postgres/MySQL/MongoDB nodes execute SQL/queries verbatim — they trust the workflow author. Don't expose the editor to untrusted users without role-based restrictions.

---

## 🌐 بالعربية

**FlowForge** هو نظام أتمتة (Automation) ذاتي الاستضافة مستوحى من **n8n**.
ميزته الأساسية أنه يمكنك تشغيله على سيرفر، أو على جهازك، أو حتى **مباشرة على هاتفك من خلال Termux**، وكل ده من بورت واحد عبر المتصفح.

### المميزات

- محرر بصري Drag-and-drop يربط الـ nodes ببعضها
- دعم تشغيل من ٣ بيئات: Docker (انتاج)، تثبيت يدوي (Linux/macOS)، Termux (Android) مع SQLite
- أكثر من ٣٠ Node جاهزة (HTTP, Slack, Telegram, OpenAI, Postgres, …)
- Webhook triggers ينفذ workflow حسب الطلب
- Schedule triggers (Cron) للجدولة
- توثيق متعدد المستخدمين (JWT) وتشفير Credentials بـ AES-256-GCM
- لغة Expressions متوافقة مع n8n: `{{ $json.foo }}` و `$node.Name` و `$now` و `$env`

### تثبيت سريع — Termux (للموبايل)

```bash
pkg update -y
pkg install -y git
git clone https://github.com/Dr-Code-EG/flowforge.git
cd flowforge
bash install-termux.sh
```

السكريبت بيعمل كل حاجة تلقائياً (Node.js, pnpm, البناء، التشغيل). بعد ما تشوف رسالة `FlowForge backend listening on http://0.0.0.0:3000` افتح المتصفح على `http://localhost:3000` وسجل أول حساب — هيكون هو المالك (Owner).

> نصيحة: لو عايز التشغيل يفضل شغال لما تقفل Termux، اكتب `termux-wake-lock` قبل تشغيل السكريبت.

### تثبيت سريع — Docker

```bash
git clone https://github.com/Dr-Code-EG/flowforge.git
cd flowforge
docker compose up -d
# افتح http://localhost:3000
```

### المتغيرات الأساسية في `.env`

- `JWT_SECRET` — مفتاح توقيع الـ JWT (لازم يكون قوي)
- `ENCRYPTION_KEY` — مفتاح تشفير الـ Credentials (٦٤ حرف Hex = ٣٢ بايت)
- `DATABASE_HOST` — لو فاضي بيستخدم SQLite (الأفضل للموبايل)
- `EXECUTION_MODE` — `regular` (افتراضي) أو `queue` لما يكون عندك Redis

---

## License

MIT © 2025 — built for Ahmed.
