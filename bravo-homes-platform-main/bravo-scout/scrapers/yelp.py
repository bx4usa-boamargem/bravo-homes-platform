"""
scrapers/yelp.py — Scraper de Reviews do Yelp

Monitora reviews de 1-3 estrelas dos concorrentes na região de Atlanta.
Usa scraping público (sem API key necessária).
"""

import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from typing import Optional
import uuid
import re


# Concorrentes para monitorar reviews
COMPETITORS = [
    {
        "name": "Cornerstone Remodeling Atlanta",
        "yelp_url": "https://www.yelp.com/biz/cornerstone-remodeling-atlanta",
    },
    {
        "name": "Classic Baths by Design",
        "yelp_url": "https://www.yelp.com/biz/classic-baths-by-design-atlanta",
    },
    {
        "name": "Five Star Bath Solutions Marietta",
        "yelp_url": "https://www.yelp.com/biz/five-star-bath-solutions-of-marietta-marietta",
    },
    {
        "name": "FD Remodeling Atlanta",
        "yelp_url": "https://www.yelp.com/biz/fd-remodeling-atlanta",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


async def scrape_yelp_reviews() -> list[dict]:
    """
    Busca reviews recentes de 1-3 estrelas dos concorrentes no Yelp.
    Reviews negativas = oportunidade de "Review Rescue" para a Bravo.
    """
    leads = []

    async with httpx.AsyncClient(timeout=20.0, headers=HEADERS, follow_redirects=True) as client:
        for competitor in COMPETITORS:
            try:
                # Buscar página de reviews recentes
                url = f"{competitor['yelp_url']}?sort_by=date_desc"
                response = await client.get(url)

                if response.status_code != 200:
                    print(f"⚠️ Yelp {competitor['name']}: HTTP {response.status_code}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")

                # Buscar reviews (estrutura do Yelp pode mudar)
                review_elements = soup.select('[data-review-id]')
                if not review_elements:
                    # Fallback: buscar por aria-label com estrelas
                    review_elements = soup.select('.review__09f24__oHr9V, .comment__09f24__gu0rG, [class*="review"]')

                for review_el in review_elements[:10]:  # Limitar a 10 reviews
                    try:
                        # Extrair rating (1-5 estrelas)
                        rating_el = review_el.select_one('[aria-label*="star"]')
                        if not rating_el:
                            continue

                        rating_text = rating_el.get("aria-label", "")
                        rating_match = re.search(r'(\d)', rating_text)
                        if not rating_match:
                            continue

                        rating = int(rating_match.group(1))

                        # Só capturar reviews de 1-3 estrelas (insatisfeitos)
                        if rating > 3:
                            continue

                        # Extrair texto da review
                        text_el = review_el.select_one('[class*="comment"], p, span.raw__09f24__T4Ezm')
                        review_text = text_el.get_text(strip=True) if text_el else ""

                        if len(review_text) < 20:
                            continue

                        # Extrair nome do reviewer
                        name_el = review_el.select_one('[class*="user-passport"] a, [class*="name"]')
                        reviewer_name = name_el.get_text(strip=True) if name_el else "Unknown"

                        lead = {
                            "lead_id": str(uuid.uuid4()),
                            "fonte": "yelp",
                            "grupo_ou_pagina": f"Yelp: {competitor['name']}",
                            "texto_original": review_text,
                            "nome_autor": reviewer_name.split()[0] if reviewer_name else "Unknown",
                            "post_url": competitor["yelp_url"],
                            "data_post": datetime.now().isoformat(),
                            "tipo": "review_negativa_concorrente",
                            "rating": rating,
                            "timestamp_captura": datetime.now().isoformat(),
                        }
                        leads.append(lead)

                    except Exception as e:
                        continue

                print(f"✅ Yelp {competitor['name']}: {len([l for l in leads if competitor['name'] in l.get('grupo_ou_pagina', '')])} reviews negativas")

            except Exception as e:
                print(f"❌ Erro Yelp {competitor['name']}: {e}")

    return leads
