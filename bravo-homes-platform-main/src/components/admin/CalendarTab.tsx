import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarTabProps {
  handleGoogleSync: () => void;
  setEventForm: (form: any) => void;
  setIsEventModalOpen: (v: boolean) => void;
  mapEventsForCalendar: () => any[];
  handleEventDrop: (info: any) => void;
  handleEventClick: (info: any) => void;
}

export default function CalendarTab({
  handleGoogleSync, setEventForm, setIsEventModalOpen,
  mapEventsForCalendar, handleEventDrop, handleEventClick,
}: CalendarTabProps) {
  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="u-section-header">
        <div className="u-syne-title">Calendário de Vistorias e Agendamentos</div>
        <div className="u-flex-gap-8">
          <button className="btn ghost" onClick={handleGoogleSync} style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" style={{width:'14px'}} alt="GCal" />
            Sincronizar Google
          </button>
          <button className="btn gold" onClick={() => {
             setEventForm({ lead_id: '', date: '', time: '00:00', title: '' });
             setIsEventModalOpen(true);
          }}>+ Novo Evento</button>
        </div>
      </div>
      <div className="card" style={{ flex: 1, padding: '16px', background: 'var(--bg2)' }}>
         <style dangerouslySetInnerHTML={{__html: `
           .fc { color: var(--text); font-family: 'Inter', sans-serif; font-size: 0.85rem; }
           .fc-theme-standard th, .fc-theme-standard td, .fc-theme-standard .fc-scrollgrid { border-color: var(--b); }
           .fc-button-primary { background-color: var(--bg3) !important; border-color: var(--b) !important; color: var(--text) !important; text-transform: capitalize; }
           .fc-button-primary:hover { background-color: var(--gold) !important; color: #000 !important; border-color: var(--gold) !important; }
           .fc-button-active { background-color: var(--gold) !important; color: #000 !important; }
           .fc-toolbar-title { font-family: 'Syne', sans-serif; font-size: 1.2rem !important; color: var(--gold); text-transform: capitalize; }
           .fc-day-today { background-color: rgba(201, 148, 58, 0.05) !important; }
           .fc-event { cursor: move; border-radius: 4px; padding: 2px 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
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
            events={mapEventsForCalendar()}
            editable={true}
            droppable={true}
            eventDrop={handleEventDrop}
            eventClick={handleEventClick}
            dateClick={(info: any) => {
              const clickedDate = info.dateStr?.substring(0, 10) || '';
              const clickedTime = info.dateStr?.substring(11, 16) || new Date().toTimeString().substring(0, 5);
              setEventForm({ lead_id: '', date: clickedDate, time: clickedTime, title: '' });
              setIsEventModalOpen(true);
            }}
            height="100%"
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={true}
         />
      </div>
    </div>
  );
}
