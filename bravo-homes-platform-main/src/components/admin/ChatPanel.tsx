import React, { useRef } from 'react';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ChatPanelProps {
  chatPartners: any[];
  selectedChatUser: any;
  setSelectedChatUser: (u: any) => void;
  messages: any[];
  setMessages: (fn: (prev: any[]) => any[]) => void;
  setAllChatMessages: (fn: (prev: any[]) => any[]) => void;
  user: any;
  newMessage: string;
  setNewMessage: (v: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  renderMessageContent: (msg: any) => React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showToast: (msg: string) => void;
  showConfirm: (msg: string, cb: () => void) => void;
  isRecording: boolean;
  recordingTime: number;
  formatTime: (t: number) => string;
  cancelRecording: () => void;
  stopRecordingAndSend: () => void;
  startRecording: () => void;
  isUploading: boolean;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  supabase: any;
}

export default function ChatPanel({
  chatPartners, selectedChatUser, setSelectedChatUser, messages, setMessages,
  setAllChatMessages, user, newMessage, setNewMessage, handleSendMessage,
  renderMessageContent, messagesEndRef, showToast, showConfirm,
  isRecording, recordingTime, formatTime, cancelRecording, stopRecordingAndSend,
  startRecording, isUploading, handleFileSelect, fileInputRef, supabase,
}: ChatPanelProps) {
  const { t } = useLanguage();
  return (
    <div className="page active" style={{display: 'flex', gap: '16px', height: 'calc(100vh - 80px)'}}>
      <Card className="flex flex-col h-full p-0 flex-shrink-0 w-[300px]">
         <div style={{padding: '16px', borderBottom: '1px solid var(--b)', fontWeight: 700}}>{t('chatPartnersTitle')}</div>
         <div style={{flex: 1, overflowY: 'auto'}}>
           {chatPartners.map(p => (
             <div key={p.id} onClick={() => setSelectedChatUser(p)} style={{padding: '12px 16px', borderBottom: '1px solid var(--b)', cursor: 'pointer', background: selectedChatUser?.id === p.id ? 'var(--bg3)' : 'transparent', display: 'flex', alignItems: 'center', gap: '10px'}}>
               <div className="av" style={{background: 'var(--gold)', color: '#000', width: '32px', height: '32px', fontSize: '0.8rem', fontWeight: 'bold'}}>{(p.full_name || p.name || 'PA').substring(0,2).toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.full_name || p.name || t('partnerFallback')}</div>
                </div>
                <button title="Apagar conversa" onClick={(e) => { e.stopPropagation(); showConfirm(`${t('deleteChatConfirm')} "${p.full_name || p.name || t('partnerFallback')}"? ${t('chatDeleteWarn')}`, async () => {
                  await supabase.from('messages').delete().or(
                    `and(sender_id.eq.${user?.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user?.id})`
                  );
                  setMessages(prev => prev.filter(m =>
                    !((m.sender_id === user?.id && m.receiver_id === p.id) ||
                      (m.sender_id === p.id && m.receiver_id === user?.id))
                  ));
                  setAllChatMessages(prev => prev.filter(m =>
                    !((m.sender_id === user?.id && m.receiver_id === p.id) ||
                      (m.sender_id === p.id && m.receiver_id === user?.id))
                  ));
                  if (selectedChatUser?.id === p.id) setSelectedChatUser(null);
                  showToast(t('chatDeletedSuccess'));
                }); }} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'0.85rem',padding:'4px',color:'var(--t3)',opacity:0.5,transition:'opacity .15s'}} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>🗑️</button>
             </div>
           ))}
           {chatPartners.length === 0 && <div style={{padding: '20px', color: 'var(--t3)', fontSize: '0.85rem', textAlign: 'center'}}>{t('noActiveChats')}</div>}
         </div>
      </Card>
      <Card className="flex flex-col flex-1 h-full p-0 min-w-0">
         {selectedChatUser ? (
           <>
             <div style={{padding: '16px', borderBottom: '1px solid var(--b)', display: 'flex', alignItems: 'center', gap: '10px'}}>
               <div className="av" style={{background: 'var(--gold)', color: '#000', width: '40px', height: '40px'}}>{(selectedChatUser.full_name || selectedChatUser.name || 'PA').substring(0,2).toUpperCase()}</div>
               <div>
                 <div style={{fontWeight: 700}}>{selectedChatUser.full_name || selectedChatUser.name || t('partnerFallback')}</div>
                 <div style={{fontSize: '0.75rem', color: 'var(--t2)'}}>{selectedChatUser.specialty || t('partnerFallback')}</div>
               </div>
             </div>
             <div style={{flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg)'}}>
                {messages.length === 0 ? (
                   <div style={{margin: 'auto', color: 'var(--t3)', fontStyle: 'italic', fontSize: '0.85rem'}}>{t('noMessagesYet')}</div>
                ) : (
                   messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', background: isMe ? 'var(--gold)' : 'var(--bg3)', color: isMe ? '#000' : 'var(--text)', padding: '10px 14px', borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0', fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                          {renderMessageContent(msg)}
                          <div style={{fontSize: '0.65rem', color: isMe ? 'rgba(0,0,0,0.6)' : 'var(--t3)', marginTop: '6px', textAlign: 'right'}}>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      );
                   })
                )}
                <div ref={messagesEndRef} />
             </div>
             <div style={{padding: '16px', borderTop: '1px solid var(--b)', display: 'flex', gap: '10px', background: 'var(--bg2)', alignItems: 'center'}}>
                {isRecording ? (
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--red)', fontWeight: 600}}>
                    <div style={{fontSize: '1.2rem', animation: 'pulsing 1s infinite'}}>🔴</div>
                    <style dangerouslySetInnerHTML={{__html: `@keyframes pulsing { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}} />
                    <div>{t('recordingAudio')}: {formatTime(recordingTime)}</div>
                    <div className="flex-1"></div>
                    <Button variant="ghost" className="text-danger border-transparent font-medium" onClick={cancelRecording}>{t('cancelBtn')}</Button>
                    <Button variant="gold" onClick={stopRecordingAndSend}>{t('sendAudioBtn')}</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} style={{flex: 1, display: 'flex', gap: '10px', minWidth: 0}}>
                    <input type="file" ref={fileInputRef} style={{display: 'none'}} onChange={handleFileSelect} />
                    <Button type="button" variant="ghost" className="px-3 text-[1.2rem] border-transparent" onClick={() => fileInputRef.current?.click()} title={t('attachFileTitle') as string} disabled={isUploading}>📎</Button>
                    
                    <input type="text" className="f-inp" placeholder={isUploading ? t('uploadingFileMsg') as string : t('typeMessagePlaceholder') as string} value={newMessage} onChange={e => setNewMessage(e.target.value)} disabled={isUploading} style={{flex: 1, margin: 0}} />
                    
                    {newMessage.trim() === '' ? (
                      <Button type="button" variant="ghost" className="px-3 text-[1.2rem] text-gold border-transparent" disabled={isUploading} onClick={startRecording} title={t('recordAudioTitle') as string}>🎤</Button>
                    ) : (
                      <Button type="submit" variant="gold" className="px-5" disabled={isUploading}>{t('sendBtn')}</Button>
                    )}
                  </form>
                )}
             </div>
           </>
         ) : (
           <div style={{margin: 'auto', color: 'var(--t3)', textAlign: 'center'}}>
              <div style={{fontSize: '3rem', marginBottom: '10px'}}>💬</div>
              <div>{t('selectPartnerPrompt1')}<br/>{t('selectPartnerPrompt2')}</div>
           </div>
         )}
      </Card>
    </div>
  );
}
