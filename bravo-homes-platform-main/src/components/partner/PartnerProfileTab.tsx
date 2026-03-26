import React from 'react';
import type { Lang } from '../../lib/i18n';

interface PartnerProfileTabProps {
  user: any;
  profileData: any;
  profileEditing: boolean;
  setProfileEditing: (v: boolean) => void;
  profileForm: any;
  setProfileForm: (f: any) => void;
  profileSaving: boolean;
  saveProfile: () => void;
  profileAvatarRef: React.RefObject<HTMLInputElement | null>;
  uploadAvatar: (files: FileList | null) => void;
  passwordForm: any;
  setPasswordForm: (f: any) => void;
  passwordSaving: boolean;
  changePassword: () => void;
  toggleNotif: (key: string, val: boolean) => void;
  t: (key: string) => string;
  lang: string;
  setLang: (l: Lang) => void;
}

export default function PartnerProfileTab({
  user, profileData, profileEditing, setProfileEditing,
  profileForm, setProfileForm, profileSaving, saveProfile,
  profileAvatarRef, uploadAvatar,
  passwordForm, setPasswordForm, passwordSaving, changePassword,
  toggleNotif, t, lang, setLang,
}: PartnerProfileTabProps) {
  return (
    <div className="page active">
      <div className="u-mb-16"><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>{t('myPartnerProfile')}</div></div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {/* ROW 1: Personal Info + Notifications */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'stretch'}}>
          {/* Personal Info */}
          <div className="card">
            <div className="ch">
              <span className="ct">{t('personalInfo')}</span>
              {!profileEditing ? (
                <span className="ca" style={{cursor:'pointer'}} onClick={() => setProfileEditing(true)}>{t('edit')}</span>
              ) : (
                <div style={{display:'flex',gap:6}}>
                  <span className="ca" style={{cursor:'pointer',color:'var(--red)'}} onClick={() => { setProfileEditing(false); setProfileForm(profileData); }}>{t('cancel')}</span>
                  <span className="ca" style={{cursor:'pointer',color:'var(--green)'}} onClick={saveProfile}>{profileSaving ? t('savingProfile') : t('save')}</span>
                </div>
              )}
            </div>
            <div className="cb">
              <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
                <input ref={profileAvatarRef} type="file" accept="image/*" className="u-hide" onChange={e => uploadAvatar(e.target.files)} />
                <div onClick={() => profileAvatarRef.current?.click()} style={{width:56,height:56,borderRadius:'50%',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gold)',position:'relative',flexShrink:0}}>
                  {profileData?.avatar_url ? (
                    <img src={profileData.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  ) : (
                    <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.1rem',color:'var(--bg)'}}>{(profileData?.full_name || 'PR').substring(0,2).toUpperCase()}</span>
                  )}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.5)',textAlign:'center',fontSize:'0.5rem',color:'#fff',padding:'2px 0'}}>📷</div>
                </div>
                <div className="u-flex-1">
                  {profileEditing ? (
                    <input className="f-inp" value={profileForm.full_name || ''} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} placeholder={t('fullNameLabel')} style={{fontWeight:700,fontSize:'1rem',marginBottom:4}} />
                  ) : (
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem'}}>{profileData?.full_name || 'Partner'}</div>
                  )}
                  <div style={{fontSize:'0.78rem',color:'var(--t2)'}}>{profileData?.specialty || 'Certified Specialist'}</div>
                  <div style={{color:'var(--gold)',fontSize:'0.75rem',marginTop:2}}>★★★★★ 5.0 (Bravo Verified)</div>
                </div>
              </div>
              {profileEditing ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div className="u-grid-2">
                    <div><label className="u-mono-label-sm">{t('phone')}</label><input className="f-inp" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="(407) 555-1234" /></div>
                    <div>
                      <label className="u-mono-label-sm">{t('specialtyMulti')}</label>
                      <select className="f-inp" value="" onChange={e => {
                        const val = e.target.value;
                        if (!val) return;
                        const current = profileForm.specialty ? profileForm.specialty.split(', ').filter(Boolean) : [];
                        if (!current.includes(val)) {
                          setProfileForm({...profileForm, specialty: [...current, val].join(', ')});
                        }
                      }}>
                        <option value="">{t('addSpecialty')}</option>
                        <option value="General Contractor">General Contractor</option>
                        <option value="Kitchen Remodel">Kitchen Remodel</option>
                        <option value="Bathroom Remodel">Bathroom Remodel</option>
                        <option value="Full Home Renovation">Full Home Renovation</option>
                        <option value="Painting & Finishing">Painting & Finishing</option>
                        <option value="Flooring">Flooring</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Roofing">Roofing</option>
                      </select>
                      {profileForm.specialty && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                          {profileForm.specialty.split(', ').map((spec: string) => spec.trim()).filter(Boolean).map((spec: string) => (
                            <span key={spec} style={{background:'var(--bg3)',padding:'4px 8px',borderRadius:4,fontSize:'0.75rem',display:'flex',alignItems:'center',gap:4}}>
                              {spec}
                              <span style={{cursor:'pointer',color:'var(--red)'}} onClick={() => {
                                const current = profileForm.specialty.split(', ').map((s: string) => s.trim()).filter(Boolean);
                                setProfileForm({...profileForm, specialty: current.filter((s: string) => s !== spec).join(', ')});
                              }}>✕</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="u-grid-2">
                    <div><label className="u-mono-label-sm">{t('companyName')}</label><input className="f-inp" value={profileForm.company_name || ''} onChange={e => setProfileForm({...profileForm, company_name: e.target.value})} placeholder="Your Company LLC" /></div>
                    <div><label className="u-mono-label-sm">{t('licenseNumber')}</label><input className="f-inp" value={profileForm.license_number || ''} onChange={e => setProfileForm({...profileForm, license_number: e.target.value})} placeholder="CGC-123456" /></div>
                  </div>
                  <div className="u-grid-2">
                    <div><label className="u-mono-label-sm">{t('city')}</label><input className="f-inp" value={profileForm.city || ''} onChange={e => setProfileForm({...profileForm, city: e.target.value})} placeholder="Orlando" /></div>
                    <div><label className="u-mono-label-sm">{t('state')}</label><select className="f-inp" value={profileForm.state || ''} onChange={e => setProfileForm({...profileForm, state: e.target.value})}><option value="" disabled>-- Selecione --</option><option value="FL">Florida</option><option value="TX">Texas</option><option value="CA">California</option><option value="NY">New York</option><option value="GA">Georgia</option><option value="NC">North Carolina</option><option value="NJ">New Jersey</option><option value="PA">Pennsylvania</option></select></div>
                  </div>
                  <div><label className="u-mono-label-sm">{t('bioAbout')}</label><textarea className="f-inp" style={{resize:'vertical',minHeight:60}} value={profileForm.bio || ''} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder={t('bioPlaceholder')} /></div>
                </div>
              ) : (
                <>
                  <div className="profile-logs-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:40,rowGap:0}}>
                    <div style={{display:'flex',flexDirection:'column'}}>
                      <div className="log-item"><div className="log-date" style={{width:80}}>{t('email')}</div><div className="log-text">{user?.email || t('notListed')}</div></div>
                      <div className="log-item"><div className="log-date" style={{width:80}}>{t('phone')}</div><div className="log-text">{profileData?.phone || t('notSet')}</div></div>
                      <div className="log-item"><div className="log-date" style={{width:80}}>{t('SPECIALTYCOL')}</div><div className="log-text">{profileData?.specialty || t('notSet')}</div></div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column'}}>
                      <div className="log-item"><div className="log-date" style={{width:120}}>{t('companyName')}</div><div className="log-text">{profileData?.company_name || t('notSet')}</div></div>
                      <div className="log-item"><div className="log-date" style={{width:120}}>{t('licenseNumber')}</div><div className="log-text">{profileData?.license_number || t('notSet')}</div></div>
                      <div className="log-item"><div className="log-date" style={{width:120}}>{t('location')}</div><div className="log-text">{profileData?.city && profileData?.state ? `${profileData.city}, ${profileData.state}` : t('notSet')}</div></div>
                    </div>
                  </div>
                  {profileData?.bio && <div style={{marginTop:10,padding:'10px 14px',background:'var(--bg3)',borderRadius:8,fontSize:'0.82rem',color:'var(--t2)',lineHeight:1.6}}>{profileData.bio}</div>}
                </>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="ch"><span className="ct">{t('notifPrefs')}</span></div>
            <div className="cb">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>{t('emailNotif')}</div><div style={{fontSize:'0.72rem',color:'var(--t3)'}}>{t('emailNotifDesc')}</div></div>
                <div onClick={() => toggleNotif('notifications_email', !profileForm.notifications_email)} style={{width:44,height:24,borderRadius:12,background:profileForm.notifications_email ? 'var(--green)' : 'var(--bg3)',cursor:'pointer',position:'relative',transition:'background .2s'}}><div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:profileForm.notifications_email ? 22 : 2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}} /></div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>{t('smsNotif')}</div><div style={{fontSize:'0.72rem',color:'var(--t3)'}}>{t('smsNotifDesc')}</div></div>
                <div onClick={() => toggleNotif('notifications_sms', !profileForm.notifications_sms)} style={{width:44,height:24,borderRadius:12,background:profileForm.notifications_sms ? 'var(--green)' : 'var(--bg3)',cursor:'pointer',position:'relative',transition:'background .2s'}}><div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:profileForm.notifications_sms ? 22 : 2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Password + Language */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'stretch'}}>
          <div className="card">
            <div className="ch"><span className="ct">🔒 {t('changePassword')}</span></div>
            <div className="cb">
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <input className="f-inp" type="password" placeholder={t('newPassPlaceholder')} value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} />
                <input className="f-inp" type="password" placeholder={t('confirmNewPass')} value={passwordForm.confirmPass} onChange={e => setPasswordForm({...passwordForm, confirmPass: e.target.value})} />
                <button className="btn gold" onClick={changePassword} disabled={passwordSaving || !passwordForm.newPass} style={{opacity: passwordSaving || !passwordForm.newPass ? 0.6 : 1}}>{passwordSaving ? t('changingPass') : t('updatePassBtn')}</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="ch"><span className="ct">🌐 {t('language')}</span></div>
            <div className="cb">
              <select className="f-inp" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
