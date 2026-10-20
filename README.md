# Pressing — gestion de pressing

Application de gestion de pressing : clients, commandes, services, paiements, notifications
et comptes utilisateurs. Elle centralise le suivi des dépôts et des dates de sortie,
automatise le calcul du total d'une commande et sécurise la facturation.

Monorepo réunissant le frontend React et le backend FastAPI.

## Stack

| Couche | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, MUI 7 + Radix UI |
| Backend | FastAPI, SQLAlchemy 2, SQLite, JWT OAuth2 |
| Lancement | `demarrer.sh` (API + Vite en une commande) |

## Structure

```
.
├── backend/          API FastAPI
│   ├── app/
│   │   ├── models/       User, Client, Commande + CommandeItem, Service, Paiement, Notification
│   │   ├── routes/       auth, users, clients, services, commandes, paiements, trash, notifications
│   │   ├── schemas/      Modèles Pydantic d'entrée/sortie
│   │   ├── middleware/   Journalisation HTTP (statut, auteur, message d'erreur)
│   │   └── utils/        Auth JWT, permissions, identifiants, seed, pagination
│   ├── config.py         Réglages (env file `.env`)
│   └── reset_db.py       Reconstruction de la base
├── frontend/         Client React/Vite
│   └── src/app/
│       ├── pages/        Dashboard, Clients, Commandes, Services, Paiements, Notifications, ClientOrders, Login
│       ├── components/   Tables, cartes, modales
│       ├── contexts/     Contexte d'authentification
│       └── lib/          api.ts (REST), store.ts (mode hors-ligne), statut.ts, facture.ts
└── demarrer.sh       Démarre API + frontend ensemble
```

## Démarrage rapide

```bash
./demarrer.sh
```

Le script crée les ports si besoin, lance l'API puis Vite, attend que les deux répondent
et affiche les logs de chaque requête API dans le terminal.

- Frontend : http://localhost:5173
- API : http://localhost:8000 — documentation interactive sur `/docs`
- `QUIET=1 ./demarrer.sh` garde le terminal silencieux (logs dans `/tmp/pressing-*.log`)
- `API_PORT` / `WEB_PORT` pour changer les ports

## Installation manuelle

### Backend

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuration

Le backend lit `backend/.env` (non versionné) via `pydantic-settings` :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | Chaîne SQLAlchemy — `sqlite:///./pressing.db` par défaut |
| `SECRET_KEY` | Signature des JWT — **à changer en production** |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Validité du token (480 par défaut) |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | Compte créé au premier démarrage |

Le frontend lit `frontend/.env` :

| Variable | Rôle |
| --- | --- |
| `VITE_USE_API` | `true` pour parler à l'API, sinon fonctionnement hors-ligne |
| `VITE_API_URL` | Base de l'API — `http://localhost:8000` par défaut |

## Deux modes de fonctionnement

`VITE_USE_API=false` (défaut) : l'application s'appuie sur `src/app/lib/store.ts` et le
stockage local, utile pour développer ou démo sans backend.
`VITE_USE_API=true` : toutes les pages passent par `src/app/lib/api.ts` et l'API FastAPI.

## API

Préfixes montés sur l'application : `/auth`, `/users`, `/clients`, `/services`,
`/commandes`, `/paiements`, `/trash`, `/notifications`.

| Domaine | Points notables |
| --- | --- |
| `/auth` | `POST /login` (e-mail + mot de passe), `GET /me`, `POST /logout` |
| `/commandes` | CRUD, total calculé depuis les articles et les tarifs de service |
| `/paiements` | CRUD, rapprochement avec le solde des commandes |
| `/trash` | `GET`, `DELETE /{module}/{id}`, `POST /{module}/{id}/restore` |
| `/notifications` | `GET`, `/unread-count`, `/{id}/read`, `/read-all` |

## Accès et permissions

Les rôles sont `superadmin` (tous droits) et des comptes limités par matrice de permissions
portée par module (`clients`, `commandes`, `services`, `paiements`, `users`) et par action
(`view`, `create`, `edit`, `delete`). Le contrôle s'applique côté API via
`require_perm(module, action)`.

## Suppression souple

Clients, commandes, services, paiements et utilisateurs héritent de `SoftDeletable` :
une suppression déplace l'enregistrement en corbeille (`/trash`) au lieu de le détruire,
avec restauration possible.

## Base de données

```bash
backend/venv/bin/python backend/reset_db.py --confirm
```

Recrée la base, applique les tables et réinitialise le compte superadmin.

## Sécurité

- Mots de passe hachés avec `passlib`/bcrypt, jamais stockés en clair.
- JWT signés côté serveur, expiration courte, CORS restreint aux origines locales.
- `.env`, bases SQLite et `venv`/`node_modules` exclus du dépôt par `.gitignore`.
