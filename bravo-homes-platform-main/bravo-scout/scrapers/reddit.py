"""
scrapers/reddit.py — Scraper de Reddit via RSS (feedparser)

Monitora subreddits relevantes para home remodeling na região de Atlanta.
Usa feeds RSS/Atom públicos com feedparser para parsing robusto.
Adiciona delay entre requests para evitar rate limiting.
"""

import feedparser
import httpx
import asyncio
from datetime import datetime, timedelta
import uuid
import html
import re


# Prioridade de feeds — feeds com mais chances de ter leads primeiro
REDDIT_RSS_FEEDS = [
    # High priority: r/Atlanta (local, mais relevante)
    {"url": "https://www.reddit.com/r/Atlanta/new.rss?limit=25", "name": "r/Atlanta - new posts"},
    {"url": "https://www.reddit.com/r/Atlanta/search.rss?q=contractor+remodel+renovation&sort=new&t=week&restrict_sr=on", "name": "r/Atlanta - contractor/remodel"},
    {"url": "https://www.reddit.com/r/Atlanta/search.rss?q=handyman+recommend+kitchen+bathroom&sort=new&t=week&restrict_sr=on", "name": "r/Atlanta - handyman/kitchen/bath"},
    # Medium priority: Home subs
    {"url": "https://www.reddit.com/r/HomeImprovement/search.rss?q=atlanta+georgia+remodel+contractor&sort=new&t=week&restrict_sr=on", "name": "r/HomeImprovement - atlanta"},
    {"url": "https://www.reddit.com/r/HomeRenovation/search.rss?q=atlanta+georgia&sort=new&t=week&restrict_sr=on", "name": "r/HomeRenovation - atlanta"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def _clean_html(raw_html: str) -> str:
    """Remove HTML tags and decode entities"""
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


async def scrape_reddit() -> list[dict]:
    """
    Busca posts recentes no Reddit sobre home remodeling em Atlanta.
    Usa feeds RSS com feedparser. Delay entre requests para evitar rate limiting.
    """
    leads = []
    seen_urls = set()

    async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as client:
        for i, feed_info in enumerate(REDDIT_RSS_FEEDS):
            # Delay de 2s entre requests para evitar rate limiting (exceto primeiro)
            if i > 0:
                await asyncio.sleep(2)

            try:
                response = await client.get(feed_info["url"])

                if response.status_code == 429:
                    print(f"  ⚠️ Reddit {feed_info['name']}: Rate limited (429) — parando")
                    break  # Stop all feeds if rate limited
                if response.status_code == 403:
                    print(f"  ⚠️ Reddit {feed_info['name']}: Forbidden (403) — parando")
                    break
                if response.status_code != 200:
                    print(f"  ⚠️ Reddit {feed_info['name']}: HTTP {response.status_code}")
                    continue

                # Use feedparser for robust Atom/RSS parsing
                feed = feedparser.parse(response.text)

                count = 0
                for entry in feed.entries:
                    link = entry.get("link", "")
                    if link in seen_urls:
                        continue
                    seen_urls.add(link)

                    title = entry.get("title", "")
                    # Content is in 'summary' for Reddit Atom feeds
                    raw_summary = entry.get("summary", "")
                    content = _clean_html(raw_summary)

                    author = entry.get("author", "Unknown")
                    if author.startswith("/u/"):
                        author = author[3:]

                    text = f"{title} {content}".strip()
                    if len(text) < 20:
                        continue

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "reddit",
                        "grupo_ou_pagina": feed_info["name"],
                        "texto_original": text[:500],
                        "nome_autor": author,
                        "post_url": link,
                        "data_post": entry.get("updated", entry.get("published", datetime.now().isoformat())),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)
                    count += 1

                print(f"  ✅ Reddit {feed_info['name']}: {count} posts")

            except Exception as e:
                print(f"  ❌ Erro Reddit {feed_info['name']}: {type(e).__name__}: {e}")

    print(f"  📦 Reddit total: {len(leads)} posts únicos coletados")
    return leads
