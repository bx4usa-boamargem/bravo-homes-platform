import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import type { Lead, Partner, Client, CalendarEvent, Message, Profile, EditingEvent, GoogleEvent, ChatPartner } from '../types';
import type { User } from '@supabase/supabase-js';

import SettingsTab from '../components/admin/SettingsTab';
import ChatPanel from '../components/admin/ChatPanel';
import CalendarTab from '../components/admin/CalendarTab';
import PartnersTab from '../components/admin/PartnersTab';
import ClientsTab from '../components/admin/ClientsTab';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminPipelineTab from '../components/admin/AdminPipelineTab';
import AdminAllLeadsTab from '../components/admin/AdminAllLeadsTab';
import AdminProjectsTab from '../components/admin/AdminProjectsTab';
import AdminLandingPagesTab from '../components/admin/AdminLandingPagesTab';
import ToastContainer, { useToast } from '../components/admin/Toast';
import ConfirmModal from '../components/admin/ConfirmModal';
import NewProjectModal from '../components/admin/NewProjectModal';
import NewLeadModal from '../components/admin/NewLeadModal';
import PartnerModal from '../components/admin/PartnerModal';
import EventModal from '../components/admin/EventModal';
import { useAdminProjects, useAdminLeads, useAdminLandingPages, adminKeys } from '../hooks/useAdminQueries';
import { useQueryClient } from '@tanstack/react-query';
import './AdminDashboard.css';
import '../styles/utilities.css';

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
  
  const { data: projects = [] } = useAdminProjects();
  const { data: leads = [] } = useAdminLeads();
  const { data: landingPages = [] } = useAdminLandingPages();
  const activeLeadsCount = leads.length;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  
  // Lead Modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesInput, setNotesInput] = useState('');
  
  // New Lead Modal
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: '', service_type: '', city: '', email: '', phone: '', urgency: '', estimated_value: '', partner_id: '' });

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

  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', service_type: '', contract_value: '', deadline: '', start_date: '', client_id: '' });
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
        queryClient.invalidateQueries({ queryKey: adminKeys.projects() });
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
        queryClient.invalidateQueries({ queryKey: adminKeys.projects() });
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
  const [isGoogleLinked, setIsGoogleLinked] = useState(() => localStorage.getItem('google_calendar_linked') === 'true');

  // --- GOOGLE REST API HANDLERS ---
  const handleGoogleSync = async () => {
    // If already linked, just try to refresh the token from the session
    if (isGoogleLinked) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        localStorage.setItem('google_provider_token', session.provider_token);
        fetchGoogleEvents(session.provider_token);
        showToast('Google Calendar sincronizado!');
      } else {
        const storedToken = localStorage.getItem('google_provider_token');
        if (storedToken) {
          fetchGoogleEvents(storedToken);
          showToast('Google Calendar sincronizado!');
        } else {
          showToast('Sessão expirada, reconectando...');
          localStorage.removeItem('google_calendar_linked');
          setIsGoogleLinked(false);
          handleGoogleSync();
        }
      }
      return;
    }
    try {
      showToast("Conectando ao Google Calendar...");
      
      // Use signInWithOAuth with skipBrowserRedirect to get the URL without redirecting
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: { access_type: 'offline', prompt: 'consent' },
          redirectTo: window.location.origin + '/admin',
          skipBrowserRedirect: true
        }
      });
      
      if (error || !data?.url) {
        showToast("Erro ao gerar link do Google: " + (error?.message || 'URL não gerada'));
        return;
      }
      
      // Open centered popup
      const w = 500, h = 650;
      const left = window.screenX + (window.innerWidth - w) / 2;
      const top = window.screenY + (window.innerHeight - h) / 2;
      const popup = window.open(
        data.url,
        'googleCalendarAuth',
        `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );
      
      // Listen for popup close and check for new session
      const checkInterval = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(checkInterval);
          // Check if auth was successful
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.provider_token) {
            localStorage.setItem('google_provider_token', session.provider_token);
            localStorage.setItem('google_calendar_linked', 'true');
            localStorage.removeItem('google_calendar_disconnected');
            setIsGoogleLinked(true);
            fetchGoogleEvents(session.provider_token);
            showToast('✅ Google Calendar conectado!');
          }
        }
      }, 500);
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao conectar Google: " + err.message);
    }
  };

  const handleGoogleDisconnect = () => {
    localStorage.removeItem('google_provider_token');
    localStorage.removeItem('google_calendar_linked');
    localStorage.setItem('google_calendar_disconnected', 'true');
    setIsGoogleLinked(false);
    setGoogleEvents([]);
    showToast('Google Calendar desconectado.');
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
           className: 'google-event',
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
      const wasDisconnected = localStorage.getItem('google_calendar_disconnected') === 'true';
      if (providerToken && !wasDisconnected) {
         localStorage.setItem('google_provider_token', providerToken);
         localStorage.setItem('google_calendar_linked', 'true');
         setIsGoogleLinked(true);
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
         setUser(currentUser);
         
         const { data: profile, error: profError } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
         
         if (profile) {
             // ROLE GUARD: only admins can access this dashboard
             if (profile.role && profile.role !== 'admin') {
               if (profile.role === 'parceiro') { navigate('/partner', { replace: true }); return; }
               if (profile.role === 'cliente') { navigate('/client', { replace: true }); return; }
               navigate('/', { replace: true }); return;
             }
            // PRIORITIZE profile data over Google metadata to avoid overriding user's chosen name/photo
            setUserProfile({
               ...profile,
               avatar_url: profile.avatar_url || currentUser.user_metadata?.avatar_url,
               full_name: profile.full_name || currentUser.user_metadata?.full_name
            });
            setAdminName(profile.full_name || currentUser.user_metadata?.full_name || 'Admin');
            setAdminEmail(currentUser.email || '');
            setAdminPhone(profile.phone || currentUser.user_metadata?.phone || '');
         } else {
            setAdminName(currentUser.user_metadata?.full_name || 'Admin');
            setAdminEmail(currentUser.email || '');
            setAdminPhone(currentUser.user_metadata?.phone || '');
            setUserProfile({ id: currentUser.id, role: 'admin', avatar_url: currentUser.user_metadata?.avatar_url, full_name: currentUser.user_metadata?.full_name || 'Admin' } as Profile);
            if (profError) console.warn('Sem perfil público detectado:', profError.message);
         }
      }
      
      // Parallel fetch all data at once for faster loading
      const [cliRes, partRes, chatRes, calRes] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('profiles').select('*').eq('role', 'parceiro'),
        supabase.from('messages').select('sender_id, receiver_id'),
        supabase.from('calendar_events').select('*'),
      ]);

      if (cliRes.data) setClients(cliRes.data);
      if (partRes.data) setPartners(partRes.data);
      if (chatRes.data) setAllChatMessages(chatRes.data);
      if (calRes.data) setCalendarEvents(calRes.data);

      setLoadingDb(false);
      
      // Auto-sync Google Calendar if previously linked
      const isLinked = localStorage.getItem('google_calendar_linked') === 'true';
      if (isLinked) {
         setIsGoogleLinked(true);
         // Try session token first, then stored token
         const { data: { session: tokenSession } } = await supabase.auth.getSession();
         const activeToken = tokenSession?.provider_token || localStorage.getItem('google_provider_token');
         if (activeToken) {
            localStorage.setItem('google_provider_token', activeToken);
            fetchGoogleEvents(activeToken);
         }
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
        queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
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
        queryClient.invalidateQueries({ queryKey: adminKeys.projects() });
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.provider_token && localStorage.getItem('google_calendar_disconnected') !== 'true') {
           localStorage.setItem('google_provider_token', session.provider_token);
           localStorage.setItem('google_calendar_linked', 'true');
           setIsGoogleLinked(true);
           fetchGoogleEvents(session.provider_token);
        }
    });

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
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

  const updateLead = async (leadId: string, updates: any) => {
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, ...updates });
    }

    // Update DB
    const { error } = await supabase.from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead:', error);
    } else {
      queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
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
      try {
        // Delete leads first to satisfy foreign key constraint
        await supabase.from('leads').delete().eq('client_id', clientId);
        
        // Delete the client and verify it was actually deleted
        const { data, error, count } = await supabase.from('clients').delete().eq('id', clientId).select();
        
        if (error) {
          console.error("Erro ao deletar cliente:", error);
          showToast("Erro ao excluir cliente: " + error.message);
          return;
        }
        
        if (!data || data.length === 0) {
          // RLS blocked the delete — try without RLS check or warn user
          console.warn('Delete retornou 0 linhas. Possível bloqueio de RLS. Tentando via rpc...');
          // Fallback: try direct rpc call
          const { error: rpcError } = await supabase.rpc('delete_client_by_id', { client_id: clientId });
          if (rpcError) {
            console.error('RPC fallback failed:', rpcError);
            showToast('⚠️ Não foi possível excluir. Verifique as políticas RLS no Supabase para a tabela "clients".');
            return;
          }
        }
        
        setClients(prev => prev.filter(c => c.id !== clientId));
        queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
        showToast('Cliente excluído com sucesso!');
      } catch (err: any) {
        console.error('Erro inesperado ao deletar cliente:', err);
        showToast('Erro inesperado: ' + err.message);
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
      queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
      setIsNewLeadOpen(false);
      setNewLeadForm({ name: '', service_type: '', city: '', email: '', phone: '', urgency: '', estimated_value: '', partner_id: '' });
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
      const { error } = await supabase.from('landing_pages').insert([{
        name: lpForm.name,
        city: lpForm.city,
        status: 'draft'
      }]).select().single();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: adminKeys.landingPages() });
      setIsLPOpen(false);
      setLpForm({ name: '', city: '' });
      showToast("Landing Page criada com sucesso! Ela foi criada como rascunho (DRAFT). Clique no status para publicar.");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao criar LP.');
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
          
          <div className="sb-sec">{t('system')}</div>
          <div className={navItemClass('settings')} onClick={() => navTo('settings')}><span className="ni-icon">⚙</span>{t('settings')}</div>
        </div>
        <div className="sb-footer">
          <div className="logout" style={{textAlign:'center'}} onClick={async () => { localStorage.removeItem('adminActiveTab'); await supabase.auth.signOut(); window.location.href = '/'; }}>🚪 {t('logout')}</div>
        </div>
      </nav>
      {/* Mobile sidebar backdrop */}
      <div className={`sb-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} aria-hidden="true"></div>

      <div className="main">
        <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '60px', borderBottom: '1px solid var(--b)', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <button className="sb-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Abrir/fechar menu lateral" style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '1.4rem', cursor: 'pointer', display: 'none' }}>☰</button>
            <div className="topbar-title" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
              {{'lp':t('topbarLandingPages'),'allleads':t('topbarAllLeads'),'adminchat':t('topbarChat'),'projects':t('topbarProjects'),'pipeline':t('topbarPipeline'),'calendar':t('topbarCalendar'),'partners':t('topbarPartners'),'clients':t('topbarClients'),'finances':t('topbarFinances'),'settings':t('topbarSettings'),'dashboard':t('topbarDashboard')}[activeTab] || activeTab.toUpperCase()}
            </div>
          </div>
          
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="notif-btn" onClick={() => setIsNotifOpen(!isNotifOpen)} aria-label="Abrir notificações" style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg3)', border: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '1.2rem' }}>🔔</span>
              {unreadCount > 0 && <span style={{position:'absolute',top:'-4px',right:'-4px',background:'var(--red)',color:'#fff',fontSize:'0.6rem',fontWeight:700,borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--bg2)'}}>{unreadCount}</span>}
            </button>
            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'} className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--b)] hover:opacity-80 transition-all text-xl" style={{background: 'var(--bg3)', outline: 'none'}}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
        
        {isNotifOpen && (
          <div className="notif-panel open" style={{ right: 30 }}>
            <div className="nphead">{t('notificationsTitle')} {unreadCount > 0 && <span style={{background:'var(--red)',color:'#fff',fontSize:'0.55rem',borderRadius:10,padding:'1px 6px',marginLeft:6}}>{unreadCount}</span>} <span className="npclear" style={{cursor: 'pointer'}} onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}>{t('markAllRead')}</span></div>
            <div style={{maxHeight:'350px',overflowY:'auto'}}>
              {notifications.length === 0 && <div className="empty-state" style={{padding: '20px'}}>{t('noNotifications')}</div>}
              {notifications.slice(0, 20).map(n => (
                <div key={n.id} onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? {...x, read: true} : x))} style={{padding:'10px 16px',borderBottom:'1px solid var(--b)',cursor:'pointer',background: n.read ? 'transparent' : 'rgba(201,148,58,0.08)',transition:'all .2s'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <span style={{fontSize:'0.7rem'}}>{n.type}</span>
                    {!n.read && <span style={{width:6,height:6,borderRadius:'50%',background:'var(--red)',flexShrink:0}}></span>}
                  </div>
                  <div style={{fontSize:'0.8rem',fontWeight: n.read ? 400 : 700,color:'var(--text)'}}>{n.title}</div>
                  <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{n.body}</div>
                  <div style={{fontSize:'0.6rem',color:'var(--t3)',marginTop:4,fontFamily:"'DM Mono',monospace"}}>{n.time.toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="content">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && <AdminOverviewTab setActiveTab={setActiveTab} />}

          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <AdminPipelineTab 
              setIsNewLeadOpen={setIsNewLeadOpen}
              setSelectedLead={setSelectedLead}
            />
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <AdminProjectsTab
              handleCreateProject={handleCreateProject}
              setNewProjectForm={setNewProjectForm}
              setEditingProjectId={setEditingProjectId}
              setIsNewProjectOpen={setIsNewProjectOpen}
              showConfirm={showConfirm}
            />
          )}

          {/* ALL LEADS TAB */}
          {activeTab === 'allleads' && (
            <AdminAllLeadsTab
              setIsNewLeadOpen={setIsNewLeadOpen}
              setSelectedLead={setSelectedLead}
              showConfirm={showConfirm}
            />
          )}

          {/* LANDING PAGES TAB */}
          {activeTab === 'lp' && (
            <AdminLandingPagesTab
              setIsLPOpen={setIsLPOpen}
              showConfirm={showConfirm}
            />
          )}

          {/* CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <CalendarTab
              handleGoogleSync={handleGoogleSync}
              handleGoogleDisconnect={handleGoogleDisconnect}
              isGoogleLinked={isGoogleLinked}
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
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={handleEventSubmit}
        eventForm={eventForm}
        setEventForm={setEventForm}
        leads={leads}
        selectedLead={selectedLead}
      />

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
                  <input required type="date" className="f-inp" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} onClick={(e) => { try { if ('showPicker' in e.target) { (e.target as HTMLInputElement).showPicker(); } } catch(err){} }} />
                </div>
                <div>
                  <label className="f-label">Horário *</label>
                  <input required type="time" className="f-inp" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} onClick={(e) => { try { if ('showPicker' in e.target) { (e.target as HTMLInputElement).showPicker(); } } catch(err){} }} />
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
      <PartnerModal
        isOpen={isPartnerOpen}
        onClose={() => setIsPartnerOpen(false)}
        onSubmit={handlePartnerSubmit}
        form={partnerForm}
        setForm={setPartnerForm}
      />

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
                 showConfirm('Excluir este parceiro? Isso removerá permanentemente do sistema.', async () => {
                    try {
                      // Remove associated leads, messages, notifications first
                      await supabase.from('leads').update({ partner_id: null }).eq('partner_id', selectedPartner.id);
                      await supabase.from('messages').delete().or(`sender_id.eq.${selectedPartner.id},receiver_id.eq.${selectedPartner.id}`);
                      await supabase.from('notifications').delete().eq('user_id', selectedPartner.id);
                      
                      // Delete profile and verify
                      const { data, error } = await supabase.from('profiles').delete().eq('id', selectedPartner.id).select();
                      
                      if (error) {
                        showToast('Erro ao excluir parceiro: ' + error.message);
                        return;
                      }
                      
                      if (!data || data.length === 0) {
                        console.warn('Delete retornou 0 linhas. Possível bloqueio de RLS.');
                        const { error: rpcError } = await supabase.rpc('delete_profile_by_id', { profile_id: selectedPartner.id });
                        if (rpcError) {
                          console.error('RPC fallback failed:', rpcError);
                          showToast('⚠️ Não foi possível excluir. Verifique as políticas RLS no Supabase para a tabela "profiles".');
                          return;
                        }
                      }
                      
                      setPartners(prev => prev.filter(p => p.id !== selectedPartner.id));
                      setSelectedPartner(null);
                      setEditPartner(null);
                      showToast('Parceiro removido com sucesso!');
                    } catch (err: any) {
                      console.error('Erro inesperado:', err);
                      showToast('Erro inesperado: ' + err.message);
                    }
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
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onSubmit={handleNewLeadSubmit}
        form={newLeadForm}
        setForm={setNewLeadForm}
        partners={partners}
      />

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
