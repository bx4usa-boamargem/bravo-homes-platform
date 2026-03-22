"""
dispatcher.py — Encaminha leads qualificados para o Agente 2 (bravo-qualifier)

Envia leads via POST HTTP para o bravo-qualifier processar.
"""

import httpx
import json
import os
from datetime import datetime


QUALIFIER_URL = os.getenv("QUALIFIER_URL", "http://localhost:8001")
LEADS_SEEN_FILE = os.path.join(os.path.dirname(__file__), "leads_seen.json")


def load_seen_leads() -> set:
    """Carrega IDs de leads já processados"""
    try:
        with open(LEADS_SEEN_FILE, "r") as f:
            return set(json.load(f))
    except (FileNotFoundError, json.JSONDecodeError):
        return set()


def save_seen_leads(seen: set):
    """Salva IDs de leads processados"""
    # Manter apenas os últimos 5000 IDs para não crescer infinitamente
    recent = list(seen)[-5000:]
    with open(LEADS_SEEN_FILE, "w") as f:
        json.dump(recent, f)


async def dispatch_lead(lead: dict) -> bool:
    """
    Envia um lead para o bravo-qualifier via POST.
    Retorna True se enviado com sucesso.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{QUALIFIER_URL}/novo-lead",
                json=lead,
            )

            if response.status_code == 200:
                print(f"  📤 Lead {lead['lead_id'][:8]}... encaminhado ao qualifier")
                return True
            else:
                print(f"  ⚠️ Qualifier respondeu {response.status_code}: {response.text[:100]}")
                return False

    except httpx.ConnectError:
        print(f"  ❌ Não conseguiu conectar ao qualifier em {QUALIFIER_URL}")
        return False
    except Exception as e:
        print(f"  ❌ Erro ao encaminhar: {e}")
        return False


async def dispatch_leads(leads: list[dict]) -> dict:
    """
    Filtra leads já vistos e encaminha os novos para o qualifier.
    Retorna estatísticas.
    """
    seen = load_seen_leads()
    stats = {"total": len(leads), "novos": 0, "enviados": 0, "erros": 0}

    for lead in leads:
        lead_id = lead.get("lead_id") or lead.get("post_url", "")

        if lead_id in seen:
            continue

        stats["novos"] += 1
        seen.add(lead_id)

        success = await dispatch_lead(lead)
        if success:
            stats["enviados"] += 1
        else:
            stats["erros"] += 1

    save_seen_leads(seen)

    print(f"\n📊 Dispatch: {stats['total']} total | {stats['novos']} novos | "
          f"{stats['enviados']} enviados | {stats['erros']} erros")

    return stats
