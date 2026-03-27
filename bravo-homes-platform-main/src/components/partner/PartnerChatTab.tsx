import React from 'react';

interface PartnerChatTabProps {
  user: any;
  chatTab: string;
  setChatTab: (tab: string) => void;
  messages: any[];
  chatClients: any[];
  selectedChatClient: any;
  setSelectedChatClient: (client: any) => void;
  setDeleteConfirmClient: (client: null | any) => void;
  channelMessages: any[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  chatFileRef: React.RefObject<HTMLInputElement | null>;
  sendChatFile: (files: FileList | null) => void;
  isRecording: boolean;
  stopRecording: () => void;
  startRecording: () => void;
  chatMsg: string;
  setChatMsg: (msg: string) => void;
  sendMessage: (msg: string) => void;
  canSend?: boolean;
  canDelete?: boolean;
  showToast?: (title: string, msg: string, type: 'error'|'success'|'info') => void;
}

export default function PartnerChatTab({
  user, chatTab, setChatTab, messages, chatClients, selectedChatClient, setSelectedChatClient,
  setDeleteConfirmClient, channelMessages, chatEndRef, chatFileRef, sendChatFile,
  isRecording, stopRecording, startRecording, chatMsg, setChatMsg, sendMessage, canSend = true, canDelete = true, showToast
}: PartnerChatTabProps) {
  return (
    <div className="page active">
      <div style={{display:'flex',height:'calc(100vh - 100px)',background:'var(--bg2)',border:'1px solid var(--b)',borderRadius:10,overflow:'hidden'}}>
        {/* Sidebar */}
        <div style={{width:260,borderRight:'1px solid var(--b)',display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--b)',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.85rem'}}>Conversas</div>
          <div style={{flex:1,overflowY:'auto'}}>
            <div onClick={() => setChatTab('admin')} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer',background:chatTab === 'admin' ? 'var(--gd)' : 'transparent',borderLeft:`3px solid ${chatTab === 'admin' ? 'var(--gold)' : 'transparent'}`,transition:'all .15s'}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'var(--gd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:'var(--gold)',flexShrink:0}}>BH</div>
              <div className="u-flex-1-min">
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:'0.82rem',fontWeight:600}}>Bravo Homes Admin</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)'}}>Admin · Suporte / Coordenação</div>
              </div>
              {messages.filter((m: any) => m.topic === 'admin').length > 0 && <span className="badge gold" style={{fontSize:'0.6rem'}}>{messages.filter((m: any) => m.topic === 'admin').length}</span>}
            </div>
            <div style={{padding:'10px 14px 4px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1}}>Clientes ({chatClients.length})</div>
            {chatClients.length === 0 && <div style={{padding:'8px 14px',fontSize:'0.75rem',color:'var(--t3)',fontStyle:'italic'}}>Nenhum cliente</div>}
            {chatClients.map((c: any) => {
              const isSelected = chatTab === 'client' && selectedChatClient?.id === c.id;
              const unread = messages.filter((m: any) => m.sender_id === c.id && m.receiver_id === user?.id).length;
              return (
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',background:isSelected ? 'var(--gd)' : 'transparent',borderLeft:`3px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,position:'relative'}} onClick={() => { setChatTab('client'); setSelectedChatClient(c); }}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(46,204,113,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700,color:'var(--green)',flexShrink:0}}>{(c.name || 'CL').substring(0,2).toUpperCase()}</div>
                  <div className="u-flex-1-min">
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name || 'Cliente'}</div>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)'}}>{c.email || c.phone || ''}</div>
                  </div>
                  {unread > 0 && <span className="badge gold" style={{fontSize:'0.55rem'}}>{unread}</span>}
                  <button title="Apagar conversa" onClick={(e) => { e.stopPropagation(); if (canDelete) setDeleteConfirmClient(c); else showToast?.('Acesso Negado', 'Sem permissão para apagar conversas.', 'error'); }} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'0.85rem',padding:'4px',color:'var(--t3)',opacity:0.6,transition:'opacity .15s'}} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>🗑️</button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid var(--b)',display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:'50%',background:chatTab === 'client' ? 'rgba(46,204,113,0.2)' : 'var(--gd)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.7rem',color:chatTab === 'client' ? 'var(--green)' : 'var(--gold)',flexShrink:0}}>{chatTab === 'client' ? (selectedChatClient?.name || 'CL').substring(0,2).toUpperCase() : 'BH'}</div>
            <div className="u-flex-1">
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.88rem'}}>{chatTab === 'client' ? (selectedChatClient?.name || 'Selecione um cliente') : 'Bravo Homes Admin'}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)'}}>{chatTab === 'client' ? 'Conversa individual' : 'Admin · Suporte'} · 🟢 Real-time</div>
            </div>
          </div>

          <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
            {channelMessages.length === 0 && <div style={{fontSize:'0.8rem',color:'var(--t3)',textAlign:'center',marginTop:40}}>No messages yet. Start the conversation below. 💬</div>}
            {channelMessages.map((m: any) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} style={{alignSelf:isMine ? 'flex-end' : 'flex-start',maxWidth:'70%'}}>
                  <div style={{background:isMine ? 'var(--gold)' : 'var(--bg3)',color:isMine ? '#000' : 'var(--text)',padding:'10px 14px',borderRadius:isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',fontSize:'0.88rem',lineHeight:1.5}}>
                    {(!m.payload?.msg_type || m.payload?.msg_type === 'text') && m.content}
                    {m.payload?.msg_type === 'image' && m.payload?.url && <a href={m.payload.url} target="_blank" rel="noreferrer"><img src={m.payload.url} alt="" style={{maxWidth:240,borderRadius:8,display:'block'}} /></a>}
                    {m.payload?.msg_type === 'file' && m.payload?.url && <a href={m.payload.url} target="_blank" rel="noreferrer" style={{color:isMine ? '#000' : 'var(--gold)',textDecoration:'underline',fontWeight:600}}>📎 {m.payload.name || 'Download'}</a>}
                    {m.payload?.msg_type === 'audio' && m.payload?.url && <audio controls src={m.payload.url} style={{maxWidth:240}} />}
                  </div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',color:'var(--t3)',marginTop:3,textAlign:isMine ? 'right' : 'left'}}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : ''}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div style={{padding:'12px 16px',borderTop:'1px solid var(--b)',display:'flex',gap:8,alignItems:'center'}}>
            <input ref={chatFileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="u-hide" onChange={e => sendChatFile(e.target.files)} />
            <button className="btn ghost" style={{padding:'8px 10px',fontSize:'1rem',flexShrink:0}} onClick={() => { if (canSend) chatFileRef.current?.click(); else showToast?.('Acesso Negado', 'Permissão negada para enviar mensagens/arquivos.', 'error'); }} title="Attach file">📎</button>
            <button className={`btn ${isRecording ? 'gold' : 'ghost'}`} style={{padding:'8px 10px',fontSize:'1rem',flexShrink:0,animation:isRecording ? 'pulse 1s infinite' : 'none'}} onClick={() => { if (canSend) { if (isRecording) stopRecording(); else startRecording(); } else showToast?.('Acesso Negado', 'Permissão negada para enviar mensagens/áudio.', 'error'); }} title={isRecording ? 'Stop recording' : 'Record audio'}>🎤</button>
            <input className="chat-input u-flex-1" placeholder={isRecording ? '🔴 Recording... click mic to stop' : 'Type your message...'} value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) sendMessage(chatMsg); else showToast?.('Acesso Negado', 'Permissão negada.', 'error'); }}} disabled={isRecording} />
            <button className="btn gold" onClick={() => { if (canSend) sendMessage(chatMsg); else showToast?.('Acesso Negado', 'Permissão negada para postar mensagens.', 'error'); }} disabled={isRecording || !chatMsg.trim()}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
