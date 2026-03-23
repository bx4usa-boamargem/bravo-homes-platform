import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, Eye, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PlanBadge from '../shared/PlanBadge';

interface TenantRow {
  id:            string;
  name:          string;
  owner_user_id: string | null;
  plan:          string;
  slug:          string | null;
  status:        string | null;
  created_at:    string;
  blogs_count:   number;
  articles_count: number;
}

const PLANS = ['all', 'free', 'starter', 'pro', 'enterprise'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  });
}

function escapeCsv(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(rows: TenantRow[]) {
  const headers = ['ID', 'Nome', 'Plan', 'Blogs', 'Artigos', 'Status', 'Criado em'];
  const lines   = [
    headers.join(','),
    ...rows.map(r => [
      r.id, r.name, r.plan, r.blogs_count, r.articles_count,
      r.status ?? '', formatDate(r.created_at),
    ].map(escapeCsv).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `omniseen-clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const UsersTable: React.FC = () => {
  const [tenants, setTenants]     = useState<TenantRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search,  setSearch]      = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [suspending, setSuspending] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        // Fetch tenants
        const { data: tenantsData, error } = await supabase
          .from('tenants')
          .select('id, name, owner_user_id, plan, slug, status, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        if (!tenantsData || tenantsData.length === 0) {
          setTenants([]);
          return;
        }

        // Fetch blog counts per tenant
        const tenantIds = tenantsData.map(t => t.id);

        const [blogsRes, articlesRes] = await Promise.all([
          supabase
            .from('blogs')
            .select('id, tenant_id')
            .in('tenant_id', tenantIds),
          supabase
            .from('articles')
            .select('id, blog_id, blogs!inner(tenant_id)')
            .in('blogs.tenant_id', tenantIds),
        ]);

        // Count blogs per tenant
        const blogsByTenant: Record<string, number> = {};
        for (const b of blogsRes.data ?? []) {
          const tid = (b as { id: string; tenant_id: string }).tenant_id;
          blogsByTenant[tid] = (blogsByTenant[tid] ?? 0) + 1;
        }

        // Count articles per tenant
        const articlesByTenant: Record<string, number> = {};
        for (const a of articlesRes.data ?? []) {
          const blog = (a as { id: string; blog_id: string; blogs: { tenant_id: string } }).blogs;
          if (blog?.tenant_id) {
            articlesByTenant[blog.tenant_id] = (articlesByTenant[blog.tenant_id] ?? 0) + 1;
          }
        }

        const rows: TenantRow[] = tenantsData.map(t => ({
          id:             t.id,
          name:           t.name ?? '(sem nome)',
          owner_user_id:  t.owner_user_id,
          plan:           t.plan ?? 'free',
          slug:           t.slug,
          status:         t.status,
          created_at:     t.created_at,
          blogs_count:    blogsByTenant[t.id] ?? 0,
          articles_count: articlesByTenant[t.id] ?? 0,
        }));

        setTenants(rows);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[UsersTable] Error:', msg);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTenants();
  }, []);

  const handleSuspend = async (tenant: TenantRow) => {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    setSuspending(tenant.id);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenant.id);

      if (error) throw error;

      setTenants(prev =>
        prev.map(t => t.id === tenant.id ? { ...t, status: newStatus } : t),
      );
      toast.success(
        newStatus === 'suspended'
          ? `Cliente "${tenant.name}" suspenso`
          : `Cliente "${tenant.name}" reativado`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro: ${msg}`);
    } finally {
      setSuspending(null);
    }
  };

  const filtered = useMemo(() => {
    return tenants.filter(t => {
      const matchSearch = search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.slug ?? '').toLowerCase().includes(search.toLowerCase());
      const matchPlan = planFilter === 'all' || t.plan === planFilter;
      return matchSearch && matchPlan;
    });
  }, [tenants, search, planFilter]);

  return (
    <div
      style={{
        background:   'var(--admin-card)',
        border:       '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        padding:      '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   '16px',
          flexWrap:       'wrap',
          gap:            '12px',
        }}
      >
        <div>
          <div className="admin-section-title" style={{ marginBottom: '2px', borderBottom: 'none' }}>
            👤 CLIENTES
          </div>
          <div style={{ fontSize: '12px', color: 'var(--admin-muted)' }}>
            {filtered.length} de {tenants.length} clientes
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position:  'absolute',
                left:      '10px',
                top:       '50%',
                transform: 'translateY(-50%)',
                color:     'var(--admin-muted)',
              }}
            />
            <input
              className="admin-input"
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '30px', width: '200px', fontSize: '12px' }}
            />
          </div>

          {/* Plan filter */}
          <select
            className="admin-select"
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            style={{ width: '120px', fontSize: '12px' }}
          >
            {PLANS.map(p => (
              <option key={p} value={p}>
                {p === 'all' ? 'Todos os planos' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* Export CSV */}
          <button
            className="admin-btn admin-btn-outline"
            onClick={() => downloadCsv(filtered)}
            style={{ gap: '6px', fontSize: '12px' }}
          >
            <Download size={13} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div className="admin-spinner admin-spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
          <div>{tenants.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum resultado encontrado.'}</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th style={{ textAlign: 'center' }}>Blogs</th>
                <th style={{ textAlign: 'center' }}>Artigos</th>
                <th>Criado em</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tenant => (
                <tr key={tenant.id}>
                  {/* Name */}
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)', fontSize: '13px' }}>
                        {tenant.name}
                      </div>
                      {tenant.slug && (
                        <div style={{ fontSize: '11px', color: 'var(--admin-muted)', fontFamily: 'var(--admin-font-mono)' }}>
                          /{tenant.slug}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Plan */}
                  <td><PlanBadge plan={tenant.plan} /></td>

                  {/* Blogs */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--admin-font-mono)', fontWeight: 600, color: 'var(--admin-text)' }}>
                      {tenant.blogs_count}
                    </span>
                  </td>

                  {/* Articles */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--admin-font-mono)', fontWeight: 600, color: 'var(--admin-text)' }}>
                      {tenant.articles_count}
                    </span>
                  </td>

                  {/* Created */}
                  <td>
                    <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '12px', color: 'var(--admin-muted)' }}>
                      {formatDate(tenant.created_at)}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {tenant.status === 'suspended' ? (
                      <span
                        style={{
                          display:    'inline-flex',
                          alignItems: 'center',
                          gap:        '5px',
                          fontSize:   '11px',
                          fontWeight: 600,
                          color:      'var(--admin-red)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-red)', display: 'inline-block' }} />
                        Suspenso
                      </span>
                    ) : (
                      <span
                        style={{
                          display:    'inline-flex',
                          alignItems: 'center',
                          gap:        '5px',
                          fontSize:   '11px',
                          fontWeight: 600,
                          color:      'var(--admin-green)',
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--admin-green)', display: 'inline-block', boxShadow: '0 0 4px var(--admin-green)' }} />
                        Ativo
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="admin-btn admin-btn-outline"
                        style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                        title="Ver detalhes"
                      >
                        <Eye size={11} />
                        Ver
                      </button>
                      <button
                        className={`admin-btn ${tenant.status === 'suspended' ? 'admin-btn-outline' : 'admin-btn-danger'}`}
                        onClick={() => handleSuspend(tenant)}
                        disabled={suspending === tenant.id}
                        style={{ padding: '4px 8px', fontSize: '11px', gap: '4px', opacity: suspending === tenant.id ? 0.6 : 1 }}
                        title={tenant.status === 'suspended' ? 'Reativar' : 'Suspender'}
                      >
                        <Ban size={11} />
                        {tenant.status === 'suspended' ? 'Reativar' : 'Suspender'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
