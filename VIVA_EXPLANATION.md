# Viva Technical Explanation - Movie Magic Refactor (v2)

This document summarizes the transition from a monolithic Node.js/MySQL architecture to a consolidated 5-file Serverless PostgreSQL architecture.

## 1. Architectural Shift (Consolidated Serverless)
- **Consolidation**: Instead of a single giant `app.js`, the backend logic is now organized into **5 specific domain-focused serverless functions** in the `/api` directory:
  - `login.js`: Identity management for customers.
  - `signup.js`: Registration logic.
  - `movies.js`: Catalog browsing and detail rendering.
  - `booking.js`: Seat reservation and payment success flows.
  - `admin.js`: Full administrative control (Dashboard + CRUD).
- **Execution**: Each function is independent and triggered only when needed, optimizing resource usage on Vercel.

## 2. Modern JavaScript (ES Modules)
- **type: module**: The project was updated to use **ES Modules (ESM)**. This allows for modern `import/export` syntax and the `export default async function handler(req, res)` pattern required by Vercel for serverless functions.

## 3. Database: Neon PostgreSQL
- **Connection**: Switched from the `mysql` package to the `pg` package.
- **Pooling**: We use a `Pool` connection in `utils/db.js` which is shared across all 5 API files. This prevents connection exhaustion (a common issue in serverless environments).
- **Syntax**: Queries were updated to use `$1, $2` placeholders (Postgres style) instead of `?` (MySQL style).

## 4. Enhanced Security (Bcrypt)
- **MD5 vs Bcrypt**: Replaced the outdated MD5 hashing with **bcrypt**. MD5 is fast but insecure. Bcrypt is "computationally expensive," making it resistant to brute-force and rainbow table attacks.
- **Hashing**: Passwords are now salted and hashed with 10 rounds of salt before being stored in the `customer` or `admin` tables.

## 5. Frontend & Routing
- **Explicit API Calls**: Frontend templates (`.ejs` files) were updated to point directly to these `/api/...` endpoints. 
- **vercel.json Rewrites**: We use rewrites to maintain clean root-level URLs (e.g., mapping `/moviesdash` to `/api/movies?action=moviesdash`) so the user never sees the complex backend file structure.

## 6. EJS in Serverless
- **utils/render.js**: A common utility was created to locate and render EJS templates from the `views/` folder, ensuring that serverless lambdas can still provide the same dynamic HTML as the original Express server.
