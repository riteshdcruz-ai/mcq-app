# MCQ Platform

A web-based multiple-choice question testing platform built with Next.js, Prisma, and SQLite. Designed for internal certification practice — supports timed tests, multiple attempts, tab-switch detection, and admin-managed question banks.

## Features

### For Test Takers
- Take assigned tests with a live countdown timer
- Timer turns red and bold at 5 minutes remaining
- Test auto-submits when time expires
- Tab-switch detection: warned at 1st and 2nd violation, auto-submitted at 3rd
- Multiple attempts allowed per test
- Dashboard shows all past attempts with individual scores and pass/fail status
- Detailed result review with correct answers and explanations

### For Admins
- Upload question banks from books (PDF/DOCX)
- AI-assisted question extraction and review
- Approve or reject extracted questions
- Build tests from approved questions (fixed or random mode)
- Assign tests to specific users or all users
- Manage users: create, delete, reset password, change role
- View all test results across users

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via Prisma ORM |
| Auth | JWT cookies (jose + bcryptjs) |
| Styling | Tailwind CSS |
| Runtime | Node.js |

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Database Setup

```bash
npx prisma db push
```

### Create Admin User

```bash
node scripts/setup.js
```

This creates a default admin account. Check the script for credentials and change the password after first login.

### Seed Practice Questions (optional)

To load the Workday Tenant Build certification practice questions:

```bash
$env:DATABASE_URL = "file:./prisma/dev.db"
node scripts/seed-workday-questions.js
```

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Remote Access (Tunnel)

To share the app with others over the internet during a test session:

```bash
ssh -R 80:localhost:3000 localhost.run
```

Copy the `*.lhr.life` URL and share it. To prevent the tunnel from closing due to inactivity, run this keep-alive loop in a separate terminal:

```powershell
while ($true) { Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing | Out-Null; Start-Sleep 30 }
```

> The dev server and tunnel both need to remain running for the duration of the test session.

## Environment Variables

Create a `.env.local` file in the project root:

```
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-here"
```

> Prisma reads `.env` by default. When running scripts directly with Node, set `DATABASE_URL` in the shell or use `.env.local` with dotenv.

## Project Structure

```
src/
  app/
    admin/          Admin pages (users, books, questions, tests, results)
    api/            API routes
    dashboard/      User dashboard
    login/          Login page
    tests/          Test-taking and result pages
  components/       Shared components (Nav)
  lib/              Auth, DB client, AI helpers
prisma/
  schema.prisma     Data model
scripts/
  setup.js          Create initial admin user
  seed-workday-questions.js   Load practice question bank
```

## Roles

| Role | Access |
|---|---|
| `admin` | Full admin panel, user management, question/test management |
| `resource` | Dashboard, assigned tests, attempt history |

## Notes

- The platform uses SQLite — suitable for small teams and local deployments. For production use with many concurrent users, migrate to PostgreSQL.
- The `.env.local` file and `prisma/dev.db` are excluded from version control.
