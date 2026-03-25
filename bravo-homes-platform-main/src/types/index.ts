import type { User } from '@supabase/supabase-js';

// ============================================
// Database Table Types (Supabase)
// ============================================

export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'parceiro' | 'cliente';
  avatar_url?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  source?: string;
  created_at?: string;
}

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status: string;
  service_type?: string;
  source?: string;
  notes?: string;
  score?: number;
  estimated_value?: number;
  city?: string;
  partner_id?: string;
  client_id?: string;
  urgency?: string;
  assigned_partners?: string[];
  created_at?: string;
  updated_at?: string;
  clients?: Client;
}

export interface Project {
  id: string;
  name: string;
  service_type?: string;
  status?: string;
  progress?: number;
  contract_value?: number;
  deadline?: string;
  partner_id?: string;
  lead_id?: string;
  client_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Partner {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  specialty?: string;
  city?: string;
  state?: string;
  status?: string;
  rating?: number;
  completed_projects?: number;
  active_projects?: number;
  user_id?: string;
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  lead_id?: string;
  project_id?: string;
  user_id?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read?: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  audio_url?: string;
}

export interface LandingPage {
  id: string;
  name: string;
  city?: string;
  slug?: string;
  visits?: number;
  visitors?: number;
  conversions?: number;
  leads_count?: number;
  is_active?: boolean;
  status?: string;
  created_at?: string;
}

export interface Stage {
  id: string;
  project_id: string;
  name: string;
  status?: string;
  order_index?: number;
  completed?: boolean;
  created_at?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at?: string;
}

export interface DailyLog {
  id: string;
  project_id?: string;
  user_id: string;
  log_text: string;
  materials?: string;
  created_at: string;
}

export interface LocalNote {
  id: string;
  lead_id?: string;
  text: string;
  date?: string;
  created_at: string;
}

// ============================================
// Google Calendar Types
// ============================================

export interface GoogleEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  description?: string;
  is_google_native?: boolean;
}

// ============================================
// Form Types
// ============================================

export interface EventForm {
  lead_id: string;
  date: string;
  time: string;
  title: string;
}

export interface EditingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  is_google_native?: boolean;
}

export interface NewProjectForm {
  name: string;
  service_type: string;
  contract_value: string;
  deadline: string;
}

export interface LPForm {
  name: string;
  city: string;
}

export interface NewEventForm {
  title: string;
  event_date: string;
  start_time: string;
  project_id: string;
}

export interface LogForm {
  project_id: string;
  log_text: string;
  materials: string;
}

export interface ProfileForm {
  full_name?: string;
  phone?: string;
  specialization?: string;
  [key: string]: string | undefined;
}

// ============================================
// Chat Types
// ============================================

export interface ChatPartner {
  id: string;
  full_name: string;
  avatar_url?: string;
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
}

// ============================================
// Re-export Supabase User for convenience
// ============================================

export type { User };
