import React from 'react';
import { supabase } from '../../lib/supabase';

interface PartnerHeaderProps {
  theme: string;
  toggleTheme: () => void;
  activeTab: string;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  t: (key: string) => string;
  unreadCount: number;
  notifOpen: boolean;
  setNotifOpen: (val: boolean) => void;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  user: any;
  profileData?: any;
}

export default function PartnerHeader({
  theme, toggleTheme, activeTab, sidebarOpen, setSidebarOpen, t,
  unreadCount, notifOpen, setNotifOpen, notifications, setNotifications, user
}: PartnerHeaderProps) {

  return (
    <div className="topbar">
      <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
      <div className="topbar-title">
        {activeTab === 'dashboard' && t('dashboard')}
        {activeTab === 'projects' && t('myProjects')}
        {activeTab === 'stages' && t('stagesOfWork')}
        {activeTab === 'calendar' && t('calendarOfWorks')}
        {activeTab === 'dailylog' && t('dailyLog')}
        {activeTab === 'leads' && t('assignedLeads')}
        {activeTab === 'chat' && t('chat')}
        {activeTab === 'uploads' && t('photosDocuments')}
        {activeTab === 'profile' && t('myProfile')}
      </div>

      <div className="topbar-pill">🟢 Online</div>
      <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',color:'var(--t3)'}}>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      
      {/* Notification Bell */}
      <div style={{position:'relative'}}>
        <div onClick={() => setNotifOpen(!notifOpen)} style={{cursor:'pointer',fontSize:'1.1rem',position:'relative',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'8px',border:'1px solid var(--b)',background: notifOpen ? 'var(--gold)' : 'var(--bg3)',transition:'all .2s'}}>
          🔔
          {unreadCount > 0 && (
            <span style={{position:'absolute',top:'-2px',right:'-2px',background:'var(--red)',borderRadius:'50%',width:12,height:12,border:'2px solid var(--bg)'}}></span>
          )}
        </div>
        {notifOpen && (
          <>
            <div style={{position:'fixed',inset:0,zIndex:998}} onClick={() => setNotifOpen(false)}></div>
          <div style={{position:'absolute',top:'100%',right:0,width:'340px',maxHeight:'400px',overflowY:'auto',background:'var(--bg2)',border:'1px solid var(--b)',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.3)',zIndex:999,padding:'8px 0',marginTop:'8px'}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:'0.85rem'}}>🔔 Notificações</span>
              {unreadCount > 0 && (
                <button style={{fontSize:'0.65rem',color:'var(--gold)',background:'none',border:'none',cursor:'pointer',fontWeight:600}} onClick={async () => {
                  const dbNotifs = notifications.filter(n => !n.read && !String(n.id).startsWith('msg-'));
                  if (dbNotifs.length > 0) await supabase.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
                  setNotifications(prev => prev.map(n => ({...n, read: true})));
                }}>Marcar todas como lidas</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div style={{padding:'24px',textAlign:'center',color:'var(--t3)',fontSize:'0.8rem'}}>Nenhuma notificação</div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} onClick={async () => {
                  if (!n.read) {
                    if (!String(n.id).startsWith('msg-')) await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                    setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x));
                  }
                }} style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',cursor:'pointer',background: n.read ? 'transparent' : 'rgba(201,148,58,0.08)',transition:'all .2s'}}>
                  <div style={{fontSize:'0.8rem',fontWeight: n.read ? 400 : 700,color:'var(--text)'}}>{n.title}</div>
                  <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:'2px'}}>{n.body}</div>
                  <div style={{fontSize:'0.6rem',color:'var(--t3)',marginTop:'4px'}}>{new Date(n.created_at).toLocaleString('pt-BR')}</div>
                </div>
              ))
            )}
          </div>
          </>
        )}
      </div>

      <div className="theme-btn" onClick={toggleTheme} title="Alternar tema">
        {theme === 'dark' ? '☀️' : '🌙'}
      </div>
    </div>
  );
}
