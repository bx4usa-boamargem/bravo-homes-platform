import React from 'react';

interface PartnerHomeTabProps {
  projects: any[];
  stages: any[];
  messages: any[];
  leads: any[];
  events: any[];
  logs: any[];
  setActiveTab: (tab: string) => void;
  user?: any;
}

export default function PartnerHomeTab({
  projects, stages, messages, leads, events, logs, setActiveTab, user
}: PartnerHomeTabProps) {
  
  // Calcula mensagens recebidas não respondidas
  const unansweredCount = React.useMemo(() => {
    if (!user || !user.id || !messages) return 0;
    
    // Identifica todos os parceiros de conversa (pessoas com quem enviei ou recebi msg)
    const clientIds = new Set<string>();
    messages.forEach((m: any) => {
      if (m.sender_id && m.sender_id !== user.id) clientIds.add(m.sender_id);
      if (m.receiver_id && m.receiver_id !== user.id) clientIds.add(m.receiver_id);
    });

    let totalUnanswered = 0;
    
    // Para cada cliente, conta quantas mensagens ele enviou DEPOIS da minha última resposta
    clientIds.forEach(clientId => {
      // Filtra a conversa específica ordenando da mais nova para a mais antiga
      const thread = messages
        .filter((m: any) => (m.sender_id === user.id && m.receiver_id === clientId) || (m.sender_id === clientId && m.receiver_id === user.id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      for (const m of thread) {
        if (m.sender_id === clientId && m.receiver_id === user.id) {
          totalUnanswered++;
        } else if (m.sender_id === user.id) {
          // Achei uma mensagem MINHA. Isso significa que todas as mensagens dele anteriores a isso
          // já foram teoricamente "respondidas" por mim.
          break;
        }
      }
    });

    return totalUnanswered;
  }, [messages, user]);

  return (
    <div className="page active">
      <div className="kpi-grid">
        <div className="kpi gold"><div className="kl">Projetos Ativos</div><div className="kv">{projects.length}</div><div className="kc">Em andamento</div></div>
        <div className="kpi green"><div className="kl">Etapas Criadas</div><div className="kv">{stages.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div><div className="kc">Esta semana</div></div>
        <div className="kpi blue"><div className="kl">Mensagens</div><div className="kv">{unansweredCount}</div><div className="kc">Sem Resposta</div></div>
        <div className="kpi orange"><div className="kl">Leads Atribuídos</div><div className="kv">{leads.length}</div><div className="kc">Para você</div></div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ch"><span className="ct">Próximas Atividades</span><span className="ca" onClick={() => setActiveTab('calendar')} style={{cursor: 'pointer', textDecoration: 'underline'}}>Ver calendário →</span></div>
          <div className="cb">
            {events.length === 0 && <div style={{padding: '20px', textAlign: 'center', color: 'var(--t2)', fontSize: '0.85rem'}}>Nenhuma atividade agendada.</div>}
            {events.slice(0, 4).map(ev => {
               const pOpts = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' } as any;
               return (
                 <div key={ev.id} className="log-item" style={{display:'flex', gap: '10px', padding: '10px', borderBottom: '1px solid var(--b)'}}>
                   <div className="log-date" style={{width: '120px', fontSize: '0.8rem', color: 'var(--t3)'}}>{new Date(ev.event_date || ev.start_time).toLocaleString('pt-br', pOpts)}</div>
                   <div className="log-text" style={{fontSize: '0.9rem'}}><strong>Agenda</strong> — {ev.title}</div>
                 </div>
               );
            })}
          </div>
        </div>
        <div className="card">
          <div className="ch"><span className="ct">Alertas e Logs</span></div>
          <div className="cb">
            {logs.length === 0 && <div style={{padding: '20px', textAlign: 'center', color: 'var(--t2)', fontSize: '0.85rem'}}>Nenhum alerta recente.</div>}
            {logs.slice(0, 4).map(log => (
              <div key={log.id} className="alert-item" style={{display:'flex', gap: '10px', padding: '10px', borderBottom: '1px solid var(--b)', alignItems:'center'}}>
                <div className="aid light-blue" style={{background: 'var(--blue)', width:'10px', height:'10px', borderRadius:'50%'}}></div>
                <div className="atxt" style={{fontSize: '0.9rem'}}><strong>Log:</strong> {log.log_text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
