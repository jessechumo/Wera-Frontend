# End-to-end tests

Playwright drives the real app: Vite (started by Playwright) in front of
`wera serve` and PostgreSQL. Tests create their own accounts and delete
them at the end.

```sh
# 1. A test database with the schema and the seed jobs (never the live one)
cd ../wera
export DATABASE_URL=postgres://wera:...@localhost:5433/wera_test?sslmode=disable
go run ./cmd/wera migrate
psql "$DATABASE_URL" -f ../wera-frontend/e2e/seed.sql

# 2. The API (no CORAL_API_KEY needed: AI features show their fallback)
HTTP_ADDR=127.0.0.1:8090 go run ./cmd/wera serve

# 3. The tests
cd ../wera-frontend
WERA_API=http://127.0.0.1:8090 npm run e2e
# with an installed Chrome instead of Playwright's browser:
PW_CHROME_PATH=/usr/bin/google-chrome WERA_API=http://127.0.0.1:8090 npm run e2e
```
