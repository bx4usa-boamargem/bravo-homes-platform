import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './PartnerDashboard.css';

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('partnerActiveTab') || 'dashboard');
  
  useEffect(() => {
    localStorage.setItem('partnerActiveTab', activeTab);
  }, [activeTab]);

  const [theme, setTheme] = useState(() => localStorage.getItem('appTheme') || 'dark');
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [chatTab, setChatTab] = useState<string>('admin');
  const [clients, setClients] = useState<any[]>([]);
  const [selectedChatClient, setSelectedChatClient] = useState<any>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<any>(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, msg: string, type: 'error' | 'success'} | null>(null);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', service_type: 'Reforma', contract_value: '', deadline: '' });
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newStageName, setNewStageName] = useState('');
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', event_date: '', start_time: '', project_id: '' });
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
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPass: '', confirmPass: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const profileAvatarRef = React.useRef<HTMLInputElement>(null);
  
  const showToast = (title: string, msg: string, type: 'error' | 'success' = 'success') => {
    setToastMessage({title, msg, type});
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function fetchData() {
      setLoadingDb(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);
      // ROLE GUARD: only parceiro can access this dashboard
      const { data: roleProfile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
      if (roleProfile && roleProfile.role && roleProfile.role !== 'parceiro') {
        if (roleProfile.role === 'admin') { navigate('/admin', { replace: true }); return; }
        if (roleProfile.role === 'cliente') { navigate('/client', { replace: true }); return; }
        navigate('/', { replace: true }); return;
      }
      const { data: pData } = await supabase.from('projects').select('*');
      if (pData) setProjects(pData);
      
      const { data: lData } = await supabase.from('leads').select('*');
      if (lData) setLeads(lData);

      const { data: sData } = await supabase.from('stages').select('*');
      if (sData) setStages(sData);

      const { data: eData } = await supabase.from('calendar_events').select('*');
      if (eData) setEvents(eData);

      const { data: mData } = await supabase.from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser?.id},receiver_id.eq.${currentUser?.id}`)
        .order('created_at', { ascending: true });
      if (mData) setMessages(mData);

      // Load admin users for chat
      const { data: adminUsers } = await supabase.from('profiles').select('*').eq('role', 'admin');
      if (adminUsers && adminUsers.length > 0) setAdminUser(adminUsers[0]);

      // Load ALL clients for lookup (used to resolve names in chat)
      const { data: clientsData } = await supabase.from('clients').select('*').order('name');
      if (clientsData) setClients(clientsData);

      const { data: dLogData } = await supabase.from('daily_logs').select('*');
      if (dLogData) setLogs(dLogData);

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
  const navItemClass = (tab: string) => `ni ${activeTab === tab ? 'active' : ''}`;
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
      const { name, service_type, contract_value, deadline } = newProjectForm;
      
      const { error } = await supabase.from('projects').insert([{ 
        name, 
        service_type: service_type || 'Reforma Residencial', 
        status: 'active', 
        progress: 0,
        contract_value: contract_value ? parseInt(contract_value.toString()) : 0,
        deadline: deadline || null
      }]);
      
      if (error) {
         console.error('Supabase Insert Error:', error);
         showToast("Erro do Banco de Dados", error.message, "error");
      } else {
         showToast("Sucesso", "Projeto criado com sucesso!", "success");
         setIsNewProjectOpen(false);
         setNewProjectForm({ name: '', service_type: 'Reforma', contract_value: '', deadline: '' });
         setTimeout(() => window.location.reload(), 1500);
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
  const SUPABASE_URL = 'https://tyeaqluofishcvhvpwrg.supabase.co';

  const loadProjectFiles = async (projectId?: string) => {
    const pid = projectId || uploadProjectId;
    if (!pid) return;
    const { data, error } = await supabase.from('project_documents').select('*').eq('project_id', pid).order('created_at', { ascending: false });
    if (!error && data) setProjectFiles(data);
  };

  useEffect(() => { if (uploadProjectId) loadProjectFiles(uploadProjectId); }, [uploadProjectId]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !uploadProjectId) {
      if (!uploadProjectId) showToast('Atenção', 'Selecione um projeto antes de enviar arquivos.', 'error');
      return;
    }
    setIsUploading(true);
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = `${uploadProjectId}/${Date.now()}_${i}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('project-files').upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) { showToast('Erro', `Falha ao enviar ${file.name}: ${uploadErr.message}`, 'error'); continue; }
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/project-files/${path}`;
      const { error: dbErr } = await supabase.from('project_documents').insert([{
        project_id: uploadProjectId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type
      }]);
      if (!dbErr) successCount++;
    }
    if (successCount > 0) showToast('Sucesso', `${successCount} arquivo(s) enviado(s)!`, 'success');
    await loadProjectFiles();
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

  // === CALENDAR FUNCTIONS ===
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      showToast('Atenção', 'Preencha o título e a data.', 'error');
      return;
    }
    try {
      const { data, error } = await supabase.from('calendar_events').insert([{
        title: newEvent.title,
        event_date: newEvent.event_date,
        start_time: newEvent.start_time || null,
        lead_id: null
      }]).select().single();
      if (error) { showToast('Erro', error.message, 'error'); return; }
      setEvents(prev => [...prev, data]);
      setNewEvent({ title: '', event_date: '', start_time: '', project_id: '' });
      setIsNewEventOpen(false);
      showToast('Sucesso', 'Atividade agendada!', 'success');
    } catch (err: any) { showToast('Erro', err.message, 'error'); }
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from('calendar_events').delete().eq('id', eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
    showToast('Removido', 'Evento removido.', 'success');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const todayEvents = events.filter(e => {
    const d = new Date(e.event_date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const weekEvents = events.filter(e => {
    const d = new Date(e.event_date);
    d.setHours(0, 0, 0, 0);
    return d > today && d <= endOfWeek;
  });
  const futureEvents = events.filter(e => {
    const d = new Date(e.event_date);
    d.setHours(0, 0, 0, 0);
    return d > endOfWeek;
  }).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

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

  const getStatusColor = (s: string) => {
    if (s === 'Convertido') return 'var(--green)';
    if (s === 'Perdido') return 'var(--red)';
    if (s === 'Proposta Enviada' || s === 'Reunião Agendada') return 'var(--gold)';
    return 'var(--t3)';
  };

  const leadStatuses = ['Novo', 'Em Contato', 'Reunião Agendada', 'Proposta Enviada', 'Convertido', 'Perdido'];

  // === CHAT FUNCTIONS ===

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        setMessages(prev => {
          if (prev.some((m: any) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(async ({ data, error }) => {
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
            <div className="pname">{user?.user_metadata?.full_name || 'Parceiro(a)'}</div>
            <div className="prole">Parceiro</div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="sb-sec">Principal</div>
          <div className={navItemClass('dashboard')} onClick={() => navTo('dashboard')}>
            <span className="ni-icon">◈</span>{t('dashboard')}
          </div>

          <div className="sb-sec">{t('myProjects')}</div>
          <div className={navItemClass('projects')} onClick={() => navTo('projects')}>
            <span className="ni-icon">▦</span>{t('activeProjects')}{projects.length > 0 && <span className="badge gold">{projects.length}</span>}
          </div>
          <div className={navItemClass('stages')} onClick={() => navTo('stages')}>
            <span className="ni-icon">☑</span>{t('stagesOfWork')}
          </div>
          <div className={navItemClass('calendar')} onClick={() => navTo('calendar')}>
            <span className="ni-icon">◷</span>{t('calendar')}
          </div>
          <div className={navItemClass('dailylog')} onClick={() => navTo('dailylog')}>
            <span className="ni-icon">📋</span>{t('dailyLog')}
          </div>

          <div className="sb-sec">{t('messaging')}</div>
          <div className={navItemClass('leads')} onClick={() => navTo('leads')}>
            <span className="ni-icon">◎</span>{t('assignedLeads')}{leads.length > 0 && <span className="badge">{leads.length}</span>}
          </div>
          <div className={navItemClass('chat')} onClick={() => navTo('chat')}>
            <span className="ni-icon">💬</span>{t('chat')}
          </div>

          <div className="sb-sec">{t('files')}</div>
          <div className={navItemClass('uploads')} onClick={() => navTo('uploads')}>
            <span className="ni-icon">📷</span>{t('photosDocs')}
          </div>

          <div className="sb-sec">{t('account')}</div>
          <div className={navItemClass('profile')} onClick={() => navTo('profile')}>
            <span className="ni-icon">◉</span>{t('myProfile')}
          </div>
        </div>
        <div className="sb-footer">
          <div className="logout" style={{textAlign:'center'}} onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}>
            🚪 {t('logout')}
          </div>
        </div>
      </nav>
      {/* Mobile sidebar backdrop */}
      <div className={`sb-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>

      {/* MAIN */}
      <div className="main">
        {toastMessage && (
          <div style={{position: 'fixed', bottom: 30, right: 30, background: toastMessage.type === 'error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '15px 20px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '5px'}}>
            <strong style={{fontFamily: "'Syne', sans-serif"}}>{toastMessage.title}</strong>
            <span style={{fontSize: '0.85rem'}}>{toastMessage.msg}</span>
          </div>
        )}
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
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',color:'var(--t3)'}}>Qua, 24 Março 2026</span>
          <div className="theme-btn" onClick={toggleTheme} title="Alternar tema">
            {theme === 'dark' ? '☀️' : '🌙'}
          </div>
        </div>
        
        <div className="content">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="page active">
              <div className="kpi-grid">
                <div className="kpi gold"><div className="kl">Projetos Ativos</div><div className="kv">{projects.length}</div><div className="kc">Em andamento</div></div>
                <div className="kpi green"><div className="kl">Etapas Criadas</div><div className="kv">{stages.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div><div className="kc">Esta semana</div></div>
                <div className="kpi blue"><div className="kl">Mensagens</div><div className="kv">{messages.length}</div><div className="kc">Recebidas</div></div>
                <div className="kpi orange"><div className="kl">Leads Atribuídos</div><div className="kv">{leads.length}</div><div className="kc">Para você</div></div>
              </div>
              <div className="g2">
                <div className="card">
                  <div className="ch"><span className="ct">Próximas Atividades</span><span className="ca" onClick={() => setActiveTab('calendar')}>Ver calendário →</span></div>
                  <div className="cb">
                    {events.length === 0 && <div style={{padding: '20px', textAlign: 'center', color: 'var(--t2)', fontSize: '0.85rem'}}>Nenhuma atividade agendada.</div>}
                    {events.slice(0, 4).map(ev => {
                       const pOpts = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit' } as any;
                       return (
                         <div key={ev.id} className="log-item">
                           <div className="log-date" style={{width: '90px'}}>{new Date(ev.date || ev.start_time).toLocaleString('pt-br', pOpts)}</div>
                           <div className="log-text"><strong>Agenda</strong> — {ev.title}</div>
                         </div>
                       );
                    })}
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><span className="ct">Alertas e Logs</span></div>
                  <div className="cb">
                    {logs.length === 0 && <div style={{padding: '20px', textAlign: 'center', color: 'var(--t2)', fontSize: '0.85rem'}}>Nenhum alerta recente.</div>}
                    {logs.slice(0, 4).map(log => (
                      <div key={log.id} className="alert-item">
                        <div className="aid light-blue"></div>
                        <div className="atxt"><strong>Log:</strong> {log.log_text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <div className="page active">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div><div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase'}}>{projects.length} projetos em andamento</div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem',marginTop:3}}>Meus Projetos Ativos</div></div>
                <button className="btn gold" onClick={handleCreateProject}>Novo Projeto</button>
              </div>
              
              {projects.length === 0 && !loadingDb && (
                <div className="empty-state" style={{padding: '20px', textAlign: 'center'}}>Nenhum projeto encontrado.</div>
              )}
              
              {projects.map((p: any) => (
                <div className="proj-card" key={p.id} onClick={() => { setSelectedProject(p); setActiveTab('stages'); }}>
                  <div className="proj-header">
                    <div><div className="proj-name">{p.name || 'Projeto sem nome'}</div><div className="proj-service">{p.service_type || 'Serviço'}</div></div>
                    <span className={`status-badge ${p.status === 'active' ? 'active' : 'pending'}`}>{p.status || 'Ativo'}</span>
                  </div>
                  <div className="prog-bar"><div className="prog-fill" style={{width:`${p.progress || 0}%`}}></div></div>
                  <div className="prog-info"><span>Progresso</span><span style={{color:'var(--gold)'}}>{p.progress || 0}%</span></div>
                  <div className="proj-meta"><span>📅 Início: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/D'}</span><span>🏁 Entrega: {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/D'}</span><span style={{color:'var(--green)'}}>💰 ${p.contract_value ? Number(p.contract_value).toLocaleString() : '0'}</span></div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stages' && (
            <div className="page active">
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase'}}>Gerenciamento de Etapas</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem',marginTop:3}}>Etapas de Execução</div>
              </div>

              {/* Project selector */}
              <div className="card" style={{marginBottom:14}}>
                <div className="ch"><span className="ct">Selecionar Projeto</span></div>
                <div className="cb">
                  <select
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--b)',borderRadius:6,padding:'10px 12px',color:'var(--text)',fontFamily:"'DM Sans',sans-serif",fontSize:'0.85rem',outline:'none'}}
                    value={selectedProject?.id || ''}
                    onChange={e => {
                      const proj = projects.find(p => p.id === e.target.value);
                      setSelectedProject(proj || null);
                    }}
                  >
                    <option value="">-- Escolha um projeto --</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
                  </select>
                </div>
              </div>

              {selectedProject && (
                <>
                  {/* Progress overview */}
                  <div className="card" style={{marginBottom:14}}>
                    <div className="ch"><span className="ct">📊 Progresso: {selectedProject.name}</span><span className="ca" style={{color:'var(--gold)'}}>{selectedProject.progress || 0}%</span></div>
                    <div className="cb">
                      <div className="prog-bar" style={{height:12,borderRadius:6,marginBottom:12}}><div className="prog-fill" style={{width:`${selectedProject.progress || 0}%`,borderRadius:6,transition:'width 0.3s'}}></div></div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'var(--t3)'}}>
                        <span>{projectStages.filter(s => s.status === 'completed').length} de {projectStages.length} etapas concluídas</span>
                        <span>📅 Prazo: {selectedProject.deadline ? new Date(selectedProject.deadline).toLocaleDateString() : 'Não definido'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Add new stage */}
                  <div className="card" style={{marginBottom:14}}>
                    <div className="ch"><span className="ct">➕ Adicionar Nova Etapa</span></div>
                    <div className="cb">
                      <div style={{display:'flex',gap:10}}>
                        <input
                          type="text"
                          className="f-inp"
                          placeholder="Ex: Fundação, Alvenaria, Acabamento..."
                          value={newStageName}
                          onChange={e => setNewStageName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addStage()}
                          style={{flex:1}}
                        />
                        <button className="btn gold" onClick={addStage} style={{whiteSpace:'nowrap'}}>+ Adicionar</button>
                      </div>
                    </div>
                  </div>

                  {/* Stages list */}
                  <div className="card">
                    <div className="ch"><span className="ct">📋 Etapas do Projeto</span><span className="ca">{projectStages.length} etapas</span></div>
                    <div className="cb" style={{padding:0}}>
                      {projectStages.length === 0 && <div style={{padding:'25px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhuma etapa criada ainda. Adicione a primeira etapa acima!</div>}
                      {projectStages.sort((a: any, b: any) => a.order_index - b.order_index).map((stg: any, idx: number) => (
                        <div key={stg.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--b)',transition:'background 0.15s',cursor:'pointer'}} onClick={() => toggleStage(stg.id, stg.status)}>
                          <div style={{width:24,height:24,borderRadius:6,border: stg.status === 'completed' ? '2px solid var(--green)' : '2px solid var(--b)',background: stg.status === 'completed' ? 'var(--green)' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',color:'#fff',flexShrink:0,transition:'all 0.2s'}}>{stg.status === 'completed' && '✓'}</div>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,fontSize:'0.88rem',textDecoration: stg.status === 'completed' ? 'line-through' : 'none',color: stg.status === 'completed' ? 'var(--t3)' : 'var(--text)',transition:'all 0.2s'}}>{idx + 1}. {stg.name}</div>
                            <div style={{fontSize:'0.7rem',color:'var(--t3)',marginTop:2}}>{stg.status === 'completed' ? 'Concluída ✓' : stg.status === 'in_progress' ? 'Em andamento' : 'Pendente'}</div>
                          </div>
                          <button className="btn ghost" style={{fontSize:'0.7rem',padding:'4px 10px',color:'var(--red)'}} onClick={(e) => { e.stopPropagation(); deleteStage(stg.id); }}>🗑</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{marginTop:16,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                    <button className="btn gold" onClick={() => showToast('Salvo', 'Progresso sincronizado com Bravo Homes!', 'success')}>💾 Salvar progresso</button>
                    <button className="btn ghost" onClick={() => { if (selectedProject) setUploadProjectId(selectedProject.id); setActiveTab('uploads'); }}>📷 Enviar fotos desta etapa</button>
                  </div>
                </>
              )}

              {!selectedProject && (
                <div className="card">
                  <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
                    <div style={{fontSize:'2rem',marginBottom:10}}>📋</div>
                    <div style={{fontSize:'0.9rem',marginBottom:6}}>Selecione um projeto acima para gerenciar suas etapas</div>
                    <div style={{fontSize:'0.75rem'}}>Ou clique em um projeto na aba <strong style={{color:'var(--gold)',cursor:'pointer'}} onClick={() => setActiveTab('projects')}>Projetos Ativos</strong></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>Calendário de Obras</div>
                <button className="btn gold" onClick={() => setIsNewEventOpen(true)}>+ Atividade</button>
              </div>

              {/* New event form */}
              {isNewEventOpen && (
                <div className="card" style={{marginBottom:14,border:'1px solid var(--gold)'}}>
                  <div className="ch"><span className="ct">➕ Nova Atividade</span><span className="ca" style={{cursor:'pointer'}} onClick={() => setIsNewEventOpen(false)}>✕ Fechar</span></div>
                  <div className="cb">
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                      <div>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Título *</label>
                        <input className="f-inp" style={{width:'100%'}} placeholder="Ex: Vistoria da fundação" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                      </div>
                      <div>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Projeto (opcional)</label>
                        <select className="f-inp" style={{width:'100%'}} value={newEvent.project_id} onChange={e => setNewEvent({...newEvent, project_id: e.target.value})}>
                          <option value="">-- Geral --</option>
                          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                      <div>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Data *</label>
                        <input className="f-inp" type="date" style={{width:'100%'}} value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} />
                      </div>
                      <div>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Horário</label>
                        <input className="f-inp" type="time" style={{width:'100%'}} value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} />
                      </div>
                    </div>
                    <button className="btn gold" onClick={addEvent}>📅 Agendar Atividade</button>
                  </div>
                </div>
              )}

              <div className="card" style={{ flex: 1, padding: '16px', background: 'var(--bg2)' }}>
                <style dangerouslySetInnerHTML={{__html: `
                  .fc { color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.85rem; }
                  .fc-theme-standard th, .fc-theme-standard td, .fc-theme-standard .fc-scrollgrid { border-color: var(--b); }
                  .fc-button-primary { background-color: var(--bg3) !important; border-color: var(--b) !important; color: var(--text) !important; text-transform: capitalize; }
                  .fc-button-primary:hover { background-color: var(--gold) !important; color: #000 !important; border-color: var(--gold) !important; }
                  .fc-button-active { background-color: var(--gold) !important; color: #000 !important; }
                  .fc-toolbar-title { font-family: 'Syne', sans-serif; font-size: 1.2rem !important; color: var(--gold); text-transform: capitalize; }
                  .fc-day-today { background-color: rgba(201, 148, 58, 0.05) !important; }
                  .fc-event { cursor: pointer; border-radius: 4px; padding: 2px 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
                  .fc-timegrid-slot-label { color: var(--t2); }
                  .fc-col-header-cell-cushion { color: var(--t2); text-decoration: none; padding: 8px !important; }
                `}} />
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  locale="pt-br"
                  buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
                  events={events.map((e: any) => {
                    const startStr = e.start_time ? `${e.event_date}T${e.start_time}` : e.event_date;
                    return {
                      id: e.id,
                      title: e.title,
                      start: startStr,
                      backgroundColor: 'var(--gold)',
                      borderColor: 'var(--gold)',
                      textColor: '#000',
                    };
                  })}
                  editable={true}
                  droppable={true}
                  eventDrop={async (info: any) => {
                    const newDate = info.event.start;
                    const dateStr = newDate.toISOString().split('T')[0];
                    const timeStr = newDate.toTimeString().substring(0, 5);
                    await supabase.from('calendar_events').update({ event_date: dateStr, start_time: timeStr }).eq('id', info.event.id);
                    setEvents((prev: any[]) => prev.map(ev => ev.id === info.event.id ? { ...ev, event_date: dateStr, start_time: timeStr } : ev));
                    showToast('Atualizado', 'Evento reagendado!', 'success');
                  }}
                  eventClick={async (info: any) => {
                    if (confirm(`Deseja excluir "${info.event.title}"?`)) {
                      await deleteEvent(info.event.id);
                      info.event.remove();
                    }
                  }}
                  dateClick={(info: any) => {
                    const clickedDate = info.dateStr?.substring(0, 10) || '';
                    const clickedTime = info.dateStr?.substring(11, 16) || new Date().toTimeString().substring(0, 5);
                    setNewEvent({ title: '', event_date: clickedDate, start_time: clickedTime, project_id: '' });
                    setIsNewEventOpen(true);
                  }}
                  height="auto"
                  slotMinTime="07:00:00"
                  slotMaxTime="20:00:00"
                  allDaySlot={true}
                />
              </div>
            </div>
          )}

          {/* DAILY LOG */}
          {activeTab === 'dailylog' && (
            <div className="page active">
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase'}}>Registro diário de atividades</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem',marginTop:3}}>Log Diário de Atividades</div>
              </div>

              {/* Form */}
              <div className="card" style={{marginBottom:14}}>
                <div className="ch"><span className="ct">📝 Registrar hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                <div className="cb">
                  <div style={{marginBottom:12}}>
                    <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Projeto *</label>
                    <select className="f-inp" value={logForm.project_id} onChange={e => setLogForm({...logForm, project_id: e.target.value})}>
                      <option value="">-- Selecione o projeto --</option>
                      {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>O que foi feito hoje? *</label>
                    <textarea className="f-inp" style={{resize:'vertical',minHeight:100}} placeholder="Descreva as atividades realizadas hoje na obra..." value={logForm.log_text} onChange={e => setLogForm({...logForm, log_text: e.target.value})}></textarea>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase',display:'block',marginBottom:6}}>Materiais utilizados</label>
                    <input className="f-inp" type="text" placeholder="Ex: 40 azulejos 60x60, argamassa, rejunte..." value={logForm.materials} onChange={e => setLogForm({...logForm, materials: e.target.value})} />
                  </div>
                  <button className="btn gold" onClick={submitLog} disabled={isSavingLog} style={{opacity: isSavingLog ? 0.6 : 1}}>
                    {isSavingLog ? '⏳ Salvando...' : '💾 Salvar log do dia'}
                  </button>
                </div>
              </div>

              {/* History */}
              <div className="card">
                <div className="ch"><span className="ct">📚 Histórico de Logs</span><span className="ca">{logs.length} registro(s)</span></div>
                <div className="cb" style={{padding: logs.length === 0 ? undefined : 0}}>
                  {logs.length === 0 && <div style={{padding:'20px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhum log submetido ainda. Registre suas atividades diárias acima.</div>}
                  {logs.map((log: any) => (
                    <div key={log.id} style={{padding:'14px 16px',borderBottom:'1px solid var(--b)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:'var(--gold)',flexShrink:0}}></div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--gold)'}}>
                            {new Date(log.created_at).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {' • '}
                            {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {log.project_id && <span style={{fontSize:'0.65rem',background:'var(--gd)',color:'var(--gold)',borderRadius:4,padding:'2px 8px',fontWeight:600}}>{getProjectName(log.project_id)}</span>}
                        </div>
                        <button className="btn ghost" style={{fontSize:'0.65rem',padding:'3px 8px',color:'var(--red)'}} onClick={() => deleteLog(log.id)}>🗑</button>
                      </div>
                      <div style={{fontSize:'0.85rem',color:'var(--text)',lineHeight:1.6,whiteSpace:'pre-wrap',paddingLeft:16}}>{log.log_text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEADS */}
          {activeTab === 'leads' && (
            <div className="page active">
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)',letterSpacing:1,textTransform:'uppercase'}}>{leads.length} leads atribuídos</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem',marginTop:3}}>Leads Atribuídos</div>
              </div>
              
              {leads.length === 0 && !loadingDb && (
                <div className="card">
                  <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
                    <div style={{fontSize:'2rem',marginBottom:10}}>🎯</div>
                    <div style={{fontSize:'0.9rem',marginBottom:6}}>Nenhum lead atribuído a você no momento</div>
                    <div style={{fontSize:'0.75rem'}}>Quando a equipe Bravo encaminhar clientes potenciais, eles aparecerão aqui para você gerenciar</div>
                  </div>
                </div>
              )}

              {leads.map((l: any) => (
                <div className="card" key={l.id} style={{marginBottom:10,border: expandedLead === l.id ? '1px solid var(--gold)' : undefined}}>
                  {/* Header - always visible */}
                  <div style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}} onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:getUrgencyColor(l.urgency || ''),flexShrink:0}}></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:'0.92rem'}}>{l.name || 'Sem nome'}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)',marginTop:2}}>{l.service_type || 'Serviço'} · {l.city || 'Cidade n/d'} · {l.source || 'Manual'}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:'0.72rem',fontWeight:600,color:getStatusColor(l.status || 'Novo'),marginBottom:2}}>{l.status || 'Novo'}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)'}}>{l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : ''}</div>
                    </div>
                    <span style={{color:'var(--t3)',fontSize:'0.7rem'}}>{expandedLead === l.id ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded details */}
                  {expandedLead === l.id && (
                    <div style={{padding:'0 16px 16px',borderTop:'1px solid var(--b)'}}>
                      {/* Contact info */}
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14,marginBottom:14}}>
                        <div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Telefone</div>
                          <div style={{fontSize:'0.88rem',fontWeight:600}}>{l.phone || 'Não informado'}</div>
                        </div>
                        <div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>E-mail</div>
                          <div style={{fontSize:'0.88rem',fontWeight:600,wordBreak:'break-all'}}>{l.email || 'Não informado'}</div>
                        </div>
                        <div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Urgência</div>
                          <div style={{fontSize:'0.82rem',fontWeight:600,color:getUrgencyColor(l.urgency || '')}}>
                            {l.urgency === 'alta' || l.urgency === 'hot' ? '🔴 Alta' : l.urgency === 'media' || l.urgency === 'warm' ? '🟠 Média' : '🟢 Baixa'}
                          </div>
                        </div>
                        <div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Serviço</div>
                          <div style={{fontSize:'0.82rem',fontWeight:600}}>{l.service_type || 'N/D'}</div>
                        </div>
                      </div>

                      {/* Quick contact buttons */}
                      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                        {l.phone && (
                          <a href={`sms:${l.phone}`} className="btn gold" style={{fontSize:'0.75rem',padding:'6px 14px',textDecoration:'none'}}>💬 SMS</a>
                        )}
                        {l.phone && (
                          <a href={`tel:${l.phone}`} className="btn ghost" style={{fontSize:'0.75rem',padding:'6px 14px',textDecoration:'none'}}>📞 Call</a>
                        )}
                        {l.phone && (
                          <a href={`https://wa.me/1${l.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="btn ghost" style={{fontSize:'0.75rem',padding:'6px 14px',textDecoration:'none'}}>📱 WhatsApp</a>
                        )}
                        {l.email && (
                          <a href={`mailto:${l.email}`} className="btn ghost" style={{fontSize:'0.75rem',padding:'6px 14px',textDecoration:'none'}}>✉️ E-mail</a>
                        )}
                      </div>

                      {/* Status selector */}
                      <div style={{marginBottom:14}}>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:6}}>Status do Lead</label>
                        <select className="f-inp" value={l.status || 'Novo'} onChange={e => updateLeadStatus(l.id, e.target.value)}>
                          {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Notes */}
                      <div style={{marginBottom:14}}>
                        <label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:6}}>Observações</label>
                        <textarea className="f-inp" style={{resize:'vertical',minHeight:70}} placeholder="Anote informações sobre este lead..." value={leadNotes[l.id] !== undefined ? leadNotes[l.id] : (l.notes || '')} onChange={e => setLeadNotes(prev => ({...prev, [l.id]: e.target.value}))}></textarea>
                        {leadNotes[l.id] !== undefined && leadNotes[l.id] !== (l.notes || '') && (
                          <button className="btn gold" style={{marginTop:6,fontSize:'0.72rem',padding:'5px 14px'}} onClick={() => saveLeadNotes(l.id)}>💾 Salvar observações</button>
                        )}
                      </div>

                      {/* Delete */}
                      <div style={{display:'flex',justifyContent:'flex-end'}}>
                        <button className="btn ghost" style={{fontSize:'0.7rem',padding:'5px 12px',color:'var(--red)'}} onClick={() => deleteLead(l.id)}>🗑 Remover lead</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CHAT */}
          {activeTab === 'chat' && (
            <div className="page active">
              <div style={{display:'flex',height:'calc(100vh - 100px)',background:'var(--bg2)',border:'1px solid var(--b)',borderRadius:10,overflow:'hidden'}}>
                {/* Sidebar */}
                <div style={{width:260,borderRight:'1px solid var(--b)',display:'flex',flexDirection:'column',flexShrink:0}}>
                  <div style={{padding:'14px 16px',borderBottom:'1px solid var(--b)',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.85rem'}}>Conversas</div>
                  <div style={{flex:1,overflowY:'auto'}}>
                    <div onClick={() => setChatTab('admin')} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',cursor:'pointer',background:chatTab === 'admin' ? 'var(--gd)' : 'transparent',borderLeft:`3px solid ${chatTab === 'admin' ? 'var(--gold)' : 'transparent'}`,transition:'all .15s'}}>
                      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--gd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:700,color:'var(--gold)',flexShrink:0}}>BH</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:'0.82rem',fontWeight:600}}>Bravo Homes Admin</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)'}}>Admin · Suporte / Coordenação</div>
                      </div>
                      {messages.filter((m: any) => m.topic === 'admin').length > 0 && <span className="badge gold" style={{fontSize:'0.6rem'}}>{messages.filter((m: any) => m.topic === 'admin').length}</span>}
                    </div>
                    {/* Individual client conversations - only those with messages */}
                    <div style={{padding:'10px 14px 4px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1}}>Clientes ({chatClients.length})</div>
                    {chatClients.length === 0 && <div style={{padding:'8px 14px',fontSize:'0.75rem',color:'var(--t3)',fontStyle:'italic'}}>Nenhum cliente</div>}
                    {chatClients.map((c: any) => {
                      const isSelected = chatTab === 'client' && selectedChatClient?.id === c.id;
                      const unread = messages.filter((m: any) => m.sender_id === c.id && m.receiver_id === user?.id).length;
                      return (
                        <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',cursor:'pointer',background:isSelected ? 'var(--gd)' : 'transparent',borderLeft:`3px solid ${isSelected ? 'var(--gold)' : 'transparent'}`,position:'relative'}} onClick={() => { setChatTab('client'); setSelectedChatClient(c); }}>
                          <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(46,204,113,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:700,color:'var(--green)',flexShrink:0}}>{(c.name || 'CL').substring(0,2).toUpperCase()}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name || 'Cliente'}</div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--t3)'}}>{c.email || c.phone || ''}</div>
                          </div>
                          {unread > 0 && <span className="badge gold" style={{fontSize:'0.55rem'}}>{unread}</span>}
                          <button title="Apagar conversa" onClick={(e) => { e.stopPropagation(); setDeleteConfirmClient(c); }} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:'0.85rem',padding:'4px',color:'var(--t3)',opacity:0.6,transition:'opacity .15s'}} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}>🗑️</button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chat area */}
                <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
                  {/* Header */}
                  <div style={{padding:'14px 18px',borderBottom:'1px solid var(--b)',display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:chatTab === 'client' ? 'rgba(46,204,113,0.2)' : 'var(--gd)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'0.7rem',color:chatTab === 'client' ? 'var(--green)' : 'var(--gold)',flexShrink:0}}>{chatTab === 'client' ? (selectedChatClient?.name || 'CL').substring(0,2).toUpperCase() : 'BH'}</div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'0.88rem'}}>{chatTab === 'client' ? (selectedChatClient?.name || 'Selecione um cliente') : 'Bravo Homes Admin'}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.68rem',color:'var(--t3)'}}>{chatTab === 'client' ? 'Conversa individual' : 'Admin · Suporte'} · 🟢 Real-time</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{flex:1,overflowY:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}}>
                    {channelMessages.length === 0 && <div style={{fontSize:'0.8rem',color:'var(--t3)',textAlign:'center',marginTop:40}}>No messages yet. Start the conversation below. 💬</div>}
                    {channelMessages.map((m: any) => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} style={{alignSelf:isMine ? 'flex-end' : 'flex-start',maxWidth:'70%'}}>
                          <div style={{background:isMine ? 'var(--gold)' : 'var(--bg3)',color:isMine ? '#000' : 'var(--text)',padding:'10px 14px',borderRadius:isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',fontSize:'0.88rem',lineHeight:1.5}}>
                            {/* Text */}
                            {(!m.payload?.msg_type || m.payload?.msg_type === 'text') && m.content}
                            {/* Image */}
                            {m.payload?.msg_type === 'image' && m.payload?.url && (
                              <a href={m.payload.url} target="_blank" rel="noreferrer"><img src={m.payload.url} alt="" style={{maxWidth:240,borderRadius:8,display:'block'}} /></a>
                            )}
                            {/* File */}
                            {m.payload?.msg_type === 'file' && m.payload?.url && (
                              <a href={m.payload.url} target="_blank" rel="noreferrer" style={{color:isMine ? '#000' : 'var(--gold)',textDecoration:'underline',fontWeight:600}}>📎 {m.payload.name || 'Download'}</a>
                            )}
                            {/* Audio */}
                            {m.payload?.msg_type === 'audio' && m.payload?.url && (
                              <audio controls src={m.payload.url} style={{maxWidth:240}} />
                            )}
                          </div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',color:'var(--t3)',marginTop:3,textAlign:isMine ? 'right' : 'left'}}>
                            {m.created_at ? new Date(m.created_at).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : ''}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input bar */}
                  <div style={{padding:'12px 16px',borderTop:'1px solid var(--b)',display:'flex',gap:8,alignItems:'center'}}>
                    <input ref={chatFileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{display:'none'}} onChange={e => sendChatFile(e.target.files)} />
                    <button className="btn ghost" style={{padding:'8px 10px',fontSize:'1rem',flexShrink:0}} onClick={() => chatFileRef.current?.click()} title="Attach file">📎</button>
                    <button className={`btn ${isRecording ? 'gold' : 'ghost'}`} style={{padding:'8px 10px',fontSize:'1rem',flexShrink:0,animation:isRecording ? 'pulse 1s infinite' : 'none'}} onClick={isRecording ? stopRecording : startRecording} title={isRecording ? 'Stop recording' : 'Record audio'}>🎤</button>
                    <input className="chat-input" style={{flex:1}} placeholder={isRecording ? '🔴 Recording... click mic to stop' : 'Type your message...'} value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(chatMsg); }}} disabled={isRecording} />
                    <button className="btn gold" onClick={() => sendMessage(chatMsg)} disabled={isRecording || !chatMsg.trim()}>Send</button>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="page active">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>Fotos &amp; Documentos</div>
              </div>

              {/* Project selector */}
              <div className="card" style={{marginBottom:14}}>
                <div className="ch"><span className="ct">📁 Selecionar Projeto</span></div>
                <div className="cb">
                  <select
                    style={{width:'100%',background:'var(--bg3)',border:'1px solid var(--b)',borderRadius:6,padding:'10px 12px',color:'var(--text)',fontFamily:"'DM Sans',sans-serif",fontSize:'0.85rem',outline:'none'}}
                    value={uploadProjectId}
                    onChange={e => setUploadProjectId(e.target.value)}
                  >
                    <option value="">-- Escolha um projeto --</option>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.service_type}</option>)}
                  </select>
                </div>
              </div>

              {uploadProjectId && (
                <>
                  {/* Upload zone */}
                  <div className="card" style={{marginBottom:14}}>
                    <div className="ch"><span className="ct">📸 Enviar Arquivos</span></div>
                    <div className="cb">
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" style={{display:'none'}} onChange={e => handleFileUpload(e.target.files)} />
                      <div
                        className="upload-zone"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; }}
                        onDragLeave={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--b)'; handleFileUpload(e.dataTransfer.files); }}
                        style={{cursor: isUploading ? 'wait' : 'pointer', opacity: isUploading ? 0.6 : 1}}
                      >
                        <div className="upload-icon">{isUploading ? '⏳' : '📸'}</div>
                        <div className="upload-text">{isUploading ? 'Enviando arquivos...' : 'Clique ou arraste fotos/documentos aqui'}</div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',marginTop:6}}>JPG, PNG, PDF, DOC, XLS · Vários arquivos de uma vez</div>
                      </div>
                    </div>
                  </div>

                  {/* Photo gallery */}
                  {projectFiles.filter(f => f.file_type?.startsWith('image/')).length > 0 && (
                    <div className="card" style={{marginBottom:14}}>
                      <div className="ch"><span className="ct">🖼️ Galeria de Fotos</span><span className="ca">{projectFiles.filter(f => f.file_type?.startsWith('image/')).length} fotos</span></div>
                      <div className="cb">
                        <div className="photo-grid">
                          {projectFiles.filter(f => f.file_type?.startsWith('image/')).map((f: any) => (
                            <div key={f.id} className="photo-thumb" style={{backgroundImage: `url(${f.file_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative'}}>
                              <div style={{position:'absolute',top:4,right:4,display:'flex',gap:4}}>
                                <a href={f.file_url} target="_blank" rel="noreferrer" style={{background:'rgba(0,0,0,0.6)',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',textDecoration:'none'}} onClick={e => e.stopPropagation()}>🔍</a>
                                <button style={{background:'rgba(200,0,0,0.7)',border:'none',borderRadius:4,padding:'2px 6px',fontSize:'0.65rem',color:'#fff',cursor:'pointer'}} onClick={e => { e.stopPropagation(); deleteFile(f); }}>✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Documents list */}
                  <div className="card">
                    <div className="ch"><span className="ct">📄 Documentos do Projeto</span><span className="ca">{projectFiles.filter(f => !f.file_type?.startsWith('image/')).length} docs</span></div>
                    <div className="cb" style={{padding: projectFiles.filter(f => !f.file_type?.startsWith('image/')).length === 0 ? undefined : 0}}>
                      {projectFiles.filter(f => !f.file_type?.startsWith('image/')).length === 0 && (
                        <div style={{padding:'20px',textAlign:'center',color:'var(--t3)',fontSize:'0.85rem'}}>Nenhum documento enviado ainda.</div>
                      )}
                      {projectFiles.filter(f => !f.file_type?.startsWith('image/')).map((f: any) => (
                        <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid var(--b)'}}>
                          <span style={{fontSize:'1.4rem'}}>{getFileIcon(f.file_type)}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:'0.82rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.file_name}</div>
                            <div style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',color:'var(--t3)',textTransform:'uppercase'}}>{f.file_type?.split('/').pop()} · {new Date(f.created_at).toLocaleDateString()}</div>
                          </div>
                          <a href={f.file_url} target="_blank" rel="noreferrer" className="btn ghost" style={{fontSize:'0.72rem',padding:'5px 12px',textDecoration:'none'}}>Ver</a>
                          <button className="btn ghost" style={{fontSize:'0.72rem',padding:'5px 10px',color:'var(--red)'}} onClick={() => deleteFile(f)}>🗑</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!uploadProjectId && (
                <div className="card">
                  <div className="cb" style={{padding:'30px',textAlign:'center',color:'var(--t3)'}}>
                    <div style={{fontSize:'2rem',marginBottom:10}}>📁</div>
                    <div style={{fontSize:'0.9rem'}}>Selecione um projeto acima para gerenciar fotos e documentos</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="page active">
              <div style={{marginBottom:16}}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>My Partner Profile</div></div>
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {/* ROW 1: Personal Info + Notifications */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'stretch'}}>
                  {/* Personal Info */}
                  <div className="card">
                    <div className="ch">
                      <span className="ct">Personal Information</span>
                      {!profileEditing ? (
                        <span className="ca" style={{cursor:'pointer'}} onClick={() => setProfileEditing(true)}>Edit</span>
                      ) : (
                        <div style={{display:'flex',gap:6}}>
                          <span className="ca" style={{cursor:'pointer',color:'var(--red)'}} onClick={() => { setProfileEditing(false); setProfileForm(profileData); }}>Cancel</span>
                          <span className="ca" style={{cursor:'pointer',color:'var(--green)'}} onClick={saveProfile}>{profileSaving ? 'Saving...' : 'Save'}</span>
                        </div>
                      )}
                    </div>
                    <div className="cb">
                      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
                        <input ref={profileAvatarRef} type="file" accept="image/*" style={{display:'none'}} onChange={e => uploadAvatar(e.target.files)} />
                        <div onClick={() => profileAvatarRef.current?.click()} style={{width:56,height:56,borderRadius:'50%',cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--gold)',position:'relative',flexShrink:0}}>
                          {profileData?.avatar_url ? (
                            <img src={profileData.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                          ) : (
                            <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'1.1rem',color:'var(--bg)'}}>{(profileData?.full_name || 'PR').substring(0,2).toUpperCase()}</span>
                          )}
                          <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(0,0,0,0.5)',textAlign:'center',fontSize:'0.5rem',color:'#fff',padding:'2px 0'}}>📷</div>
                        </div>
                        <div style={{flex:1}}>
                          {profileEditing ? (
                            <input className="f-inp" value={profileForm.full_name || ''} onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} placeholder="Full Name" style={{fontWeight:700,fontSize:'1rem',marginBottom:4}} />
                          ) : (
                            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1rem'}}>{profileData?.full_name || 'Partner'}</div>
                          )}
                          <div style={{fontSize:'0.78rem',color:'var(--t2)'}}>{profileData?.specialty || 'Certified Specialist'}</div>
                          <div style={{color:'var(--gold)',fontSize:'0.75rem',marginTop:2}}>★★★★★ 5.0 (Bravo Verified)</div>
                        </div>
                      </div>
                      {profileEditing ? (
                        <div style={{display:'flex',flexDirection:'column',gap:10}}>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Phone</label><input className="f-inp" value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} placeholder="(407) 555-1234" /></div>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Specialty</label><select className="f-inp" value={profileForm.specialty || ''} onChange={e => setProfileForm({...profileForm, specialty: e.target.value})}><option value="">Select...</option><option value="General Contractor">General Contractor</option><option value="Kitchen Remodel">Kitchen Remodel</option><option value="Bathroom Remodel">Bathroom Remodel</option><option value="Full Home Renovation">Full Home Renovation</option><option value="Painting & Finishing">Painting & Finishing</option><option value="Flooring">Flooring</option><option value="Electrical">Electrical</option><option value="Plumbing">Plumbing</option><option value="Roofing">Roofing</option></select></div>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Company Name</label><input className="f-inp" value={profileForm.company_name || ''} onChange={e => setProfileForm({...profileForm, company_name: e.target.value})} placeholder="Your Company LLC" /></div>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>License Number</label><input className="f-inp" value={profileForm.license_number || ''} onChange={e => setProfileForm({...profileForm, license_number: e.target.value})} placeholder="CGC-123456" /></div>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>City</label><input className="f-inp" value={profileForm.city || ''} onChange={e => setProfileForm({...profileForm, city: e.target.value})} placeholder="Orlando" /></div>
                            <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>State</label><select className="f-inp" value={profileForm.state || ''} onChange={e => setProfileForm({...profileForm, state: e.target.value})}><option value="">Select...</option><option value="FL">Florida</option><option value="TX">Texas</option><option value="CA">California</option><option value="NY">New York</option><option value="GA">Georgia</option><option value="NC">North Carolina</option><option value="NJ">New Jersey</option><option value="PA">Pennsylvania</option></select></div>
                          </div>
                          <div><label style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',color:'var(--t3)',textTransform:'uppercase',letterSpacing:1,display:'block',marginBottom:4}}>Bio / About</label><textarea className="f-inp" style={{resize:'vertical',minHeight:60}} value={profileForm.bio || ''} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} placeholder="Tell clients about your experience and expertise..." /></div>
                        </div>
                      ) : (
                        <>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                            <div className="log-item"><div className="log-date">E-mail</div><div className="log-text">{user?.email || 'Not listed'}</div></div>
                            <div className="log-item"><div className="log-date">Company</div><div className="log-text">{profileData?.company_name || 'Not set'}</div></div>
                            <div className="log-item"><div className="log-date">Phone</div><div className="log-text">{profileData?.phone || 'Not set'}</div></div>
                            <div className="log-item"><div className="log-date">License</div><div className="log-text">{profileData?.license_number || 'Not set'}</div></div>
                            <div className="log-item"><div className="log-date">Specialty</div><div className="log-text">{profileData?.specialty || 'Not set'}</div></div>
                            <div className="log-item"><div className="log-date">Location</div><div className="log-text">{profileData?.city && profileData?.state ? `${profileData.city}, ${profileData.state}` : 'Not set'}</div></div>
                          </div>
                          {profileData?.bio && <div style={{marginTop:10,padding:'10px 14px',background:'var(--bg3)',borderRadius:8,fontSize:'0.82rem',color:'var(--t2)',lineHeight:1.6}}>{profileData.bio}</div>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="card">
                    <div className="ch"><span className="ct">🔔 Notification Preferences</span></div>
                    <div className="cb">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>Email Notifications</div><div style={{fontSize:'0.72rem',color:'var(--t3)'}}>New leads, project updates, messages</div></div>
                        <div onClick={() => toggleNotif('notifications_email', !profileForm.notifications_email)} style={{width:44,height:24,borderRadius:12,background:profileForm.notifications_email ? 'var(--green)' : 'var(--bg3)',cursor:'pointer',position:'relative',transition:'background .2s'}}><div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:profileForm.notifications_email ? 22 : 2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}} /></div>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div><div style={{fontWeight:600,fontSize:'0.85rem'}}>SMS Notifications</div><div style={{fontSize:'0.72rem',color:'var(--t3)'}}>Urgent updates and lead alerts</div></div>
                        <div onClick={() => toggleNotif('notifications_sms', !profileForm.notifications_sms)} style={{width:44,height:24,borderRadius:12,background:profileForm.notifications_sms ? 'var(--green)' : 'var(--bg3)',cursor:'pointer',position:'relative',transition:'background .2s'}}><div style={{width:20,height:20,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:profileForm.notifications_sms ? 22 : 2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}} /></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Password + Language */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,alignItems:'stretch'}}>
                  <div className="card">
                    <div className="ch"><span className="ct">🔒 Change Password</span></div>
                    <div className="cb">
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        <input className="f-inp" type="password" placeholder="New password (min 6 chars)" value={passwordForm.newPass} onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})} />
                        <input className="f-inp" type="password" placeholder="Confirm new password" value={passwordForm.confirmPass} onChange={e => setPasswordForm({...passwordForm, confirmPass: e.target.value})} />
                        <button className="btn gold" onClick={changePassword} disabled={passwordSaving || !passwordForm.newPass} style={{opacity: passwordSaving || !passwordForm.newPass ? 0.6 : 1}}>{passwordSaving ? 'Changing...' : '🔒 Update Password'}</button>
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
          )}

        </div>
      </div>

      {/* NOVO PROJETO MODAL */}
      {isNewProjectOpen && (
        <div className="modal-overlay open" onClick={() => setIsNewProjectOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '450px'}}>
            <div className="modal-head">
              <div className="modal-title">Criar Novo Projeto</div>
              <button className="dclose" onClick={() => setIsNewProjectOpen(false)}>✕</button>
            </div>
            <form onSubmit={submitProjectForm}>
              <div className="modal-body">
                <div className="f-row" style={{marginBottom: '15px'}}>
                  <div style={{width: '100%'}}>
                    <label className="f-label">Nome do Projeto *</label>
                    <input required type="text" className="f-inp" placeholder="Ex: Reforma Johnson" value={newProjectForm.name} onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})} />
                  </div>
                </div>
                <div className="f-row" style={{marginBottom: '15px'}}>
                  <div style={{width: '100%'}}>
                    <label className="f-label">Tipo de Serviço *</label>
                    <select required className="f-inp" value={newProjectForm.service_type} onChange={e => setNewProjectForm({...newProjectForm, service_type: e.target.value})}>
                      <option value="Reforma Completa">Reforma Completa</option>
                      <option value="Bathroom Remodel">Bathroom Remodel</option>
                      <option value="Kitchen Remodel">Kitchen Remodel</option>
                      <option value="Pintura e Acabamento">Pintura e Acabamento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="f-row" style={{marginBottom: '20px', display: 'flex', gap: '15px'}}>
                  <div style={{flex: 1}}>
                    <label className="f-label" style={{whiteSpace: 'nowrap'}}>Valor Estimado ($)</label>
                    <input type="number" className="f-inp" placeholder="Ex: 25000" value={newProjectForm.contract_value} onChange={e => setNewProjectForm({...newProjectForm, contract_value: e.target.value})} />
                  </div>
                  <div style={{flex: 1}}>
                    <label className="f-label" style={{whiteSpace: 'nowrap'}}>Prazo de Entrega</label>
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
