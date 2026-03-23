import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import type { Project, Lead, Partner, Client, LandingPage, CalendarEvent, Message, Profile, EditingEvent, GoogleEvent, ChatPartner } from '../types';
import type { User } from '@supabase/supabase-js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import SettingsTab from '../components/admin/SettingsTab';
import ChatPanel from '../components/admin/ChatPanel';
import CalendarTab from '../components/admin/CalendarTab';
import PartnersTab from '../components/admin/PartnersTab';
import ClientsTab from '../components/admin/ClientsTab';
import SocialMediaTab from '../components/admin/SocialMediaTab';
import ToastContainer, { useToast } from '../components/admin/Toast';
import ConfirmModal from '../components/admin/ConfirmModal';
import NewProjectModal from '../components/admin/NewProjectModal';
import './AdminDashboard.css';
import '../styles/utilities.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'dashboard');
  
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string; type: string; title: string; body: string; time: Date; read: boolean}[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // Lead Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesInput, setNotesInput] = useState('');
  
  // New Lead Modal
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: '', service_type: 'Bathroom Remodel', city: '', email: '', phone: '', urgency: 'warm', estimated_value: '', partner_id: '' });

  // Event Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ lead_id: '', date: '', time: '00:00', title: '' });
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);

  // LP Modal
  const [isLPOpen, setIsLPOpen] = useState(false);
  const [lpForm, setLpForm] = useState({ name: '', city: '' });

  // Partner Modal
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: '', city: '', phone: '', specialty: '', email: '', password: '' });
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editPartner, setEditPartner] = useState<Partner | null>(null);

  // Chat State
  const [selectedChatUser, setSelectedChatUser] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [allChatMessages, setAllChatMessages] = useState<{sender_id: string; receiver_id: string}[]>([]);

  // Media & Audio States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingTimerRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Profile State
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  // Browser Notifications
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem('bravo_notif_prefs');
    return saved ? JSON.parse(saved) : { new_lead: true, partner_msg: true, project_update: true, weekly_report: true };
  });
  const toggleNotifPref = (key: string) => {
    setNotifPrefs((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('bravo_notif_prefs', JSON.stringify(updated));
      return updated;
    });
  };
  const sendBrowserNotif = (title: string, body: string, tag: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/bravo-logo.png', tag, badge: '/bravo-logo.png' });
    }
  };

  // Sidebar responsive
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, lang, setLang } = useLanguage();
  const { toasts, showToast, dismissToast } = useToast();

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ show: boolean, msg: string, onConfirm: () => void }>({ show: false, msg: '', onConfirm: () => {} });
  const showConfirm = (msg: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, msg, onConfirm });
  };

  // Social Media State
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [socialPostForm, setSocialPostForm] = useState({ content: '', image_url: '', facebook: true, instagram: false });
  const [socialPosting, setSocialPosting] = useState(false);

  const META_APP_ID = import.meta.env.VITE_META_APP_ID || '914191061529946';

  // Load social data
  const loadSocialData = async () => {
    const [accts, posts] = await Promise.all([
      supabase.from('social_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('social_posts').select('*').order('created_at', { ascending: false })
    ]);
    if (accts.data) setSocialAccounts(accts.data);
    if (posts.data) setSocialPosts(posts.data);
  };

  // Facebook OAuth Connect
  const handleFbConnect = () => {
    const redirectUri = window.location.origin + '/admin';
    const scope = 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,public_profile';
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=token`;
    
    const popup = window.open(authUrl, 'fbAuth', 'width=600,height=700,scrollbars=yes');
    
    // Listen for the popup to return with the token
    const interval = setInterval(async () => {
      try {
        if (!popup || popup.closed) { clearInterval(interval); return; }
        const popupUrl = popup.location.href;
        if (popupUrl.includes('access_token=')) {
          clearInterval(interval);
          const hash = popupUrl.split('#')[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          popup.close();
          
          if (!accessToken) { showToast('Erro: Token não encontrado.'); return; }
          
          // Get user's pages
          const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`);
          const pagesData = await pagesRes.json();
          
          if (!pagesData.data || pagesData.data.length === 0) {
            showToast('Nenhuma Facebook Page encontrada na sua conta. Crie uma Page primeiro.');
            return;
          }
          
          const page = pagesData.data[0]; // First page
          const pageToken = page.access_token;
          const pageId = page.id;
          const pageName = page.name;
          
          // Save Facebook account
          const { error: fbErr } = await supabase.from('social_accounts').upsert({
            platform: 'facebook',
            page_id: pageId,
            page_name: pageName,
            access_token: pageToken,
          }, { onConflict: 'platform' });
          
          if (fbErr) console.error('FB save error:', fbErr);
          
          // Try to get Instagram Business Account
          const igRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
          const igData = await igRes.json();
          
          if (igData.instagram_business_account) {
            const igId = igData.instagram_business_account.id;
            await supabase.from('social_accounts').upsert({
              platform: 'instagram',
              page_id: pageId,
              page_name: pageName,
              access_token: pageToken,
              ig_business_id: igId,
            }, { onConflict: 'platform' });
            showToast(`✅ Facebook (${pageName}) e Instagram conectados!`);
          } else {
            showToast(`✅ Facebook (${pageName}) conectado! Instagram não detectado.`);
          }
          
          await loadSocialData();
        }
      } catch { /* cross-origin, still waiting */ }
    }, 500);
  };

  // Publish to Facebook/Instagram
  const handleSocialPublish = async () => {
    if (!socialPostForm.content.trim()) return;
    setSocialPosting(true);
    
    try {
      const results: string[] = [];
      
      // Publish to Facebook
      if (socialPostForm.facebook) {
        const fbAccount = socialAccounts.find(a => a.platform === 'facebook');
        if (fbAccount) {
          let fbUrl = `https://graph.facebook.com/v21.0/${fbAccount.page_id}`;
          let fbBody: Record<string, string> = { access_token: fbAccount.access_token };
          
          if (socialPostForm.image_url) {
            fbUrl += '/photos';
            fbBody.url = socialPostForm.image_url;
            fbBody.message = socialPostForm.content;
          } else {
            fbUrl += '/feed';
            fbBody.message = socialPostForm.content;
          }
          
          const fbRes = await fetch(fbUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fbBody) });
          const fbData = await fbRes.json();
          
          if (fbData.id || fbData.post_id) {
            const postId = fbData.id || fbData.post_id;
            await supabase.from('social_posts').insert({
              platform: 'facebook',
              content: socialPostForm.content,
              image_url: socialPostForm.image_url || null,
              post_id: postId,
              post_url: `https://www.facebook.com/${postId}`,
              status: 'published',
              published_at: new Date().toISOString()
            });
            results.push('Facebook ✅');
          } else {
            results.push(`Facebook ❌ (${fbData.error?.message || 'Erro'})`);
          }
        }
      }
      
      // Publish to Instagram
      if (socialPostForm.instagram) {
        const igAccount = socialAccounts.find(a => a.platform === 'instagram');
        if (igAccount && igAccount.ig_business_id) {
          if (!socialPostForm.image_url) {
            results.push('Instagram ❌ (imagem obrigatória)');
          } else {
            // Step 1: Create media container
            const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount.ig_business_id}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image_url: socialPostForm.image_url, caption: socialPostForm.content, access_token: igAccount.access_token })
            });
            const containerData = await containerRes.json();
            
            if (containerData.id) {
              // Step 2: Publish the container
              const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount.ig_business_id}/media_publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: containerData.id, access_token: igAccount.access_token })
              });
              const publishData = await publishRes.json();
              
              if (publishData.id) {
                await supabase.from('social_posts').insert({
                  platform: 'instagram',
                  content: socialPostForm.content,
                  image_url: socialPostForm.image_url,
                  post_id: publishData.id,
                  post_url: `https://www.instagram.com/p/${publishData.id}`,
                  status: 'published',
                  published_at: new Date().toISOString()
                });
                results.push('Instagram ✅');
              } else {
                results.push(`Instagram ❌ (${publishData.error?.message || 'Erro ao publicar'})`);
              }
            } else {
              results.push(`Instagram ❌ (${containerData.error?.message || 'Erro ao criar mídia'})`);
            }
          }
        }
      }
      
      showToast(results.join(' | '));
      setSocialPostForm({ content: '', image_url: '', facebook: true, instagram: false });
      await loadSocialData();
    } catch (err: any) {
      showToast(`Erro: ${err.message}`);
    } finally {
      setSocialPosting(false);
    }
  };

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', service_type: 'Reforma', contract_value: '', deadline: '', start_date: '', client_id: '' });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectClientMode, setProjectClientMode] = useState<'existing' | 'new'>('existing');
  const [newClientName, setNewClientName] = useState('');

  const handleCreateProject = () => {
    setEditingProjectId(null);
    setNewProjectForm({ name: '', service_type: 'Reforma', contract_value: '', deadline: '', start_date: '', client_id: '' });
    setProjectClientMode('existing');
    setNewClientName('');
    setIsNewProjectOpen(true);
  };

  const submitProjectForm = async (e: any) => {
    e.preventDefault();
    const { name, service_type, contract_value, deadline, start_date, client_id } = newProjectForm;

    // Handle new client creation if needed
    let finalClientId = client_id;
    if (projectClientMode === 'new' && newClientName.trim()) {
      const { data: newClient } = await supabase.from('clients').insert({ name: newClientName.trim() }).select().single();
      if (newClient) {
        finalClientId = newClient.id;
        setClients(prev => [...prev, newClient]);
      }
    }

    // Base fields (always exist)
    const baseData: any = {
      name,
      service_type: service_type || 'Reforma Residencial',
      contract_value: contract_value ? parseInt(contract_value) : 0,
      deadline: deadline || null,
    };

    // Extra fields (may not exist in DB yet)
    const fullData: any = {
      ...baseData,
      start_date: start_date || null,
      client_id: finalClientId || null,
    };
    
    if (editingProjectId) {
      // Try with all fields first, fallback to base fields
      let { error } = await supabase.from('projects').update(fullData).eq('id', editingProjectId);
      if (error && error.message.includes('column')) {
        ({ error } = await supabase.from('projects').update(baseData).eq('id', editingProjectId));
      }
      if (error) {
        showToast('Erro ao atualizar projeto: ' + error.message);
      } else {
        showToast('Projeto atualizado com sucesso!');
        setProjects(prev => prev.map(p => p.id === editingProjectId ? { ...p, ...fullData } : p));
      }
    } else {
      let { error } = await supabase.from('projects').insert([{ ...fullData, status: 'active', progress: 0 }]);
      if (error && error.message.includes('column')) {
        ({ error } = await supabase.from('projects').insert([{ ...baseData, status: 'active', progress: 0 }]));
      }
      if (error) {
        showToast('Erro ao criar projeto: ' + error.message);
      } else {
        showToast('Projeto criado com sucesso!');
        const { data: refreshed } = await supabase.from('projects').select('*');
        if (refreshed) setProjects(refreshed);
      }
    }

    // Always close popup
    setIsNewProjectOpen(false);
    setEditingProjectId(null);
    setNewProjectForm({ name: '', service_type: 'Reforma', contract_value: '', deadline: '', start_date: '', client_id: '' });
    setNewClientName('');
  };

  // Structured Notes State
  const [localNotes, setLocalNotes] = useState<{id:string;date?:string;text:string}[]>([]);

  // Google Calendar States
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [_isGoogleLinked, setIsGoogleLinked] = useState(false);

  // --- GOOGLE REST API HANDLERS ---
  const handleGoogleSync = async () => {
    try {
      showToast("Redirecionando para o Google...");
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin + '/admin'
        }
      });
      if (error) {
         console.warn("LinkIdentity falhou, tentando signIn direto", error);
         await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
              queryParams: { access_type: 'offline', prompt: 'consent' },
              redirectTo: window.location.origin + '/admin'
            }
         });
      }
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao conectar Google: " + err.message);
    }
  };

  const fetchGoogleEvents = async (token: string) => {
    try {
      const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=' + new Date().toISOString() + '&maxResults=50&singleEvents=true&orderBy=startTime', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
         if (resp.status === 401) {
            localStorage.removeItem('google_provider_token');
            setIsGoogleLinked(false);
         }
         return;
      }
      const data = await resp.json();
      if (data.items) {
        const gEvents = data.items.map((item: any) => ({
           id: item.id,
           title: '[Google] ' + item.summary,
           start: item.start.dateTime || item.start.date,
           end: item.end?.dateTime || item.end?.date,
           backgroundColor: '#4285F4',
           borderColor: '#4285F4',
           textColor: '#fff',
           extendedProps: { is_google_native: true }
        }));
        setGoogleEvents(gEvents);
      }
    } catch(err) {
      console.error("Erro fetch Google Events", err);
    }
  };

  const pushEventToGoogle = async (eventDetails: any) => {
    const token = localStorage.getItem('google_provider_token');
    if (!token) return;
    try {
      const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventDetails)
      });
      if (resp.ok) {
        setTimeout(() => showToast("Agendamento Sincronizado com o seu Google Calendar!"), 1500);
      }
    } catch(err) {
      console.error("Erro push Google Event", err);
    }
  };
  // --------------------------------

  useEffect(() => {
    async function fetchData() {
      setLoadingDb(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      const providerToken = sessionData.session?.provider_token;
      if (providerToken) {
         localStorage.setItem('google_provider_token', providerToken);
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
         setUser(currentUser);
         setAdminName(currentUser.user_metadata?.full_name || 'Admin');
         setAdminEmail(currentUser.email || '');
         setAdminPhone(currentUser.user_metadata?.phone || '');
         // phone from profile will be loaded below after profile fetch
         
         const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
         
         if (profile) {
             // ROLE GUARD: only admins can access this dashboard
             if (profile.role && profile.role !== 'admin') {
               if (profile.role === 'parceiro') { navigate('/partner', { replace: true }); return; }
               if (profile.role === 'cliente') { navigate('/client', { replace: true }); return; }
               navigate('/', { replace: true }); return;
             }
            setUserProfile({
               ...profile,
               avatar_url: currentUser.user_metadata?.avatar_url || profile.avatar_url,
               full_name: currentUser.user_metadata?.full_name || profile.full_name
            });
             if (profile.phone) setAdminPhone(profile.phone);
         } else {
            // Se a tabela 'profiles' não existir, joga a foto salva nos metadados do auth
            setUserProfile({ id: currentUser.id, role: 'admin', avatar_url: currentUser.user_metadata?.avatar_url, full_name: currentUser.user_metadata?.full_name || 'Admin' } as Profile);
            if (profError) console.warn('Sem perfil público detectado:', profError.message);
         }
      }
      
      // Parallel fetch all data at once for faster loading
      const [projRes, leadsRes, lpRes, cliRes, partRes, chatRes, calRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('leads').select('*, clients(*)').order('created_at', { ascending: false }),
        supabase.from('landing_pages').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('profiles').select('*').eq('role', 'parceiro'),
        supabase.from('messages').select('sender_id, receiver_id'),
        supabase.from('calendar_events').select('*'),
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (lpRes.data) setLandingPages(lpRes.data);
      if (cliRes.data) setClients(cliRes.data);
      if (partRes.data) setPartners(partRes.data);
      if (chatRes.data) setAllChatMessages(chatRes.data);
      if (calRes.data) setCalendarEvents(calRes.data);

      // Load social media data
      await loadSocialData();
      setLoadingDb(false);
      
      const storedToken = localStorage.getItem('google_provider_token');
      if (storedToken) {
         setIsGoogleLinked(true);
         fetchGoogleEvents(storedToken);
      }
    }
    fetchData();

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase.channel('realtime-admin-leads')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const newLead = payload.new as any;
        setLeads(prev => [newLead, ...prev]);
        setNotifications(prev => [{ id: 'lead-' + newLead.id, type: '🎯 Novo Lead', title: newLead.name || 'Lead', body: `${newLead.service_type || ''} — ${newLead.city || ''}`, time: new Date(), read: false }, ...prev]);
        // Browser push notification
        const prefs = JSON.parse(localStorage.getItem('bravo_notif_prefs') || '{"new_lead":true}');
        if (prefs.new_lead) {
          sendBrowserNotif(
            '🔔 Novo Lead na Bravo!',
            `${newLead.name || 'Lead'} — ${newLead.service_type || ''} — ${newLead.city || ''} — $${newLead.estimated_value || '?'}`,
            'new-lead-' + newLead.id
          );
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user?.id) {
          setNotifications(prev => [{ id: 'msg-' + msg.id, type: '💬 Mensagem', title: 'Nova mensagem no chat', body: msg.content?.substring(0, 80) || 'Nova mensagem recebida', time: new Date(), read: false }, ...prev]);
        }
        const prefs = JSON.parse(localStorage.getItem('bravo_notif_prefs') || '{"partner_msg":true}');
        if (prefs.partner_msg && msg.receiver_id === user?.id) {
          sendBrowserNotif(
            '💬 Nova mensagem no chat',
            msg.content?.substring(0, 100) || 'Nova mensagem recebida',
            'chat-msg-' + msg.id
          );
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, (payload) => {
        const proj = payload.new as any;
        setProjects(prev => prev.map(p => p.id === proj.id ? proj : p));
        setNotifications(prev => [{ id: 'proj-' + proj.id + '-' + Date.now(), type: '📋 Projeto', title: proj.name || 'Projeto', body: `Status: ${proj.status || 'atualizado'}`, time: new Date(), read: false }, ...prev]);
        const prefs = JSON.parse(localStorage.getItem('bravo_notif_prefs') || '{"project_update":true}');
        if (prefs.project_update) {
          sendBrowserNotif(
            '📋 Projeto atualizado',
            `${proj.name || 'Projeto'} — Status: ${proj.status || 'atualizado'}`,
            'proj-' + proj.id
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Chat Effect — load ALL messages involving this partner (across all admins)
  useEffect(() => {
    if (!selectedChatUser) return;
    const fetchMsgs = async () => {
      const { data } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${selectedChatUser.id},receiver_id.eq.${selectedChatUser.id}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMsgs();

    const channel = supabase.channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === selectedChatUser.id || msg.receiver_id === selectedChatUser.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev.filter(m => !m.id?.toString().includes('.')), msg];
          });
        }
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [selectedChatUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Compute chat partners from actual messages — show ALL partners with conversations (not filtered by current admin)
  const chatPartners = React.useMemo(() => {
    const partnerIds = new Set<string>();
    const partnerIdSet = new Set(partners.map(p => p.id));
    allChatMessages.forEach((m: any) => {
      if (partnerIdSet.has(m.sender_id)) partnerIds.add(m.sender_id);
      if (partnerIdSet.has(m.receiver_id)) partnerIds.add(m.receiver_id);
    });
    return partners.filter(p => partnerIds.has(p.id));
  }, [allChatMessages, partners]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navItemClass = (tab: string) => `ni ${activeTab === tab ? 'active' : ''}`;
  const navTo = (tab: string) => { setActiveTab(tab); setSidebarOpen(false); };

  // KANBAN DRAG AND DROP
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    // Optimistic UI update
    setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    // Update Supabase
    const { error } = await supabase.from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      // Revert optimism if failed (optional, simplified here)
    }
  };

  const updateLead = async (leadId: string, updates: any) => {
    // Optimistic UI update
    setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, ...updates } : l));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, ...updates });
    }

    // Update DB
    const { error } = await supabase.from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead:', error);
    }
  };

  // Parse notes into structured blocks: [{date: '21/03/2026', text: '...', id: '...'}]
  const parseNotes = (notesStr: string) => {
    if (!notesStr) return [];
    const parts = notesStr.split(/(?=\[\d{2}\/\d{2}\/\d{4}\])/g);
    return parts.map(p => {
      const match = p.match(/^\[(\d{2}\/\d{2}\/\d{4})\]([\s\S]*)$/);
      if (match) {
        return { id: Math.random().toString(), date: match[1], text: match[2].trimStart().replace(/\n+$/, '') };
      }
      return { id: Math.random().toString(), date: '', text: p.replace(/\n+$/, '') };
    }).filter(p => p.date || p.text.trim());
  };

  useEffect(() => {
    if (selectedLead) {
      setLocalNotes(parseNotes(selectedLead.notes || ''));
    }
  }, [selectedLead?.notes]);

  const saveLocalNotes = async (updatedNotes: any[]) => {
    if (!selectedLead) return;
    const newString = updatedNotes
      .filter(n => n.text.trim() !== '') // Remove blocks with empty text
      .map(n => n.date ? `[${n.date}] ${n.text}` : n.text)
      .join('\n');
    await updateLead(selectedLead.id, { notes: newString });
  };

  const handleNotesSave = async () => {
    if (!notesInput.trim() || !selectedLead) return;
    const currentNotes = selectedLead.notes || '';
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const newNotes = currentNotes + (currentNotes ? '\n' : '') + `[${dateStr}] ${notesInput}`;
    await updateLead(selectedLead.id, { notes: newNotes });
    setNotesInput('');
  };

  const handleDeleteClient = async (clientId: string) => {
    showConfirm("Certeza que deseja excluir este cliente e todos os seus leads?", async () => {
      // Optimistic UI update
      setClients(prev => prev.filter(c => c.id !== clientId));
      setLeads(prev => prev.filter(l => l.client_id !== clientId));

      // Delete leads first to satisfy foreign key constraint, then delete client
      await supabase.from('leads').delete().eq('client_id', clientId);
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      
      if (error) {
        console.error("Erro ao deletar cliente:", error);
        showToast("Erro ao excluir cliente: " + error.message);
      }
    });
  };

  const handleNewLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name || !newLeadForm.city) return;
    
    // Only create the lead — client is created when assigned to a partner
    const leadPayload: Record<string, unknown> = {
      name: newLeadForm.name,
      email: newLeadForm.email || '',
      phone: newLeadForm.phone || '',
      service_type: newLeadForm.service_type,
      city: newLeadForm.city,
      source: 'manual-admin',
      status: 'new',
      urgency: newLeadForm.urgency,
    };
    if (newLeadForm.estimated_value) leadPayload.estimated_value = parseFloat(newLeadForm.estimated_value);
    if (newLeadForm.partner_id) leadPayload.partner_id = newLeadForm.partner_id;
    const { data: newLead, error } = await supabase.from('leads').insert(leadPayload).select().single();

    if (!error && newLead) {
      setLeads(prev => prev.some(l => l.id === newLead.id) ? prev : [newLead, ...prev]);
      setIsNewLeadOpen(false);
      setNewLeadForm({ name: '', service_type: 'Bathroom Remodel', city: '', email: '', phone: '', urgency: 'warm', estimated_value: '', partner_id: '' });
      showToast('Lead criado com sucesso!');
      // Direct browser notification
      const prefs = JSON.parse(localStorage.getItem('bravo_notif_prefs') || '{"new_lead":true}');
      if (prefs.new_lead) {
        sendBrowserNotif('🔔 Novo Lead na Bravo!', `${newLead.name} — ${newLead.service_type || ''} — ${newLead.city || ''} — $${newLead.estimated_value || '?'}`, 'new-lead-' + newLead.id);
      }
    } else {
      console.error('Error inserting lead:', error);
      showToast(`Erro ao criar Lead: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleEventDrop = async (info: any) => {
    const { event } = info;
    const newStart = event.start;
    const newEnd = event.end || new Date(newStart.getTime() + 60*60*1000);
    if (!newStart) return;

    if (event.extendedProps.is_google_native) {
       const token = localStorage.getItem('google_provider_token');
       if (!token) {
          showToast("Conecte seu Google Calendar no botão acima para reagendar este evento.");
          info.revert();
          return;
       }
       try {
          const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`, {
             method: 'PATCH',
             headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
                start: { dateTime: newStart.toISOString() },
                end: { dateTime: newEnd.toISOString() }
             })
          });
          if (!resp.ok) throw new Error("Falha no sync do Google");
          showToast("Reagendado diretamente no seu Google Calendar!");
       } catch (err) {
          console.error("Erro patch Google", err);
          showToast("Erro ao reagendar no Google.");
          info.revert();
       }
       return;
    }

    // Converte a data para o formato YYYY-MM-DD local
    const event_date = newStart.toLocaleDateString('en-CA'); // en-CA garante formato YYYY-MM-DD
    
    // Tenta extrair a hora se existir
    let start_time = null;
    if (!event.allDay) {
       start_time = newStart.toTimeString().split(' ')[0];
    }

    try {
      const { error } = await supabase.from('calendar_events').update({ event_date, start_time: start_time || null }).eq('id', event.id);
      if (error) throw error;
      
      // Atualiza estado local
      setCalendarEvents(prev => prev.map(e => e.id === event.id ? { ...e, event_date, start_time: start_time || e.start_time } : e));
    } catch (err: any) {
      console.error("Erro ao arrastar evento", err);
      showToast("Erro ao salvar a nova data no banco de dados.");
      info.revert();
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.date || !eventForm.time) return;
    
    // --- VERIFICAÇÃO DE OVERLAP (Agendamento Duplo) ---
    const newStart = new Date(`${eventForm.date}T${eventForm.time}:00`);
    const newEnd = new Date(newStart.getTime() + 60*60*1000); // Assumindo blocos de 1 hora
    
    const allEvents = mapEventsForCalendar();
    const hasOverlap = allEvents.some(ev => {
      // Ignorar eventos de dia todo (eventos Google sem dateTime)
      if (!ev.start || String(ev.start).length <= 10) return false; 
      
      const evStart = new Date(String(ev.start));
      // Se n tiver end estrito, default de 1h
      const evEnd = ev.end ? new Date(String(ev.end)) : new Date(evStart.getTime() + 60*60*1000);
      
      // Há choque se novoInicio < eventFim E novoFim > eventInicio
      return newStart < evEnd && newEnd > evStart;
    });

    if (hasOverlap) {
      showToast('Conflito de Horário! Já existe um agendamento neste horário da agenda.');
      return;
    }
    // --------------------------------------------------

    const lead = leads.find(l => l.id === eventForm.lead_id);
    const leadName = lead ? (lead.clients?.name || lead.name || 'Desconhecido') : '';
    const title = eventForm.title || (leadName ? `Vistoria: ${leadName}` : 'Agendamento de Vistoria');

    try {
      const { data, error } = await supabase.from('calendar_events').insert([{
         title,
         event_date: eventForm.date,
         start_time: eventForm.time + ':00',
         lead_id: eventForm.lead_id || null
      }]).select().single();
      
      if (error) {
        showToast(error.message || 'Erro ao criar evento.');
      } else {
        showToast("Agendamento criado com sucesso!");
        pushEventToGoogle({
           summary: eventForm.title || `Vistoria: Agendamento Bravo`,
           start: { dateTime: new Date(`${eventForm.date}T${eventForm.time}:00`).toISOString() },
           end: { dateTime: new Date(new Date(`${eventForm.date}T${eventForm.time}:00`).getTime() + 60*60*1000).toISOString() }
        });
        setCalendarEvents(prev => [...prev, data]);
        if (eventForm.lead_id) {
            updateLead(eventForm.lead_id, { status: 'scheduling' });
        }
        setIsEventModalOpen(false);
        setEventForm({ lead_id: '', date: '', time: '00:00', title: '' });
      }
    } catch(err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao criar evento.');
    }
  };

  const handleLPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lpForm.name || !lpForm.city) return;
    try {
      const { data, error } = await supabase.from('landing_pages').insert([{
        name: lpForm.name,
        city: lpForm.city,
        status: 'draft'
      }]).select().single();
      if (error) throw error;
      setLandingPages([data, ...landingPages]);
      setIsLPOpen(false);
      setLpForm({ name: '', city: '' });
      showToast("Landing Page criada com sucesso! Ela foi criada como rascunho (DRAFT). Clique no status para publicar.");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao criar LP.');
    }
  };

  const toggleLPStatus = async (lp: any) => {
    const newStatus = lp.status === 'live' ? 'draft' : 'live';
    try {
      const { error } = await supabase.from('landing_pages').update({ status: newStatus }).eq('id', lp.id);
      if (error) throw error;
      setLandingPages(prev => prev.map(p => p.id === lp.id ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao alterar status.");
    }
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.email || !partnerForm.password) {
      showToast('Nome, e-mail e senha são obrigatórios.');
      return;
    }
    if (partnerForm.password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    try {
      // 1. Criar usuário via auth (o trigger do banco cria o profile automaticamente)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: partnerForm.email,
        password: partnerForm.password,
        options: { data: { full_name: partnerForm.name, role: 'parceiro' } }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Falha ao criar usuário.');

      // 2. Aguardar trigger criar o profile e atualizar campos extras
      await new Promise(r => setTimeout(r, 1500));
      const { error: updateErr } = await supabase.from('profiles')
        .update({
          full_name: partnerForm.name,
          city: partnerForm.city || null,
          phone: partnerForm.phone || null,
          specialty: partnerForm.specialty || null,
          state: 'available'
        })
        .eq('id', authData.user.id);
      if (updateErr) console.warn('Campos extras não salvos:', updateErr.message);

      // 3. Buscar o perfil criado e adicionar na lista
      const { data: newPartner } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      if (newPartner) setPartners(prev => [newPartner, ...prev]);

      setIsPartnerOpen(false);
      setPartnerForm({ name: '', city: '', phone: '', specialty: '', email: '', password: '' });
      showToast('Parceiro criado com sucesso!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao adicionar parceiro.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatUser || !user) return;
    
    // Opt-UI
    const tempMsg = {
      id: Math.random().toString(),
      sender_id: user.id,
      receiver_id: selectedChatUser.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setAllChatMessages(prev => [...prev, { sender_id: user.id, receiver_id: selectedChatUser.id }]);
    setNewMessage('');
    
    const { error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: selectedChatUser.id,
      content: tempMsg.content
    }]);
    
    if (error) {
       console.error("Chat erro:", error);
       showToast("Erro ao enviar mensagem. Se a tabela 'messages' não existe, você precisa rodar o script SQL lá no Supabase Dashboard.");
    }
  };

  const uploadToSupabaseAndSend = async (file: Blob | File, fileName: string, fileType: string) => {
    if (!selectedChatUser || !user) return;
    setIsUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.\\-]/g, '_')}`;
      
      const { data: _uploadData, error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);

      const { error: msgError } = await supabase.from('messages').insert([{
        sender_id: user.id,
        receiver_id: selectedChatUser.id,
        content: `[${fileType.split('/')[0].toUpperCase()}]`,
        file_url: publicUrl,
        file_name: fileName,
        file_type: fileType
      }]);

      if (msgError) throw msgError;
      
    } catch (err: any) {
      console.error('Upload Error:', err);
      showToast(`Erro ao enviar arquivo: ${err.message || 'Verifique se o bucket chat_attachments está criado.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadToSupabaseAndSend(file, file.name, file.type);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setIsUploadingAvatar(true);
      showToast('Fazendo upload da imagem...');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('chat_attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat_attachments').getPublicUrl(filePath);

      const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').upsert({ id: user!.id, avatar_url: publicUrl, full_name: adminName || user?.user_metadata?.full_name, role: 'admin' });
      if (profileError) console.warn("Tabela profiles ausente. Salvando apenas na Auth:", profileError.message);

      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      showToast('Foto de perfil atualizada com sucesso!');
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar foto: ${err.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      showToast('Salvando alterações...');
      const updates: any = {};
      
      if (adminName !== user?.user_metadata?.full_name) {
          updates.data = { full_name: adminName, phone: adminPhone };
      }
      if (adminEmail !== user?.email) {
          updates.email = adminEmail;
      }
      
      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').upsert({ id: user!.id, full_name: adminName, phone: adminPhone, role: 'admin' });
      if (profileError) console.warn("Tabela profiles ausente:", profileError.message);

      setUserProfile((prev: any) => ({ ...prev, full_name: adminName }));
      
      if (updates.email) {
         showToast('Perfil atualizado! Um email de verificação foi enviado aos seus e-mails novo e antigo.');
      } else {
         showToast('Perfil atualizado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar perfil: ${err.message}`);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await uploadToSupabaseAndSend(audioBlob, `audio_${Date.now()}.webm`, 'audio/webm');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro microfone:', err);
      showToast('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderMessageContent = (msg: any) => {
    if (!msg.file_url) return msg.content;
    
    const isImage = msg.file_type?.startsWith('image/');
    const isVideo = msg.file_type?.startsWith('video/');
    const isAudio = msg.file_type?.startsWith('audio/');

    if (isImage) {
      return (
        <div>
          <img src={msg.file_url} alt={msg.file_name} style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', marginTop: '4px'}} onClick={() => window.open(msg.file_url, '_blank')} />
        </div>
      );
    }
    if (isVideo) {
      return (
        <div>
          <video src={msg.file_url} controls style={{maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '4px'}} />
        </div>
      );
    }
    if (isAudio) {
      return (
        <div>
          <audio src={msg.file_url} controls style={{maxWidth: '220px', marginTop: '4px'}} />
        </div>
      );
    }
    // Generic Document
    return (
      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
         <span style={{fontSize: '1.5rem'}}>📄</span>
         <span style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>{msg.file_name || 'Documento'}</span>
      </a>
    );
  };

  const handleEventClick = async (info: any) => {
    const ev = info.event;
    const startDate = ev.start;
    setEditingEvent({
      id: ev.id,
      title: ev.title,
      date: startDate ? startDate.toISOString().substring(0, 10) : '',
      time: startDate ? startDate.toTimeString().substring(0, 5) : '00:00',
      is_google_native: ev.extendedProps?.is_google_native || false,
    });
  };

  const handleEditEventSave = async () => {
    if (!editingEvent) return;
    try {
      if (editingEvent.is_google_native) {
        showToast('Eventos do Google não podem ser editados aqui.');
        return;
      }
      const { error } = await supabase.from('calendar_events').update({
        event_date: editingEvent.date,
        start_time: editingEvent.time,
        title: editingEvent.title,
      }).eq('id', editingEvent.id);
      if (error) throw error;
      setCalendarEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, event_date: editingEvent.date, start_time: editingEvent.time, title: editingEvent.title } : e));
      showToast('Evento atualizado com sucesso!');
      setEditingEvent(null);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao atualizar evento.');
    }
  };

  const handleEditEventDelete = async () => {
    if (!editingEvent) return;
    showConfirm(`Deseja excluir o agendamento "${editingEvent.title}"?`, async () => {
      try {
        if (editingEvent.is_google_native) {
          const token = localStorage.getItem('google_provider_token');
          if (!token) {
            showToast("Conecte seu Google Calendar primeiro para excluir este evento.");
            return;
          }
          const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${editingEvent.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error("Falha ao excluir no Google");
          setGoogleEvents(prev => prev.filter(e => e.id !== editingEvent.id));
          showToast("Evento excluído do Google Calendar!");
          setEditingEvent(null);
          return;
        }
        const { error } = await supabase.from('calendar_events').delete().eq('id', editingEvent.id);
        if (error) throw error;
        setCalendarEvents(prev => prev.filter(e => e.id !== editingEvent.id));
        showToast('Evento excluído!');
        setEditingEvent(null);
      } catch (err: any) {
        console.error(err);
        showToast("Erro ao excluir evento.");
      }
    });
  };

  const mapEventsForCalendar = () => {
    const local = calendarEvents.map(e => {
       const startStr = e.start_time ? `${e.event_date}T${e.start_time}` : e.event_date;
       const endStr = (e.end_time && e.event_date) ? `${e.event_date}T${e.end_time}` : undefined;
       return {
         id: e.id,
         title: e.title,
         start: startStr,
         end: endStr,
         backgroundColor: 'var(--gold)',
         borderColor: 'var(--gold)',
         textColor: '#000',
         extendedProps: {
           lead_id: e.lead_id
         }
       };
    });
    return [...local, ...googleEvents];
  };

  const totalRevenue = projects.reduce((acc, p) => acc + (Number(p.contract_value) || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const activeLeadsCount = leads.length;
  const schedulingLeads = leads.filter(l => l.status === 'scheduling');
  const schedulingLeadsCount = schedulingLeads.length;

  const grossRevenue = totalRevenue;
  const toReceive = projects.reduce((acc, p) => {
     const val = Number(p.contract_value) || 0;
     const paid = val * ((p.progress || 0) / 100);
     return acc + (val - paid);
  }, 0);
  const paidToPartners = projects.reduce((acc, p) => {
     const val = Number(p.contract_value) || 0;
     const paid = val * ((p.progress || 0) / 100);
     return acc + (paid * 0.6); 
  }, 0);

  // --- Metricas Receita Mensal ---
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = new Array(12).fill(0);
  projects.forEach(p => {
    if (p.created_at) {
       const d = new Date(p.created_at);
       if (d.getFullYear() === currentYear) {
         monthlyRevenue[d.getMonth()] += (Number(p.contract_value) || 0);
       }
    }
  });
  const chartLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // --- Metricas Leads por Fonte ---
  const leadsPerSource = leads.reduce((acc, l) => {
     const source = (l.source && l.source.trim() !== '') ? l.source : 'Desconhecido';
     acc[source] = (acc[source] || 0) + 1;
     return acc;
  }, {} as Record<string, number>);
  
  const totalLeadsWithSource = leads.length || 1;
  const sourceColors = ['var(--gold)', 'var(--blue)', 'var(--green)', 'var(--red)', 'var(--orange)', 'var(--purple)'];
  const sourceElements = (Object.entries(leadsPerSource) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]: [string, number], idx: number) => {
       const color = sourceColors[idx % sourceColors.length];
       const percentage = Math.round((count / totalLeadsWithSource) * 100);
       const niceSourceName = source === 'manual-admin' ? 'Manual' : source;
       return (
         <div key={source} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
           <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.8rem', textTransform:'capitalize'}}>
             <div style={{width:'8px',height:'8px',borderRadius:'50%',background:color}}></div>{niceSourceName}
           </div>
           <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.75rem'}}>
             {percentage}% · {Number(count)} leads
           </div>
         </div>
       );
    });

  return (
    <div className="admin-body">
      <nav className={`sb ${sidebarOpen ? 'open' : ''}`} role="navigation" aria-label="Menu principal">
        <div className="sb-brand">
          <img src={theme === 'light' ? "/Logo atual Bravo.png" : "/Logo Fundo azul.jpeg"} alt="Bravo Homes Group" className="sb-logo" style={{background: 'transparent'}} />
          <div className="sb-sub">{t('adminDashboard')}</div>
        </div>
        <div className="sb-admin">
          {userProfile?.avatar_url ? (
            <img src={userProfile.avatar_url} alt="Admin" className="av" style={{objectFit: 'cover', width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--gold)'}} />
          ) : (
            <div className="av" style={{textTransform:'uppercase'}}>{(userProfile?.full_name || user?.user_metadata?.full_name || 'A').substring(0, 2)}</div>
          )}
          <div style={{minWidth: 0}}>
            <div className="pname" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{userProfile?.full_name || user?.user_metadata?.full_name || 'Admin'}</div>
            <div className="prole">{t('administrator')}</div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="sb-sec">{t('overview')}</div>
          <div className={navItemClass('dashboard')} onClick={() => navTo('dashboard')}><span className="ni-icon">◈</span>{t('dashboard')}</div>
          
          <div className="sb-sec">{t('sales')}</div>
          <div className={navItemClass('pipeline')} onClick={() => navTo('pipeline')}><span className="ni-icon">◧</span>{t('pipeline')}{activeLeadsCount > 0 && <span className="badge gold">{activeLeadsCount}</span>}</div>
          <div className={navItemClass('allleads')} onClick={() => navTo('allleads')}><span className="ni-icon">◎</span>{t('allLeads')}</div>
          <div className={navItemClass('lp')} onClick={() => navTo('lp')}><span className="ni-icon">⊞</span>{t('landingPages')}{landingPages.length > 0 && <span className="badge blue">{landingPages.length}</span>}</div>
          
          <div className="sb-sec">{t('operations')}</div>
          <div className={navItemClass('projects')} onClick={() => navTo('projects')}><span className="ni-icon">▦</span>{t('activeProjects')}{projects.length > 0 && <span className="badge gold">{projects.length}</span>}</div>
          <div className={navItemClass('calendar')} onClick={() => navTo('calendar')}><span className="ni-icon">📅</span>{t('calendar')}</div>
          <div className={navItemClass('clients')} onClick={() => navTo('clients')}><span className="ni-icon">◉</span>{t('clients')}</div>
          <div className={navItemClass('partners')} onClick={() => navTo('partners')}><span className="ni-icon">👷</span>{t('partners')}</div>
          
          <div className="sb-sec">{t('financial')}</div>
          <div className={navItemClass('finances')} onClick={() => navTo('finances')}><span className="ni-icon">$</span>{t('finances')}</div>
          
          <div className="sb-sec">{t('messaging')}</div>
          <div className={navItemClass('adminchat')} onClick={() => navTo('adminchat')}><span className="ni-icon">💬</span>{t('chat')}</div>
          <div className={navItemClass('social')} onClick={() => navTo('social')}><span className="ni-icon">📱</span>Social Media</div>
          
          <div className="sb-sec">SYSTEM</div>
          <div className={navItemClass('settings')} onClick={() => navTo('settings')}><span className="ni-icon">⚙</span>{t('settings')}</div>
        </div>
        <div className="sb-footer">
          <div className="logout" style={{textAlign:'center'}} onClick={async () => { localStorage.removeItem('adminActiveTab'); await supabase.auth.signOut(); window.location.href = '/'; }}>🚪 {t('logout')}</div>
        </div>
      </nav>
      {/* Mobile sidebar backdrop */}
      <div className={`sb-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>

      <div className="main">
        <div className="topbar">
          <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Abrir/fechar menu lateral">☰</button>
          <div className="topbar-title">{{'lp':t('topbarLandingPages'),'allleads':t('topbarAllLeads'),'adminchat':t('topbarChat'),'projects':t('topbarProjects'),'pipeline':t('topbarPipeline'),'calendar':t('topbarCalendar'),'partners':t('topbarPartners'),'clients':t('topbarClients'),'finances':t('topbarFinances'),'settings':t('topbarSettings'),'dashboard':t('topbarDashboard')}[activeTab] || activeTab.toUpperCase()}</div>
          <div className="topbar-actions"></div>
          <button className="notif-btn" onClick={() => setIsNotifOpen(!isNotifOpen)} aria-label="Abrir notificações" style={{position:'relative'}}>
            🔔
            {unreadCount > 0 && <span style={{position:'absolute',top:'-2px',right:'-2px',background:'var(--red)',color:'#fff',fontSize:'0.55rem',fontWeight:700,borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center'}}>{unreadCount}</span>}
          </button>
          <button className="theme-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}>{theme === 'dark' ? '🌙' : '☀️'}</button>
        </div>
        
        {isNotifOpen && (
          <div className="notif-panel open" style={{ right: 30 }}>
            <div className="nphead">Notificações {unreadCount > 0 && <span style={{background:'var(--red)',color:'#fff',fontSize:'0.55rem',borderRadius:10,padding:'1px 6px',marginLeft:6}}>{unreadCount}</span>} <span className="npclear" style={{cursor: 'pointer'}} onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}>Marcar todas lidas</span></div>
            <div style={{maxHeight:'350px',overflowY:'auto'}}>
              {notifications.length === 0 && <div className="empty-state" style={{padding: '20px'}}>Sem notificações</div>}
              {notifications.slice(0, 20).map(n => (
                <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x))} style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',cursor:'pointer',background: n.read ? 'transparent' : 'rgba(201,148,58,0.08)',transition:'all .2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <span style={{fontSize:'0.7rem'}}>{n.type}</span>
                    {!n.read && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--red)',flexShrink:0}}></span>}
                  </div>
                  <div style={{fontSize:'0.8rem',fontWeight: n.read ? 400 : 700,color:'var(--text)'}}>{n.title}</div>
                  <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{n.body}</div>
                  <div style={{fontSize:'0.6rem',color:'var(--t3)',marginTop:4,fontFamily:"'DM Mono',monospace"}}>{n.time.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="page active">
              {loadingDb ? (
                /* Skeleton loading state */
                <>
                  <div className="kpi-grid">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-kpi"></div>)}
                  </div>
                  <div className="g2" style={{marginTop:'14px'}}>
                    <div className="skeleton skeleton-card"></div>
                    <div className="skeleton skeleton-card"></div>
                  </div>
                </>
              ) : (
                <>
              <div className="kpi-grid">
                <div className="kpi gold"><div className="kl">Receita Total (Obras)</div><div className="kv">${totalRevenue.toLocaleString()}</div><div className="kc">Dos contratos assinados</div></div>
                <div className="kpi blue"><div className="kl">Leads Ativos</div><div className="kv">{activeLeadsCount}</div><div className="kc">Total no painel</div></div>
                <div className="kpi green"><div className="kl">Obras em andamento</div><div className="kv">{activeProjectsCount}</div><div className="kc">Em execução</div></div>
                <div className="kpi red"><div className="kl">Visitas (Agendamentos)</div><div className="kv">{schedulingLeadsCount}</div><div className="kc">{schedulingLeadsCount > 0 ? 'Leads agendados' : 'Nenhuma no momento'}</div></div>
              </div>
              <div className="g2">
                <div className="card">
                  <div className="ch"><span className="ct">Receita Mensal {currentYear}</span></div>
                  <div className="cb" style={{ height: '160px', padding: '10px 18px' }}>
                    <Bar 
                      data={{
                        labels: chartLabels,
                        datasets: [{
                          label: 'Receita ($)',
                          data: monthlyRevenue,
                          backgroundColor: '#C9943A',
                          borderRadius: 4,
                        }]
                      }} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { display: false, grid: { display: false } },
                          x: { grid: { display: false }, ticks: { color: '#9A9690', font: { size: 10, family: 'Inter' } }, border: { display: false } }
                        }
                      }} 
                    />
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><span className="ct">Leads por Fonte</span></div>
                  <div className="cb" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {sourceElements.length > 0 ? sourceElements : (
                       <div style={{fontSize: '0.8rem', color: 'var(--t3)'}}>Nenhum lead com fonte rastreada.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="g2">
                <div className="card">
                  <div className="ch"><span className="ct">Projetos em Andamento</span><span className="ca" onClick={() => setActiveTab('projects')}>Ver todos →</span></div>
                  <div className="cb" style={{padding: 0}}>
                    <table className="tbl">
                      <thead><tr><th>Cliente</th><th>Parceiro</th><th>Progresso</th><th>Entrega</th></tr></thead>
                      <tbody>
                        {projects.length === 0 && !loadingDb && (
                          <tr><td colSpan={4} className="u-empty-state">Nenhum projeto encontrado.</td></tr>
                        )}
                        {projects.slice(0, 3).map((p: any) => (
                          <tr key={p.id} className="u-cursor-pointer" onClick={() => setActiveTab('projects')}>
                            <td><div style={{fontWeight:600}}>{p.name || 'Projeto sem nome'}</div><div style={{fontSize:'0.72rem',color:'var(--t2)'}}>{p.service_type || 'Serviço'} · ${p.contract_value || '0'}</div></td>
                            <td><div className="av p1" style={{width:'24px',height:'24px',fontSize:'0.6rem'}}>MR</div></td>
                            <td style={{width:'90px'}}><div className="prog-bar"><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div><div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--gold)',marginTop:'3px'}}>{p.progress || 0}%</div></td>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--orange)'}}>{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/D'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><span className="ct">Atividade Recente</span></div>
                  <div className="cb" style={{padding:'0 18px'}}>
                    {/* Render recent leads dynamically */}
                    {leads.slice(0, 3).map((l: any, i: number) => (
                      <div className="log-item" key={l.id || i}>
                        <div className="log-date">{i === 0 ? 'AGORA' : new Date(l.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="log-text">Novo lead • <strong>{l.clients?.name || l.name || 'Desconhecido'}</strong> via {l.source || 'Manual'} — {l.service_type} {l.estimated_value ? `$${l.estimated_value}` : ''}</div>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <>
                        <div className="log-item"><div className="log-date">AGORA</div><div className="log-text">Marcus enviou <strong>3 fotos</strong> do Johnson Kitchen — Etapa 4</div></div>
                        <div className="log-item"><div className="log-date">09:45</div><div className="log-text">Carlos atualizou etapa 3 do Webb Bathroom — Concluído ✓</div></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div className="page active">
               <div style={{marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                 <div>
                   <div style={{fontSize:'0.62rem',color:'var(--t3)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'3px'}}>{activeLeadsCount} leads ativos</div>
                   <div style={{fontWeight:700,fontSize:'1.05rem'}}>Pipeline de Leads</div>
                 </div>
                 <button className="btn gold" onClick={() => setIsNewLeadOpen(true)}>+ Novo Lead</button>
               </div>
                <div className="kanban">
                  {['new', 'contacted', 'scheduling', 'proposal', 'closed'].map(statusGroup => {
                    const statusTitles: Record<string, string> = {
                      'new': 'Novos',
                      'contacted': 'Em Contato',
                      'scheduling': 'Agendamento / Visita',
                      'proposal': 'Proposta',
                      'closed': 'Fechados ✓'
                    };
                    const colLeads = leads.filter(l => l.status === statusGroup);
                    return (
                      <div 
                        className="kol" 
                        key={statusGroup}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, statusGroup)}
                      >
                        <div className="kol-h">
                          {statusTitles[statusGroup]}
                          <span className="kol-n" style={statusGroup === 'closed' ? {background:'var(--green)',color:'#fff'} : {}}>{colLeads.length}</span>
                        </div>
                        {colLeads.map((l: any) => (
                          <div 
                            className="lead-c" 
                            draggable 
                            key={l.id}
                            onDragStart={(e) => handleDragStart(e, l.id)}
                            onClick={() => setSelectedLead(l)}
                          >
                            <div className="lc-name">{l.clients?.name || l.name || 'Lead s/ Nome'}</div>
                            <div className="lc-srv">{l.service_type || 'Serviço G'} · {l.city || 'Local ND'}</div>
                            <div className="lc-foot">
                              <span className="lc-val">{l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : 'Valor tbd'}</span>
                              {l.urgency === 'hot' && <span className="urg hot" style={{background:'rgba(231,76,60,0.15)',color:'var(--red)'}}>QUENTE</span>}
                              {l.urgency === 'warm' && <span className="urg warm" style={{background:'rgba(230,126,34,0.15)',color:'var(--orange)'}}>MORNO</span>}
                              {l.urgency === 'cool' && <span className="urg cool" style={{background:'rgba(52,152,219,0.15)',color:'var(--blue)'}}>FRIO</span>}
                            </div>
                          </div>
                        ))}
                        {colLeads.length === 0 && <div className="empty-state" style={{fontSize: '0.8rem', padding: '10px'}}>Vazio</div>}
                      </div>
                    );
                  })}
                </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div className="page active">
              <div className="u-section-header">
                 <div className="u-syne-title">Projetos Ativos — Visão Admin</div>
                 <button className="btn gold" onClick={handleCreateProject}>Novo Projeto</button>
              </div>
              <div className="card">
                <div className="cb u-p-0">
                  <table className="tbl">
                    <thead><tr><th>Cliente</th><th>Serviço</th><th>Valor</th><th>Progresso</th><th>Status</th><th style={{textAlign:'center'}}>Ação</th></tr></thead>
                    <tbody>
                      {projects.length === 0 && !loadingDb && (
                        <tr><td colSpan={6} className="u-empty-state">Nenhum projeto em andamento.</td></tr>
                      )}
                      {projects.map((p: any) => (
                        <tr key={p.id}>
                          <td><b>{p.name || 'Projeto'}</b></td>
                          <td>{p.service_type || 'Serviço'}</td>
                          <td className="u-text-gold">${p.contract_value || '0'}</td>
                          <td><div className="prog-bar" style={{width:'80px'}}><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div><div style={{fontSize:'.65rem',color:'var(--t2)',marginTop:'3px'}}>{p.progress || 0}%</div></td>
                          <td><span className={`status-b ${p.status === 'active' ? 'sb-active' : ''}`}>{p.status || 'ND'}</span></td>
                          <td>
                            <div style={{display:'flex',gap:'12px',justifyContent:'center',alignItems:'center'}}>
                              <button className="btn ghost u-btn-pill" onClick={() => {
                                setNewProjectForm({ name: p.name || '', service_type: p.service_type || '', contract_value: String(p.contract_value || ''), deadline: p.deadline || '', start_date: (p as any).start_date || '', client_id: (p as any).client_id || '' });
                                setEditingProjectId(p.id);
                                setIsNewProjectOpen(true);
                              }}>✏️ Editar</button>
                              <button className="btn ghost" style={{padding:'4px 10px',fontSize:'.7rem',color:'var(--red)'}} onClick={async () => {
                                showConfirm(`Deseja excluir o projeto "${p.name}"?`, async () => {
                                  const { error } = await supabase.from('projects').delete().eq('id', p.id);
                                  if (error) { showToast('Erro: ' + error.message); return; }
                                  setProjects(prev => prev.filter(x => x.id !== p.id));
                                  showToast('Projeto excluído com sucesso!');
                                });
                              }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <CalendarTab
              handleGoogleSync={handleGoogleSync}
              setEventForm={setEventForm}
              setIsEventModalOpen={setIsEventModalOpen}
              mapEventsForCalendar={mapEventsForCalendar}
              handleEventDrop={handleEventDrop}
              handleEventClick={handleEventClick}
            />
          )}

          {/* PARTNERS TAB */}
          {activeTab === 'partners' && (
            <PartnersTab
              partners={partners}
              projects={projects}
              loadingDb={loadingDb}
              setIsPartnerOpen={setIsPartnerOpen}
              setSelectedPartner={setSelectedPartner}
            />
          )}

          {/* ALL LEADS TAB */}
          {activeTab === 'allleads' && (
            <div className="page active">
              <div className="u-section-header">
                <div className="u-syne-title">Todos os Leads</div>
                <button className="btn gold" onClick={() => setIsNewLeadOpen(true)}>+ Novo Lead</button>
              </div>
              <div className="card">
                <div className="cb u-p-0">
                  <table className="tbl">
                    <thead><tr><th>Lead / Cliente</th><th>Serviço / Cidade</th><th>Valor</th><th>Temperatura</th><th>Status</th><th>Criado em</th><th></th></tr></thead>
                    <tbody>
                      {leads.map(l => (
                        <tr key={l.id} className="u-cursor-pointer" onClick={() => setSelectedLead(l)}>
                          <td><b>{l.clients?.name || l.name || 'Lead s/ Nome'}</b></td>
                          <td>{l.service_type} • {l.city}</td>
                          <td className="u-text-gold">${l.estimated_value || 'N/D'}</td>
                          <td>
                            {l.urgency === 'hot' && <span className="urg hot">QUENTE</span>}
                            {l.urgency === 'warm' && <span className="urg warm">MORNO</span>}
                            {l.urgency === 'cool' && <span className="urg cool">FRIO</span>}
                          </td>
                          <td><span className="status-b sb-draft">{l.status}</span></td>
                          <td><div style={{fontSize:'0.75rem',color:'var(--text)'}}>{new Date(l.created_at || '').toLocaleDateString('pt-BR')}<br/><span style={{color:'var(--t2)'}}>{new Date(l.created_at || '').toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</span></div></td>
                          <td onClick={e => e.stopPropagation()}>
                            <button className="btn ghost" style={{padding:'4px 8px',fontSize:'.85rem',color:'var(--red)'}} onClick={async () => {
                              showConfirm(`Deseja excluir o lead "${l.clients?.name || l.name}"?`, async () => {
                                const { error } = await supabase.from('leads').delete().eq('id', l.id);
                                if (error) { showToast('Erro: ' + error.message); return; }
                                setLeads(prev => prev.filter(x => x.id !== l.id));
                                showToast('Lead excluído com sucesso!');
                              });
                            }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LANDING PAGES TAB */}
          {activeTab === 'lp' && (
            <div className="page active">
              <div className="u-section-header">
                <div className="u-syne-title">Landing Pages</div>
                <button className="btn gold" onClick={() => setIsLPOpen(true)}>+ Nova LP</button>
              </div>
              <div className="card">
                <div className="cb u-p-0">
                  <table className="tbl">
                    <thead><tr><th style={{width:'18%'}}>Página (Cidade)</th><th style={{width:'12%'}}>Status</th><th style={{width:'14%'}}>Visitantes</th><th style={{width:'14%'}}>Leads Gerados</th><th style={{width:'14%'}}>Conversão</th><th style={{width:'28%',textAlign:'center'}}>Ação</th></tr></thead>
                    <tbody>
                      {landingPages.length === 0 && !loadingDb && <tr><td colSpan={6} className="u-empty-state">Nenhuma LP encontrada.</td></tr>}
                      {landingPages.map(lp => {
                        const convRate = (lp.visitors ?? 0) > 0 ? Math.round(((lp.leads_count ?? 0) / (lp.visitors ?? 1)) * 100) : 0;
                        return (
                          <tr key={lp.id}>
                            <td><b>{lp.name}</b><div style={{fontSize:'0.7rem',color:'var(--t2)'}}>{lp.city}</div></td>
                            <td><span className={`status-b ${lp.status === 'live' ? 'sb-live' : 'sb-draft'}`} style={{cursor: 'pointer'}} title="Clique para alternar o status" onClick={() => toggleLPStatus(lp)}>{(lp.status || 'draft').toUpperCase()}</span></td>
                            <td>{lp.visitors}</td>
                            <td>{lp.leads_count}</td>
                            <td><div style={{fontFamily:"'DM Mono',monospace",color:'var(--green)'}}>{convRate}%</div></td>
                            <td>
                              <div style={{display:'flex', gap:'12px', justifyContent:'center', alignItems:'center'}}>
                                <button className="btn ghost" style={{padding:'6px 14px',fontSize:'.75rem'}} onClick={() => {
                                  navigator.clipboard.writeText(`https://bravohomes.com/lp/${(lp.city || '').toLowerCase().replace(/\\s+/g, '-')}`);
                                  showToast('Link da LP copiado para a área de transferência!');
                                }}>Link</button>
                                <button className="btn ghost" style={{padding:'6px 14px',fontSize:'.75rem'}} onClick={() => showToast('Construtor visual de LP em breve!')}>Editar</button>
                                <button className="btn ghost" style={{padding:'6px 14px',fontSize:'.95rem',color:'var(--red)'}} onClick={async () => {
                                  showConfirm(`Deseja excluir a LP "${lp.name}"?`, async () => {
                                    const { error } = await supabase.from('landing_pages').delete().eq('id', lp.id);
                                    if (error) { showToast('Erro: ' + error.message); return; }
                                    setLandingPages(prev => prev.filter(x => x.id !== lp.id));
                                    showToast('Landing Page excluída com sucesso!');
                                  });
                                }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CLIENTS TAB */}
          {activeTab === 'clients' && (
            <ClientsTab
              clients={clients}
              loadingDb={loadingDb}
              setIsNewLeadOpen={setIsNewLeadOpen}
              showToast={showToast}
              handleDeleteClient={handleDeleteClient}
            />
          )}

          {/* SOCIAL MEDIA TAB */}
          {activeTab === 'social' && (
            <SocialMediaTab
              socialAccounts={socialAccounts}
              socialPosts={socialPosts}
              socialPostForm={socialPostForm}
              setSocialPostForm={setSocialPostForm}
              socialPosting={socialPosting}
              handleSocialPublish={handleSocialPublish}
              handleFbConnect={handleFbConnect}
            />
          )}

          {/* FINANCES TAB */}
          {activeTab === 'finances' && (
            <div className="page active">
              <div style={{marginBottom:16}}><div className="u-syne-title">Financeiro</div></div>
              <div className="g3">
                 <div className="kpi"><div className="kl">Faturamento Bruto</div><div className="kv u-text-gold">${grossRevenue.toLocaleString(undefined, {maximumFractionDigits:0})}</div></div>
                 <div className="kpi"><div className="kl">A Receber</div><div className="kv">${toReceive.toLocaleString(undefined, {maximumFractionDigits:0})}</div></div>
                 <div className="kpi"><div className="kl">Pago aos Parceiros</div><div className="kv">${paidToPartners.toLocaleString(undefined, {maximumFractionDigits:0})}</div></div>
              </div>
              <div className="card">
                <div className="ch"><span className="ct">Últimos Pagamentos</span></div>
                <div className="cb empty-state">O módulo financeiro está sincronizando com sua conta Stripe/Banco.</div>
              </div>
            </div>
          )}

           {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <SettingsTab
              t={t} userProfile={userProfile} user={user}
              adminName={adminName} setAdminName={setAdminName}
              adminEmail={adminEmail} setAdminEmail={setAdminEmail}
              adminPhone={adminPhone} setAdminPhone={setAdminPhone}
              handleProfileSave={handleProfileSave}
              handleAvatarUpload={handleAvatarUpload}
              isUploadingAvatar={isUploadingAvatar}
              showToast={showToast} showConfirm={showConfirm}
              notifPrefs={notifPrefs} toggleNotifPref={toggleNotifPref}
              lang={lang} setLang={setLang}
            />
          )}

          {/* ADMINCHAT TAB */}
          {activeTab === 'adminchat' && (
            <ChatPanel
              chatPartners={chatPartners}
              selectedChatUser={selectedChatUser}
              setSelectedChatUser={setSelectedChatUser}
              messages={messages}
              setMessages={setMessages}
              setAllChatMessages={setAllChatMessages}
              user={user}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              renderMessageContent={renderMessageContent}
              messagesEndRef={messagesEndRef}
              showToast={showToast}
              showConfirm={showConfirm}
              isRecording={isRecording}
              recordingTime={recordingTime}
              formatTime={formatTime}
              cancelRecording={cancelRecording}
              stopRecordingAndSend={stopRecordingAndSend}
              startRecording={startRecording}
              isUploading={isUploading}
              handleFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              supabase={supabase}
            />
          )}

        </div>
      </div>

      {/* LEAD DETALHES MODAL */}
      <div className={`modal-overlay ${selectedLead ? 'open' : ''}`} onClick={() => setSelectedLead(null)}>
        {selectedLead && (
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head" style={{alignItems: 'flex-start', paddingTop: '20px'}}>
              <div style={{width: '100%', marginRight: '30px'}}>
                <div style={{fontSize: '0.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'}}>Nome Completo</div>
                <input 
                  type="text"
                  className="modal-title"
                  style={{background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', outline: 'none', borderBottom: '1px dashed var(--t3)', width: '100%', textOverflow: 'ellipsis', paddingBottom: '4px', margin: 0}}
                  value={selectedLead.name ?? selectedLead.clients?.name ?? ''}
                  onChange={e => setSelectedLead({...selectedLead, name: e.target.value})}
                  onBlur={async () => {
                     if (selectedLead.name !== undefined) {
                        await updateLead(selectedLead.id, { name: selectedLead.name });
                     }
                  }}
                  placeholder="Nome do Lead / Cliente"
                  title="Clique para editar o nome"
                />
              </div>
              <button className="dclose" aria-label="Fechar" style={{marginTop: '-8px'}} onClick={() => setSelectedLead(null)}>✕</button>
            </div>
            <div className="modal-body" style={{display: 'flex', gap: '20px'}}>
              <div className="u-flex-1">
                <div className="d-row">
                  <div className="dfield"><div className="dlabel">Serviço</div><div className="dval">{selectedLead.service_type || 'N/D'}</div></div>
                  <div className="dfield"><div className="dlabel">Local</div><div className="dval">{selectedLead.city || 'N/D'}</div></div>
                  <div className="dfield">
                    <div className="dlabel">Valor Est.</div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                      <span className="dval big u-text-gold">$</span>
                      <input 
                        type="number"
                        className="dval big" 
                        title="Clique para editar o valor"
                        style={{color: 'var(--gold)', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--t3)', width: '100px', outline: 'none', padding: 0}}
                        value={selectedLead.estimated_value || ''}
                        onChange={e => setSelectedLead({...selectedLead, estimated_value: e.target.value ? parseFloat(e.target.value) : undefined})}
                        onBlur={async () => {
                           const val = parseFloat(String(selectedLead.estimated_value ?? ''));
                           if (!isNaN(val)) await updateLead(selectedLead.id, { estimated_value: val });
                        }}
                        placeholder="N/D"
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{marginTop: '20px'}}>
                  <div className="dlabel">Ações / Mudar Fase</div>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px'}}>
                    <select className="f-inp" style={{width: 'auto'}} value={selectedLead.status} onChange={(e) => updateLead(selectedLead.id, {status: e.target.value})}>
                      <option value="new">Nova / Recebida</option>
                      <option value="contacted">Em Contato</option>
                      <option value="scheduling">Agendamento de Vistoria</option>
                      <option value="proposal">Proposta Enviada</option>
                      <option value="closed">Fechado ✓</option>
                    </select>

                    <button className="btn ghost" style={selectedLead.urgency === 'hot' ? {background:'rgba(201,148,58,0.15)',borderColor:'var(--gold)'} : {}} onClick={() => updateLead(selectedLead.id, {urgency: 'hot'})}>🔥 Quente</button>
                    <button className="btn ghost" style={selectedLead.urgency === 'warm' ? {background:'rgba(201,148,58,0.15)',borderColor:'var(--gold)'} : {}} onClick={() => updateLead(selectedLead.id, {urgency: 'warm'})}>☀️ Morno</button>
                    <button className="btn ghost" style={selectedLead.urgency === 'cool' ? {background:'rgba(201,148,58,0.15)',borderColor:'var(--gold)'} : {}} onClick={() => updateLead(selectedLead.id, {urgency: 'cool'})}>❄️ Frio</button>
                  </div>
                </div>

                <div style={{marginTop: '20px', background: 'var(--bg3)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem'}}>
                  <label className="dlabel">Histórico / Notas Internas</label>
                  
                  <div style={{display:'flex',gap:'8px', alignItems:'flex-start', marginBottom:'12px'}}>
                    <textarea className="f-inp" placeholder="Adicionar nova nota..." value={notesInput} onChange={e => setNotesInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNotesSave(); } }} style={{resize: 'vertical', minHeight: '44px', paddingTop: '10px'}} />
                    <button className="btn gold" onClick={handleNotesSave} style={{alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px'}}>Gravar</button>
                  </div>

                  <div style={{maxHeight: '200px', overflowY: 'auto', paddingRight: '4px'}}>
                    {localNotes.length === 0 ? (
                      <div style={{color:'var(--t3)', fontStyle:'italic', fontSize:'0.75rem'}}>Nenhum histórico registrado.</div>
                    ) : (
                      localNotes.map((note, idx) => (
                        <div key={note.id} style={{marginBottom: '6px', background: 'var(--bg2)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--b)', position:'relative'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2px'}}>
                            {note.date && <div style={{fontSize: '0.6rem', color: 'var(--gold)', fontWeight:700}}>{note.date}</div>}
                            <button title="Excluir nota" onClick={() => {
                              const newNotes = localNotes.filter((_: any, i: number) => i !== idx);
                              setLocalNotes(newNotes);
                              saveLocalNotes(newNotes);
                            }} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',fontSize:'0.7rem',padding:'0 2px',lineHeight:1,opacity:0.6,transition:'opacity .2s'}}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                            >🗑️</button>
                          </div>
                          <textarea 
                            className="f-inp"
                            style={{minHeight: '28px', height: 'auto', resize: 'none', width: '100%', background: 'transparent', border: 'none', padding: 0, color: 'var(--text)', outline: 'none', fontSize: '0.75rem'}}
                            value={note.text}
                            onChange={(e) => {
                              const newNotes = [...localNotes];
                              newNotes[idx].text = e.target.value;
                              setLocalNotes(newNotes);
                            }}
                            onBlur={() => saveLocalNotes(localNotes)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div style={{width: '220px', flexShrink: 0, paddingLeft: '16px', borderLeft: '1px solid var(--b)'}}>
                {partners.length > 0 && (<>
                <div className="dlabel">Atribuir a Parceiro(s)</div>
                <div style={{marginTop:'6px', marginBottom:'12px'}}>
                    {partners.map((p: any) => {
                      const assignedList: string[] = selectedLead.assigned_partners || [];
                      const isAssigned = assignedList.includes(p.id);
                      return (
                        <div key={p.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',borderRadius:'6px',marginBottom:'4px',cursor:'pointer',background: isAssigned ? 'rgba(201,148,58,0.15)' : 'transparent',border: isAssigned ? '1px solid var(--gold)' : '1px solid var(--b)',transition:'all .2s'}}
                          onClick={async () => {
                            const newList = isAssigned ? assignedList.filter((id: string) => id !== p.id) : [...assignedList, p.id];
                            setSelectedLead({...selectedLead, assigned_partners: newList});
                            await updateLead(selectedLead.id, { assigned_partners: newList });

                            // Notify the partner when assigned
                            if (!isAssigned) {
                              const leadName = selectedLead.clients?.name || selectedLead.name || 'Novo Lead';
                              await supabase.from('notifications').insert({
                                user_id: p.id,
                                title: '🎯 Novo Lead atribuído a você!',
                                body: `${leadName} — ${selectedLead.service_type || ''} — ${selectedLead.city || ''} — $${(selectedLead as any).estimated_value || '?'}`,
                                type: 'lead_assigned',
                                link: '/partner'
                              });
                            }

                            // When assigning a partner: create Client if not yet created
                            if (!isAssigned && !selectedLead.client_id) {
                              const { data: newClient } = await supabase.from('clients').insert({
                                name: selectedLead.clients?.name || selectedLead.name || 'Unknown',
                                email: (selectedLead as any).email || '',
                                phone: (selectedLead as any).phone || '',
                                city: selectedLead.city || '',
                                state: 'GA'
                              }).select().single();
                              if (newClient) {
                                await updateLead(selectedLead.id, { client_id: newClient.id });
                                setSelectedLead({...selectedLead, assigned_partners: newList, client_id: newClient.id, clients: newClient});
                                setClients(prev => [...prev, newClient]);
                                showToast('Lead promovido a Cliente!');
                              }
                            }
                          }}
                        >
                          <div style={{width:14,height:14,borderRadius:3,border: isAssigned ? '2px solid var(--gold)' : '2px solid var(--b2)',background: isAssigned ? 'var(--gold)' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.6rem',color:'#000',flexShrink:0}}>
                            {isAssigned && '✓'}
                          </div>
                          <div style={{fontSize:'0.78rem',fontWeight: isAssigned ? 600 : 400,color: isAssigned ? 'var(--gold)' : 'var(--text)'}}>👷 {p.full_name || p.name || 'Parceiro'}</div>
                        </div>
                      );
                    })}
                </div>
                </>)}
                
                <div className="dlabel" style={{marginTop: '20px'}}>Outras Ações</div>
                    <button className="btn ghost" style={{width: '100%', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'}} onClick={() => {
                        const leadName = selectedLead.clients?.name || selectedLead.name || 'Desconhecido';
                        setEventForm({ lead_id: selectedLead.id, date: '', time: '00:00', title: `Vistoria: ${leadName}` });
                        setIsEventModalOpen(true);
                    }}>
                      🗓️ Agendar Vistoria
                    </button>
                    <button className="btn" style={{background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--red)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={() => {
                      showConfirm('Certeza que deseja descartar este lead?', () => {
                        updateLead(selectedLead.id, { status: 'lost' });
                        setSelectedLead(null);
                      });
                    }}>
                      Descartar Lead
                    </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EVENT MODAL */}
      {isEventModalOpen && (
        <div className="modal-overlay open" onClick={() => setIsEventModalOpen(false)}>
          <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{eventForm.lead_id && selectedLead ? `Agendar Vistoria: ${selectedLead.clients?.name || selectedLead.name}` : 'Criar Novo Agendamento'}</div>
              <button className="dclose" aria-label="Fechar" onClick={() => setIsEventModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEventSubmit}>
              <div className="modal-body">
                {(!eventForm.lead_id || !selectedLead) && (
                  <div className="f-row u-mb-15">
                    <div className="u-w-full">
                      <label className="f-label">Selecionar Lead / Cliente *</label>
                      <select required className="f-inp" value={eventForm.lead_id} onChange={e => setEventForm({...eventForm, lead_id: e.target.value})}>
                        <option value="">-- Selecione o Lead --</option>
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.clients?.name || l.name} ({l.service_type})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <div className="f-row">
                  <div>
                    <label className="f-label">Data *</label>
                    <input required type="date" className="f-inp" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} onClick={(e) => { try { 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker() } catch(err){} }} />
                  </div>
                  <div>
                    <label className="f-label">Horário *</label>
                    <input required type="time" className="f-inp" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} onClick={(e) => { try { 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker() } catch(err){} }} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn ghost" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn gold">Confirmar Agendamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="modal-overlay open" onClick={() => setEditingEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '420px'}}>
            <div className="modal-head">
              <div className="modal-title">Editar Agendamento</div>
              <span className="modal-close" onClick={() => setEditingEvent(null)}>×</span>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:'12px'}}>
                <label className="f-label">Título</label>
                <input type="text" className="f-inp" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} />
              </div>
              <div className="f-row">
                <div>
                  <label className="f-label">Data *</label>
                  <input required type="date" className="f-inp" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} onClick={(e) => { try { 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker() } catch(err){} }} />
                </div>
                <div>
                  <label className="f-label">Horário *</label>
                  <input required type="time" className="f-inp" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} onClick={(e) => { try { 'showPicker' in e.target && (e.target as HTMLInputElement).showPicker() } catch(err){} }} />
                </div>
              </div>
            </div>
            <div className="modal-foot" style={{justifyContent:'space-between'}}>
              <button type="button" className="btn" style={{background:'transparent',border:'1px solid rgba(231,76,60,0.5)',color:'var(--red)'}} onClick={handleEditEventDelete}>🗑️ Excluir</button>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" className="btn ghost" onClick={() => setEditingEvent(null)}>Cancelar</button>
                <button type="button" className="btn gold" onClick={handleEditEventSave}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LP MODAL */}
      {isLPOpen && (
        <div className="modal-overlay open" onClick={() => setIsLPOpen(false)}>
          <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Nova Landing Page</div>
              <button className="dclose" aria-label="Fechar" onClick={() => setIsLPOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleLPSubmit}>
              <div className="modal-body">
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">Serviço / Nome da Página *</label>
                    <input required type="text" className="f-inp" placeholder="Ex: Kitchen Remodel" value={lpForm.name} onChange={e => setLpForm({...lpForm, name: e.target.value})} />
                  </div>
                </div>
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">Cidade / Região Alvo *</label>
                    <input required type="text" className="f-inp" placeholder="Ex: Alpharetta" value={lpForm.city} onChange={e => setLpForm({...lpForm, city: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn ghost" onClick={() => setIsLPOpen(false)}>Cancelar</button>
                <button type="submit" className="btn gold">Criar Página</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTNER MODAL */}
      {isPartnerOpen && (
        <div className="modal-overlay open" onClick={() => setIsPartnerOpen(false)}>
          <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Novo Parceiro / Contratado</div>
              <button className="dclose" aria-label="Fechar" onClick={() => setIsPartnerOpen(false)}>✕</button>
            </div>
            <form onSubmit={handlePartnerSubmit}>
              <div className="modal-body">
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">Nome da Empresa ou Profissional *</label>
                    <input required type="text" className="f-inp" placeholder="Ex: Obras Rápidas LLC" value={partnerForm.name} onChange={e => setPartnerForm({...partnerForm, name: e.target.value})} />
                  </div>
                </div>
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">E-mail do Parceiro *</label>
                    <input type="email" className="f-inp" placeholder="parceiro@email.com" value={partnerForm.email} onChange={e => setPartnerForm({...partnerForm, email: e.target.value})} required />
                  </div>
                </div>
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">Senha de Acesso *</label>
                    <input type="password" className="f-inp" placeholder="Mínimo 6 caracteres" value={partnerForm.password} onChange={e => setPartnerForm({...partnerForm, password: e.target.value})} required />
                  </div>
                </div>
                <div className="f-row">
                  <div style={{width: '50%'}}>
                    <label className="f-label">Especialidade</label>
                    <input type="text" className="f-inp" placeholder="Ex: Piso, Geral" value={partnerForm.specialty} onChange={e => setPartnerForm({...partnerForm, specialty: e.target.value})} />
                  </div>
                  <div style={{width: '50%'}}>
                    <label className="f-label">Telefone</label>
                    <input type="text" className="f-inp" placeholder="(000) 000-0000" value={partnerForm.phone} onChange={e => setPartnerForm({...partnerForm, phone: e.target.value})} />
                  </div>
                </div>
                <div className="f-row">
                  <div className="u-w-full">
                    <label className="f-label">Local de Atuação (Cidade)</label>
                    <input type="text" className="f-inp" placeholder="Ex: Marietta, GA" value={partnerForm.city} onChange={e => setPartnerForm({...partnerForm, city: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn ghost" onClick={() => setIsPartnerOpen(false)}>Cancelar</button>
                <button type="submit" className="btn gold">Adicionar Parceiro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTNER DETALHES MODAL - EDITABLE */}
      <div className={`modal-overlay ${selectedPartner ? 'open' : ''}`} onClick={() => { setSelectedPartner(null); setEditPartner(null); }}>
        {selectedPartner && (
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '520px'}}>
            <div className="modal-head">
              <div className="modal-title">Perfil do Parceiro</div>
              <button className="dclose" aria-label="Fechar" onClick={() => { setSelectedPartner(null); setEditPartner(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                <div style={{width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold'}}>
                  {(selectedPartner.name || selectedPartner.full_name || 'PA').substring(0,2).toUpperCase()}
                </div>
                <div className="u-flex-1">
                  <h2 style={{margin: 0, fontSize: '1.2rem', color: 'var(--gold)'}}>{selectedPartner.name || selectedPartner.full_name || 'Sem nome'}</h2>
                  <div style={{color: 'var(--t2)', fontSize: '0.9rem'}}>{selectedPartner.specialty || 'Empreiteiro Geral'}</div>
                </div>
                {!editPartner && <button className="btn ghost" style={{fontSize:'0.75rem',padding:'6px 12px'}} onClick={() => setEditPartner({...selectedPartner})}>✏️ Editar</button>}
              </div>
              
              {editPartner ? (
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  <div className="f-row u-flex-gap-10">
                    <div className="u-flex-1">
                      <label className="f-label">Nome *</label>
                      <input className="f-inp" value={editPartner.full_name || ''} onChange={e => setEditPartner({...editPartner, full_name: e.target.value})} />
                    </div>
                  </div>
                  <div className="f-row u-flex-gap-10">
                    <div className="u-flex-1">
                      <label className="f-label">Telefone</label>
                      <input className="f-inp" placeholder="(000) 000-0000" value={editPartner.phone || ''} onChange={e => setEditPartner({...editPartner, phone: e.target.value})} />
                    </div>
                    <div className="u-flex-1">
                      <label className="f-label">Atuação (Cidade)</label>
                      <input className="f-inp" placeholder="Ex: Marietta, GA" value={editPartner.city || ''} onChange={e => setEditPartner({...editPartner, city: e.target.value})} />
                    </div>
                  </div>
                  <div className="f-row u-flex-gap-10">
                    <div className="u-flex-1">
                      <label className="f-label">Especialidade</label>
                      <input className="f-inp" placeholder="Ex: Piso, Elétrica" value={editPartner.specialty || ''} onChange={e => setEditPartner({...editPartner, specialty: e.target.value})} />
                    </div>
                    <div className="u-flex-1">
                      <label className="f-label">Status</label>
                      <select className="f-inp" value={editPartner.state || 'available'} onChange={e => setEditPartner({...editPartner, state: e.target.value})}>
                        <option value="available">Disponível</option>
                        <option value="busy">Em Projeto</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="d-row">
                    <div className="dfield"><div className="dlabel">Telefone</div><div className="dval">{selectedPartner.phone || 'N/D'}</div></div>
                    <div className="dfield"><div className="dlabel">Atuação</div><div className="dval">{selectedPartner.city || 'Georgia'}</div></div>
                  </div>
                  <div className="d-row" style={{marginTop:'10px'}}>
                    <div className="dfield"><div className="dlabel">Especialidade</div><div className="dval">{selectedPartner.specialty || 'Empreiteiro Geral'}</div></div>
                    <div className="dfield"><div className="dlabel">Status</div><div className="dval">{{
                      available: 'Disponível', busy: 'Em Projeto', inactive: 'Inativo'
                    }[selectedPartner.state as string] || 'Disponível'}</div></div>
                  </div>
                </>
              )}
              
              <div className="dlabel" style={{marginTop: '20px', marginBottom: '10px'}}>Projetos Atribuídos</div>
              {projects.filter(p => p.partner_id === selectedPartner.id).length > 0 ? (
                 <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                   {projects.filter(p => p.partner_id === selectedPartner.id).map(p => (
                     <li key={p.id} style={{padding: '10px', background: 'var(--bg3)', borderRadius: '6px', marginBottom: '8px', fontSize: '0.85rem'}}>
                        <b>{p.name}</b> • {p.status}
                     </li>
                   ))}
                 </ul>
              ) : (
                 <div style={{color: 'var(--t3)', fontSize: '0.85rem', fontStyle: 'italic'}}>Nenhum projeto associado no momento.</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn" style={{background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', color: 'var(--red)'}} onClick={() => {
                 showConfirm('Excluir este parceiro?', async () => {
                    await supabase.from('profiles').delete().eq('id', selectedPartner.id);
                    setPartners(prev => prev.filter(p => p.id !== selectedPartner.id));
                    setSelectedPartner(null);
                    setEditPartner(null);
                 });
              }}>Remover Parceiro</button>
              {editPartner ? (
                <div style={{display:'flex',gap:'8px',marginLeft:'auto'}}>
                  <button className="btn ghost" onClick={() => setEditPartner(null)}>Cancelar</button>
                  <button className="btn gold" onClick={async () => {
                    const { error } = await supabase.from('profiles').update({
                      full_name: editPartner.full_name || editPartner.name,
                      phone: editPartner.phone || null,
                      city: editPartner.city || null,
                      specialty: editPartner.specialty || null,
                      state: editPartner.state || 'available'
                    }).eq('id', selectedPartner.id);
                    if (error) { showToast('Erro: ' + error.message); return; }
                    const updated = {...selectedPartner, ...editPartner};
                    setPartners(prev => prev.map(p => p.id === selectedPartner.id ? updated : p));
                    setSelectedPartner(updated);
                    setEditPartner(null);
                    showToast('Parceiro atualizado!');
                  }}>Salvar</button>
                </div>
              ) : (
                <button className="btn ghost" style={{marginLeft:'auto'}} onClick={() => { setSelectedPartner(null); setEditPartner(null); }}>Fechar</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* NEW LEAD MODAL */}
      {isNewLeadOpen && (
        <div className="modal-overlay open" onClick={() => setIsNewLeadOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
            <div className="modal-head">
              <div className="modal-title">Cadastrar Novo Lead Manual</div>
              <button className="dclose" aria-label="Fechar" onClick={() => setIsNewLeadOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleNewLeadSubmit}>
              <div className="modal-body">
                <div className="f-row">
                  <div><label className="f-label">Nome Completo do Cliente *</label><input required type="text" className="f-inp" placeholder="Ex: John Smith" value={newLeadForm.name} onChange={e => setNewLeadForm({...newLeadForm, name: e.target.value})} /></div>
                  <div><label className="f-label">Cidade *</label><input required type="text" className="f-inp" placeholder="Ex: Marietta" value={newLeadForm.city} onChange={e => setNewLeadForm({...newLeadForm, city: e.target.value})} /></div>
                </div>
                <div className="f-row">
                  <div><label className="f-label">Telefone</label><input type="text" className="f-inp" placeholder="(000) 000-0000" value={newLeadForm.phone} onChange={e => setNewLeadForm({...newLeadForm, phone: e.target.value})} /></div>
                  <div><label className="f-label">Email</label><input type="email" className="f-inp" placeholder="john@email.com" value={newLeadForm.email} onChange={e => setNewLeadForm({...newLeadForm, email: e.target.value})} /></div>
                </div>
                <div className="f-row">
                  <div>
                    <label className="f-label">Tipo de Serviço *</label>
                    <select className="f-inp" value={newLeadForm.service_type} onChange={e => setNewLeadForm({...newLeadForm, service_type: e.target.value})}>
                      <option value="Bathroom Remodel">Bathroom Remodel</option>
                      <option value="Kitchen Remodel">Kitchen Remodel</option>
                      <option value="Basement Finishing">Basement Finishing</option>
                      <option value="Custom Home">Custom Home</option>
                    </select>
                  </div>
                  <div>
                    <label className="f-label">Temperatura Inicial</label>
                    <select className="f-inp" value={newLeadForm.urgency} onChange={e => setNewLeadForm({...newLeadForm, urgency: e.target.value})}>
                      <option value="hot">🔥 Quente</option>
                      <option value="warm">☀️ Morno</option>
                      <option value="cool">❄️ Frio</option>
                    </select>
                  </div>
                </div>
                <div className="f-row">
                  <div>
                    <label className="f-label">Valor Estimado ($)</label>
                    <input type="number" className="f-inp" placeholder="Ex: 35000" value={newLeadForm.estimated_value} onChange={e => setNewLeadForm({...newLeadForm, estimated_value: e.target.value})} />
                  </div>
                  <div>
                    <label className="f-label">Parceiro Responsável</label>
                    <select className="f-inp" value={newLeadForm.partner_id} onChange={e => setNewLeadForm({...newLeadForm, partner_id: e.target.value})}>
                      <option value="">Nenhum (não atribuir)</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email || 'Parceiro'}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn ghost" onClick={() => setIsNewLeadOpen(false)}>Cancelar</button>
                <button type="submit" className="btn gold">Criar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        show={confirmModal.show}
        msg={confirmModal.msg}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
      />

      {/* TOAST CONTAINER — auto-dismissing, non-blocking */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSubmit={submitProjectForm}
        form={newProjectForm}
        setForm={setNewProjectForm}
        editingProjectId={editingProjectId}
        clients={clients}
        projectClientMode={projectClientMode}
        setProjectClientMode={setProjectClientMode}
        newClientName={newClientName}
        setNewClientName={setNewClientName}
      />

    </div>
  );
}
