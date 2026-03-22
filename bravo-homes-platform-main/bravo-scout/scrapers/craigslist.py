"""
scrapers/craigslist.py — Scraper de Craigslist via RSS

Monitora posts de "services wanted" na região de Atlanta Metro.
Fonte segura: usa feeds RSS públicos.
"""

import feedparser
import httpx
from datetime import datetime, timedelta
from typing import Optional
import uuid


# RSS feeds de Craigslist Atlanta
CRAIGSLIST_FEEDS = [
    {
        "url": "https://atlanta.craigslist.org/search/bfs?format=rss",
        "name": "Atlanta - Business/Financial Services",
    },
    {
        "url": "https://atlanta.craigslist.org/search/hss?format=rss",
        "name": "Atlanta - Household Services",
    },
]


async def scrape_craigslist() -> list[dict]:
    """
    Busca posts recentes do Craigslist Atlanta via RSS.
    Retorna lista de leads crus para análise pelo keyword_engine.
    """
    leads = []

    async with httpx.AsyncClient(timeout=15.0) as client:
        for feed_info in CRAIGSLIST_FEEDS:
            try:
                response = await client.get(feed_info["url"])
                if response.status_code != 200:
                    print(f"⚠️ Craigslist {feed_info['name']}: HTTP {response.status_code}")
                    continue

                feed = feedparser.parse(response.text)

                for entry in feed.entries:
                    # Pular posts com mais de 72 horas
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        post_date = datetime(*entry.published_parsed[:6])
                        if datetime.now() - post_date > timedelta(hours=72):
                            continue

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "craigslist",
                        "grupo_ou_pagina": feed_info["name"],
                        "texto_original": f"{entry.get('title', '')} {entry.get('summary', '')}",
                        "nome_autor": "Unknown",
                        "post_url": entry.get("link", ""),
                        "data_post": entry.get("published", datetime.now().isoformat()),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)

                print(f"✅ Craigslist {feed_info['name']}: {len(feed.entries)} posts encontrados")

            except Exception as e:
                print(f"❌ Erro Craigslist {feed_info['name']}: {e}")

    return leads
