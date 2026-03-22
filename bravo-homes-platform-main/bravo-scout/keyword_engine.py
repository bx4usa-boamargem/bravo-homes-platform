"""
keyword_engine.py — Motor de Palavras-Chave do Bravo Scout

Analisa textos e detecta se contêm intenção de compra de serviços
de home remodeling na região de Atlanta Metro, GA.
"""

import re
from typing import Optional


# Palavras-chave de serviços
SERVICE_KEYWORDS = {
    "kitchen remodel": ["kitchen remodel", "kitchen renovation", "kitchen update", "kitchen cabinet", "kitchen countertop", "new kitchen"],
    "bathroom remodel": ["bathroom remodel", "bathroom renovation", "bath remodel", "bathroom update", "shower remodel", "tub replacement"],
    "flooring": ["flooring", "hardwood floor", "tile floor", "laminate floor", "vinyl plank", "floor install", "new floor"],
    "painting": ["painting", "painter", "house painting", "interior paint", "exterior paint", "repaint"],
    "deck/patio": ["deck", "patio", "deck build", "patio build", "outdoor deck", "deck repair"],
    "pressure washing": ["pressure wash", "power wash", "pressure cleaning"],
    "room addition": ["room addition", "home addition", "adding a room", "home expansion", "add a room"],
    "general remodel": ["remodel", "renovation", "contractor", "handyman", "home improvement", "drywall", "backsplash", "tile"],
}

# Palavras que indicam intenção de compra
INTENT_KEYWORDS = [
    "looking for", "need a", "recommend", "anyone know", "who did",
    "estimate", "quote", "how much", "cost of", "best contractor",
    "good contractor", "reliable contractor", "can anyone suggest",
    "had a bad experience", "looking to hire", "need help with",
    "want to", "planning to", "thinking about", "searching for",
    "does anyone have", "suggestions for", "referral", "reference",
    "who would you", "any recommendations", "busco", "procuro",
    "necesito", "alguien sabe", "recomiendan", "preciso de",
    "alguem conhece", "indicação", "indicacao",
]

# Cidades-alvo em Atlanta Metro
TARGET_CITIES = [
    "milton", "alpharetta", "roswell", "kennesaw", "acworth",
    "woodstock", "canton", "holly springs", "marietta", "smyrna",
    "vinings", "east cobb", "sandy springs", "johns creek",
    "dunwoody", "atlanta",
]

# Palavras que DESQUALIFICAM um post (contractors, spam, etc)
DISQUALIFY_KEYWORDS = [
    "we offer", "our company", "free estimate call us", "dm for quote",
    "years of experience", "licensed and insured contractor",
    "we specialize in", "contact us at", "our team",
    "hiring now", "we are hiring", "job opening",
]


class KeywordResult:
    """Resultado da análise de palavras-chave"""
    def __init__(self):
        self.has_service = False
        self.has_intent = False
        self.has_city = False
        self.is_disqualified = False
        self.detected_services: list[str] = []
        self.detected_cities: list[str] = []
        self.score: float = 0.0
        self.urgency: str = "baixa"

    @property
    def is_lead(self) -> bool:
        """Um texto é considerado lead se tem serviço + intenção e não é spam"""
        return self.has_service and self.has_intent and not self.is_disqualified

    def to_dict(self) -> dict:
        return {
            "is_lead": self.is_lead,
            "services": self.detected_services,
            "cities": self.detected_cities,
            "score": self.score,
            "urgency": self.urgency,
        }


def detect_urgency(text: str) -> str:
    """Detecta urgência baseada em palavras-chave"""
    text_lower = text.lower()

    high_urgency = [
        "asap", "urgently", "this week", "already started",
        "project stalled", "emergency", "right away", "immediately",
        "as soon as possible", "urgent", "today", "tomorrow",
    ]
    medium_urgency = [
        "this month", "this spring", "next month", "planning to",
        "soon", "in a few weeks", "this summer", "this year",
    ]

    for keyword in high_urgency:
        if keyword in text_lower:
            return "alta"

    for keyword in medium_urgency:
        if keyword in text_lower:
            return "media"

    return "baixa"


def analyze_text(text: str) -> KeywordResult:
    """
    Analisa um texto e retorna se é um potencial lead.
    
    Verifica:
    1. Contém palavras-chave de serviço
    2. Contém intenção de compra
    3. Menciona cidade-alvo (opcional, aumenta score)
    4. Não é spam/contractor
    """
    result = KeywordResult()
    text_lower = text.lower()

    # 1. Verificar desqualificação (spam, contractors)
    for keyword in DISQUALIFY_KEYWORDS:
        if keyword in text_lower:
            result.is_disqualified = True
            return result

    # 2. Detectar serviços
    for service_name, keywords in SERVICE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                if service_name not in result.detected_services:
                    result.detected_services.append(service_name)
                result.has_service = True
                result.score += 30

    # 3. Detectar intenção de compra
    for keyword in INTENT_KEYWORDS:
        if keyword in text_lower:
            result.has_intent = True
            result.score += 25
            break  # Uma intenção já é suficiente

    # 4. Detectar cidades
    for city in TARGET_CITIES:
        # Usar regex para evitar matches parciais (ex: "canton" dentro de outra palavra)
        pattern = r'\b' + re.escape(city) + r'\b'
        if re.search(pattern, text_lower):
            city_formatted = city.title() + ", GA"
            if city_formatted not in result.detected_cities:
                result.detected_cities.append(city_formatted)
            result.has_city = True
            result.score += 20

    # 5. Detectar urgência
    result.urgency = detect_urgency(text)
    if result.urgency == "alta":
        result.score += 25
    elif result.urgency == "media":
        result.score += 10

    # Limitar score a 100
    result.score = min(result.score, 100.0)

    return result


# ============================================================
# Testes rápidos (rodar: python keyword_engine.py)
# ============================================================
if __name__ == "__main__":
    test_texts = [
        # Lead válido (EN)
        "Anyone know a good contractor for a kitchen remodel in Milton? Need to get started ASAP!",
        # Lead válido (PT-BR)
        "Alguém conhece um bom contratante para reforma de banheiro em Marietta? Preciso de indicação.",
        # Lead válido (ES)
        "Alguien sabe de un buen contractor para remodel de cocina en Alpharetta?",
        # NÃO é lead (contractor fazendo propaganda)
        "We specialize in kitchen remodeling in Atlanta. Free estimate call us at 770-555-0000!",
        # NÃO é lead (sem intenção de compra)
        "Just finished my kitchen remodel in Roswell. Looks amazing!",
        # Lead com urgência alta
        "URGENT: Need a painter in Kennesaw this week. Previous contractor ghosted us.",
    ]

    print("=" * 60)
    print("🔍 BRAVO SCOUT — Teste do Motor de Palavras-Chave")
    print("=" * 60)

    for i, text in enumerate(test_texts, 1):
        result = analyze_text(text)
        status = "✅ LEAD" if result.is_lead else "❌ Não é lead"
        if result.is_disqualified:
            status = "🚫 SPAM"

        print(f"\n--- Teste {i} ---")
        print(f"Texto: \"{text[:80]}...\"")
        print(f"Status: {status}")
        print(f"Serviços: {result.detected_services}")
        print(f"Cidades: {result.detected_cities}")
        print(f"Urgência: {result.urgency}")
        print(f"Score: {result.score}/100")
