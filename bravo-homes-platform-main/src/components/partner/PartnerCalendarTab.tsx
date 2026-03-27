import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { usePartnerEvents } from '../../hooks/usePartnerQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface PartnerCalendarTabProps {
  projects: any[];
  showToast: (title: string, msg: string, type?: 'success'|'error') => void;
  user?: any;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function PartnerCalendarTab({ projects, showToast, user, canEdit = true, canDelete = true }: PartnerCalendarTabProps) {
  const { data: events = [], isLoading } = usePartnerEvents();
  const queryClient = useQueryClient();

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', event_date: '', start_time: '00:00', project_id: '' });
  const [editingEvent, setEditingEvent] = useState<{ id: string, title: string, date: string, time: string } | null>(null);

  const addEventMut = useMutation({
    mutationFn: async (eventData: any) => {
      const payload = { ...eventData, user_id: user?.id };
      const { error } = await supabase.from('calendar_events').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-events'] });
      showToast('Sucesso', 'Atividade agendada!', 'success');
      setIsNewEventOpen(false);
      setNewEvent({ title: '', event_date: '', start_time: '00:00', project_id: '' });
    },
    onError: (err: any) => {
      showToast('Erro', err.message || 'Falha ao agendar', 'error');
    }
  });

  const updateEventMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { error } = await supabase.from('calendar_events').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-events'] });
      setEditingEvent(null);
      showToast('Sucesso', 'Atividade atualizada!', 'success');
    }
  });

  const deleteEventMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-events'] });
      setEditingEvent(null);
      showToast('Sucesso', 'Atividade excluída!', 'success');
    }
  });

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.event_date) return showToast('Erro', 'Preencha título e data', 'error');
    addEventMut.mutate({
      title: newEvent.title,
      event_date: newEvent.event_date,
      start_time: newEvent.start_time || null,
      project_id: newEvent.project_id || null
    });
  };

  if (isLoading) return <div style={{padding:'20px'}}>Carregando calendário...</div>;

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="u-section-header">
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'1.05rem'}}>Calendário de Obras</div>
        <button className="btn gold" onClick={() => { if (canEdit) setIsNewEventOpen(true); else showToast?.('Acesso Negado', 'Permissão negada.', 'error'); }}>+ Atividade</button>
      </div>

      {/* New event form */}
      {isNewEventOpen && (
        <div className="modal-overlay open" onClick={() => setIsNewEventOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '450px', zIndex: 1000}}>
            <div className="modal-head">
              <div className="modal-title">Nova Atividade</div>
              <button className="dclose" onClick={() => setIsNewEventOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:'15px'}}>
                <label className="u-mono-label">Título *</label>
                <input className="f-inp u-w-full" placeholder="Ex: Vistoria da fundação" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              </div>
              <div style={{marginBottom:'15px'}}>
                <label className="u-mono-label">Projeto (opcional)</label>
                <select className="f-inp u-w-full" value={newEvent.project_id} onChange={e => setNewEvent({...newEvent, project_id: e.target.value})}>
                  <option value="" disabled>-- Selecione --</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:15,marginBottom:'20px'}}>
                <div>
                  <label className="u-mono-label">Data *</label>
                  <input className="f-inp u-w-full" type="date" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} />
                </div>
                <div>
                  <label className="u-mono-label">Horário</label>
                  <input className="f-inp u-w-full" type="time" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} />
                </div>
              </div>
              <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
                 <button type="button" className="btn ghost" style={{flex: 1, padding: '12px', fontSize: '0.95rem'}} onClick={() => setIsNewEventOpen(false)}>Cancelar</button>
                 <button type="button" className="btn gold" style={{flex: 1, padding: '12px', fontSize: '0.95rem'}} onClick={handleAddEvent} disabled={addEventMut.isPending}>
                   {addEventMut.isPending ? 'Agendando...' : 'Agendar Atividade'}
                 </button>
              </div>
            </div>
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
          eventDrop={(info: any) => {
            if (!canEdit) {
              info.revert();
              showToast('Acesso Negado', 'Permissão negada.', 'error');
              return;
            }
            const newDate = info.event.start;
            const dateStr = newDate.toISOString().split('T')[0];
            const timeStr = newDate.toTimeString().substring(0, 5);
            updateEventMut.mutate({ id: info.event.id, updates: { event_date: dateStr, start_time: timeStr } });
          }}
          eventClick={(info: any) => {
            if (!canEdit && !canDelete) {
              showToast('Acesso Negado', 'Permissão negada para editar ou excluir atividades.', 'error');
              return;
            }
            const ev = info.event;
            const startDate = ev.start;
            setEditingEvent({
              id: ev.id,
              title: ev.title,
              date: startDate ? startDate.toISOString().substring(0, 10) : '',
              time: startDate ? startDate.toTimeString().substring(0, 5) : '00:00',
            });
          }}
          dateClick={(info: any) => {
            if (!canEdit) {
              showToast('Acesso Negado', 'Permissão negada.', 'error');
              return;
            }
            const clickedDate = info.dateStr?.substring(0, 10) || '';
            const clickedTime = info.dateStr?.substring(11, 16) || new Date().toTimeString().substring(0, 5);
            setNewEvent({ title: '', event_date: clickedDate, start_time: clickedTime, project_id: '' });
            setIsNewEventOpen(true);
          }}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="24:00:00"
          allDaySlot={true}
        />
      </div>

      {editingEvent && (
        <div className="modal-overlay open" onClick={() => setEditingEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '420px', zIndex: 1000}}>
            <div className="modal-head">
              <div className="modal-title">Editar Agendamento</div>
              <button className="dclose" onClick={() => setEditingEvent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:'12px'}}>
                <label className="u-mono-label">Título</label>
                <input className="f-inp u-w-full" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} />
              </div>
              <div className="u-grid-2">
                <div>
                  <label className="u-mono-label">Data *</label>
                  <input className="f-inp u-w-full" type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                </div>
                <div>
                  <label className="u-mono-label">Horário *</label>
                  <input className="f-inp u-w-full" type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} />
                </div>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'16px 20px',borderTop:'1px solid var(--b)'}}>
              <button className="btn" style={{background:'transparent',border:'1px solid rgba(231,76,60,0.5)',color:'var(--red)'}} onClick={() => { if (canDelete) deleteEventMut.mutate(editingEvent.id); else showToast?.('Acesso Negado', 'Sem permissão para apagar.', 'error'); }}>🗑️ Excluir</button>
              <div style={{display:'flex',gap:'8px'}}>
                <button className="btn ghost" onClick={() => setEditingEvent(null)}>Cancelar</button>
                <button className="btn gold" onClick={() => { if (canEdit) updateEventMut.mutate({ id: editingEvent.id, updates: { title: editingEvent.title, event_date: editingEvent.date, start_time: editingEvent.time }}); else showToast?.('Acesso Negado', 'Permissão negada para salvar alterações.', 'error'); }}>Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
