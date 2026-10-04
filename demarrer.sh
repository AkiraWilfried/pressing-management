#!/usr/bin/env bash
# ===================================================================
# PRESSING — démarrage en un coup : backend FastAPI + frontend Vite
# Usage :  ./demarrer.sh
# Env    :  API_PORT (8000, 8010 si occupé) · WEB_PORT (5173)
# ===================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

API_PORT="${API_PORT:-8000}"
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${API_PORT}$"; then
  echo "⚠️  Port ${API_PORT} déjà occupé → API sur 8010"
  API_PORT=8010
fi
WEB_PORT="${WEB_PORT:-5173}"

# ── Backend ─────────────────────────────────────────────────────────
cd "$ROOT/backend"
[ -x venv/bin/uvicorn ] || {
  echo "✗ venv manquant : python3 -m venv venv && venv/bin/pip install -r requirements.txt"
  exit 1
}
echo "▶ Backend   http://localhost:${API_PORT}  (docs: /docs)"
venv/bin/uvicorn app.main:app --port "$API_PORT" --reload >/tmp/pressing-backend.log 2>&1 &
API_PID=$!

# ── Frontend (mode API) ─────────────────────────────────────────────
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
echo "▶ Frontend  http://localhost:${WEB_PORT}  (mode API)"
VITE_USE_API=true VITE_API_URL="http://localhost:${API_PORT}" \
  npm run dev -- --port "$WEB_PORT" --strictPort >/tmp/pressing-frontend.log 2>&1 &
WEB_PID=$!

trap 'kill "$API_PID" "$WEB_PID" 2>/dev/null || true' EXIT INT TERM

# ── Attente que les deux soient prêts ───────────────────────────────
for _ in $(seq 1 30); do
  curl -sf "http://localhost:${API_PORT}/" >/dev/null 2>&1 \
    && curl -sf "http://localhost:${WEB_PORT}/login" >/dev/null 2>&1 && break
  sleep 1
done

echo ""
echo "✔ Pressing prêt : ouvrir http://localhost:${WEB_PORT}"
echo "  Comptes : admin@pressing.cm/admin123 · user@pressing.cm/user123"
echo "  Logs    : /tmp/pressing-backend.log · /tmp/pressing-frontend.log"
echo "  Ctrl+C pour tout arrêter."

wait
