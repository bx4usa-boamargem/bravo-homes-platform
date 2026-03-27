
interface PartnerSidebarProps {
  theme: string;
  profileData: Record<string, string> | null;
  user: any;
  activeTab: string;
  navTo: (tab: string) => void;
  projectsCount: number;
  leadsCount: number;
  t: (key: string) => string;
  sidebarOpen: boolean;
  setSidebarOpen: (val: boolean) => void;
  handleLogout: () => void;
  perms?: any;
}

export default function PartnerSidebar({
  theme, profileData, user, activeTab, navTo, projectsCount, leadsCount, t, sidebarOpen, setSidebarOpen, handleLogout, perms
}: PartnerSidebarProps) {
  const navItemClass = (tab: string) => `ni ${activeTab === tab ? 'active' : ''}`;

  return (
    <>
      <nav className={`sb ${sidebarOpen ? 'open' : ''}`}>
        <div className="sb-brand">
          <img src={theme === 'light' ? "/Logo atual Bravo.png" : "/Logo Fundo azul.jpeg"} alt="Bravo Homes Group" className="sb-logo" style={{background: 'transparent'}} />
          <div className="sb-sub">Portal do Parceiro</div>
        </div>
        <div className="sb-partner">
          <div className="av" style={{textTransform:'uppercase',overflow:'hidden',padding:0}}>
            {profileData?.avatar_url ? (
              <img src={profileData.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
            ) : (
              user?.user_metadata?.full_name ? user.user_metadata.full_name.substring(0, 2) : 'P'
            )}
          </div>
          <div>
            <div className="pname">{profileData?.full_name || user?.user_metadata?.full_name || 'Usuário(a)'}</div>
            <div className="prole" style={{textTransform: 'capitalize'}}>{profileData?.role || 'Usuário'}</div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="sb-sec">Principal</div>
          <div className={navItemClass('dashboard')} onClick={() => navTo('dashboard')}>
            <span className="ni-icon">◈</span>{t('dashboard')}
          </div>
          {(!perms || perms.leads?.view !== false) && (
            <div className={navItemClass('leads')} onClick={() => navTo('leads')}>
              <span className="ni-icon">◎</span>{t('assignedLeads')}{leadsCount > 0 && <span className="badge">{leadsCount}</span>}
            </div>
          )}

          {(!perms || perms.projects?.view !== false) && (
            <>
              <div className="sb-sec">{t('myProjects')}</div>
              <div className={navItemClass('projects')} onClick={() => navTo('projects')}>
                <span className="ni-icon">▦</span>{t('activeProjects')}{projectsCount > 0 && <span className="badge gold">{projectsCount}</span>}
              </div>
              <div className={navItemClass('stages')} onClick={() => navTo('stages')}>
                <span className="ni-icon">☑</span>{t('stagesOfWork')}
              </div>
            </>
          )}
          {(!perms || perms.calendar?.view !== false) && (
            <div className={navItemClass('calendar')} onClick={() => navTo('calendar')}>
              <span className="ni-icon">◷</span>{t('calendar')}
            </div>
          )}
          <div className={navItemClass('dailylog')} onClick={() => navTo('dailylog')}>
            <span className="ni-icon">📋</span>{t('dailyLog')}
          </div>

          <div className="sb-sec">{t('messaging')}</div>
          {(!perms || perms.chat?.view !== false) && (
            <div className={navItemClass('chat')} onClick={() => navTo('chat')}>
               <span className="ni-icon">💬</span>{t('chat')}
            </div>
          )}

          <div className="sb-sec">{t('files')}</div>
          <div className={navItemClass('uploads')} onClick={() => navTo('uploads')}>
            <span className="ni-icon">📷</span>{t('photosDocs')}
          </div>

          {(!perms || perms.team?.view !== false) && (
            <>
              <div className="sb-sec">Gestão</div>
              <div className={navItemClass('team')} onClick={() => navTo('team')}>
                <span className="ni-icon">👥</span>Minha Equipe
              </div>
            </>
          )}

          <div className="sb-sec">{t('account')}</div>
          <div className={navItemClass('profile')} onClick={() => navTo('profile')}>
            <span className="ni-icon">◉</span>{t('myProfile')}
          </div>
        </div>
        <div className="sb-footer">
          <div className="logout" style={{textAlign:'center'}} onClick={handleLogout}>
            🚪 {t('logout')}
          </div>
        </div>
      </nav>
      {/* Mobile sidebar backdrop */}
      <div className={`sb-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
    </>
  );
}
