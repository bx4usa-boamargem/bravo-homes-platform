import { useLanguage } from '../../lib/i18n';
import { useAdminProjects, useAdminLeads } from '../../hooks/useAdminQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AdminOverviewTabProps {
  setActiveTab: (tab: string) => void;
}

export default function AdminOverviewTab({ setActiveTab }: AdminOverviewTabProps) {
  const { t, lang } = useLanguage();
  const { data: projects = [], isLoading: loadingProjects } = useAdminProjects();
  const { data: leads = [], isLoading: loadingLeads } = useAdminLeads();

  const loadingDb = loadingProjects || loadingLeads;

  if (loadingDb) {
    return (
      <div className="page active">
        <div className="kpi-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-kpi"></div>)}
        </div>
        <div className="g2" style={{marginTop:'14px'}}>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = projects.reduce((acc, p) => acc + (Number(p.contract_value) || 0), 0);
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const activeLeadsCount = leads.length;
  const schedulingLeadsCount = leads.filter(l => l.status === 'scheduling').length;

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
  const chartLabelsStr = t('monthsShort');
  const chartLabels = chartLabelsStr.split(',');

  const leadsPerSource = leads.reduce((acc, l) => {
    const source = (l.source && l.source.trim() !== '') ? l.source : t('unknownLabel');
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalLeadsWithSource = leads.length || 1;
  const sourceColors = ['var(--gold)', 'var(--blue)', 'var(--green)', 'var(--red)', 'var(--orange)', 'var(--purple)'];
  const sourceElements = (Object.entries(leadsPerSource) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([source, count], idx) => {
      const color = sourceColors[idx % sourceColors.length];
      const percentage = Math.round((count / totalLeadsWithSource) * 100);
      const niceSourceName = source === 'manual-admin' ? t('manualLabel') : source;
      return (
        <div key={source} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', textTransform: 'capitalize' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></div>{niceSourceName}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.75rem' }}>
            {percentage}% · {Number(count)} leads
          </div>
        </div>
      );
    });

  return (
    <div className="page active">
      <div className="kpi-grid">
        <div className="kpi gold">
          <div className="kl">{t('totalRevenueKpi')}</div>
          <div className="kv">${totalRevenue.toLocaleString()}</div>
          <div className="kc">{t('fromSignedContracts')}</div>
        </div>
        <div className="kpi blue">
          <div className="kl">{t('activeLeadsKpi')}</div>
          <div className="kv">{activeLeadsCount}</div>
          <div className="kc">{t('totalInPanel')}</div>
        </div>
        <div className="kpi green">
          <div className="kl">{t('ongoingProjects')}</div>
          <div className="kv">{activeProjectsCount}</div>
          <div className="kc">{t('inExecution')}</div>
        </div>
        <div className="kpi red">
          <div className="kl">{t('visitsAppointments')}</div>
          <div className="kv">{schedulingLeadsCount}</div>
          <div className="kc">{schedulingLeadsCount > 0 ? t('scheduledLeads') : t('noneAtMoment')}</div>
        </div>
      </div>
      
      <div className="g2">
        <Card>
          <CardHeader><CardTitle>{t('monthlyRevenueYear')} {currentYear}</CardTitle></CardHeader>
          <CardContent style={{ height: '160px', padding: '10px 18px' }}>
            <Bar 
              data={{
                labels: chartLabels,
                datasets: [{
                  label: t('value') || 'Receita ($)',
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('leadsBySource')}</CardTitle></CardHeader>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sourceElements.length > 0 ? sourceElements : (
              <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>{t('noLeadsWithSource')}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="g2">
        <Card>
          <CardHeader>
            <CardTitle>{t('projectsInProgress')}</CardTitle>
            <span className="ca" onClick={() => setActiveTab('projects')} style={{cursor: 'pointer'}}>{t('viewAll')} →</span>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <table className="tbl">
              <thead><tr><th>{t('clientLabel')}</th><th>{t('progressLabel')}</th><th>{t('deliveryDate')}</th></tr></thead>
              <tbody>
                {projects.length === 0 && (
                  <tr><td colSpan={3} className="u-empty-state">{t('noProjectsFound')}</td></tr>
                )}
                {projects.slice(0, 3).map((p: any) => (
                  <tr key={p.id} className="u-cursor-pointer" onClick={() => setActiveTab('projects')}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name || t('projectNoName')}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--t2)' }}>{p.service_type || t('serviceLabel')} · ${p.contract_value || '0'}</div>
                    </td>
                    <td style={{ width: '90px' }}>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${p.progress || 0}%` }}></div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.6rem', color: 'var(--gold)', marginTop: '3px' }}>
                        {p.progress || 0}%
                      </div>
                    </td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: '0.7rem', color: 'var(--orange)' }}>
                      {p.deadline ? new Date(p.deadline).toLocaleDateString() : 'N/D'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>{t('recentActivity')}</CardTitle></CardHeader>
          <CardContent style={{ padding: '0 18px' }}>
            {leads.slice(0, 3).map((l: any, i: number) => {
              const created = new Date(l.created_at);
              const now = new Date();
              const diffMs = now.getTime() - created.getTime();
              const diffMin = Math.floor(diffMs / 60000);
              const diffH = Math.floor(diffMin / 60);
              const isToday = created.toDateString() === now.toDateString();
              const isYesterday = created.toDateString() === new Date(now.getTime() - 86400000).toDateString();
              let timeLabel = '';
              if (diffMin < 1) timeLabel = t('justNowLabel');
              else if (diffMin < 60) timeLabel = `${diffMin} ${t('minsAgoLabel')}`;
              else if (diffH < 24 && isToday) timeLabel = `${diffH}${t('hoursAgoLabel')}`;
              else if (isYesterday) timeLabel = `${t('yesterdayLabel')} ${created.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`;
              else timeLabel = created.toLocaleDateString(lang, { day: '2-digit', month: '2-digit' }) + ' ' + created.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div className="log-item" key={l.id || i}>
                  <div className="log-date">{timeLabel}</div>
                  <div className="log-text">
                    {t('newLeadText')} • <strong>{l.clients?.name || l.name || t('unknownLabel')}</strong> {t('viaLabel')} {l.source || t('manualLabel')} — {l.service_type} {l.estimated_value ? `$${l.estimated_value}` : ''}
                  </div>
                </div>
              );
            })}
            {leads.length === 0 && (
              <>
                <div className="log-item"><div className="log-date">{t('nowLabel')}</div><div className="log-text">{t('waitingForActivities')}</div></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
