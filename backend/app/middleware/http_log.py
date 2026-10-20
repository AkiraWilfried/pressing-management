import time
import traceback

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

RESET = "\x1b[0m"
CLASSES = {2: "\x1b[32m", 3: "\x1b[36m", 4: "\x1b[33m", 5: "\x1b[31m"}

# Les corps de requêtes transitent avec les mots de passe en clair (/auth/login,
# POST /users, /users/{id}/password) : on ne journalise que statut, chemin, acteur, durée.


def _color(status_code: int) -> str:
    return CLASSES.get(status_code // 100, RESET)


def _actor(request: Request) -> str:
    return getattr(request.state, "actor", "anon")


def _line(request: Request, status_code: int, elapsed_ms: float) -> str:
    color = _color(status_code)
    return (
        f"{color}{status_code:>3} {request.method:<6} {request.url.path}"
        f"{_spaces(request.url.path)}[{_actor(request)}] {elapsed_ms:>5.0f} ms{RESET}"
    )


def _spaces(path: str) -> str:
    return " " * max(1, 34 - len(path))


def install(app: FastAPI) -> None:
    """Une ligne par requête, avec le message d'erreur — uvicorn se chargeait bien des
    statuts, mais ses lignes d'accès sont muettes sur le `detail`."""

    @app.middleware("http")
    async def log_request(request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - started) * 1000

        # 4xx et 5xx sont déjà imprimés par les handlers, avec le détail
        if response.status_code < 400:
            print(_line(request, response.status_code, elapsed), flush=True)
        return response

    @app.exception_handler(StarletteHTTPException)
    async def log_http_exception(request: Request, exc: StarletteHTTPException):
        print(
            f"{_color(exc.status_code)}  ✗ {exc.status_code:>3} {request.method:<6} "
            f"{request.url.path} — {exc.detail} [{_actor(request)}]{RESET}",
            flush=True,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def log_validation_error(request: Request, exc: RequestValidationError):
        for error in exc.errors():
            field = ".".join(str(part) for part in error["loc"][1:]) or "body"
            print(
                f"{_color(422)}  ✗ 422 {request.method:<6} {request.url.path} — "
                f"{field}: {error['msg']} [{_actor(request)}]{RESET}",
                flush=True,
            )
        return JSONResponse(status_code=422, content={"detail": jsonable_encoder(exc.errors())})

    @app.exception_handler(Exception)
    async def log_unhandled(request: Request, exc: Exception):
        traceback.print_exc()
        print(
            f"{_color(500)}  ✗ 500 {request.method:<6} {request.url.path} — "
            f"{type(exc).__name__}: {exc} [{_actor(request)}]{RESET}",
            flush=True,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Erreur interne du serveur"},
        )
