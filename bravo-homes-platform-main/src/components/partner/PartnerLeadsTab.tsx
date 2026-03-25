import React from 'react';

interface PartnerLeadsTabProps {
  leads: any[];
  loadingDb: boolean;
  expandedLead: string | null;
  setExpandedLead: (id: string | null) => void;
  getUrgencyColor: (u: string) => string;
  getStatusColor: (s: string) => string;
  leadStatuses: string[];
  updateLeadStatus: (id: string, status: string) => void;
  leadNotes: Record<string, string>;
  setLeadNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveLeadNotes: (id: string) => void;
  deleteLead: (id: string) => void;
}

export default function PartnerLeadsTab({
  leads, loadingDb, expandedLead, setExpandedLead,
  getUrgencyColor, getStatusColor, leadStatuses, updateLeadStatus,
  leadNotes, setLeadNotes, saveLeadNotes, deleteLead
}: PartnerLeadsTabProps) {
  return (
    <div className="page active">
      <div className="u-mb-16">
        <div className="u-mono-label-xs">{leads.length} leads atribuídos</div>
        <div className="u-syne-title u-mt-3">Leads Atribuídos</div>
      </div>
      
      {leads.length === 0 && !loadingDb && (
        <div className="card">
          <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
            <div className="u-emoji-icon">🎯</div>
            <div style={{fontSize:'0.9rem',marginBottom:6}}>Nenhum lead atribuído a você no momento</div>
            <div style={{fontSize:'0.75rem'}}>Quando a equipe Bravo encaminhar clientes potenciais, eles aparecerão aqui para você gerenciar</div>
          </div>
        </div>
      )}

      {leads.map((l: any) => (
        <div className="card" key={l.id} style={{marginBottom:10,border: expandedLead === l.id ? '1px solid var(--gold)' : undefined}}>
          <div style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}} onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)}>
            <div style={{width:10,height:10,borderRadius:'50%',background:getUrgencyColor(l.urgency || ''),flexShrink:0}}></div>
            <div className="u-flex-1-min">
              <div style={{fontWeight:700,fontSize:'0.92rem'}}>{l.name || 'Sem nome'}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)',marginTop:2}}>{l.service_type || 'Serviço'} · {l.city || 'Cidade n/d'} · {l.source || 'Manual'}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'0.72rem',fontWeight:600,color:getStatusColor(l.status || 'Novo'),marginBottom:2}}>{l.status || 'Novo'}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)'}}>{l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : ''}</div>
            </div>
            <span style={{color:'var(--t3)',fontSize:'0.7rem'}}>{expandedLead === l.id ? '▲' : '▼'}</span>
          </div>

          {expandedLead === l.id && (
            <div style={{padding:'0 16px 16px',borderTop:'1px solid var(--b)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14,marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Telefone</div>
                  <div style={{fontSize:'0.88rem',fontWeight:600}}>{l.phone || 'Não informado'}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>E-mail</div>
                  <div style={{fontSize:'0.88rem',fontWeight:600,wordBreak:'break-all'}}>{l.email || 'Não informado'}</div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Urgência</div>
                  <div style={{fontSize:'0.82rem',fontWeight:600,color:getUrgencyColor(l.urgency || '')}}>
                    {l.urgency === 'alta' || l.urgency === 'hot' ? '🔴 Alta' : l.urgency === 'media' || l.urgency === 'warm' ? '🟠 Média' : '🟢 Baixa'}
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Serviço</div>
                  <div style={{fontSize:'0.82rem',fontWeight:600}}>{l.service_type || 'N/D'}</div>
                </div>
              </div>

              <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                {l.phone && <a href={`sms:${l.phone}`} className="btn gold u-btn-link">💬 SMS</a>}
                {l.phone && <a href={`tel:${l.phone}`} className="btn ghost u-btn-link">📞 Call</a>}
                {l.phone && <a href={`https://wa.me/1${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn ghost u-btn-link">📱 WhatsApp</a>}
                {l.email && <a href={`mailto:${l.email}`} className="btn ghost u-btn-link">✉️ E-mail</a>}
              </div>

              <div className="u-mb-14">
                <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:6}}>Status do Lead</label>
                <select className="f-inp" value={l.status || ''} onChange={e => updateLeadStatus(l.id, e.target.value)}>
                  <option value="" disabled>-- Selecione --</option>
                  {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="u-mb-14">
                <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:6}}>Observações</label>
                <textarea className="f-inp" style={{resize:'vertical',minHeight:70}} placeholder="Anote informações sobre este lead..." value={leadNotes[l.id] !== undefined ? leadNotes[l.id] : (l.notes || '')} onChange={e => setLeadNotes(prev => ({...prev, [l.id]: e.target.value}))}></textarea>
                {leadNotes[l.id] !== undefined && leadNotes[l.id] !== (l.notes || '') && (
                  <button className="btn gold" style={{marginTop:6,fontSize:'0.72rem',padding:'5px 14px'}} onClick={() => saveLeadNotes(l.id)}>💾 Salvar observações</button>
                )}
              </div>

              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button className="btn ghost" style={{fontSize:'0.7rem',padding:'5px 12px',color:'var(--red)'}} onClick={() => deleteLead(l.id)}>🗑 Remover lead</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
