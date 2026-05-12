"""
backend/app/api/routes/wordpress_sync.py

Rota opcional para sincronizar posts do WordPress com a tabela de notificações.

Endpoints:
  POST /api/wordpress/sync   — importa posts recentes do WP para o banco
  GET  /api/wordpress/posts  — proxy: retorna posts do WP sem gravar no banco
"""

import base64
import html
import re
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Notificacao

router = APIRouter()

WP_BASE_URL = "https://escoteirosdf.org.br"
WP_API = f"{WP_BASE_URL}/wp-json/wp/v2"
WP_USER = "scoutlink@escoteirosdf.org.br"
WP_APP_PASSWORD = "GnZi 6NwV d7bQ 1HUR xzjc iI51"


def _wp_auth_header() -> str:
    credentials = f"{WP_USER}:{WP_APP_PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return f"Basic {encoded}"


def _strip_html(raw: str) -> str:
    no_tags = re.sub(r"<[^>]+>", "", raw)
    return html.unescape(no_tags).strip()


def _normalize_date(date_gmt: str) -> datetime:
    if not date_gmt.endswith("Z"):
        date_gmt = date_gmt + "Z"
    return datetime.fromisoformat(date_gmt.replace("Z", "+00:00"))


async def _fetch_wp_posts(per_page: int = 10, after: Optional[str] = None) -> list[dict]:
    params = {
        "per_page": per_page,
        "status": "publish",
        "orderby": "date",
        "order": "desc",
        "_embed": "wp:featuredmedia,author",
    }
    if after:
        params["after"] = after

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(
            f"{WP_API}/posts",
            params=params,
            headers={"Authorization": _wp_auth_header()},
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao conectar ao WordPress: HTTP {res.status_code}",
        )
    return res.json()


@router.post("/sync")
async def sync_wordpress_posts(
    per_page: int = Query(default=20, ge=1, le=100),
    after: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Importa posts do WordPress como Notificacoes no banco. Ignora duplicatas."""
    posts = await _fetch_wp_posts(per_page=per_page, after=after)
    importados = 0
    ignorados = 0

    for post in posts:
        titulo = _strip_html(post.get("title", {}).get("rendered", ""))[:255]
        data_criacao = _normalize_date(post.get("date_gmt", datetime.now(timezone.utc).isoformat()))

        existe = db.query(Notificacao).filter(
            Notificacao.titulo == titulo,
            Notificacao.categoria == "Noticia",
            Notificacao.data_criacao == data_criacao,
        ).first()

        if existe:
            ignorados += 1
            continue

        excerpt = _strip_html(post.get("excerpt", {}).get("rendered", ""))
        if not excerpt:
            excerpt = _strip_html(post.get("content", {}).get("rendered", ""))[:400]
        link = post.get("link", "")
        descricao = f"{excerpt}\n\n🔗 Leia mais: {link}" if link else excerpt

        db.add(Notificacao(
            titulo=titulo,
            descricao=descricao,
            categoria="Noticia",
            data_criacao=data_criacao,
            autor_id=None,
            alvo_uel_id=None,
            alvo_perfil_id=None,
        ))
        importados += 1

    db.commit()
    return {"status": "ok", "importados": importados, "ignorados": ignorados, "total": len(posts)}


@router.get("/posts")
async def get_wordpress_posts(
    per_page: int = Query(default=10, ge=1, le=100),
    after: Optional[str] = Query(default=None),
):
    """Retorna posts do WordPress em tempo real, sem gravar no banco."""
    posts = await _fetch_wp_posts(per_page=per_page, after=after)
    resultado = []
    for post in posts:
        embedded = post.get("_embedded", {})
        media_list = embedded.get("wp:featuredmedia", [])
        authors = embedded.get("author", [])
        titulo = _strip_html(post.get("title", {}).get("rendered", ""))
        excerpt = _strip_html(post.get("excerpt", {}).get("rendered", "")) or \
                  _strip_html(post.get("content", {}).get("rendered", ""))[:400]
        resultado.append({
            "wp_id": post.get("id"),
            "titulo": titulo,
            "descricao": excerpt,
            "categoria": "Noticia",
            "data_criacao": _normalize_date(post.get("date_gmt", "")).isoformat(),
            "link": post.get("link", ""),
            "imagem_url": media_list[0].get("source_url") if media_list else None,
            "autor_nome": authors[0].get("name") if authors else None,
        })
    return resultado
