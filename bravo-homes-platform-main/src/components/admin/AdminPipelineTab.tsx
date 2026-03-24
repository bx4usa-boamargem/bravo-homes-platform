import React from 'react';
import { useLanguage } from '../../lib/i18n';
import { useAdminLeads, useUpdateLeadStatus } from '../../hooks/useAdminQueries';
import { Button } from '../ui/Button';

interface AdminPipelineTabProps {
  setIsNewLeadOpen: (val: boolean) => void;
  setSelectedLead: (lead: any) => void;
}

export default function AdminPipelineTab({ setIsNewLeadOpen, setSelectedLead }: AdminPipelineTabProps) {
  const { t } = useLanguage();
  const { data: leads = [], isLoading } = useAdminLeads();
  const updateStatus = useUpdateLeadStatus();

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (!leadId) return;

    try {
      await updateStatus.mutateAsync({ leadId, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">{t('loadingPipeline')}</div>;
  }

  const activeLeadsCount = leads.length;

  return (
    <div className="page active">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--t3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '3px' }}>
            {activeLeadsCount} {t('activeLeadsCount')}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t('pipelineTitle')}</div>
        </div>
        <Button variant="gold" onClick={() => setIsNewLeadOpen(true)}>{t('newLeadBtn')}</Button>
      </div>
      
      <div className="kanban">
        {['new', 'contacted', 'scheduling', 'proposal', 'closed'].map(statusGroup => {
          const statusTitles: Record<string, string> = {
            'new': t('statusNew'),
            'contacted': t('statusContacted'),
            'scheduling': t('statusScheduling'),
            'proposal': t('statusProposal'),
            'closed': t('statusClosed')
          };
          const colLeads = leads.filter(l => l.status === statusGroup);
          
          return (
            <div 
              className="kol" 
              key={statusGroup}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, statusGroup)}
            >
              <div className="kol-h">
                {statusTitles[statusGroup]}
                <span className="kol-n" style={statusGroup === 'closed' ? { background: 'var(--green)', color: '#fff' } : {}}>
                  {colLeads.length}
                </span>
              </div>
              
              {colLeads.map((l: any) => (
                <div 
                  className="lead-c" 
                  draggable 
                  key={l.id}
                  onDragStart={(e) => handleDragStart(e, l.id)}
                  onClick={() => setSelectedLead(l)}
                >
                  <div className="lc-name">{l.clients?.name || l.name || t('leadNoName')}</div>
                  <div className="lc-srv">{l.service_type || t('servicePlaceholder')} · {l.city || t('locationPlacholder')}</div>
                  <div className="lc-foot">
                    <span className="lc-val">{l.estimated_value ? `$${Number(l.estimated_value).toLocaleString()}` : t('valueTbd')}</span>
                    {l.urgency === 'hot' && <span className="urg hot" style={{ background: 'rgba(231,76,60,0.15)', color: 'var(--red)' }}>{t('urgencyHot')}</span>}
                    {l.urgency === 'warm' && <span className="urg warm" style={{ background: 'rgba(230,126,34,0.15)', color: 'var(--orange)' }}>{t('urgencyWarm')}</span>}
                    {l.urgency === 'cool' && <span className="urg cool" style={{ background: 'rgba(52,152,219,0.15)', color: 'var(--blue)' }}>{t('urgencyCool')}</span>}
                  </div>
                </div>
              ))}
              
              {colLeads.length === 0 && <div className="empty-state" style={{ fontSize: '0.8rem', padding: '10px' }}>{t('emptyState')}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
