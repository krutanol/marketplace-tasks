# Marketplace Task Manager

Менеджер задач для команди маркетплейсу — управління задачами по товарах у Kanban-стилі з REST API.

## Стек технологій

| Шар | Технологія |
|---|---|
| Backend | Node.js + TypeScript + Express |
| База даних | PostgreSQL + Prisma ORM |
| Авторизація | JWT + bcrypt + API Keys |
| Frontend | React + TypeScript + TailwindCSS |
| State management | TanStack Query (React Query) |
| Drag & Drop | dnd-kit |
| Валідація | Zod |
| Build tool | Vite |
| Тести | Vitest + Supertest |

## Структура проєкту

```
marketplace/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Схема бази даних
│   │   └── seed.ts             # Seed дані
│   └── src/
│       ├── features/
│       │   ├── users/          # Авторизація, управління юзерами
│       │   ├── tasks/          # CRUD задач, дошка
│       │   ├── subtasks/       # Підзадачі
│       │   └── products/       # Товари / артикули
│       ├── middleware/         # Auth, validation, errors
│       ├── utils/              # Pagination, audit log
│       └── lib/                # Prisma client
└── frontend/
    └── src/
        ├── features/
        │   ├── tasks/          # Дошка, картки, деталі задачі
        │   ├── subtasks/       # Компонент підзадач
        │   ├── products/       # Сторінка товарів
        │   └── users/          # Логін, реєстрація, список юзерів
        ├── components/         # Layout, shared UI
        ├── lib/                # Axios instance, утиліти
        └── types/              # TypeScript типи
```

## Швидкий старт

### 1. Налаштування бази даних

```bash
# Створіть PostgreSQL базу даних та заповніть .env
cd backend
copy .env.example .env
# Відредагуйте DATABASE_URL, JWT_SECRET у .env
```

### 2. Backend

```bash
cd backend
npm install
npm run db:generate   # Генерація Prisma client
npm run db:migrate    # Міграції
npm run db:seed       # Тестові дані
npm run dev           # Запуск dev сервера (порт 3000)
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev           # Запуск dev сервера (порт 5173)
```

Відкрийте http://localhost:5173

### Тестові акаунти (після seed)

| Email | Пароль | Роль |
|---|---|---|
| admin@marketplace.com | Admin1234! | Адмін |
| manager@marketplace.com | Manager1234! | Менеджер |
| executor@marketplace.com | Executor1234! | Виконавець |

## API Документація

Swagger UI доступний на: http://localhost:3000/api/docs

### Основні ендпоінти

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/me

GET    /api/tasks                              — список задач (фільтри: status, priority, assigneeId, article)
GET    /api/tasks/:id                          — деталі задачі з підзадачами та артикулами
POST   /api/tasks                              — створити задачу (articles: ["ART-001"] або "ALL")
PATCH  /api/tasks/:id                          — оновити задачу
DELETE /api/tasks/:id                          — видалити задачу
GET    /api/tasks/by-article/:article          — задачі по артикулу
PATCH  /api/tasks/:id/articles/:article/status — статус артикула в задачі

POST   /api/tasks/:id/subtasks                 — додати підзадачу
PATCH  /api/tasks/:id/subtasks/:subId          — оновити підзадачу
DELETE /api/tasks/:id/subtasks/:subId          — видалити підзадачу

GET    /api/products                           — список товарів
POST   /api/products                           — додати товар
POST   /api/products/import                    — bulk import
DELETE /api/products/:article                  — видалити товар
```

### API Key для зовнішніх інтеграцій

```http
X-Api-Key: <your-api-key>
```

API ключі генеруються адміном через: `POST /api/users/:id/generate-api-key`

## Ролі та дозволи

| Дія | Admin | Manager | Executor |
|---|---|---|---|
| Створення задач | ✅ | ✅ | ❌ |
| Зміна статусу задачі | ✅ | ✅ | ✅ |
| Управління підзадачами | ✅ | ✅ | ✅ |
| Управління товарами | ✅ | ✅ | ❌ |
| Управління юзерами | ✅ | ❌ | ❌ |
| Генерація API ключів | ✅ | ❌ | ❌ |
