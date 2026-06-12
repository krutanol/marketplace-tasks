# Tech Stack

## Stack

| Layer | Choice |
|---|---|
| Language | TypeScript (backend + frontend) |
| Backend Framework | Express 4 + express-async-errors |
| Database | PostgreSQL + Prisma ORM 5 |
| Auth | JWT (jsonwebtoken) + bcryptjs + API Keys |
| Frontend Framework | React 18 + Vite 5 |
| Styling | TailwindCSS 3 |
| State / Data Fetching | TanStack React Query 5 |
| Forms | react-hook-form + zod |
| Drag & Drop | dnd-kit |
| Validation | Zod (shared schema pattern) |
| Testing | Vitest + Supertest |
| API Docs | Swagger UI (openapi.yaml) |

## Common Commands

```bash
# Backend — install and run
cd backend
npm install
npm run db:generate   # Prisma client generation
npm run db:migrate    # Apply migrations
npm run db:seed       # Seed test data
npm run dev           # Dev server on :3000

# Frontend — install and run
cd frontend
npm install
npm run dev           # Dev server on :5173

# Tests
cd backend && npm test
```

## Notes

- Use pinned/exact dependency versions — no open ranges (^, ~)
- All DB queries go through Prisma — no raw SQL string concatenation
- All input validated with Zod schemas before hitting service layer
- Secrets in .env only — never committed. Copy .env.example to .env
- JWT auth for browser clients, X-Api-Key header for external integrations
- Pagination on all list endpoints (page + limit params)
