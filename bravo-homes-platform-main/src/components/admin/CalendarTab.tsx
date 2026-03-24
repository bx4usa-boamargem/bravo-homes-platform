import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import '../../styles/fullcalendar.css';

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
          <Button variant="ghost" onClick={handleGoogleSync} aria-label="Sincronizar com Google Calendar" style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" style={{width:'14px'}} alt="Google Calendar" />
            Sincronizar Google
          </Button>
          <Button variant="gold" aria-label="Criar novo evento" onClick={() => {
             setEventForm({ lead_id: '', date: '', time: '00:00', title: '' });
             setIsEventModalOpen(true);
          }}>+ Novo Evento</Button>
        </div>
      </div>
      <Card className="flex-1 p-[16px] bg-bg-2">
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
            eventContent={(arg) => {
              const isGoogle = arg.event.extendedProps?.is_google_native;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                  {isGoogle && (
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
                      alt="G" 
                      style={{ width: '12px', height: '12px', flexShrink: 0 }} 
                    />
                  )}
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {arg.timeText && <b style={{marginRight: '4px'}}>{arg.timeText}</b>}
                    {arg.event.title.replace('[Google] ', '')}
                  </div>
                </div>
              );
            }}
            dateClick={(info: any) => {
              const clickedDate = info.dateStr?.substring(0, 10) || '';
              const clickedTime = info.dateStr?.substring(11, 16) || new Date().toTimeString().substring(0, 5);
              setEventForm({ lead_id: '', date: clickedDate, time: clickedTime, title: '' });
              setIsEventModalOpen(true);
            }}
            height="100%"
            slotMinTime="07:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={true}
         />
      </Card>
    </div>
  );
}
