import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../lib/i18n';
import './ClientDashboard.css';

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState({ emoji: '', title: '', desc: '' });
  const { t } = useLanguage();
  
  // Notifications
  const [notifications, setNotifications] = useState<{id: string; type: string; title: string; body: string; time: Date; read: boolean}[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchProject() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
      // Fetching the first project as a placeholder for the logged-in client's project
      const { data } = await supabase.from('projects').select('*').limit(1).single();
      if (data) setProject(data);
    }
    fetchProject();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItemClass = (tab: string) => `nav-item ${activeTab === tab ? 'active' : ''}`;
  const navTo = (tab: string) => { setActiveTab(tab); setSidebarOpen(false); };

  const openLightbox = (emoji: string, title: string, desc: string) => {
    setLightboxData({ emoji, title, desc });
    setIsLightboxOpen(true);
  };

  return (
    <div className="client-app">
      {/* SIDEBAR */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={theme === 'light' ? "/Logo atual Bravo.png" : "/Logo Fundo azul.jpeg"} alt="Bravo Homes" className="brand-img" style={{background: 'transparent'}} />
          <div className="sub">Portal do Cliente</div>
        </div>
        <div className="client-card">
          <div className="client-avatar" style={{textTransform:'uppercase'}}>{user?.user_metadata?.full_name ? user.user_metadata.full_name.substring(0, 2) : 'C'}</div>
          <div className="client-info">
            <div className="name">{user?.user_metadata?.full_name || project?.name?.split(' - ')[0] || 'Cliente'}</div>
            <div className="role">Cliente</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('main')}</div>
          <div className={navItemClass('dashboard')} onClick={() => navTo('dashboard')}>
            <span className="icon">◈</span> {t('dashboard')}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('myWork')}</div>
          <div className={navItemClass('progress')} onClick={() => navTo('progress')}>
            <span className="icon">▦</span> {t('workProgress')}
          </div>
          <div className={navItemClass('stages')} onClick={() => navTo('stages')}>
            <span className="icon">☑</span> {t('stages')}
          </div>
          <div className={navItemClass('fotos')} onClick={() => navTo('fotos')}>
            <span className="icon">📷</span> {t('photos')}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('financial')}</div>
          <div className={navItemClass('pagamentos')} onClick={() => navTo('pagamentos')}>
            <span className="icon">$</span> {t('payments')}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('communication')}</div>
          <div className={navItemClass('chat')} onClick={() => navTo('chat')}>
            <span className="icon">💬</span> {t('chat')}
          </div>
          <div className={navItemClass('aprovacoes')} onClick={() => navTo('aprovacoes')}>
            <span className="icon">✓</span> {t('approvals')}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('documents')}</div>
          <div className={navItemClass('documentos')} onClick={() => navTo('documentos')}>
            <span className="icon">📄</span> {t('documents')}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">{t('account')}</div>
          <div className={navItemClass('avaliacao')} onClick={() => navTo('avaliacao')}>
            <span className="icon">★</span> {t('evaluation')}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="theme-btn" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
          </button>
          <button className="logout-btn" style={{textAlign:'center',width:'100%'}} onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}>
            <span>🚪</span> {t('logout')}
          </button>
        </div>
      </nav>
      {/* Mobile sidebar backdrop */}
      <div className={`sb-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="topbar">
          <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <span className="topbar-title">{{'dashboard':'DASHBOARD','progress':'PROGRESSO','stages':'ETAPAS','fotos':'FOTOS','pagamentos':'PAGAMENTOS','chat':'CHAT','aprovacoes':'APROVAÇÕES','documentos':'DOCUMENTOS','avaliacao':'AVALIAÇÃO'}[activeTab] || activeTab.toUpperCase()}</span>
          


          <span className="topbar-badge">Em Andamento</span>
          
          {/* Notification Bell */}
          <div style={{position:'relative',marginLeft:'auto'}}>
            <button onClick={async () => {
              setNotifOpen(!notifOpen);
              if (!notifOpen && unreadCount > 0) {
                const dbNotifs = notifications.filter(n => !n.read && !String(n.id).startsWith('msg-'));
                if (dbNotifs.length > 0) {
                  await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
                }
                setNotifications(prev => prev.map(n => ({...n, read: true})));
              }
            }} style={{background: notifOpen ? 'var(--gold)' : 'var(--bg3)',border:'1px solid var(--b)',borderRadius:'8px',width:36,height:36,cursor:'pointer',fontSize:'1rem',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
              🔔
              {unreadCount > 0 && <span style={{position:'absolute',top:'-2px',right:'-2px',background:'var(--red)',color:'#fff',fontSize:'0.55rem',fontWeight:700,borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount}</span>}
            </button>
            {notifOpen && (
              <div style={{position:'absolute',top:'100%',right:0,width:'320px',maxHeight:'350px',overflowY:'auto',background:'var(--bg2)',border:'1px solid var(--b)',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.3)',zIndex:999,padding:'8px 0',marginTop:'8px'}}>
                <div style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:'0.85rem'}}>🔔 Notificações</span>
                  {unreadCount > 0 && <button style={{fontSize:'0.65rem',color:'var(--gold)',background:'none',border:'none',cursor:'pointer',fontWeight:600}} onClick={async () => {
                    const dbNotifs = notifications.filter(n => !n.read && !String(n.id).startsWith('msg-'));
                    if (dbNotifs.length > 0) await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
                    setNotifications(prev => prev.map(n => ({...n, read: true})));
                  }}>Marcar todas lidas</button>}
                </div>
                {notifications.length === 0 ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--t3)',fontSize:'0.8rem'}}>Sem notificações</div>
                ) : (
                  notifications.slice(0, 15).map(n => (
                    <div key={n.id} onClick={async () => {
                    if (!n.read) {
                      if (!String(n.id).startsWith('msg-')) await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                      setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x));
                    }
                  }} style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',cursor:'pointer',background: n.read ? 'transparent' : 'rgba(201,148,58,0.08)',transition:'all .2s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                        <span style={{fontSize:'0.7rem'}}>{n.type}</span>
                        {!n.read && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--red)',flexShrink:0}}></span>}
                      </div>
                      <div style={{fontSize:'0.8rem',fontWeight: n.read ? 400 : 700,color:'var(--text)'}}>{n.title}</div>
                      <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{n.body}</div>
                      <div style={{fontSize:'0.6rem',color:'var(--t3)',marginTop:4,fontFamily:"'DM Mono',monospace"}}>{n.time.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span className="topbar-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
        </div>

        <div className="content">
          
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="page active">
              <div className="section-title">Bem-vindo, {project?.name?.split(' - ')[0] || 'Johnson Family'}</div>
              <div className="section-sub">Acompanhe o progresso da sua reforma em tempo real.</div>

              <div className="alert">
                <span className="alert-icon">🏗️</span>
                <div className="alert-text">
                  <div className="alert-title">Marcus está na Etapa 4 de 8 — Revestimento em Andamento</div>
                  Piso e azulejos sendo instalados. Previsão de conclusão desta etapa: 25/Mar/2026.
                </div>
              </div>

              <div className="grid-4" style={{marginBottom: 20}}>
                <div className="kpi-card">
                  <div className="kpi-label">Progresso Total</div>
                  <div className="kpi-value gold">{project?.progress || 0}%</div>
                  <div style={{marginTop: 8}}>
                    <div className="progress-wrap"><div className="progress-fill" style={{width: `${project?.progress || 0}%`}}></div></div>
                  </div>
                  <div className="kpi-sub">Em dia com o cronograma</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Etapa Atual</div>
                  <div className="kpi-value">4 <span style={{fontSize: 16, color: 'var(--t2)'}}>/8</span></div>
                  <div className="kpi-sub" style={{marginTop: 6}}><span className="badge badge-gold">Revestimento</span></div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Próximo Pagamento</div>
                  <div className="kpi-value gold">$14,550</div>
                  <div className="kpi-sub">Após vistoria mid-project</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Entrega Prevista</div>
                  <div className="kpi-value green">{project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/D'}</div>
                  <div className="kpi-sub">Estimativa atual</div>
                </div>
              </div>

              <div className="grid-2" style={{marginBottom: 20}}>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Atividade Recente</span>
                    <span className="badge badge-gold">4 ações</span>
                  </div>
                  <div className="feed-item">
                    <div className="feed-dot green"></div>
                    <div>
                      <div style={{fontSize: 13, color: 'var(--text)'}}>Fotos da etapa 3 enviadas pelo Marcus</div>
                      <div className="feed-meta">20/Mar · 14:32</div>
                    </div>
                  </div>
                  <div className="feed-item">
                    <div className="feed-dot"></div>
                    <div>
                      <div style={{fontSize: 13, color: 'var(--text)'}}>Etapa 3 marcada como concluída</div>
                      <div className="feed-meta">10/Mar · 09:15</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Resumo do Projeto</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span style={{color:'var(--t2)'}}>Projeto</span>
                      <span style={{fontWeight:600}}>{project?.name || project?.service_type || 'Projeto s/ nome'}</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span style={{color:'var(--t2)'}}>Contratado</span>
                      <span style={{fontWeight:600}}>Marcus Rivera</span>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                      <span style={{color:'var(--t2)'}}>Valor Total</span>
                      <span style={{fontWeight:600,fontFamily:"'DM Mono',monospace",color:'var(--gold)'}}>${project?.contract_value || '0'}</span>
                    </div>
                    <div className="sep" style={{margin:'6px 0'}}></div>
                    <div className="progress-label">
                      <span>Pagamento</span><span style={{fontWeight:600}}>40% pago</span>
                    </div>
                    <div className="progress-wrap"><div className="progress-fill" style={{width:'40%'}}></div></div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">Ações Rápidas</span></div>
                <div className="quick-actions">
                  <button className="btn btn-gold" onClick={() => setActiveTab('chat')}>💬 Enviar Mensagem</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('fotos')}>📷 Ver Fotos</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('pagamentos')}>$ Pagamentos</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('aprovacoes')}>✓ Aprovações <span className="badge badge-orange" style={{marginLeft: 4}}>2</span></button>
                </div>
              </div>
            </div>
          )}

          {/* PROGRESS */}
          {activeTab === 'progress' && (
            <div className="page active">
              <div className="section-title">Progresso da Obra</div>
              <div className="section-sub">{project?.name?.split(' - ')[0] || 'Johnson Family'} — {project?.name || project?.service_type || 'Reforma'}</div>

              <div className="card" style={{marginBottom: 20}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                  <div>
                    <div style={{fontSize:22,fontWeight:800,fontFamily:"'Syne',sans-serif",color:'var(--gold)'}}>{project?.progress || 0}%</div>
                    <div style={{fontSize:13,color:'var(--t2)',marginTop:2}}>Etapa 4 de 8 em progresso</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span className="badge badge-gold">{project?.status || 'Em Andamento'}</span>
                    <div style={{fontSize:11,color:'var(--t2)',marginTop:4}}>Iniciado em {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/D'}</div>
                  </div>
                </div>
                <div className="progress-wrap progress-xl" style={{marginBottom: 10}}>
                  <div className="progress-fill" style={{width:`${project?.progress || 0}%`}}></div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--t3)'}}>
                  <span>Início</span><span>Et.1</span><span>Et.2</span><span>Et.3</span><span>Et.4 ◄</span><span>Et.5</span><span>Et.6</span><span>Et.7</span><span>Fim</span>
                </div>
              </div>

              <div className="timeline">
                <div className="tl-item">
                  <div className="tl-dot done">✓</div>
                  <div className="tl-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="tl-title">Etapa 1 — Demolição</div>
                      <span className="badge badge-green">Concluído</span>
                    </div>
                    <div className="tl-date">Concluído em 04/Mar/2026</div>
                    <div className="tl-note">Remoção completa dos armários, bancadas e revestimento antigo.</div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot active">4</div>
                  <div className="tl-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="tl-title">Etapa 4 — Revestimento (Piso/Azulejo)</div>
                      <span className="badge badge-gold">Em Progresso</span>
                    </div>
                    <div className="tl-date">Iniciado em 20/Mar/2026</div>
                    <div className="tl-note">Instalação de porcelanato 60x60 no piso. Azulejo metro white nas paredes.</div>
                    <div className="tl-progress">
                      <div className="progress-label"><span>Progresso da etapa</span><span>65%</span></div>
                      <div className="progress-wrap"><div className="progress-fill" style={{width:'65%'}}></div></div>
                    </div>
                  </div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot pending">5</div>
                  <div className="tl-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div className="tl-title">Etapa 5 — Montagem de Armários</div>
                      <span className="badge badge-gray">Pendente</span>
                    </div>
                    <div className="tl-date">Previsto para 26/Mar/2026</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOTOS */}
          {activeTab === 'fotos' && (
            <div className="page active">
              <div className="section-title">Fotos da Obra</div>
              <div className="section-sub">Registro fotográfico por etapa.</div>

              <div style={{marginBottom:24}}>
                <div className="photo-stage-header"><span className="badge badge-green">✓</span> Etapa 1 — Demolição</div>
                <div className="photo-grid">
                  <div className="photo-card" onClick={() => openLightbox('🏚️','Antes da Demolição','Estado original da cozinha')}>
                    <span className="photo-emoji">🏚️</span>
                    <span className="photo-label">Estado Original</span>
                  </div>
                  <div className="photo-card" onClick={() => openLightbox('🔨','Durante a Demolição','Remoção dos armários e bancada antiga.')}>
                    <span className="photo-emoji">🔨</span>
                    <span className="photo-label">Demolição em Progresso</span>
                  </div>
                </div>
              </div>

              <div className="sep"></div>
              <div className="section-title" style={{fontSize:16,marginBottom:12}}>Antes e Depois</div>
              <div className="before-after">
                <div className="ba-card">
                  <div className="ba-label before">Antes</div>
                  <div className="ba-img">🏚️</div>
                  <div style={{fontSize:12,color:'var(--t2)'}}>Cozinha original com armários e revestimento antigos.</div>
                </div>
                <div className="ba-card">
                  <div className="ba-label after">Em Progresso — 75%</div>
                  <div className="ba-img">🏗️</div>
                  <div style={{fontSize:12,color:'var(--t2)'}}>Reforma 75% completa. Piso e azulejos instalados.</div>
                </div>
              </div>
            </div>
          )}

          {/* OTHERS PLACEHOLDER */}
          {['stages','pagamentos','chat','aprovacoes','documentos','avaliacao'].includes(activeTab) && (
            <div className="page active">
              <div className="empty-state" style={{marginTop: 60, textAlign: 'center'}}>
                  <div style={{fontSize: '2rem', marginBottom: 16}}>🚧</div>
                  Aba <b>{activeTab}</b> convertida para React com sucesso.<br/>
                  (Os dados completos das tabelas podem ser integrados aqui em etapas posteriores)
              </div>
            </div>
          )}

        </div>
      </div>

      {/* LIGHTBOX */}
      {isLightboxOpen && (
        <div className="lightbox open" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setIsLightboxOpen(false)}>✕</button>
            <div className="lightbox-emoji" style={{fontSize: 80, margin: '12px 0'}}>{lightboxData.emoji}</div>
            <div className="lightbox-title">{lightboxData.title}</div>
            <div className="lightbox-sub">{lightboxData.desc}</div>
          </div>
        </div>
      )}
    </div>
  );
}
