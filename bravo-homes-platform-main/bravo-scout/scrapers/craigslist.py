"""
scrapers/craigslist.py — Scraper de Craigslist via RSS

Monitora posts de serviços e busca por reformas em Atlanta Metro.
Fonte segura: usa feeds RSS públicos com queries de busca.
"""

import feedparser
import httpx
from datetime import datetime, timedelta
import uuid


# RSS feeds de Craigslist Atlanta com queries direcionadas
CRAIGSLIST_FEEDS = [
    # Services > Household
    {"url": "https://atlanta.craigslist.org/search/hss?format=rss&query=remodel", "name": "ATL Household - remodel"},
    {"url": "https://atlanta.craigslist.org/search/hss?format=rss&query=renovation", "name": "ATL Household - renovation"},
    {"url": "https://atlanta.craigslist.org/search/hss?format=rss&query=bathroom", "name": "ATL Household - bathroom"},
    {"url": "https://atlanta.craigslist.org/search/hss?format=rss&query=kitchen", "name": "ATL Household - kitchen"},
    {"url": "https://atlanta.craigslist.org/search/hss?format=rss&query=contractor", "name": "ATL Household - contractor"},
    # Gigs > Labor
    {"url": "https://atlanta.craigslist.org/search/lbg?format=rss&query=remodel", "name": "ATL Gigs Labor - remodel"},
    {"url": "https://atlanta.craigslist.org/search/lbg?format=rss&query=renovation", "name": "ATL Gigs Labor - renovation"},
    # Community > Housing
    {"url": "https://atlanta.craigslist.org/search/ccc?format=rss&query=contractor+remodel", "name": "ATL Community - contractor remodel"},
    # Services wanted
    {"url": "https://atlanta.craigslist.org/search/bfs?format=rss&query=remodel", "name": "ATL Biz Services - remodel"},
    {"url": "https://atlanta.craigslist.org/search/bfs?format=rss&query=contractor", "name": "ATL Biz Services - contractor"},
    # For sale > Materials (people selling old fixtures = likely renovating)
    {"url": "https://atlanta.craigslist.org/search/maa?format=rss&query=kitchen+cabinets", "name": "ATL Materials - kitchen cabinets"},
    {"url": "https://atlanta.craigslist.org/search/maa?format=rss&query=bathroom+vanity", "name": "ATL Materials - bathroom vanity"},
]


async def scrape_craigslist() -> list[dict]:
    """
    Busca posts recentes do Craigslist Atlanta via RSS.
    Retorna lista de leads crus para análise pelo keyword_engine.
    """
    leads = []
    seen_urls = set()

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for feed_info in CRAIGSLIST_FEEDS:
            try:
                response = await client.get(
                    feed_info["url"],
                    headers={"User-Agent": "Mozilla/5.0 (compatible; RSS Reader)"},
                )
                if response.status_code != 200:
                    print(f"  ⚠️ Craigslist {feed_info['name']}: HTTP {response.status_code}")
                    continue

                feed = feedparser.parse(response.text)

                count = 0
                for entry in feed.entries:
                    link = entry.get("link", "")
                    if link in seen_urls:
                        continue
                    seen_urls.add(link)

                    # Skip posts older than 96 hours
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        post_date = datetime(*entry.published_parsed[:6])
                        if datetime.now() - post_date > timedelta(hours=96):
                            continue

                    title = entry.get("title", "")
                    summary = entry.get("summary", "")
                    text = f"{title} {summary}".strip()

                    if len(text) < 15:
                        continue

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "craigslist",
                        "grupo_ou_pagina": feed_info["name"],
                        "texto_original": text[:500],
                        "nome_autor": "Unknown",
                        "post_url": link,
                        "data_post": entry.get("published", datetime.now().isoformat()),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)
                    count += 1

                print(f"  ✅ Craigslist {feed_info['name']}: {count} posts")

            except Exception as e:
                print(f"  ❌ Erro Craigslist {feed_info['name']}: {type(e).__name__}: {e}")

    print(f"  📦 Craigslist total: {len(leads)} posts únicos coletados")
    return leads
