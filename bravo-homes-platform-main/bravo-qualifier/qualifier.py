"""
qualifier.py — Motor de Qualificação com GPT-4o

Recebe leads crus do bravo-scout e usa GPT-4o para:
1. Analisar o texto original do lead
2. Classificar como QUENTE / MORNO / FRIO
3. Gerar resumo de qualificação SEMPRE EM PT-BR
4. Extrair dados estruturados (serviço, cidade, budget, urgência)

Suporta leads em 3 idiomas: English US, PT-BR, Español.
"""

import os
import json
from openai import AsyncOpenAI
from typing import Optional


SYSTEM_PROMPT = """Você é um qualificador de leads sênior da Bravo Homes Group, uma empresa de gerenciamento de projetos de home remodeling em Atlanta Metro, GA.

Você é FLUENTE em 3 idiomas: Inglês Americano, Português Brasileiro e Espanhol.
Você consegue LER e ENTENDER leads em qualquer um desses 3 idiomas.

IMPORTANTE: Seu resumo e notas de qualificação para os administradores DEVEM SER ESCRITOS SEMPRE EM PORTUGUÊS DO BRASIL (PT-BR), independente do idioma original do lead.

Sua função: analisar o texto bruto de um lead (post, review ou pergunta) e produzir uma qualificação estruturada.

## Critérios de Classificação:

🔥 QUENTE (hot):
- Quer agendar estimativa esta semana ou mês
- Budget definido ou mencionado
- Projeto parado de concorrente (Review Rescue)
- Respondeu com entusiasmo e detalhes
- Urgência explícita (ASAP, esta semana, etc)

🟡 MORNO (warm):
- Interesse claro mas timing vago (próximo trimestre)
- Pediu mais informações sem fechar agenda
- Comparando opções entre contractors
- Está pesquisando preços

❄️ FRIO (cold):
- Sem urgência real, apenas curiosidade
- Já contratou alguém
- Budget muito abaixo do mínimo viável
- Post muito antigo ou vago

## Faixas de Preço por Serviço (referência):
- Pressure Washing: $450–$700
- Exterior Painting: $3,500–$5,500
- Flooring: $6,000–$10,000
- Deck/Patio: $12,000–$18,000
- Bathroom Remodel: $30,000–$50,000
- Kitchen Remodel: $38,000–$65,000
- Room Addition: $95,000–$140,000

## Cidades-Alvo:
Milton, Alpharetta, Roswell, Kennesaw, Acworth, Woodstock, Canton, Holly Springs, Marietta, Smyrna

Responda SEMPRE em formato JSON válido, sem markdown, sem código, apenas o JSON puro."""


USER_PROMPT_TEMPLATE = """Analise este lead e retorne a qualificação em JSON:

**Fonte:** {fonte}
**Grupo/Página:** {grupo}
**Texto original do lead:**
"{texto}"

**Serviço detectado pelo scanner:** {servico}
**Cidade detectada:** {cidade}
**Urgência estimada:** {urgencia}

Retorne EXATAMENTE este formato JSON (sem markdown):
{{
    "classificacao": "hot" | "warm" | "cold",
    "service_type": "tipo de serviço confirmado em inglês",
    "city": "cidade confirmada",
    "estimated_budget": numero_inteiro_em_dolares,
    "urgency": "hot" | "warm" | "cold",
    "original_language": "en-US" | "pt-BR" | "es",
    "summary": "resumo de 2-3 frases SEMPRE EM PT-BR",
    "qualification_notes": "por que classificou assim, SEMPRE EM PT-BR",
    "recommended_action": "ação recomendada para o admin, SEMPRE EM PT-BR",
    "client_name": "nome do autor do post ou Unknown",
    "confidence": numero_de_0_a_100
}}"""


async def qualify_lead(lead: dict) -> Optional[dict]:
    """
    Usa GPT-4o para qualificar um lead.
    Retorna dados de qualificação ou None se falhar.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY não configurada!")
        return None

    client = AsyncOpenAI(api_key=api_key)

    user_prompt = USER_PROMPT_TEMPLATE.format(
        fonte=lead.get("fonte", "desconhecida"),
        grupo=lead.get("grupo_ou_pagina", "desconhecido"),
        texto=lead.get("texto_original", "")[:1500],  # Limitar tamanho
        servico=lead.get("servico_detectado", "General Remodel"),
        cidade=lead.get("cidade_detectada", "Atlanta Metro, GA"),
        urgencia=lead.get("urgencia_detectada", "media"),
    )

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        qualification = json.loads(content)

        # Mesclar dados originais do lead com a qualificação
        qualification["lead_original"] = {
            "lead_id": lead.get("lead_id"),
            "fonte": lead.get("fonte"),
            "grupo_ou_pagina": lead.get("grupo_ou_pagina"),
            "texto_original": lead.get("texto_original", "")[:500],
            "nome_autor": lead.get("nome_autor"),
            "post_url": lead.get("post_url"),
            "data_post": lead.get("data_post"),
        }

        # Garantir que o nome do cliente venha do lead se não for extraído
        if not qualification.get("client_name") or qualification["client_name"] == "Unknown":
            qualification["client_name"] = lead.get("nome_autor", "Unknown")

        print(f"  🧠 GPT-4o classificou como: {qualification.get('classificacao', '?').upper()}")
        print(f"     Serviço: {qualification.get('service_type')}")
        print(f"     Cidade: {qualification.get('city')}")
        print(f"     Budget: ${qualification.get('estimated_budget', 0):,}")
        print(f"     Confiança: {qualification.get('confidence', 0)}%")

        return qualification

    except json.JSONDecodeError as e:
        print(f"  ❌ GPT-4o retornou JSON inválido: {e}")
        return None
    except Exception as e:
        print(f"  ❌ Erro ao qualificar com GPT-4o: {e}")
        return None
