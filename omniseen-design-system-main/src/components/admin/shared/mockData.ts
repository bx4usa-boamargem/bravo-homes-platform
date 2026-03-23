export const MOCK_AGENT_COSTS = [
  { agent_name: 'serp_scout',       calls_count: 1204, total_tokens: 0,       total_cost_usd: 1.20, error_count: 2,  avg_duration_ms: 1240 },
  { agent_name: 'territory_mapper', calls_count: 892,  total_tokens: 0,       total_cost_usd: 15.16, error_count: 0, avg_duration_ms: 3800 },
  { agent_name: 'architect',        calls_count: 892,  total_tokens: 890000,  total_cost_usd: 4.45, error_count: 1,  avg_duration_ms: 8200 },
  { agent_name: 'scribe',           calls_count: 892,  total_tokens: 2100000, total_cost_usd: 10.50, error_count: 0, avg_duration_ms: 18400 },
  { agent_name: 'optimizer',        calls_count: 892,  total_tokens: 160000,  total_cost_usd: 0.024, error_count: 0, avg_duration_ms: 2100 },
  { agent_name: 'visionary',        calls_count: 2840, total_tokens: 0,       total_cost_usd: 8.52, error_count: 12, avg_duration_ms: 6200 },
  { agent_name: 'page_builder',     calls_count: 312,  total_tokens: 936000,  total_cost_usd: 4.68, error_count: 3,  avg_duration_ms: 22000 },
  { agent_name: 'publisher',        calls_count: 847,  total_tokens: 0,       total_cost_usd: 0,    error_count: 24, avg_duration_ms: 5400 },
];

export const MOCK_DAILY_COST = {
  openai_tokens: 4200000,
  openai_cost: 21.00,
  fal_images: 2840,
  fal_cost: 8.52,
  serper_calls: 1204,
  serper_cost: 1.20,
  places_calls: 892,
  places_cost: 15.16,
  total: 29.52,
  monthly_projection: 885,
};

export const AGENTS_MAP = [
  { key: 'serp_scout',       name: 'SERP Scout',       icon: '📡', color: '#00d4ff' },
  { key: 'territory_mapper', name: 'Territory Mapper',  icon: '🗺',  color: '#00ff88' },
  { key: 'architect',        name: 'Architect',         icon: '📐', color: '#ff6b00' },
  { key: 'scribe',           name: 'Scribe',            icon: '✍',  color: '#7c3aed' },
  { key: 'optimizer',        name: 'Optimizer',         icon: '🎯', color: '#ffd700' },
  { key: 'visionary',        name: 'Visionary',         icon: '👁',  color: '#ff2d88' },
  { key: 'page_builder',     name: 'Page Builder',      icon: '🚀', color: '#0096ff' },
  { key: 'publisher',        name: 'Publisher',          icon: '☁',  color: '#00b496' },
];

export type AgentCostData = typeof MOCK_AGENT_COSTS[number];

export interface AgentMeta {
  agentName: string;
  name: string;
  emoji: string;
  color: string;
  specialty: string;
}

export const AGENTS: AgentMeta[] = [
  { agentName: 'serp_scout',       name: 'SERP Scout',       emoji: '📡', color: '#00d4ff', specialty: 'Inteligência de Busca' },
  { agentName: 'territory_mapper', name: 'Territory Mapper',  emoji: '🗺',  color: '#00ff88', specialty: 'Inteligência Local' },
  { agentName: 'architect',        name: 'Architect',         emoji: '📐', color: '#ff6b00', specialty: 'Estratégia de Conteúdo' },
  { agentName: 'scribe',           name: 'Scribe',            emoji: '✍',  color: '#7c3aed', specialty: 'Criação de Conteúdo' },
  { agentName: 'optimizer',        name: 'Optimizer',         emoji: '🎯', color: '#ffd700', specialty: 'SEO Técnico' },
  { agentName: 'visionary',        name: 'Visionary',         emoji: '👁',  color: '#ff2d88', specialty: 'Criação Visual' },
  { agentName: 'page_builder',     name: 'Page Builder',      emoji: '🚀', color: '#0096ff', specialty: 'Landing Pages' },
  { agentName: 'publisher',        name: 'Publisher',          emoji: '☁',  color: '#00b496', specialty: 'Distribuição CMS' },
];

export const ROLE_ACCESS: Record<string, string[]> = {
  super_admin: ['p1','p2','p3','p4','p5','p6','p7'],
  analyst:     ['p1','p2','p3','p4','p5','p6','p7'],
  support:     ['p2'],
  finance:     ['p3','p5'],
  tech_ops:    ['p1','p6'],
};
