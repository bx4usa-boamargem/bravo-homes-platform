import React from 'react';

interface SocialMediaTabProps {
  socialAccounts: any[];
  socialPosts: any[];
  socialPostForm: any;
  setSocialPostForm: (form: any) => void;
  socialPosting: boolean;
  handleSocialPublish: () => void;
  handleFbConnect: () => void;
}

export default function SocialMediaTab({
  socialAccounts, socialPosts, socialPostForm, setSocialPostForm,
  socialPosting, handleSocialPublish, handleFbConnect,
}: SocialMediaTabProps) {
  const fbAccount = socialAccounts.find(a => a.platform === 'facebook');
  const igAccount = socialAccounts.find(a => a.platform === 'instagram');

  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">📱 Social Media</div>
      </div>

      {/* Connection Status */}
      <div className="card" style={{marginBottom: '16px'}}>
        <div className="ch"><span className="ct">Contas Conectadas</span></div>
        <div className="cb">
          <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:'200px',padding:'16px',borderRadius:'10px',border: fbAccount ? '1px solid rgba(66,103,178,0.4)' : '1px solid var(--b)',background: fbAccount ? 'rgba(66,103,178,0.1)' : 'transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span style={{fontSize:'1.4rem'}}>📘</span>
                <b>Facebook</b>
                {fbAccount && <span style={{color:'#4ade80',fontSize:'0.75rem'}}>● Conectado</span>}
              </div>
              {fbAccount ? (
                <div style={{fontSize:'0.8rem',color:'var(--t2)'}}>Page: <b>{fbAccount.page_name}</b></div>
              ) : (
                <button className="btn gold" style={{marginTop:'8px'}} onClick={handleFbConnect}>Conectar Facebook</button>
              )}
            </div>
            <div style={{flex:1,minWidth:'200px',padding:'16px',borderRadius:'10px',border: igAccount ? '1px solid rgba(193,53,132,0.4)' : '1px solid var(--b)',background: igAccount ? 'rgba(193,53,132,0.1)' : 'transparent'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <span style={{fontSize:'1.4rem'}}>📸</span>
                <b>Instagram</b>
                {igAccount && <span style={{color:'#4ade80',fontSize:'0.75rem'}}>● Conectado</span>}
              </div>
              {igAccount ? (
                <div style={{fontSize:'0.8rem',color:'var(--t2)'}}>Business ID: <b>{igAccount.ig_business_id}</b></div>
              ) : (
                <div style={{fontSize:'0.8rem',color:'var(--t3)',fontStyle:'italic'}}>Conecte o Facebook primeiro. O Instagram vinculado será detectado automaticamente.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Editor */}
      {socialAccounts.length > 0 && (
        <div className="card" style={{marginBottom: '16px'}}>
          <div className="ch"><span className="ct">Criar Publicação</span></div>
          <div className="cb">
            <textarea
              className="f-inp"
              style={{minHeight:'100px',resize:'vertical',marginBottom:'12px'}}
              placeholder="Escreva a legenda do seu post..."
              value={socialPostForm.content}
              onChange={e => setSocialPostForm({...socialPostForm, content: e.target.value})}
            />
            <div className="f-row" style={{marginBottom:'12px'}}>
              <div style={{flex:1}}>
                <label className="f-label">URL da Imagem (opcional)</label>
                <input type="text" className="f-inp" placeholder="https://exemplo.com/imagem.jpg" value={socialPostForm.image_url} onChange={e => setSocialPostForm({...socialPostForm, image_url: e.target.value})} />
              </div>
            </div>
            <div style={{display:'flex',gap:'16px',alignItems:'center',marginBottom:'12px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                <input type="checkbox" checked={socialPostForm.facebook} onChange={e => setSocialPostForm({...socialPostForm, facebook: e.target.checked})} />
                📘 Facebook
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'6px',cursor:'pointer'}}>
                <input type="checkbox" checked={socialPostForm.instagram} onChange={e => setSocialPostForm({...socialPostForm, instagram: e.target.checked})} disabled={!igAccount} />
                📸 Instagram {!igAccount && <span style={{fontSize:'0.7rem',color:'var(--t3)'}}>(não conectado)</span>}
              </label>
            </div>
            <button className="btn gold" disabled={socialPosting || !socialPostForm.content.trim()} onClick={handleSocialPublish}>
              {socialPosting ? '⏳ Publicando...' : '🚀 Publicar Agora'}
            </button>
          </div>
        </div>
      )}

      {/* Post History */}
      <div className="card">
        <div className="ch"><span className="ct">Histórico de Publicações</span></div>
        <div className="cb" style={{padding: 0}}>
          <table className="tbl">
            <thead><tr>
              <th>Plataforma</th>
              <th>Conteúdo</th>
              <th>Status</th>
              <th>Data</th>
              <th>Link</th>
            </tr></thead>
            <tbody>
              {socialPosts.length === 0 && <tr><td colSpan={5} className="u-empty-state">Nenhuma publicação ainda.</td></tr>}
              {socialPosts.map(sp => (
                <tr key={sp.id}>
                  <td>{sp.platform === 'facebook' ? '📘 Facebook' : '📸 Instagram'}</td>
                  <td style={{maxWidth:'250px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sp.content}</td>
                  <td><span style={{padding:'2px 8px',borderRadius:'10px',fontSize:'0.7rem',background: sp.status === 'published' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)',color: sp.status === 'published' ? '#4ade80' : '#fbbf24'}}>{sp.status === 'published' ? '✅ Publicado' : sp.status}</span></td>
                  <td style={{fontSize:'0.75rem',color:'var(--t3)'}}>{sp.published_at ? new Date(sp.published_at).toLocaleString('pt-BR') : '-'}</td>
                  <td>{sp.post_url ? <a href={sp.post_url} target="_blank" rel="noreferrer" style={{color:'var(--gold)'}}>Ver ↗</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
