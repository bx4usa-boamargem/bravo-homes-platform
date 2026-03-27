import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'profile' | 'login' | 'register'>('login');

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const { t } = useLanguage();
  
  const [theme] = useState(() => localStorage.getItem('appTheme') || 'dark');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  
  const handleProfileSelect = () => {
    setActiveView('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setAuthError(error.message);
      return;
    }

    // Fetch role from profiles table
    let { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    // Se o profile não existe (trigger falhou ou não existe), cria agora Just-In-Time
    if (!profile) {
      const roleFromMeta = data.user.user_metadata?.role || 'cliente';
      const nameFromMeta = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário';

      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: nameFromMeta,
        email: data.user.email,
        role: roleFromMeta
      });

      profile = { role: roleFromMeta };
    }

    setLoading(false);

    const role = profile?.role || 'cliente';
    
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'parceiro') {
      navigate('/partner');
    } else {
      // Check if it's an employee before routing to client
      const { data: empData } = await supabase
        .from('partner_employees')
        .select('id')
        .eq('email', data.user.email)
        .maybeSingle();

      if (empData) {
        navigate('/partner');
      } else {
        navigate('/client');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: {
          full_name: regName,
          role: regRole || 'cliente'
        }
      }
    });

    setLoading(false);

    if (error) {
      setAuthError(error.message);
    } else {
      setShowEmailPopup(true);
    }
  };



  return (
    <div className="login-body">
      <div className="login-container">
        <div className="logo-wrapper">
          {/* We import the image from public folder later or replace with absolute path for now */}
          <img src={theme === 'light' ? '/Logo atual Bravo.png' : '/Logo Fundo azul.jpeg'} alt="Bravo Homes Group" className="logo-img" style={{background: 'transparent'}} />
          <div className="logo-subtext">Plataforma de Gestão</div>
        </div>

        <div className="view-container">
          {/* PROFILE SELECTION */}
          <div className={`view ${activeView === 'profile' ? 'active' : 'exit-left'}`}>
            <h2 className="profile-title">Selecione seu acesso</h2>
            <div className="profile-cards">
              <div className="profile-card" onClick={handleProfileSelect}>
                <div className="pc-icon">👷</div>
                <div className="pc-info">
                  <h3>Sou Parceiro</h3>
                  <p>Acesse suas obras, clientes, fotos e cronograma.</p>
                </div>
                <div className="pc-arrow">➔</div>
              </div>
              <div className="profile-card" onClick={handleProfileSelect}>
                <div className="pc-icon">💼</div>
                <div className="pc-info">
                  <h3>Sou Admin</h3>
                  <p>Gerencie leads, equipes, propostas e financeiro.</p>
                </div>
                <div className="pc-arrow">➔</div>
              </div>
            </div>
          </div>

          {/* LOGIN FORM */}
          <div className={`view ${activeView === 'login' ? 'active' : 'exit-left'}`} style={{ display: activeView === 'login' || activeView === 'register' ? 'block' : 'none' }}>
            <div className="login-card">
              
              <div className="form-header">
                <h2>{t('loginTitle')}</h2>
                <p>{t('loginSubtitle')}</p>
              </div>

              <form onSubmit={handleLogin}>
                {authError && <div style={{color: 'var(--red)', fontSize: '0.8rem', marginBottom: '10px'}}>{authError}</div>}
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" placeholder={t('emailPlaceholder')} required />
                </div>
                
                <div className="form-group">
                  <label>{t('password')}</label>
                  <div className="pass-wrapper">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" placeholder="••••••••" required />
                    <button type="button" className="pass-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="form-actions">
                  <label className="remember-me">
                    <input type="checkbox" /> {t('rememberMe')}
                  </label>
                  <button type="button" className="forgot-pass" onClick={() => alert(t('forgotSoon'))}>{t('forgotPassword')}</button>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? t('loggingIn') : t('loginButton')}</span>
                </button>
              </form>

              <div className="create-account-row">
                {t('noAccount')} <button type="button" onClick={() => setActiveView('register')}>{t('createAccount')}</button>
              </div>
            </div>
          </div>


          {/* REGISTER FORM */}
          <div className={`view ${activeView === 'register' ? 'active' : 'exit-left'}`} style={{ display: activeView === 'register' ? 'block' : 'none' }}>
            <div className="login-card">
              <button type="button" className="back-btn" onClick={() => setActiveView('login')}>
                ← <span>{t('backToLogin')}</span>
              </button>

              <div className="form-header">
                <h2>{t('createAccountTitle')}</h2>
                <p>{t('createAccountSubtitle')}</p>
              </div>

              <form onSubmit={handleRegister}>
                {authError && <div style={{color: 'var(--red)', fontSize: '0.8rem', marginBottom: '10px'}}>{authError}</div>}
                <div className="form-group">
                  <label>{t('fullNameLabel')}</label>
                  <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="form-control" placeholder={t('fullNameLabel')} required />
                </div>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="form-control" placeholder={t('emailPlaceholder')} required />
                </div>
                <div className="form-group">
                  <label>{t('password')}</label>
                  <div className="pass-wrapper">
                    <input type={showRegPassword ? 'text' : 'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="form-control" placeholder="••••••••" required />
                    <button type="button" className="pass-toggle" onClick={() => setShowRegPassword(!showRegPassword)}>
                      {showRegPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('profileLabel')}</label>
                  <select 
                    className="form-control" 
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    required 
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="" disabled>-- Selecione --</option>
                    <option value="parceiro">{t('partnerContractor')}</option>
                    <option value="cliente">{t('client')}</option>
                  </select>
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  <span>{loading ? t('creatingAccount') : t('createAccountTitle')}</span>
                </button>
              </form>

              <div className="create-account-row" style={{ marginTop: 14 }}>
                {t('alreadyHaveAccount')} <button type="button" onClick={() => setActiveView('login')}>{t('enter')}</button>
              </div>
            </div>
          </div>

        </div>

        <div className="login-footer">
          Bravo Homes Group © 2026<br/><span>Atlanta, Georgia</span>
        </div>
      </div>

      {/* EMAIL CONFIRMATION POPUP */}
      {showEmailPopup && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
          <div style={{background:'linear-gradient(145deg,#161920,#1a1e28)',border:'1px solid rgba(184,150,80,0.2)',borderRadius:'16px',maxWidth:'420px',width:'90%',padding:'40px 32px',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,rgba(184,150,80,0.2),rgba(184,150,80,0.05))',border:'2px solid rgba(184,150,80,0.3)',margin:'0 auto 20px',lineHeight:'64px',fontSize:'28px'}}>📧</div>
            <h2 style={{margin:'0 0 12px',fontSize:'1.3rem',fontWeight:700,color:'#fff'}}>Verifique seu E-mail</h2>
            <p style={{margin:'0 0 8px',fontSize:'0.95rem',lineHeight:1.6,color:'#a0a8b8'}}>
              Enviamos um e-mail de confirmação para:
            </p>
            <p style={{margin:'0 0 16px',fontSize:'1rem',fontWeight:700,color:'#b89650',wordBreak:'break-all'}}>
              {regEmail}
            </p>
            <p style={{margin:'0 0 24px',fontSize:'0.85rem',lineHeight:1.6,color:'#7a8299'}}>
              Acesse sua caixa de entrada e clique no botão <strong style={{color:'#b89650'}}>"Confirmar meu E-mail"</strong> para ativar sua conta. Só depois você conseguirá fazer login.
            </p>
            <button onClick={() => { setShowEmailPopup(false); setActiveView('login'); setEmail(regEmail); }} style={{background:'linear-gradient(135deg,#b89650,#a07d3a)',color:'#fff',border:'none',borderRadius:'8px',padding:'12px 40px',fontSize:'0.95rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 15px rgba(184,150,80,0.3)',transition:'transform 0.15s'}}>
              Entendi, vou verificar!
            </button>
            <p style={{margin:'16px 0 0',fontSize:'0.7rem',color:'#4a4f60'}}>
              Não recebeu? Verifique a pasta de spam.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
