import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Lead } from '../types';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    service_type: '',
    city: '',
    email: '',
    phone: '',
    urgency: '',
    estimated_value: '',
    partner_id: ''
  });

  const fetchLeads = async () => {
    const { data } = await supabase.from('leads').select('*, clients(*)').order('created_at', { ascending: false });
    if (data) setLeads(data);
    return data;
  };

  const createLead = async (leadData: any) => {
    const { error } = await supabase.from('leads').insert([leadData]);
    if (!error) await fetchLeads();
    return { error };
  };

  const updateLead = async (id: string, updates: any) => {
    const { error } = await supabase.from('leads').update(updates).eq('id', id);
    if (!error) await fetchLeads();
    return { error };
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    }
    return { error };
  };

  const resetNewLeadForm = () => {
    setNewLeadForm({ name: '', service_type: '', city: '', email: '', phone: '', urgency: '', estimated_value: '', partner_id: '' });
  };

  return {
    leads, setLeads,
    selectedLead, setSelectedLead,
    notesInput, setNotesInput,
    isNewLeadOpen, setIsNewLeadOpen,
    newLeadForm, setNewLeadForm,
    fetchLeads, createLead, updateLead, deleteLead, resetNewLeadForm,
  };
}
