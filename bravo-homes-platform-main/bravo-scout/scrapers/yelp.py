"""
scrapers/yelp.py — Scraper de Reviews do Yelp via Fusion API

Monitora reviews de concorrentes de remodeling em Atlanta.
Usa a Yelp Fusion API (gratuita, 5000 req/dia) para buscar
negócios e reviews de forma confiável.

Requer: YELP_API_KEY no .env
"""

import httpx
from datetime import datetime
import uuid
import os

YELP_API_KEY = os.getenv("YELP_API_KEY", "")

# Search queries for finding remodeling businesses in Atlanta
SEARCH_TERMS = [
    "bathroom remodeling",
    "kitchen remodeling",
    "home renovation",
    "general contractor",
    "deck builder",
    "flooring contractor",
    "painting contractor",
    "home remodeling",
]

NEGATIVE_KEYWORDS = [
    "terrible", "worst", "never again", "rip off", "scam", "horrible",
    "unfinished", "abandoned", "didn't finish", "didn't show", "ghosted",
    "poor quality", "overcharged", "damaged", "ruined", "incompetent",
    "still waiting", "never completed", "looking for another", "need new",
    "don't use", "avoid", "unprofessional", "sloppy", "took forever",
    "way too long", "still broken", "made it worse", "nightmare",
    "disappointed", "regret", "warning", "beware", "stay away",
]


async def scrape_yelp_reviews() -> list[dict]:
    """
    Busca reviews de concorrentes via Yelp Fusion API.
    Foca em reviews negativas (1-2 estrelas) = oportunidade de lead.
    """
    if not YELP_API_KEY:
        print("  ⚠️ Yelp: YELP_API_KEY não configurada — pulando scraper")
        print("  💡 Dica: Crie uma API key gratuita em https://www.yelp.com/developers")
        return []

    leads = []
    seen_biz = set()

    headers = {
        "Authorization": f"Bearer {YELP_API_KEY}",
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        for term in SEARCH_TERMS:
            try:
                # Step 1: Search for businesses
                search_url = "https://api.yelp.com/v3/businesses/search"
                params = {
                    "term": term,
                    "location": "Atlanta, GA",
                    "sort_by": "review_count",
                    "limit": 5,
                }

                response = await client.get(search_url, params=params)

                if response.status_code == 401:
                    print(f"  ❌ Yelp: API key inválida ou expirada")
                    return leads
                if response.status_code != 200:
                    print(f"  ⚠️ Yelp search '{term}': HTTP {response.status_code}")
                    continue

                data = response.json()
                businesses = data.get("businesses", [])

                for biz in businesses:
                    biz_id = biz.get("id", "")
                    if biz_id in seen_biz:
                        continue
                    seen_biz.add(biz_id)

                    biz_name = biz.get("name", "Unknown")
                    rating = biz.get("rating", 5)

                    # Only look at businesses with some negative reviews (< 4.5 stars)
                    if rating >= 4.5:
                        continue

                    # Step 2: Get reviews for this business
                    try:
                        reviews_url = f"https://api.yelp.com/v3/businesses/{biz_id}/reviews?sort_by=newest&limit=5"
                        rev_response = await client.get(reviews_url)

                        if rev_response.status_code != 200:
                            continue

                        rev_data = rev_response.json()
                        reviews = rev_data.get("reviews", [])

                        for review in reviews:
                            rev_rating = review.get("rating", 5)
                            rev_text = review.get("text", "")
                            rev_user = review.get("user", {}).get("name", "Unknown")
                            rev_date = review.get("time_created", "")

                            # Only capture 1-3 star reviews
                            if rev_rating > 3:
                                continue

                            if len(rev_text) < 20:
                                continue

                            # Check for negative keywords (higher relevance)
                            text_lower = rev_text.lower()
                            has_negative = any(kw in text_lower for kw in NEGATIVE_KEYWORDS)

                            lead = {
                                "lead_id": str(uuid.uuid4()),
                                "fonte": "yelp",
                                "grupo_ou_pagina": f"Yelp: {biz_name}",
                                "texto_original": f"[{rev_rating}★ Review] {rev_text[:400]}",
                                "nome_autor": rev_user.split()[0] if rev_user else "Unknown",
                                "post_url": review.get("url", biz.get("url", "")),
                                "data_post": rev_date or datetime.now().isoformat(),
                                "tipo": "review_negativa_concorrente",
                                "rating": rev_rating,
                                "score": 9 if has_negative else 6,
                                "timestamp_captura": datetime.now().isoformat(),
                            }
                            leads.append(lead)

                    except Exception as e:
                        print(f"  ⚠️ Yelp reviews {biz_name}: {type(e).__name__}: {e}")

                print(f"  ✅ Yelp '{term}': {len(businesses)} businesses, {len([l for l in leads if term.split()[0] in l.get('grupo_ou_pagina', '').lower()])} reviews")

            except Exception as e:
                print(f"  ❌ Erro Yelp '{term}': {type(e).__name__}: {e}")

    print(f"  📦 Yelp total: {len(leads)} reviews negativas coletadas")
    return leads
