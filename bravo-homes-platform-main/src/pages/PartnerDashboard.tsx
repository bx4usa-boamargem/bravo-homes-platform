import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Project, Lead, Stage, CalendarEvent, Message, Client, DailyLog, ProjectDocument } from '../types';
import type { User } from '@supabase/supabase-js';
import { useLanguage } from '../lib/i18n';
// removed unused imports
import PartnerStagesTab from '../components/partner/PartnerStagesTab';
import PartnerUploadsTab from '../components/partner/PartnerUploadsTab';
import PartnerProfileTab from '../components/partner/PartnerProfileTab';
import PartnerSidebar from '../components/partner/PartnerSidebar';
import PartnerHeader from '../components/partner/PartnerHeader';
import PartnerHomeTab from '../components/partner/PartnerHomeTab';
import PartnerProjectsTab from '../components/partner/PartnerProjectsTab';
import PartnerDailyLogTab from '../components/partner/PartnerDailyLogTab';
import PartnerCalendarTab from '../components/partner/PartnerCalendarTab';
import PartnerLeadsTab from '../components/partner/PartnerLeadsTab';
import PartnerChatTab from '../components/partner/PartnerChatTab';
import '../styles/utilities.css';
import './PartnerDashboard.css';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('partnerActiveTab') || 'dashboard');
  
  useEffect(() => {
    localStorage.setItem('partnerActiveTab', activeTab);
  }, [activeTab]);

  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [chatTab, setChatTab] = useState<string>('admin');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedChatClient, setSelectedChatClient] = useState<Client | null>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<Client | null>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, msg: string, type: 'error' | 'success'} | null>(null);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', lead_name: '', lead_id: '', service_type: '', contract_value: '', start_date: '', deadline: '' });
  const [showLeadSelect, setShowLeadSelect] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [projectFiles, setProjectFiles] = useState<ProjectDocument[]>([]);
  const [logPhotos, setLogPhotos] = useState<ProjectDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
// removed isNewEventOpen
// removed newEvent and editingEvent
  const [logForm, setLogForm] = useState({ project_id: '', log_text: '', materials: '' });
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [leadNotes, setLeadNotes] = useState<Record<string, string>>({});
  const [chatMsg, setChatMsg] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatFileRef = React.useRef<HTMLInputElement>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<Record<string, any>>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileAvatarRef = React.useRef<HTMLInputElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  
  const showToast = (title: string, msg: string, type: 'error' | 'success' = 'success') => {
    setToastMessage({title, msg, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function fetchData() {
      setLoadingDb(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { navigate('/', { replace: true }); return; }
      setUser(currentUser);
      // ROLE GUARD: only parceiro can access this dashboard
      const { data: roleProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
      if (roleProfile && roleProfile.role && roleProfile.role !== 'parceiro') {
        if (roleProfile.role === 'admin') { navigate('/admin', { replace: true }); return; }
        if (roleProfile.role === 'cliente') { navigate('/client', { replace: true }); return; }
        navigate('/', { replace: true }); return;
      }
      // Parallel fetch all data at once for faster loading
      const [pRes, lRes, sRes, eRes, mRes, adminRes, clientsRes, logRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('stages').select('*'),
        supabase.from('calendar_events').select('*'),
        supabase.from('messages').select('*').or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order('created_at', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'admin'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('daily_logs').select('*'),
      ]);

      if (pRes.data) setProjects(pRes.data);
      if (lRes.data) setLeads(lRes.data);
      if (sRes.data) setStages(sRes.data);
      if (eRes.data) setEvents(eRes.data);
      if (mRes.data) setMessages(mRes.data);
      if (adminRes.data && adminRes.data.length > 0) setAdminUser(adminRes.data[0]);
      if (clientsRes.data) setClients(clientsRes.data);
      if (logRes.data) setLogs(logRes.data);

      // Load notifications
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20);
      if (notifs) setNotifications(notifs);

      setLoadingDb(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, lang, setLang } = useLanguage();
// removed navItemClass
  const navTo = (tab: string) => { setActiveTab(tab); setSidebarOpen(false); };

  const handleCreateProject = () => {
    setIsNewProjectOpen(true);
  };

  const submitProjectForm = async (e?: any) => {
    if (e) e.preventDefault();
    if (!newProjectForm.name) {
      showToast("Atenção", "Por favor, preencha o Nome do Projeto.", "error");
      return;
    }
    setIsSubmittingProject(true);
    try {
      const { name, lead_name, lead_id, service_type, contract_value, start_date, deadline } = newProjectForm;
      const combinedName = lead_name ? `${lead_name} - ${name}` : name;
      
      const fullProjectData = {
        name: combinedName, 
        service_type: service_type || 'Reforma Residencial', 
        status: 'active', 
        progress: 0,
        contract_value: contract_value ? parseInt(contract_value.toString()) : 0,
        start_date: start_date || null,
        deadline: deadline || null,
        client_id: lead_id || null,
        lead_id: lead_id || null
      };
      
      const safeProjectData = {
        name: combinedName, 
        service_type: service_type || 'Reforma Residencial', 
        status: 'active', 
        progress: 0,
        contract_value: contract_value ? parseInt(contract_value.toString()) : 0,
        start_date: start_date || null,
        deadline: deadline || null
      };

      let { error } = await supabase.from('projects').insert([fullProjectData]);
      
      if (error && error.message.includes('column')) {
         // fallback if client_id or lead_id columns don't exist
         ({ error } = await supabase.from('projects').insert([safeProjectData]));
      }
      
      if (error) {
         console.error('Supabase Insert Error:', error);
         showToast("Erro do Banco de Dados", error.message, "error");
      } else {
         showToast("Sucesso", "Projeto criado com sucesso!", "success");
         setIsNewProjectOpen(false);
         setNewProjectForm({ name: '', lead_name: '', lead_id: '', service_type: '', contract_value: '', start_date: '', deadline: '' });
         // Refresh projects list from database
         const { data: refreshed } = await supabase.from('projects').select('*');
         if (refreshed) setProjects(refreshed);
      }
    } catch (err: any) {
      console.error('Unexpected Form Error:', err);
      showToast("Falha Crítica", err.message, "error");
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // === STAGES FUNCTIONS ===
  const projectStages = selectedProject ? stages.filter((s: any) => s.project_id === selectedProject.id) : [];

  const addStage = async () => {
    if (!newStageName.trim() || !selectedProject) return;
    const nextOrder = projectStages.length + 1;
    try {
      const { data, error } = await supabase.from('stages').insert([{
        project_id: selectedProject.id,
        name: newStageName.trim(),
        status: 'pending',
        order_index: nextOrder
      }]).select().single();
      if (error) { showToast('Erro', error.message, 'error'); return; }
      setStages(prev => [...prev, data]);
      setNewStageName('');
      showToast('Sucesso', 'Etapa adicionada!', 'success');
    } catch (err: any) { showToast('Erro', err.message, 'error'); }
  };

  const toggleStage = async (stageId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, status: newStatus } : s));
    await supabase.from('stages').update({ status: newStatus }).eq('id', stageId);
    // Recalculate progress
    const updatedStages = stages.map(s => s.id === stageId ? { ...s, status: newStatus } : s).filter(s => s.project_id === selectedProject?.id);
    if (updatedStages.length > 0 && selectedProject) {
      const completed = updatedStages.filter(s => s.status === 'completed').length;
      const progress = Math.round((completed / updatedStages.length) * 100);
      await supabase.from('projects').update({ progress }).eq('id', selectedProject.id);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, progress } : p));
      setSelectedProject((prev: any) => prev ? { ...prev, progress } : prev);
    }
  };

  const deleteStage = async (stageId: string) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
    await supabase.from('stages').delete().eq('id', stageId);
    // Recalculate progress
    const remaining = stages.filter(s => s.id !== stageId && s.project_id === selectedProject?.id);
    if (selectedProject) {
      const completed = remaining.filter(s => s.status === 'completed').length;
      const progress = remaining.length > 0 ? Math.round((completed / remaining.length) * 100) : 0;
      await supabase.from('projects').update({ progress }).eq('id', selectedProject.id);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, progress } : p));
      setSelectedProject((prev: any) => prev ? { ...prev, progress } : prev);
    }
    showToast('Removida', 'Etapa removida.', 'success');
  };

  // === FILE UPLOAD FUNCTIONS ===
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tyeaqluofishcvhvpwrg.supabase.co';

  const loadProjectFiles = async (projectId?: string) => {
    const pid = projectId || (activeTab === 'uploads' ? uploadProjectId : (activeTab === 'stages' ? selectedProject?.id : null));
    if (!pid) return;
    const { data, error } = await supabase.from('project_documents').select('*').eq('project_id', pid).order('created_at', { ascending: false });
    if (!error && data) setProjectFiles(data);
  };

  const loadLogPhotos = async () => {
    const { data, error } = await supabase.from('project_documents').select('*').not('log_id', 'is', null).order('created_at', { ascending: false });
    if (!error && data) setLogPhotos(data);
  };

  useEffect(() => {
    const pid = activeTab === 'uploads' ? uploadProjectId : (activeTab === 'stages' ? selectedProject?.id : null);
    if (pid) loadProjectFiles(pid);
    if (activeTab === 'dailylog') loadLogPhotos();
  }, [uploadProjectId, selectedProject, activeTab]);

  const handleFileUpload = async (files: FileList | null, targetStageId: string | null = null, targetLogId: string | null = null, targetProjectId: string | null = null) => {
    const activePid = targetProjectId || (targetStageId ? (selectedProject?.id || uploadProjectId) : uploadProjectId);
    if (!files || files.length === 0 || !activePid) {
      if (!activePid) showToast('Atenção', 'Selecione um projeto antes de enviar arquivos.', 'error');
      return;
    }
    setIsUploading(true);
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = `${activePid}/${Date.now()}_${i}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('project-files').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) { showToast('Erro', `Falha ao enviar ${file.name}: ${uploadErr.message}`, 'error'); continue; }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/project-files/${path}`;
      const { error: dbErr } = await supabase.from('project_documents').insert([{
        project_id: activePid,
        stage_id: targetStageId,
        log_id: targetLogId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type
      }]);
      if (!dbErr) successCount++;
    }
    if (successCount > 0) showToast('Sucesso', `${successCount} arquivo(s) enviado(s)!`, 'success');
    
    if (targetLogId) await loadLogPhotos();
    else await loadProjectFiles();
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteFile = async (fileRecord: any) => {
    const pathMatch = fileRecord.file_url?.match(/project-files\/(.+)$/);
    if (pathMatch) await supabase.storage.from('project-files').remove([pathMatch[1]]);
    await supabase.from('project_documents').delete().eq('id', fileRecord.id);
    setProjectFiles(prev => prev.filter(f => f.id !== fileRecord.id));
    showToast('Removido', 'Arquivo removido.', 'success');
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('sheet') || type?.includes('excel')) return '📊';
    return '📎';
  };

  // Calendar functions moved to PartnerCalendarTab

  // === LOG FUNCTIONS ===
  const submitLog = async () => {
    if (!logForm.project_id) { showToast('Atenção', 'Selecione um projeto.', 'error'); return; }
    if (!logForm.log_text.trim()) { showToast('Atenção', 'Descreva as atividades realizadas.', 'error'); return; }
    setIsSavingLog(true);
    try {
      const fullText = logForm.materials.trim()
        ? `${logForm.log_text.trim()}\n\n🧱 Materiais: ${logForm.materials.trim()}`
        : logForm.log_text.trim();
      const { data, error } = await supabase.from('daily_logs').insert([{
        project_id: logForm.project_id,
        log_text: fullText
      }]).select().single();
      if (error) { showToast('Erro', error.message, 'error'); setIsSavingLog(false); return; }
      setLogs(prev => [data, ...prev]);
      setLogForm({ project_id: logForm.project_id, log_text: '', materials: '' });
      showToast('Salvo', 'Log do dia registrado com sucesso!', 'success');
    } catch (err: any) { showToast('Erro', err.message, 'error'); }
    setIsSavingLog(false);
  };

  const deleteLog = async (logId: string) => {
    await supabase.from('daily_logs').delete().eq('id', logId);
    setLogs(prev => prev.filter(l => l.id !== logId));
    showToast('Removido', 'Log removido.', 'success');
  };

  const getProjectName = (projectId: string) => {
    const p = projects.find((proj: any) => proj.id === projectId);
    return p ? p.name : 'Projeto';
  };

  // === LEAD FUNCTIONS ===
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const { error } = await supabase.from('leads').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', leadId);
    if (error) { showToast('Erro', error.message, 'error'); return; }
    setLeads(prev => prev.map((l: any) => l.id === leadId ? { ...l, status: newStatus } : l));
    showToast('Atualizado', `Status alterado para "${newStatus}".`, 'success');
  };

  const saveLeadNotes = async (leadId: string) => {
    const note = leadNotes[leadId];
    if (note === undefined) return;
    const { error } = await supabase.from('leads').update({ notes: note, updated_at: new Date().toISOString() }).eq('id', leadId);
    if (error) { showToast('Erro', error.message, 'error'); return; }
    setLeads(prev => prev.map((l: any) => l.id === leadId ? { ...l, notes: note } : l));
    showToast('Salvo', 'Observações salvas.', 'success');
  };

  const deleteLead = async (leadId: string) => {
    await supabase.from('leads').delete().eq('id', leadId);
    setLeads(prev => prev.filter((l: any) => l.id !== leadId));
    showToast('Removido', 'Lead removido.', 'success');
  };

  const getUrgencyColor = (u: string) => {
    if (u === 'alta' || u === 'hot') return 'var(--red)';
    if (u === 'media' || u === 'warm') return 'var(--orange)';
    return 'var(--blue)';
  };

// removed getStatusColor

  const leadStatuses = ['Novo', 'Em Contato', 'Reunião Agendada', 'Proposta Enviada', 'Convertido', 'Perdido'];

  // === CHAT FUNCTIONS ===

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const msg = payload.new;
        setMessages(prev => {
          if (prev.some((m: any) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Add in-app notification for messages received by this user
        if (msg.receiver_id === user?.id) {
          setNotifications(prev => [{ id: 'msg-' + msg.id, title: '💬 Nova mensagem', body: msg.content?.substring(0, 80) || 'Nova mensagem recebida', read: false, created_at: new Date().toISOString() }, ...prev]);
        }
      })
      .subscribe();

    // Realtime notifications
    const notifChannel = supabase.channel('partner-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const notif = payload.new as any;
        setNotifications(prev => [notif, ...prev]);
        setNotifOpen(true);
        // Browser push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, { body: notif.body, icon: '/bravo-logo.png', tag: 'notif-' + notif.id });
        }
      })
      .subscribe();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { supabase.removeChannel(channel); supabase.removeChannel(notifChannel); };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string, ext?: string, payloadData?: any) => {
    if (!content.trim() && !payloadData) return;
    const receiverId = chatTab === 'admin' ? (adminUser?.id || null) : (selectedChatClient?.id || null);
    const pl = payloadData ? { ...payloadData, msg_type: ext || 'text' } : { msg_type: 'text' };
    const { data, error } = await supabase.from('messages').insert([{
      sender_id: user?.id || null,
      receiver_id: receiverId,
      content: content.trim() || '📎',
      payload: pl
    }]).select().single();
    if (error) { showToast('Erro', error.message, 'error'); return; }
    setMessages(prev => {
      if (prev.some((m: any) => m.id === data.id)) return prev;
      return [...prev, data];
    });
    setChatMsg('');
  };

  const sendChatFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fext = file.name.split('.').pop();
      const path = `chat/${Date.now()}_${i}.${fext}`;
      const { error: upErr } = await supabase.storage.from('project-files').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) { showToast('Erro', upErr.message, 'error'); continue; }
      const url = `${SUPABASE_URL}/storage/v1/object/public/project-files/${path}`;
      const isImg = file.type.startsWith('image/');
      await sendMessage(isImg ? '🖼️ Photo' : `📎 ${file.name}`, isImg ? 'image' : 'file', { url, name: file.name, type: file.type });
    }
    if (chatFileRef.current) chatFileRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const path = `chat/audio_${Date.now()}.webm`;
        const { error: upErr } = await supabase.storage.from('project-files').upload(path, blob, { cacheControl: '3600', upsert: false, contentType: 'audio/webm' });
        if (upErr) { showToast('Erro', upErr.message, 'error'); return; }
        const url = `${SUPABASE_URL}/storage/v1/object/public/project-files/${path}`;
        await sendMessage('🎤 Audio message', 'audio', { url, name: 'audio.webm', type: 'audio/webm' });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) { showToast('Erro', 'Permissão de microfone negada.', 'error'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const channelMessages = messages.filter((m: any) => {
    if (!user) return false;
    if (chatTab === 'admin') {
      // Messages between me and admin
      return (m.sender_id === user.id && m.receiver_id === adminUser?.id) ||
             (m.sender_id === adminUser?.id && m.receiver_id === user.id);
    } else if (selectedChatClient) {
      // Messages between me and the selected client
      return (m.sender_id === user.id && m.receiver_id === selectedChatClient.id) ||
             (m.sender_id === selectedChatClient.id && m.receiver_id === user.id);
    }
    return false;
  });

  // Derive chat client list from messages (only show clients with active conversations)
  const chatClients = React.useMemo(() => {
    if (!user) return [];
    const contactIds = new Set<string>();
    messages.forEach((m: any) => {
      if (m.sender_id === user.id && m.receiver_id && m.receiver_id !== adminUser?.id) contactIds.add(m.receiver_id);
      if (m.receiver_id === user.id && m.sender_id && m.sender_id !== adminUser?.id) contactIds.add(m.sender_id);
    });
    return Array.from(contactIds).map(id => {
      const client = clients.find((c: any) => c.id === id);
      return client || { id, name: 'Cliente', email: '', phone: '' };
    });
  }, [messages, user, adminUser, clients]);

  // === PROFILE FUNCTIONS ===
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(async ({ data }) => {
      if (data) {
        setProfileData(data);
        setProfileForm(data);
      } else {
        // Profile row doesn't exist, create it
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          role: 'partner',
          notifications_email: true,
          notifications_sms: true
        };
        await supabase.from('profiles').upsert([newProfile]);
        setProfileData(newProfile);
        setProfileForm(newProfile);
      }
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user?.id) return;
    setProfileSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profileForm.full_name,
      phone: profileForm.phone,
      specialty: profileForm.specialty,
      license_number: profileForm.license_number,
      company_name: profileForm.company_name,
      city: profileForm.city,
      state: profileForm.state,
      bio: profileForm.bio,
      notifications_email: profileForm.notifications_email,
      notifications_sms: profileForm.notifications_sms
    });
    setProfileSaving(false);
    if (error) { showToast('Error', error.message, 'error'); return; }
    setProfileData({...profileData, ...profileForm});
    setProfileEditing(false);
    showToast('Saved', 'Profile updated successfully!', 'success');
  };

  const uploadAvatar = async (files: FileList | null) => {
    if (!files || !files[0] || !user?.id) return;
    const file = files[0];
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error: upErr } = await supabase.storage.from('project-files').upload(path, file, { cacheControl: '3600', upsert: true });
    if (upErr) { showToast('Error', upErr.message, 'error'); return; }
    const url = `${SUPABASE_URL}/storage/v1/object/public/project-files/${path}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setProfileData({...profileData, avatar_url: url});
    setProfileForm({...profileForm, avatar_url: url});
    showToast('Saved', 'Avatar updated!', 'success');
  };

  const changePassword = async () => {
    if (passwordForm.newPass.length < 6) { showToast('Error', 'Password must be at least 6 characters.', 'error'); return; }
    if (passwordForm.newPass !== passwordForm.confirmPass) { showToast('Error', 'Passwords do not match.', 'error'); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.newPass });
    setPasswordSaving(false);
    if (error) { showToast('Error', error.message, 'error'); return; }
    setPasswordForm({ newPass: '', confirmPass: '' });
    showToast('Success', 'Password changed successfully!', 'success');
  };

  const toggleNotif = async (key: string, val: boolean) => {
    if (!user?.id) return;
    setProfileForm({...profileForm, [key]: val});
    await supabase.from('profiles').update({ [key]: val }).eq('id', user.id);
    setProfileData({...profileData, [key]: val});
    showToast('Saved', 'Notification preference updated.', 'success');
  };

  return (
    <div className="partner-app">
      {/* SIDEBAR */}
      <PartnerSidebar
        theme={theme}
        profileData={profileData}
        user={user}
        activeTab={activeTab}
        navTo={navTo}
        projectsCount={projects.length}
        leadsCount={leads.length}
        t={t as any}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={async () => { localStorage.removeItem('partnerActiveTab'); await supabase.auth.signOut(); window.location.href = '/'; }}
      />

      {/* MAIN */}
      <div className="main">
        {toastMessage && (
          <div style={{position: 'fixed', bottom: 30, right: 30, background: toastMessage.type === 'error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '15px 20px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <strong style={{fontFamily: "'Syne', sans-serif"}}>{toastMessage.title}</strong>
            <span style={{fontSize: '0.85rem'}}>{toastMessage.msg}</span>
          </div>
        )}
        <PartnerHeader
          theme={theme}
          toggleTheme={toggleTheme}
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          t={t as any}
          unreadCount={unreadCount}
          notifOpen={notifOpen}
          setNotifOpen={setNotifOpen}
          notifications={notifications}
          setNotifications={setNotifications}
          user={user}
        />
        <div className="content">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <PartnerHomeTab
              projects={projects}
              stages={stages}
              messages={messages}
              leads={leads}
              events={events}
              logs={logs}
              setActiveTab={setActiveTab}
              user={user}
            />
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <PartnerProjectsTab
              handleCreateProject={handleCreateProject}
              setSelectedProject={setSelectedProject}
              setActiveTab={setActiveTab}
              leads={leads}
            />
          )}

          {activeTab === 'stages' && (
            <PartnerStagesTab
              projects={projects}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              projectStages={projectStages}
              newStageName={newStageName}
              setNewStageName={setNewStageName}
              addStage={addStage}
              toggleStage={toggleStage}
              deleteStage={deleteStage}
              showToast={showToast}
              setUploadProjectId={setUploadProjectId}
              setActiveTab={setActiveTab}
              projectFiles={projectFiles}
              handleFileUpload={handleFileUpload}
              deleteFile={deleteFile}
              isUploading={isUploading}
            />
          )}

          {/* CALENDAR */}
          {activeTab === 'calendar' && (
            <PartnerCalendarTab projects={projects} showToast={showToast} user={user} />
          )}

          {/* DAILY LOG */}
          {activeTab === 'dailylog' && (
            <PartnerDailyLogTab
              projects={projects}
              logs={logs}
              logForm={logForm}
              setLogForm={setLogForm}
              submitLog={submitLog}
              isSavingLog={isSavingLog}
              getProjectName={getProjectName}
              deleteLog={deleteLog}
              logPhotos={logPhotos}
              handleFileUpload={handleFileUpload}
              deleteFile={deleteFile}
              isUploading={isUploading}
            />
          )}

          {/* LEADS */}
          {activeTab === 'leads' && (
            <PartnerLeadsTab
              leads={leads}
              loadingDb={loadingDb}
              expandedLead={expandedLead}
              setExpandedLead={setExpandedLead}
              getUrgencyColor={getUrgencyColor}
              leadStatuses={leadStatuses}
              updateLeadStatus={updateLeadStatus}
              leadNotes={leadNotes}
              setLeadNotes={setLeadNotes}
              saveLeadNotes={saveLeadNotes}
              deleteLead={deleteLead}
            />
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <PartnerChatTab
              user={user}
              chatTab={chatTab}
              setChatTab={setChatTab}
              messages={messages}
              chatClients={chatClients}
              selectedChatClient={selectedChatClient}
              setSelectedChatClient={setSelectedChatClient}
              setDeleteConfirmClient={setDeleteConfirmClient}
              channelMessages={channelMessages}
              chatEndRef={chatEndRef}
              chatFileRef={chatFileRef}
              sendChatFile={sendChatFile}
              isRecording={isRecording}
              stopRecording={stopRecording}
              startRecording={startRecording}
              chatMsg={chatMsg}
              setChatMsg={setChatMsg}
              sendMessage={sendMessage}
            />
          )}

          {/* Delete conversation confirmation popup */}
          {deleteConfirmClient && (
            <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={() => setDeleteConfirmClient(null)}>
              <div style={{background:'var(--bg2)',border:'1px solid var(--b)',borderRadius:12,padding:'28px 32px',maxWidth:400,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}} onClick={e => e.stopPropagation()}>
                <div style={{fontSize:'1.2rem',marginBottom:6}}>🗑️</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem',marginBottom:8}}>Apagar conversa?</div>
                <div style={{color:'var(--t2)',fontSize:'0.85rem',marginBottom:20,lineHeight:1.5}}>
                  Tem certeza que deseja apagar toda a conversa com <b style={{color:'var(--gold)'}}>{deleteConfirmClient.name || 'este cliente'}</b>? Esta ação não pode ser desfeita.
                </div>
                <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                  <button className="btn ghost" onClick={() => setDeleteConfirmClient(null)}>Cancelar</button>
                  <button className="btn" style={{background:'var(--red)',color:'#fff',border:'none'}} onClick={async () => {
                    // Delete all messages between partner and this client
                    await supabase.from('messages').delete().or(
                      `and(sender_id.eq.${user?.id},receiver_id.eq.${deleteConfirmClient.id}),and(sender_id.eq.${deleteConfirmClient.id},receiver_id.eq.${user?.id})`
                    );
                    // Remove from local state
                    setMessages(prev => prev.filter(m =>
                      !((m.sender_id === user?.id && m.receiver_id === deleteConfirmClient.id) ||
                        (m.sender_id === deleteConfirmClient.id && m.receiver_id === user?.id))
                    ));
                    // Remove client from sidebar list
                    setClients(prev => prev.filter(c => c.id !== deleteConfirmClient.id));
                    // If this was the selected chat, deselect
                    if (selectedChatClient?.id === deleteConfirmClient.id) {
                      setSelectedChatClient(null);
                      setChatTab('admin');
                    }
                    setDeleteConfirmClient(null);
                    showToast('Sucesso', 'Conversa apagada.', 'success');
                  }}>Apagar</button>
                </div>
              </div>
            </div>
          )}

          {/* UPLOADS */}
          {activeTab === 'uploads' && (
            <PartnerUploadsTab
              projects={projects}
              projectStages={stages}
              uploadProjectId={uploadProjectId}
              setUploadProjectId={setUploadProjectId}
              projectFiles={projectFiles}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              deleteFile={deleteFile}
              getFileIcon={getFileIcon}
              t={t}
              lang={lang}
            />
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <PartnerProfileTab
              user={user}
              profileData={profileData}
              profileEditing={profileEditing}
              setProfileEditing={setProfileEditing}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              profileSaving={profileSaving}
              saveProfile={saveProfile}
              profileAvatarRef={profileAvatarRef}
              uploadAvatar={uploadAvatar}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              passwordSaving={passwordSaving}
              changePassword={changePassword}
              toggleNotif={toggleNotif}
              t={t}
              lang={lang}
              setLang={setLang}
            />
          )}

        </div>
      </div>



      {/* NOVO PROJETO MODAL */}
      {isNewProjectOpen && (
        <div className="modal-overlay open" onClick={() => setIsNewProjectOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '650px'}}>
            <div className="modal-head">
               <div className="modal-title">Criar Novo Projeto</div>
               <button className="dclose" onClick={() => setIsNewProjectOpen(false)}>✕</button>
            </div>
            <form onSubmit={submitProjectForm}>
              <div className="modal-body">
                <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px', marginBottom: '20px'}}>
                  {/* Row 1 */}
                  <div style={{position: 'relative'}}>
                    <label className="f-label">Lead Atribuído *</label>
                    <div style={{position: 'relative'}}>
                      <input required type="text" className="f-inp" style={{paddingRight: '30px'}} placeholder="Busque pelo Lead..." value={newProjectForm.lead_name} 
                        onChange={e => {
                          setNewProjectForm({...newProjectForm, lead_name: e.target.value});
                          setShowLeadSelect(true);
                        }}
                        onFocus={() => setShowLeadSelect(true)}
                        onBlur={() => setTimeout(() => setShowLeadSelect(false), 200)}
                        autoComplete="off" 
                      />
                      <span style={{position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', fontSize: '0.75rem', opacity: 0.7}}>▼</span>
                      {showLeadSelect && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0, 
                          background: 'var(--bg2)', border: '1px solid var(--border)', 
                          borderRadius: '6px', maxHeight: '180px', overflowY: 'auto', 
                          zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', marginTop: '4px'
                        }}>
                          {leads.filter((l: any) => l.name.toLowerCase().includes(newProjectForm.lead_name.toLowerCase())).length > 0 ? (
                            leads.filter((l: any) => l.name.toLowerCase().includes(newProjectForm.lead_name.toLowerCase())).map((l: any) => (
                              <div 
                                key={l.id} 
                                style={{padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text)'}}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setNewProjectForm({...newProjectForm, lead_name: l.name, lead_id: l.id});
                                  setShowLeadSelect(false);
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                {l.name}
                              </div>
                            ))
                          ) : (
                            <div style={{padding: '10px 14px', fontSize: '0.85rem', color: 'var(--t3)'}}>Nenhum lead encontrado.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="f-label">Nome do Projeto *</label>
                    <input required type="text" className="f-inp" placeholder="Ex: Reforma da Casa" value={newProjectForm.name} onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})} />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="f-label">Tipo de Serviço *</label>
                    <select required className="f-inp" value={newProjectForm.service_type} onChange={e => setNewProjectForm({...newProjectForm, service_type: e.target.value})}>
                      <option value="" disabled>-- Selecione --</option>
                      <option value="Reforma Completa">Reforma Completa</option>
                      <option value="Bathroom Remodel">Bathroom Remodel</option>
                      <option value="Kitchen Remodel">Kitchen Remodel</option>
                      <option value="Pintura e Acabamento">Pintura e Acabamento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="f-label">Valor Estimado ($)</label>
                    <input type="number" className="f-inp" placeholder="Ex: 25000" value={newProjectForm.contract_value} onChange={e => setNewProjectForm({...newProjectForm, contract_value: e.target.value})} />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <label className="f-label">Data de Início</label>
                    <input type="date" className="f-inp" value={newProjectForm.start_date} onChange={e => setNewProjectForm({...newProjectForm, start_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="f-label">Prazo de Entrega</label>
                    <input type="date" className="f-inp" value={newProjectForm.deadline} onChange={e => setNewProjectForm({...newProjectForm, deadline: e.target.value})} />
                  </div>
                </div>
                <div style={{display: 'flex', gap: '15px', marginTop: '30px', justifyContent: 'center'}}>
                   <button type="button" className="btn ghost" style={{flex: 1, padding: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={() => setIsNewProjectOpen(false)} disabled={isSubmittingProject}>Cancelar</button>
                   <button type="button" className="btn gold" style={{flex: 1, padding: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={submitProjectForm} disabled={isSubmittingProject}>{isSubmittingProject ? 'Criando...' : 'Criar Projeto'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
