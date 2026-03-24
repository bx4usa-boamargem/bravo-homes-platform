import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useLanguage } from '../../lib/i18n';
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
  const { t, lang } = useLanguage();
  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="u-section-header">
        <div className="u-syne-title">{t('calendarTitle')}</div>
        <div className="u-flex-gap-8">
          <Button variant="ghost" onClick={handleGoogleSync} aria-label={t('syncGoogleAria') as string} style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" style={{width:'14px'}} alt="Google Calendar" />
            {t('syncGoogleBtn')}
          </Button>
          <Button variant="gold" aria-label="Criar novo evento" onClick={() => {
             setEventForm({ lead_id: '', date: '', time: '00:00', title: '' });
             setIsEventModalOpen(true);
          }}>{t('newEventBtn')}</Button>
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
            locale={lang.toLowerCase()}
            buttonText={{ today: t('calToday') as string, month: t('calMonth') as string, week: t('calWeek') as string, day: t('calDay') as string }}
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
            height="auto"
            contentHeight="auto"
            expandRows={true}
            slotMinTime="07:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={true}
         />
      </Card>
    </div>
  );
}
