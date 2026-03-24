import React from 'react';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface PartnersTabProps {
  partners: any[];
  projects: any[];
  loadingDb: boolean;
  setIsPartnerOpen: (v: boolean) => void;
  setSelectedPartner: (p: any) => void;
}

export default function PartnersTab({
  partners, projects, loadingDb, setIsPartnerOpen, setSelectedPartner,
}: PartnersTabProps) {
  const { t } = useLanguage();
  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">{t('partnersAndContractors')}</div>
        <Button variant="ghost" onClick={() => setIsPartnerOpen(true)}>{t('addPartnerBtn')}</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>{t('nameCityCol')}</th><th>{t('specialtyCol')}</th><th>{t('projectsCol')}</th><th>{t('status')}</th><th>{t('actionsCol')}</th></tr></thead>
            <tbody>
              {partners.length === 0 && !loadingDb && (
                <tr><td colSpan={5} className="u-empty-state">{t('noPartnerFound')}</td></tr>
              )}
              {partners.map((p: any) => (
                <tr key={p.id}>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <div className="av" style={{background:'var(--bg3)', border:'1px solid var(--b)', width:'32px', height:'32px'}}>{(p.name || p.full_name || 'N/A').substring(0,2).toUpperCase()}</div>
                      <div>
                        <b>{p.name || p.full_name || t('noName')}</b>
                        <div className="u-mono-tiny">{p.city || 'Georgia'} • {p.phone || t('noContact')}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.specialty || t('generalContractor')}</td>
                  <td>{(projects.filter(proj => proj.partner_id === p.id).length) || 0}</td>
                  <td>{
                    (() => {
                      const st = p.state || 'available';
                      const map: Record<string,{label:string,cls:string}> = { available: {label:t('statusAvailable'),cls:'sb-active'}, busy: {label:t('statusBusy'),cls:'sb-draft'}, inactive: {label:t('statusInactive'),cls:'sb-red'} };
                      const s = map[st] || map.available;
                      return <span className={`status-b ${s.cls}`}>{s.label}</span>;
                    })()
                  }</td>
                  <td>
                    <div className="u-flex-gap-8">
                      <Button variant="ghost" className="rounded-full px-3 py-1" onClick={() => setSelectedPartner(p)}>{t('viewProfileBtn')}</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
