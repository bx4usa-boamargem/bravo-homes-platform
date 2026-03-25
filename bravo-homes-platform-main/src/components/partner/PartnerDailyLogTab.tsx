

interface PartnerDailyLogTabProps {
  projects: any[];
  logs: any[];
  logForm: any;
  setLogForm: (form: any) => void;
  submitLog: () => void;
  isSavingLog: boolean;
  getProjectName: (id: string) => string;
  deleteLog: (id: string) => void;
}

export default function PartnerDailyLogTab({
  projects, logs, logForm, setLogForm, submitLog, isSavingLog, getProjectName, deleteLog
}: PartnerDailyLogTabProps) {
  return (
    <div className="page active">
      <div className="u-mb-16">
        <div className="u-mono-label-xs">Registro diário de atividades</div>
        <div className="u-syne-title u-mt-3">Log Diário de Atividades</div>
      </div>

      {/* Form */}
      <div className="card u-mb-14">
        <div className="ch"><span className="ct">📝 Registrar hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        <div className="cb">
          <div style={{marginBottom:12}}>
            <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Projeto *</label>
            <select className="f-inp" value={logForm.project_id} onChange={e => setLogForm({...logForm, project_id: e.target.value})}>
              <option value="" disabled>-- Selecione --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
            </select>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>O que foi feito hoje? *</label>
            <textarea className="f-inp" style={{resize:'vertical',minHeight:100}} placeholder="Descreva as atividades realizadas hoje na obra..." value={logForm.log_text} onChange={e => setLogForm({...logForm, log_text: e.target.value})}></textarea>
          </div>
          <div className="u-mb-14">
            <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Materiais utilizados</label>
            <input className="f-inp" type="text" placeholder="Ex: 40 azulejos 60x60, argamassa, rejunte..." value={logForm.materials} onChange={e => setLogForm({...logForm, materials: e.target.value})} />
          </div>
          <button className="btn gold" onClick={submitLog} disabled={isSavingLog} style={{opacity: isSavingLog ? 0.6 : 1}}>
            {isSavingLog ? '⏳ Salvando...' : '💾 Salvar log do dia'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <div className="ch"><span className="ct">📚 Histórico de Logs</span><span className="ca">{logs.length} registro(s)</span></div>
        <div className="cb" style={{padding: logs.length === 0 ? undefined : 0}}>
          {logs.length === 0 && <div style={{padding:'20px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhum log submetido ainda. Registre suas atividades diárias acima.</div>}
          {logs.map((log: any) => (
            <div key={log.id} style={{padding:'14px 16px',borderBottom:'1px solid var(--b)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',flexShrink:0}}></div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--gold)'}}>
                    {new Date(log.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' • '}
                    {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {log.project_id && <span style={{fontSize:'0.65rem',background:'var(--gd)',color:'var(--gold)',borderRadius:4,padding:'2px 8px',fontWeight:600}}>{getProjectName(log.project_id)}</span>}
                </div>
                <button className="btn ghost" style={{fontSize:'0.65rem',padding:'3px 8px',color:'var(--red)'}} onClick={() => deleteLog(log.id)}>🗑</button>
              </div>
              <div style={{fontSize:'0.85rem',color:'var(--text)',lineHeight:1.6,whiteSpace:'pre-wrap',paddingLeft:16}}>{log.log_text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
