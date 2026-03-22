"""
scrapers/reddit.py — Scraper de Reddit

Monitora subreddits relevantes para home remodeling na região de Atlanta.
Usa a API pública JSON do Reddit (sem autenticação necessária).
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
import uuid


# Subreddits relevantes para monitorar
SUBREDDITS = [
    {"name": "HomeImprovement", "search": "atlanta OR marietta OR alpharetta OR roswell OR kennesaw remodel"},
    {"name": "Atlanta", "search": "contractor OR remodel OR renovation OR kitchen OR bathroom"},
    {"name": "HomeRenovation", "search": "atlanta OR georgia remodel"},
]

HEADERS = {
    "User-Agent": "BravoScout/1.0 (Lead Monitor for Bravo Homes Group)",
}


async def scrape_reddit() -> list[dict]:
    """
    Busca posts recentes no Reddit sobre home remodeling em Atlanta.
    Usa a API JSON pública (sem API key).
    """
    leads = []

    async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as client:
        for sub in SUBREDDITS:
            try:
                # Buscar posts recentes com palavras-chave
                url = f"https://www.reddit.com/r/{sub['name']}/search.json"
                params = {
                    "q": sub["search"],
                    "sort": "new",
                    "t": "week",
                    "limit": 25,
                    "restrict_sr": "true",
                }

                response = await client.get(url, params=params)

                if response.status_code != 200:
                    print(f"⚠️ Reddit r/{sub['name']}: HTTP {response.status_code}")
                    continue

                data = response.json()
                posts = data.get("data", {}).get("children", [])

                for post in posts:
                    post_data = post.get("data", {})

                    # Pular posts com mais de 72 horas
                    created_utc = post_data.get("created_utc", 0)
                    post_date = datetime.fromtimestamp(created_utc)
                    if datetime.now() - post_date > timedelta(hours=72):
                        continue

                    title = post_data.get("title", "")
                    selftext = post_data.get("selftext", "")
                    author = post_data.get("author", "Unknown")
                    permalink = post_data.get("permalink", "")

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "reddit",
                        "grupo_ou_pagina": f"r/{sub['name']}",
                        "texto_original": f"{title} {selftext}".strip(),
                        "nome_autor": author if author != "[deleted]" else "Unknown",
                        "post_url": f"https://reddit.com{permalink}" if permalink else "",
                        "data_post": post_date.isoformat(),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)

                print(f"✅ Reddit r/{sub['name']}: {len(posts)} posts analisados")

            except Exception as e:
                print(f"❌ Erro Reddit r/{sub['name']}: {e}")

    return leads
