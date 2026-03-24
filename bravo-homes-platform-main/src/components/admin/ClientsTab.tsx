import React from 'react';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface ClientsTabProps {
  clients: any[];
  loadingDb: boolean;
  setIsNewLeadOpen: (v: boolean) => void;
  showToast: (msg: string) => void;
  handleDeleteClient: (id: string) => void;
}

export default function ClientsTab({
  clients, loadingDb, setIsNewLeadOpen, showToast, handleDeleteClient,
}: ClientsTabProps) {
  const { t, lang } = useLanguage();
  return (
    <div className="page active">
      <div className="u-section-header">
        <div className="u-syne-title">{t('clientsList')}</div>
        <Button variant="gold" onClick={() => setIsNewLeadOpen(true)}>{t('newClientBtn')}</Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="tbl">
            <thead><tr>
              <th style={{width: '20%'}}>{t('clientNameCol')}</th>
              <th style={{width: '20%'}}>{t('emailCol')}</th>
              <th style={{width: '15%'}}>{t('phoneCol')}</th>
              <th style={{width: '20%'}}>{t('addressCityCol')}</th>
              <th style={{width: '10%'}}>{t('createdCol')}</th>
              <th style={{width: '15%', textAlign: 'center'}}>{t('actionsCol')}</th>
            </tr></thead>
            <tbody>
              {clients.length === 0 && !loadingDb && <tr><td colSpan={6} className="u-empty-state">{t('noClients')}</td></tr>}
              {clients.map(c => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.email}</td>
                  <td style={{color: 'var(--t2)', fontSize: '0.85rem'}}>{c.phone || '-'}</td>
                  <td>{c.address}<div className="u-mono-tiny">{c.city}, {c.state}</div></td>
                  <td><div style={{fontSize:'0.7rem',color:'var(--t3)'}}>{new Date(c.created_at).toLocaleDateString(lang)} - {new Date(c.created_at).toLocaleTimeString(lang, {hour: '2-digit', minute:'2-digit'})}</div></td>
                  <td style={{textAlign: 'center'}}>
                    <div style={{display:'flex', alignItems: 'center', justifyContent: 'center', gap:'16px'}}>
                      <Button variant="ghost" className="rounded-full px-3 py-1 text-[0.75rem]" onClick={() => showToast(t('historyTooltip'))}>{t('viewHistoryBtn')}</Button>
                      <Button variant="ghost" className="px-2 py-1 text-[.65rem] text-danger border-danger/30" onClick={() => handleDeleteClient(c.id)} title={t('deleteClientTitle')}>🗑️</Button>
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
