import type { Client } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; service_type: string; contract_value: string; deadline: string; start_date: string; client_id: string };
  setForm: (form: any) => void;
  editingProjectId: string | null;
  clients: Client[];
  projectClientMode: 'existing' | 'new';
  setProjectClientMode: (mode: 'existing' | 'new') => void;
  newClientName: string;
  setNewClientName: (name: string) => void;
}

export default function NewProjectModal({
  isOpen, onClose, onSubmit, form, setForm,
  editingProjectId, clients, projectClientMode,
  setProjectClientMode, newClientName, setNewClientName
}: NewProjectModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal u-modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{editingProjectId ? 'Editar Projeto' : 'Criar Novo Projeto'}</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">Nome do Projeto *</label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Reforma Cozinha Johnson" />
              </div>
              <div>
                <label className="f-label">Tipo de Serviço</label>
                <Select required value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                  <option value="" disabled>-- Selecione --</option>
                  <option value="Reforma">Reforma</option>
                  <option value="Reforma Residencial">Reforma Residencial</option>
                  <option>Kitchen Remodel</option>
                  <option>Bathroom Remodel</option>
                  <option>Full Renovation</option>
                  <option>Custom Home</option>
                </Select>
              </div>
              <div>
                <label className="f-label">Valor do Contrato ($)</label>
                <Input type="number" value={form.contract_value} onChange={e => setForm({...form, contract_value: e.target.value})} placeholder="25000" />
              </div>
              <div>
                <label className="f-label">Prazo Final</label>
                <Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div>
                <label className="f-label">Data de Início</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="f-label">Cliente</label>
                <div style={{display:'flex', gap:'6px', marginBottom:'4px'}}>
                  <Button type="button" variant={projectClientMode === 'existing' ? 'gold' : 'ghost'} className="text-[0.7rem] px-2.5 py-1" onClick={() => setProjectClientMode('existing')}>Existente</Button>
                  <Button type="button" variant={projectClientMode === 'new' ? 'gold' : 'ghost'} className="text-[0.7rem] px-2.5 py-1" onClick={() => setProjectClientMode('new')}>Novo</Button>
                </div>
                {projectClientMode === 'existing' ? (
                  <Select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}>
                    <option value="" disabled>-- Selecione --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                ) : (
                  <Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome do novo cliente" />
                )}
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="gold">{editingProjectId ? 'Salvar Alterações' : 'Criar Projeto'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
