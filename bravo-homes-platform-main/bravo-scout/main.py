"""
main.py — Bravo Scout (Agente 1)

Agente de monitoramento que varre fontes públicas em busca de leads
de home remodeling em Atlanta Metro, GA.

Executa scrapers em intervalos regulares e encaminha leads qualificados
para o bravo-qualifier (Agente 2).
"""

import asyncio
import os
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from keyword_engine import analyze_text
from dispatcher import dispatch_leads
from scrapers.craigslist import scrape_craigslist
from scrapers.yelp import scrape_yelp_reviews
from scrapers.reddit import scrape_reddit
from scrapers.facebook_groups import scrape_facebook_groups
from scrapers.google_maps import scrape_google_maps
from scrapers.twitter import scrape_twitter
from scrapers.nextdoor import scrape_nextdoor

load_dotenv()

# ============================================================
# Estatísticas globais
# ============================================================
stats = {
    "started_at": datetime.now().isoformat(),
    "total_scans": 0,
    "total_leads_found": 0,
    "total_leads_sent": 0,
    "last_scan": None,
    "last_scan_results": {},
}

# ============================================================
# Ciclo principal de monitoramento
# ============================================================
async def run_scan():
    """Executa todos os scrapers, filtra com keyword engine, e encaminha leads"""
    print(f"\n{'='*60}")
    print(f"🔍 BRAVO SCOUT — Scan iniciado em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    stats["total_scans"] += 1
    all_raw_leads = []

    # 1. Executar scrapers (apenas os que funcionam de cloud IPs)
    scrapers = [
        # ("Craigslist RSS", scrape_craigslist),           # 403 Blocked from cloud IPs
        ("Reddit RSS", scrape_reddit),
        ("Yelp API", scrape_yelp_reviews),
        # DESATIVADOS — bloqueados de cloud IPs:
        # ("Facebook Groups", scrape_facebook_groups),    # Exige login
        # ("Google Maps Reviews", scrape_google_maps),    # Google CAPTCHA
        # ("Twitter/X", scrape_twitter),                  # Nitter morto
        # ("Nextdoor", scrape_nextdoor),                  # Google CAPTCHA
    ]

    for name, scraper_fn in scrapers:
        try:
            print(f"\n🌐 Varrendo {name}...")
            raw_leads = await scraper_fn()
            all_raw_leads.extend(raw_leads)
            print(f"   → {len(raw_leads)} posts coletados")
        except Exception as e:
            print(f"   ❌ Erro no {name}: {e}")

    print(f"\n📦 Total de posts coletados: {len(all_raw_leads)}")

    # 2. Filtrar com keyword engine
    qualified_leads = []
    for lead in all_raw_leads:
        text = lead.get("texto_original", "")
        result = analyze_text(text)

        if result.is_lead:
            # Enriquecer o lead com dados da análise
            lead["servico_detectado"] = result.detected_services[0] if result.detected_services else "General Remodel"
            lead["cidade_detectada"] = result.detected_cities[0] if result.detected_cities else "Atlanta Metro, GA"
            lead["urgencia_detectada"] = result.urgency
            lead["score"] = result.score
            lead["tipo"] = lead.get("tipo", "pedido_de_contractor")
            qualified_leads.append(lead)

    print(f"✅ Leads qualificados pelo keyword engine: {len(qualified_leads)}/{len(all_raw_leads)}")
    stats["total_leads_found"] += len(qualified_leads)

    # 3. Encaminhar para o bravo-qualifier
    if qualified_leads:
        dispatch_stats = await dispatch_leads(qualified_leads)
        stats["total_leads_sent"] += dispatch_stats.get("enviados", 0)
    else:
        print("ℹ️ Nenhum lead qualificado neste scan")

    stats["last_scan"] = datetime.now().isoformat()
    stats["last_scan_results"] = {
        "raw_posts": len(all_raw_leads),
        "qualified": len(qualified_leads),
    }

    print(f"\n🏁 Scan completo. Próximo scan em 2 horas.")


# ============================================================
# FastAPI + Scheduler
# ============================================================
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa o scheduler quando o servidor inicia"""
    # Agendar scan a cada 2 horas
    scheduler.add_job(run_scan, "interval", hours=2, id="main_scan")

    # Rodar primeiro scan ao iniciar
    scheduler.add_job(run_scan, "date", id="initial_scan")

    scheduler.start()
    print("🚀 BRAVO SCOUT — Agente de Monitoramento iniciado!")
    print(f"   Qualifier URL: {os.getenv('QUALIFIER_URL', 'http://localhost:8001')}")
    print(f"   Intervalo: a cada 2 horas")

    yield

    scheduler.shutdown()
    print("🛑 BRAVO SCOUT — Agente encerrado.")


app = FastAPI(
    title="Bravo Scout",
    description="Agente de monitoramento de leads — Bravo Homes Group",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"agent": "bravo-scout", "status": "online"}


@app.get("/status")
async def status():
    return {
        "agent": "bravo-scout",
        "status": "online",
        "stats": stats,
    }


@app.post("/scan-now")
async def trigger_scan():
    """Endpoint para disparar um scan manualmente"""
    asyncio.create_task(run_scan())
    return {"message": "Scan iniciado em background"}


@app.get("/debug-scan")
async def debug_scan():
    """Endpoint de debug: roda scrapers inline e retorna detalhes"""
    import traceback as tb
    scrapers = [
        ("Craigslist RSS", scrape_craigslist),
        ("Reddit RSS", scrape_reddit),
        ("Yelp API", scrape_yelp_reviews),
    ]
    results = {}
    for name, scraper_fn in scrapers:
        try:
            raw_leads = await scraper_fn()
            results[name] = {
                "status": "ok",
                "count": len(raw_leads),
                "sample": [l.get("texto_original", "")[:100] for l in raw_leads[:3]],
            }
        except Exception as e:
            results[name] = {
                "status": "error",
                "error": str(e),
                "traceback": tb.format_exc(),
            }
    return {"scrapers": results, "qualifier_url": os.getenv("QUALIFIER_URL", "NOT SET")}


@app.get("/debug-http")
async def debug_http():
    """Test raw HTTP requests to see what each source actually returns"""
    import httpx
    test_urls = [
        ("Craigslist RSS - remodel", "https://atlanta.craigslist.org/search/hss?format=rss&query=remodel"),
        ("Craigslist RSS - contractor", "https://atlanta.craigslist.org/search/hss?format=rss&query=contractor"),
        ("Craigslist RSS - kitchen", "https://atlanta.craigslist.org/search/hss?format=rss&query=kitchen"),
        ("Craigslist RSS - no query", "https://atlanta.craigslist.org/search/hss?format=rss"),
        ("Reddit RSS - r/Atlanta", "https://www.reddit.com/r/Atlanta/new.rss?limit=5"),
        ("Reddit RSS - search", "https://www.reddit.com/r/Atlanta/search.rss?q=contractor&sort=new&t=week&restrict_sr=on"),
    ]
    results = {}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    async with httpx.AsyncClient(timeout=15.0, headers=headers, follow_redirects=True) as client:
        for name, url in test_urls:
            try:
                resp = await client.get(url)
                results[name] = {
                    "status_code": resp.status_code,
                    "content_length": len(resp.text),
                    "content_type": resp.headers.get("content-type", "unknown"),
                    "first_500_chars": resp.text[:500],
                }
            except Exception as e:
                results[name] = {"error": str(e)}
    return results


@app.get("/debug-reddit")
async def debug_reddit():
    """Test Reddit RSS fetch + feedparser parse on a single feed"""
    import httpx
    import feedparser
    url = "https://www.reddit.com/r/Atlanta/new.rss?limit=5"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"}
    async with httpx.AsyncClient(timeout=15.0, headers=headers, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            feed = feedparser.parse(resp.text)
            entries_data = []
            for e in feed.entries[:3]:
                entries_data.append({
                    "title": e.get("title", "?")[:100],
                    "link": e.get("link", "?"),
                    "author": e.get("author", "?"),
                    "summary_len": len(e.get("summary", "")),
                })
            return {
                "url": url,
                "http_status": resp.status_code,
                "response_length": len(resp.text),
                "content_type": resp.headers.get("content-type", "?"),
                "feedparser_version": feed.get("version", "?"),
                "feed_title": feed.feed.get("title", "?") if hasattr(feed, 'feed') else "?",
                "entries_count": len(feed.entries),
                "entries": entries_data,
                "first_200_chars": resp.text[:200],
            }
        except Exception as e:
            import traceback
            return {"error": str(e), "traceback": traceback.format_exc()}


# ============================================================
# Rodar diretamente: python main.py
# ============================================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
