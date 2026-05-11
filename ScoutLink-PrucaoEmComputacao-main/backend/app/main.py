from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import Base, engine

app = FastAPI(title=settings.app_name, debug=settings.app_debug)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def healthcheck() -> dict:
    return {"status": "ok", "env": settings.app_env}

from app.api.routes import taaec, uels, chamados, malotes, notificacoes, perfis, admin
app.include_router(taaec.router, prefix="/api/taaec", tags=["TAAEC"])
app.include_router(uels.router, prefix="/api/uels", tags=["UELs"])
app.include_router(perfis.router, prefix="/api/perfis", tags=["Perfis"])
app.include_router(chamados.router, prefix="/api/chamados", tags=["Chamados"])
app.include_router(malotes.router, prefix="/api/malotes", tags=["Malotes"])
app.include_router(notificacoes.router, prefix="/api/notificacoes", tags=["Notificações"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
