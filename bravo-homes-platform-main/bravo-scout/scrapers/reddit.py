"""
scrapers/reddit.py — Scraper de Reddit via RSS

Monitora subreddits relevantes para home remodeling na região de Atlanta.
Usa feeds RSS públicos (mais confiável que JSON API de IPs de cloud).
"""

import httpx
from datetime import datetime, timedelta
import uuid
import xml.etree.ElementTree as ET
import html
import re


# Subreddits + queries via RSS search
REDDIT_RSS_FEEDS = [
    {"url": "https://www.reddit.com/r/HomeImprovement/search.rss?q=atlanta+remodel&sort=new&t=week&restrict_sr=on", "name": "r/HomeImprovement - atlanta remodel"},
    {"url": "https://www.reddit.com/r/HomeImprovement/search.rss?q=atlanta+contractor&sort=new&t=week&restrict_sr=on", "name": "r/HomeImprovement - atlanta contractor"},
    {"url": "https://www.reddit.com/r/HomeImprovement/search.rss?q=georgia+renovation&sort=new&t=week&restrict_sr=on", "name": "r/HomeImprovement - georgia renovation"},
    {"url": "https://www.reddit.com/r/Atlanta/search.rss?q=contractor+remodel&sort=new&t=week&restrict_sr=on", "name": "r/Atlanta - contractor remodel"},
    {"url": "https://www.reddit.com/r/Atlanta/search.rss?q=renovation+kitchen+bathroom&sort=new&t=week&restrict_sr=on", "name": "r/Atlanta - renovation"},
    {"url": "https://www.reddit.com/r/Atlanta/search.rss?q=handyman+recommend&sort=new&t=week&restrict_sr=on", "name": "r/Atlanta - handyman"},
    {"url": "https://www.reddit.com/r/HomeRenovation/search.rss?q=atlanta+georgia&sort=new&t=week&restrict_sr=on", "name": "r/HomeRenovation - atlanta"},
    {"url": "https://www.reddit.com/r/RealEstate/search.rss?q=atlanta+fixer+upper+renovation&sort=new&t=week&restrict_sr=on", "name": "r/RealEstate - atlanta renovation"},
    {"url": "https://www.reddit.com/r/Flipping/search.rss?q=atlanta+contractor+remodel&sort=new&t=week&restrict_sr=on", "name": "r/Flipping - atlanta contractor"},
    {"url": "https://www.reddit.com/r/DIY/search.rss?q=atlanta+contractor+help&sort=new&t=week&restrict_sr=on", "name": "r/DIY - atlanta contractor"},
    # New/Hot posts from r/Atlanta mentioning home services
    {"url": "https://www.reddit.com/r/Atlanta/new.rss?limit=50", "name": "r/Atlanta - new posts"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def _clean_html(raw_html: str) -> str:
    """Remove HTML tags and decode entities"""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def _parse_atom_feed(xml_text: str) -> list[dict]:
    """Parse Reddit's Atom/RSS feed XML"""
    entries = []
    try:
        root = ET.fromstring(xml_text)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        for entry in root.findall('.//atom:entry', ns):
            title_el = entry.find('atom:title', ns)
            content_el = entry.find('atom:content', ns)
            link_el = entry.find('atom:link', ns)
            author_el = entry.find('atom:author/atom:name', ns)
            updated_el = entry.find('atom:updated', ns)
            
            title = title_el.text if title_el is not None and title_el.text else ""
            content = _clean_html(content_el.text) if content_el is not None and content_el.text else ""
            link = link_el.get('href', '') if link_el is not None else ""
            author = author_el.text if author_el is not None and author_el.text else "Unknown"
            updated = updated_el.text if updated_el is not None and updated_el.text else ""
            
            entries.append({
                "title": title,
                "content": content[:600],
                "link": link,
                "author": author.replace('/u/', ''),
                "date": updated,
            })
    except ET.ParseError as e:
        print(f"  ⚠️ XML parse error: {e}")
    
    return entries


async def scrape_reddit() -> list[dict]:
    """
    Busca posts recentes no Reddit sobre home remodeling em Atlanta.
    Usa feeds RSS (mais confiável que JSON API de cloud IPs).
    """
    leads = []
    seen_urls = set()

    async with httpx.AsyncClient(timeout=15.0, headers=HEADERS, follow_redirects=True) as client:
        for feed_info in REDDIT_RSS_FEEDS:
            try:
                response = await client.get(feed_info["url"])

                if response.status_code == 429:
                    print(f"  ⚠️ Reddit {feed_info['name']}: Rate limited (429) — aguardando...")
                    continue
                if response.status_code != 200:
                    print(f"  ⚠️ Reddit {feed_info['name']}: HTTP {response.status_code}")
                    continue

                entries = _parse_atom_feed(response.text)
                
                count = 0
                for entry in entries:
                    if entry["link"] in seen_urls:
                        continue
                    seen_urls.add(entry["link"])
                    
                    text = f"{entry['title']} {entry['content']}".strip()
                    if len(text) < 20:
                        continue

                    lead = {
                        "lead_id": str(uuid.uuid4()),
                        "fonte": "reddit",
                        "grupo_ou_pagina": feed_info["name"],
                        "texto_original": text[:500],
                        "nome_autor": entry["author"],
                        "post_url": entry["link"],
                        "data_post": entry["date"] or datetime.now().isoformat(),
                        "timestamp_captura": datetime.now().isoformat(),
                    }
                    leads.append(lead)
                    count += 1

                print(f"  ✅ Reddit {feed_info['name']}: {count} posts")

            except Exception as e:
                print(f"  ❌ Erro Reddit {feed_info['name']}: {type(e).__name__}: {e}")

    print(f"  📦 Reddit total: {len(leads)} posts únicos coletados")
    return leads
