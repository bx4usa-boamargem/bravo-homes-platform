"""
main.py — Bravo Qualifier (Agente 2)

Agente de qualificação de leads da Bravo Homes Group.
Recebe leads do bravo-scout, qualifica com GPT-4o em 3 idiomas,
e insere leads QUENTES e MORNOS na plataforma Bravo (Supabase).

Resumos de qualificação SEMPRE em PT-BR para os administradores.
"""

import os
import json
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from qualifier import qualify_lead
from supabase_client import insert_qualified_lead

load_dotenv()

# ============================================================
# Estatísticas globais
# ============================================================
stats = {
    "started_at": datetime.now().isoformat(),
    "total_received": 0,
    "total_hot": 0,
    "total_warm": 0,
    "total_cold": 0,
    "total_inserted": 0,
    "total_errors": 0,
    "last_lead": None,
}

# Log de leads processados
CONVERSATIONS_DIR = os.path.join(os.path.dirname(__file__), "conversations")
os.makedirs(CONVERSATIONS_DIR, exist_ok=True)


# ============================================================
# FastAPI
# ============================================================
app = FastAPI(
    title="Bravo Qualifier",
    description="Agente de qualificação de leads — Bravo Homes Group",
)


class LeadInput(BaseModel):
    lead_id: str
    fonte: str = "unknown"
    grupo_ou_pagina: str = ""
    texto_original: str
    nome_autor: str = "Unknown"
    post_url: str = ""
    data_post: str = ""
    servico_detectado: str = "General Remodel"
    cidade_detectada: str = "Atlanta Metro, GA"
    urgencia_detectada: str = "media"
    score: float = 0.0
    tipo: str = "pedido_de_contractor"
    timestamp_captura: str = ""


@app.get("/")
async def root():
    return {"agent": "bravo-qualifier", "status": "online"}


@app.get("/status")
async def status():
    return {
        "agent": "bravo-qualifier",
        "status": "online",
        "stats": stats,
    }


@app.post("/novo-lead")
async def novo_lead(lead: LeadInput):
    """
    Recebe um lead do bravo-scout, qualifica com GPT-4o,
    e insere na plataforma Bravo se for QUENTE ou MORNO.
    """
    stats["total_received"] += 1
    lead_dict = lead.model_dump()

    print(f"\n{'='*60}")
    print(f"🧠 BRAVO QUALIFIER — Novo lead recebido")
    print(f"   ID: {lead.lead_id[:8]}...")
    print(f"   Fonte: {lead.fonte} → {lead.grupo_ou_pagina}")
    print(f"   Serviço: {lead.servico_detectado}")
    print(f"   Cidade: {lead.cidade_detectada}")
    print(f"{'='*60}")

    # 1. Qualificar com GPT-4o
    print("\n  📡 Enviando para GPT-4o...")
    qualification = await qualify_lead(lead_dict)

    if not qualification:
        stats["total_errors"] += 1
        raise HTTPException(status_code=500, detail="Falha na qualificação GPT-4o")

    classificacao = qualification.get("classificacao", "cold")

    # 2. Atualizar estatísticas
    if classificacao == "hot":
        stats["total_hot"] += 1
    elif classificacao == "warm":
        stats["total_warm"] += 1
    else:
        stats["total_cold"] += 1

    # 3. Salvar conversa local
    conversation = {
        "lead_id": lead.lead_id,
        "dados_originais": lead_dict,
        "qualificacao": qualification,
        "classificacao": classificacao,
        "timestamp": datetime.now().isoformat(),
    }

    conv_file = os.path.join(CONVERSATIONS_DIR, f"{lead.lead_id}.json")
    with open(conv_file, "w", encoding="utf-8") as f:
        json.dump(conversation, f, ensure_ascii=False, indent=2)

    # 4. Inserir na plataforma Bravo (apenas QUENTE e MORNO)
    client_id, lead_id = None, None
    if classificacao in ("hot", "warm"):
        client_id, lead_id = await insert_qualified_lead(qualification)
        if lead_id:
            stats["total_inserted"] += 1
            print(f"\n  🎉 Lead inserido na plataforma Bravo!")
        else:
            stats["total_errors"] += 1
            print(f"\n  ⚠️ Falha ao inserir na plataforma")
    else:
        print(f"\n  ❄️ Lead FRIO — descartado, não entra na plataforma")

    stats["last_lead"] = {
        "lead_id": lead.lead_id,
        "classificacao": classificacao,
        "inserted": lead_id is not None,
        "timestamp": datetime.now().isoformat(),
    }

    emoji_map = {"hot": "🔥", "warm": "🟡", "cold": "❄️"}

    return {
        "status": "ok",
        "lead_id": lead.lead_id,
        "classificacao": classificacao,
        "emoji": emoji_map.get(classificacao, "❓"),
        "inserted_to_platform": lead_id is not None,
        "supabase_client_id": client_id,
        "supabase_lead_id": lead_id,
        "summary": qualification.get("summary", ""),
        "recommended_action": qualification.get("recommended_action", ""),
    }


# ============================================================
# Rodar diretamente: python main.py
# ============================================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    print(f"🚀 BRAVO QUALIFIER — Iniciando na porta {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
