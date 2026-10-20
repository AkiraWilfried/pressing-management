#!/usr/bin/env bash
# ===================================================================
# PRESSING — démarrage en un coup : backend FastAPI + frontend Vite
# Usage :  ./demarrer.sh            (chaque requête API défile ici)
#          QUIET=1 ./demarrer.sh    (logs dans /tmp, terminal silencieux)
# Env    :  API_PORT (8000, 8010 si occupé) · WEB_PORT (5173)
# ===================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_LOG="/tmp/pressing-backend.log"
WEB_LOG="/tmp/pressing-frontend.log"
QUIET="${QUIET:-0}"

API_PORT="${API_PORT:-8000}"
if ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":${API_PORT}$"; then
  echo "⚠️  Port ${API_PORT} déjà occupé → API sur 8010"
  API_PORT=8010
fi
WEB_PORT="${WEB_PORT:-5173}"

# ── Lancement en tâche de fond, terminal et fichier ou fichier seul ─
start() {  # $1 = fichier de log, $2… = commande
  local log="$1"
  shift
  : > "$log"
  if [ "$QUIET" = "1" ]; then
    "$@" >> "$log" 2>&1 &
  else
    "$@" > >(tee -a "$log") 2>&1 &
  fi
  echo $!
}

# ── Backend ─────────────────────────────────────────────────────────
cd "$ROOT/backend"
[ -x venv/bin/uvicorn ] || {
  echo "✗ venv manquant : python3 -m venv venv && venv/bin/pip install -r requirements.txt"
  exit 1
}
echo "▶ Backend   http://localhost:${API_PORT}  (docs: /docs)"
# --no-access-log : c'est le middleware app/middleware/http_log.py qui imprime les
# statuts, avec l'auteur de l'appel et le message d'erreur — uvicorn ne montre que la ligne d'accès.
API_PID=$(start "$API_LOG" venv/bin/uvicorn app.main:app --port "$API_PORT" \
  --log-level info --no-access-log --reload)

# ── Frontend (mode API) ─────────────────────────────────────────────
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
echo "▶ Frontend  http://localhost:${WEB_PORT}  (mode API)"
WEB_PID=$(start "$WEB_LOG" env \
  VITE_USE_API=true VITE_API_URL="http://localhost:${API_PORT}" \
  npm run dev -- --port "$WEB_PORT" --strictPort)

trap 'kill "$API_PID" "$WEB_PID" 2>/dev/null || true' EXIT INT TERM

# ── Attente que les deux soient prêts ───────────────────────────────
for _ in $(seq 1 30); do
  curl -sf "http://localhost:${API_PORT}/" >/dev/null 2>&1 \
    && curl -sf "http://localhost:${WEB_PORT}/login" >/dev/null 2>&1 && break
  sleep 1
done

echo ""
echo "✔ Pressing prêt : ouvrir http://localhost:${WEB_PORT}"
echo "  Comptes   : voir backend/.env (SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD)"
echo "  Base      : backend/venv/bin/python backend/reset_db.py --confirm  (reconstruction)"
echo "  Logs      : ${API_LOG} · ${WEB_LOG}"
echo "  Ctrl+C    : pour tout arrêter."

wait
