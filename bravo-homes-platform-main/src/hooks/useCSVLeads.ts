import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from './useAdminQueries';
import type { Lead } from '../types';

export function useCSVLeads() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);

  const exportLeadsToCSV = (leadsToExport: Lead[]) => {
    if (!leadsToExport || leadsToExport.length === 0) return;

    const csvData = leadsToExport.map(l => ({
      Nome: l.name || '',
      Telefone: l.phone || '',
      Email: l.email || '',
      Cidade: l.city || '',
      'Tipo de Serviço': l.service_type || '',
      'Valor Estimado': l.estimated_value || '',
      'Urgência': l.urgency || '',
      'Origem': l.source || '',
      'Status': l.status || '',
      'Observações': l.notes || '',
      'Criado em': l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_bravo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const importLeadsFromCSV = async (file: File) => {
    setIsImporting(true);
    return new Promise<{ success: number; skipped: number; error?: string }>((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rows = results.data as any[];
            let successCount = 0;
            let skippedCount = 0;

            const { data: existingLeads } = await supabase.from('leads').select('email, phone');
            const existingEmails = new Set(existingLeads?.map(l => l.email?.trim().toLowerCase()).filter(Boolean));
            const existingPhones = new Set(existingLeads?.map(l => l.phone?.replace(/\D/g, '')).filter(Boolean));

            const leadsToInsert: any[] = [];

            for (const row of rows) {
              const name = (row['Nome'] || '').trim();
              const phone = (row['Telefone'] || '').trim();
              const email = (row['Email'] || '').trim();
              
              if (!name || !phone || !email) {
                skippedCount++;
                continue;
              }

              const cleanEmail = email.toLowerCase();
              const cleanPhone = phone.replace(/\D/g, '');

              if (existingEmails.has(cleanEmail) || (cleanPhone && existingPhones.has(cleanPhone))) {
                skippedCount++;
                continue;
              }

              leadsToInsert.push({
                name,
                phone,
                email,
                city: row['Cidade'] || '',
                service_type: row['Tipo de Serviço'] || '',
                estimated_value: row['Valor Estimado'] ? parseFloat(String(row['Valor Estimado']).replace(/[^\d.-]/g, '')) || null : null,
                urgency: row['Urgência'] || '',
                notes: row['Observações'] || '',
                status: 'new',
                source: 'Importação'
              });

              existingEmails.add(cleanEmail);
              if (cleanPhone) existingPhones.add(cleanPhone);
            }

            if (leadsToInsert.length > 0) {
              const { error } = await supabase.from('leads').insert(leadsToInsert);
              if (error) throw error;
              successCount = leadsToInsert.length;
              queryClient.invalidateQueries({ queryKey: adminKeys.leads() });
            }

            setIsImporting(false);
            resolve({ success: successCount, skipped: skippedCount });
          } catch (err: any) {
            setIsImporting(false);
            resolve({ success: 0, skipped: 0, error: err.message });
          }
        },
        error: (err) => {
          setIsImporting(false);
          resolve({ success: 0, skipped: 0, error: err.message });
        }
      });
    });
  };

  return { exportLeadsToCSV, importLeadsFromCSV, isImporting };
}
