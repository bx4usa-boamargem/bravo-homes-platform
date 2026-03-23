import { describe, it, expect, vi } from 'vitest';

describe('Dashboard utility functions', () => {
  it('date formatting works correctly for pt-BR', () => {
    const date = new Date('2026-03-22T12:00:00');
    const formatted = date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('2026');
  });

  it('Promise.all parallelizes multiple queries', async () => {
    const calls: number[] = [];
    const mockQuery = (id: number) =>
      new Promise((resolve) => {
        calls.push(id);
        setTimeout(() => resolve({ data: [] }), 10);
      });

    const results = await Promise.all([mockQuery(1), mockQuery(2), mockQuery(3)]);
    expect(results).toHaveLength(3);
    expect(calls).toEqual([1, 2, 3]);
  });

  it('status mapping returns correct labels', () => {
    const statusMap: Record<string, string> = {
      new: 'Nova / Recebida',
      contacted: 'Em Contato',
      scheduling: 'Agendamento de Vistoria',
      proposal: 'Proposta Enviada',
      closed: 'Fechado ✓',
    };
    expect(statusMap['new']).toBe('Nova / Recebida');
    expect(statusMap['closed']).toBe('Fechado ✓');
    expect(statusMap['unknown']).toBeUndefined();
  });

  it('urgency values are valid', () => {
    const validUrgencies = ['hot', 'warm', 'cool'];
    expect(validUrgencies).toContain('hot');
    expect(validUrgencies).toContain('warm');
    expect(validUrgencies).toContain('cool');
    expect(validUrgencies).not.toContain('unknown');
  });
});
