import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { PartnerEmployee, EmployeePermissions } from '../../types';

interface PartnerTeamTabProps {
  user: any;
  showToast: (title: string, msg: string, type?: 'success' | 'error' | 'info') => void;
}

const defaultPermissions: EmployeePermissions = {
  dashboard: { view: true },
  team: { view: false, edit: false },
  leads: { view: true, move: false, edit_notes: false, delete: false },
  projects: { view: true, create: false, delete: false },
  stages: { view: true, create: false, done: false, delete: false, upload: false },
  calendar: { view: true, edit: false, delete: false },
  dailylog: { view: true, create: false, delete: false },
  uploads: { view: true, upload: false, delete: false },
  chat: { view: true, send: false, delete: false },
  status: 'Pendente',
};

const permissionModules = [
  { id: 'dashboard', label: 'Dashboard', actions: [{key: 'view', label: 'Ver'}] },
  { id: 'team', label: 'Minha Equipe', actions: [{key: 'view', label: 'Ver'}, {key: 'edit', label: 'Criar/Editar Usuários'}] },
  { id: 'leads', label: 'Kanban e Leads', actions: [{key: 'view', label: 'Ver'}, {key: 'move', label: 'Mover Fases'}, {key: 'edit_notes', label: 'Editar Observações'}, {key: 'delete', label: 'Excluir Leads'}] },
  { id: 'projects', label: 'Projetos Ativos', actions: [{key: 'view', label: 'Ver'}, {key: 'create', label: 'Criar Projeto'}, {key: 'delete', label: 'Excluir Projeto'}] },
  { id: 'stages', label: 'Etapas de Obra', actions: [{key: 'view', label: 'Ver'}, {key: 'create', label: 'Criar Etapa'}, {key: 'done', label: 'Concluir Etapa'}, {key: 'upload', label: 'Anexar Fotos'}, {key: 'delete', label: 'Excluir Etapa'}] },
  { id: 'calendar', label: 'Calendário e Vistorias', actions: [{key: 'view', label: 'Ver'}, {key: 'edit', label: 'Agendar/Editar'}, {key: 'delete', label: 'Excluir Agendamento'}] },
  { id: 'dailylog', label: 'Diário de Obras', actions: [{key: 'view', label: 'Ver'}, {key: 'create', label: 'Postar Atualização'}, {key: 'delete', label: 'Excluir Diário'}] },
  { id: 'uploads', label: 'Fotos e Documentos (Drive)', actions: [{key: 'view', label: 'Ver'}, {key: 'upload', label: 'Enviar Ficheiros'}, {key: 'delete', label: 'Apagar'}] },
  { id: 'chat', label: 'Chat de Mensagens', actions: [{key: 'view', label: 'Ler'}, {key: 'send', label: 'Enviar'}, {key: 'delete', label: 'Apagar Conversa'}] }
];


export default function PartnerTeamTab({ user, showToast }: PartnerTeamTabProps) {
  const [employees, setEmployees] = useState<PartnerEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<PartnerEmployee>>({});

  const fetchEmployees = async () => {
    setLoading(true);
    if (!user?.id) return;
    const { data, error } = await supabase.from('partner_employees').select('*').eq('partner_id', user.id);
    if (!error && data) {
      setEmployees(data as PartnerEmployee[]);
    } else if (error) {
      showToast('Erro de Conexão', 'Não foi possível carregar a equipe.', 'error');
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openNewEmployee = () => {
    setEditingIndex(null);
    setFormData({
      partner_id: user?.id,
      name: '',
      email: '',
      phone: '',
      role: 'Assistente',
      permissions: { ...defaultPermissions }
    });
    setIsModalOpen(true);
  };

  const openEditEmployee = (emp: PartnerEmployee, idx: number) => {
    setEditingIndex(idx);
    setFormData({ ...emp });
    setIsModalOpen(true);
  };

  const shareInvite = (emp: PartnerEmployee, method: 'whatsapp' | 'email') => {
    const loginLink = window.location.origin;
    const text = `🏢 Olá ${emp.name.split(' ')[0]}!\nSeu acesso à plataforma da *Bravo Homes* foi liberado na minha equipe.\n\nAcesse: ${loginLink}\nCrie sua conta e senha usando EXATAMENTE este e-mail:\n📧 ${emp.email}\n\nO sistema reconhecerá você automaticamente!`;
    
    if (method === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.location.href = `mailto:${emp.email}?subject=Seu Acesso a Bravo Homes&body=${encodeURIComponent(text)}`;
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Tem certeza que deseja excluir este funcionário? O acesso dele será bloqueado.')) {
      await supabase.from('partner_employees').delete().eq('id', id);
      showToast('Excluído', 'Funcionário removido com sucesso.', 'success');
      fetchEmployees();
    }
  };

  const saveEmployee = async (e: any) => {
    e.preventDefault();
    const isEditing = editingIndex !== null;
    
    if (isEditing && formData.id) {
      const { error } = await supabase.from('partner_employees').update(formData).eq('id', formData.id);
      if (!error) {
        fetchEmployees();
        setIsModalOpen(false);
        showToast('Atualizado', 'Permissões atualizadas com sucesso.', 'success');
      } else {
        showToast('Erro', error.message, 'error');
      }
    } else {
      const { error: dbError } = await supabase.from('partner_employees').insert([formData]);
      if (!dbError) {
        
        // Dispara o Magic Link do Supabase e avisa se deu certo
        const { error: authError } = await supabase.auth.signInWithOtp({ 
          email: formData.email as string,
          options: {
            emailRedirectTo: window.location.origin + '/partner'
          }
        });
        
        if (authError) {
           showToast('Criado com aviso', 'Funcionário salvo, mas houve falha ao enviar o convite mágico por e-mail.', 'info');
        } else {
           showToast('Novo Funcionário', 'E-mail mágico enviado com sucesso! Ele só precisa clicar no botão do e-mail.', 'success');
        }
        
        fetchEmployees();
        setIsModalOpen(false);
      } else {
        showToast('Erro ao Criar', dbError.message, 'error');
      }
    }
  };

  const updatePerm = (module: keyof EmployeePermissions, action: string, val: boolean) => {
    setFormData(prev => {
      if (!prev.permissions) return prev;
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: {
            ...((prev.permissions as any)[module] || {}),
            [action]: val
          }
        }
      };
    });
  };

  if (loading) return <div className="page active" style={{padding: '50px', textAlign: 'center'}}>Carregando equipe...</div>;

  return (
    <div className="page active">
      <div className="u-section-header">
        <div>
           <div className="u-syne-title" style={{fontSize: '1.2rem'}}>Minha Equipe</div>
           <div className="u-mono-label-xs" style={{marginTop: '4px'}}>Gerencie acessos e permissões dos seus funcionários.</div>
        </div>
        <button className="btn gold" onClick={openNewEmployee} style={{padding: '8px 16px', fontSize: '0.85rem'}}>+ Novo Funcionário</button>
      </div>

      <div className="card">
         <table className="data-table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--b)', color: 'var(--t2)', fontSize: '0.85rem'}}>
                 <th style={{padding: '15px 10px', textTransform: 'uppercase', fontSize: '0.75rem'}}>Nome</th>
                 <th style={{padding: '15px 10px', textTransform: 'uppercase', fontSize: '0.75rem'}}>E-mail</th>
                 <th style={{padding: '15px 10px', textTransform: 'uppercase', fontSize: '0.75rem'}}>Cargo</th>
                 <th style={{padding: '15px 10px', textTransform: 'uppercase', fontSize: '0.75rem'}}>Status</th>
                 <th style={{padding: '15px 10px', textAlign: 'center', textTransform: 'uppercase', fontSize: '0.75rem'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={4} style={{padding: '30px', textAlign: 'center', color: 'var(--t2)'}}>Nenhum funcionário cadastrado.</td></tr>
              )}
              {employees.map((emp, idx) => (
                <tr key={emp.id || idx} style={{borderBottom: '1px solid var(--b)'}}>
                  <td style={{padding: '15px 10px', display:'flex', alignItems:'center', gap:'10px'}}>
                     <div className="av" style={{width:'32px', height:'32px', fontSize:'0.8rem', background: 'var(--blue)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{emp.name.substring(0,2).toUpperCase()}</div>
                     <strong style={{color:'#fff'}}>{emp.name}</strong>
                  </td>
                  <td style={{padding: '15px 10px', color: 'var(--t2)'}}>{emp.email}</td>
                  <td style={{padding: '15px 10px'}}><span className="badge badge-gold">{emp.role}</span></td>
                  <td style={{padding: '15px 10px'}}>
                    {emp.permissions?.status === 'Ativo' ? (
                      <span className="badge" style={{background: 'rgba(52, 211, 153, 0.15)', color: '#34d399'}}>Acessou</span>
                    ) : (
                      <span className="badge" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}>Pendente</span>
                    )}
                  </td>
                  <td style={{padding: '15px 10px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '5px'}}>
                     <button className="btn-icon" onClick={() => shareInvite(emp, 'whatsapp')} style={{background: 'transparent', border:'none', cursor:'pointer'}} title="Enviar Convite Whatsapp">📱</button>
                     <button className="btn-icon" onClick={() => shareInvite(emp, 'email')} style={{background: 'transparent', border:'none', cursor:'pointer'}} title="Enviar Convite E-mail">📧</button>
                     <div style={{width: 1, height: 20, background: 'var(--border)', margin: '0 5px'}}></div>
                     <button className="btn-icon" onClick={() => openEditEmployee(emp, idx)} style={{background: 'transparent', border:'none', cursor:'pointer'}} title="Editar Permissões">⚙️</button>
                     <button className="btn-icon" onClick={() => handleDelete(emp.id)} style={{color:'var(--red)', background: 'transparent', border:'none', cursor:'pointer'}} title="Excluir">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsModalOpen(false)} style={{alignItems:'center', justifyContent:'center', padding: '20px'}}>
           <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth: '650px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--b2)', borderRadius: '12px', overflow: 'hidden'}}>
              <div className="modal-head" style={{padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--b)', flexShrink: 0}}>
                 <div className="modal-title" style={{fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: 'var(--gold)'}}>
                    {editingIndex !== null ? 'Editar Funcionário' : 'Novo Funcionário'}
                 </div>
                 <button className="dclose" onClick={() => setIsModalOpen(false)} style={{background:'transparent', border:'none', color:'var(--t2)', cursor:'pointer', fontSize:'1.2rem'}}>✕</button>
              </div>
              
              <form onSubmit={saveEmployee} style={{display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1}}>
                 <div className="modal-body" style={{padding: '20px', overflowY: 'auto', flex: 1}}>
                    <div className="grid-2" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                      <div>
                        <label className="f-label" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--t2)'}}>Nome Completo</label>
                        <input required className="f-inp" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--b)', background: 'var(--bg)', color: '#fff'}} placeholder="Ex: Lucas Mendes" value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="f-label" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--t2)'}}>Cargo</label>
                        <input required className="f-inp" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--b)', background: 'var(--bg)', color: '#fff'}} placeholder="Ex: Engenheiro" value={formData.role || ''} onChange={e=>setFormData({...formData, role: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid-2" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                      <div>
                        <label className="f-label" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--t2)'}}>E-mail de Login</label>
                        <input required type="email" className="f-inp" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--b)', background: 'var(--bg)', color: '#fff'}} placeholder="lucas@exemplo.com" value={formData.email || ''} onChange={e=>setFormData({...formData, email: e.target.value})} />
                        <div style={{fontSize:'0.75rem', color:'var(--gold)', marginTop:'5px'}}>A conta deve ser criada com este exato e-mail no painel de login.</div>
                      </div>
                      <div>
                        <label className="f-label" style={{display: 'block', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--t2)'}}>Telefone</label>
                        <input className="f-inp" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--b)', background: 'var(--bg)', color: '#fff'}} placeholder="(00) 00000-0000" value={formData.phone || ''} onChange={e=>setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>

                    <div className="sep" style={{margin:'20px 0', borderBottom: '1px solid var(--b)'}}></div>
                    
                    <h4 style={{fontFamily:"'Syne', sans-serif", marginBottom:'15px', color:'var(--t1)'}}>Controle de Acessos</h4>
                    
                    <div style={{background:'var(--bg)', padding:'15px', borderRadius:'8px', display:'flex', flexDirection:'column', gap:'15px'}}>
                      {permissionModules.map(mod => {
                         const perms: any = (formData.permissions?.[mod.id as keyof EmployeePermissions] as any) || {};
                         return (
                           <div key={mod.id} style={{display:'flex', flexDirection:'column', gap:'10px', borderBottom:'1px solid var(--b)', paddingBottom:'15px'}}>
                             <strong style={{textTransform:'capitalize', fontSize:'0.95rem', color: '#fff'}}>{mod.label}</strong>
                             <div style={{display:'flex', gap:'20px', flexWrap:'wrap'}}>
                               {mod.actions.map(act => (
                                 <label key={act.key} style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', cursor:'pointer', color: act.key === 'view' ? 'var(--gold)' : 'var(--t2)', opacity: (act.key !== 'view' && !perms.view) ? 0.5 : 1}}>
                                    <input type="checkbox" checked={!!perms[act.key]} onChange={e=>updatePerm(mod.id as any, act.key, e.target.checked)} disabled={act.key !== 'view' && !perms.view} />
                                    {act.label}
                                 </label>
                               ))}
                             </div>
                           </div>
                         );
                      })}
                    </div>
                 </div>
                 
                 <div className="modal-foot" style={{padding: '16px 20px', borderTop: '1px solid var(--b)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0}}>
                    <button type="button" className="btn ghost" style={{padding: '8px 16px', fontSize: '0.85rem'}} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                    <button type="submit" className="btn gold" style={{padding: '8px 16px', fontSize: '0.85rem'}}>Salvar Acessos</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
