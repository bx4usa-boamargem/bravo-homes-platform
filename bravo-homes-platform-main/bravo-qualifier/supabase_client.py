"""
supabase_client.py — Inserção de Leads na Plataforma Bravo

Insere leads qualificados (QUENTES e MORNOS) diretamente no Supabase
usando a SERVICE_ROLE_KEY para bypass do RLS.

Tabelas:
- clients: dados do contato (nome, telefone, email, cidade)
- leads: dados do lead (serviço, valor, status, urgência, fonte, notas)
"""

import os
import httpx
from typing import Optional, Tuple
from datetime import datetime


SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tyeaqluofishcvhvpwrg.supabase.co")


def get_headers() -> dict:
    """Retorna headers com SERVICE_ROLE_KEY para bypass do RLS"""
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not service_key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY não configurada!")

    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


async def create_client(qualification: dict) -> Optional[str]:
    """
    Cria um Cliente na tabela 'clients' do Supabase.
    Retorna o ID do cliente criado ou None se falhar.
    """
    payload = {
        "name": qualification.get("client_name", "Unknown"),
        "email": "",
        "phone": "",
        "city": qualification.get("city", "Atlanta Metro, GA"),
        "state": "GA",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/clients",
                json=payload,
                headers=get_headers(),
            )

            if response.status_code in (200, 201):
                data = response.json()
                client_id = data[0]["id"] if isinstance(data, list) else data.get("id")
                print(f"  ✅ Cliente criado no Supabase: {client_id}")
                return client_id
            else:
                print(f"  ⚠️ Erro ao criar cliente: {response.status_code} - {response.text[:200]}")
                return None

    except Exception as e:
        print(f"  ❌ Erro de conexão ao criar cliente: {e}")
        return None


async def create_lead(client_id: str, qualification: dict) -> Optional[str]:
    """
    Cria um Lead na tabela 'leads' do Supabase.
    Retorna o ID do lead criado ou None se falhar.
    """
    classificacao = qualification.get("classificacao", "warm")
    lead_original = qualification.get("lead_original", {})

    # Montar notas completas em PT-BR
    emoji = "🔥" if classificacao == "hot" else "🟡"
    notas = (
        f"{emoji} Qualificação Automática (GPT-4o)\n"
        f"{'='*40}\n\n"
        f"📝 Resumo:\n{qualification.get('summary', 'N/A')}\n\n"
        f"🔍 Notas de qualificação:\n{qualification.get('qualification_notes', 'N/A')}\n\n"
        f"💡 Ação recomendada:\n{qualification.get('recommended_action', 'N/A')}\n\n"
        f"{'='*40}\n"
        f"📊 Classificação: {classificacao.upper()}\n"
        f"💰 Budget estimado: ${qualification.get('estimated_budget', 0):,}\n"
        f"📍 Cidade: {qualification.get('city', 'N/A')}\n"
        f"🌐 Idioma original: {qualification.get('original_language', 'en-US')}\n"
        f"📊 Confiança: {qualification.get('confidence', 0)}%\n"
        f"📍 Fonte: {lead_original.get('fonte', 'N/A')} → {lead_original.get('grupo_ou_pagina', 'N/A')}\n"
        f"🔗 URL: {lead_original.get('post_url', 'N/A')}\n\n"
        f"📄 Texto original (trecho):\n\"{lead_original.get('texto_original', 'N/A')[:300]}\""
    )

    # Montar service_type com cidade para exibição no dashboard
    city = qualification.get("city", "Atlanta Metro, GA")
    service_type = f"{qualification.get('service_type', 'General Remodel')} • {city}"

    # Map classificacao to pipeline status
    status_map = {"hot": "qualified", "warm": "new", "cold": "new"}
    lead_status = status_map.get(classificacao, "new")

    payload = {
        "client_id": client_id,
        "name": qualification.get("client_name", "Unknown"),
        "service_type": service_type,
        "estimated_value": qualification.get("estimated_budget", 0),
        "score": qualification.get("confidence", 0),
        "source": lead_original.get("fonte", "scout"),
        "city": city,
        "status": lead_status,
        "notes": notas,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/leads",
                json=payload,
                headers=get_headers(),
            )

            if response.status_code in (200, 201):
                data = response.json()
                lead_id = data[0]["id"] if isinstance(data, list) else data.get("id")
                print(f"  ✅ Lead inserido no Supabase: {lead_id}")
                return lead_id
            else:
                print(f"  ⚠️ Erro ao criar lead: {response.status_code} - {response.text[:200]}")
                return None

    except Exception as e:
        print(f"  ❌ Erro de conexão ao criar lead: {e}")
        return None


async def insert_qualified_lead(qualification: dict) -> Tuple[Optional[str], Optional[str]]:
    """
    Fluxo completo: cria cliente + lead no Supabase.
    Retorna (client_id, lead_id) ou (None, None) se falhar.
    """
    classificacao = qualification.get("classificacao", "cold")

    # Só inserir leads QUENTES e MORNOS
    if classificacao not in ("hot", "warm"):
        print(f"  ❄️ Lead FRIO descartado — NÃO será inserido na plataforma")
        return None, None

    emoji = "🔥" if classificacao == "hot" else "🟡"
    print(f"\n  {emoji} Lead {classificacao.upper()} — Inserindo na plataforma Bravo...")

    # Passo 1: Criar cliente
    client_id = await create_client(qualification)
    if not client_id:
        print("  ❌ Falha ao criar cliente. Lead não inserido.")
        return None, None

    # Passo 2: Criar lead vinculado ao cliente
    lead_id = await create_lead(client_id, qualification)
    if not lead_id:
        print("  ❌ Falha ao criar lead. Cliente foi criado mas lead não foi vinculado.")
        return client_id, None

    print(f"  🎯 Lead inserido com sucesso! client={client_id}, lead={lead_id}")
    return client_id, lead_id
