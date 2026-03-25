import type { Partner } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: { name: string; service_type: string; city: string; email: string; phone: string; urgency: string; estimated_value: string; partner_id: string };
  setForm: (form: any) => void;
  partners: Partner[];
}

export default function NewLeadModal({ isOpen, onClose, onSubmit, form, setForm, partners }: NewLeadModalProps) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
        <div className="modal-head">
          <div className="modal-title">Cadastrar Novo Lead Manual</div>
          <button className="dclose" aria-label="Fechar" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="u-grid-2col">
              <div>
                <label className="f-label">Nome do Cliente *</label>
                <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="João silva" />
              </div>
              <div>
                <label className="f-label">Cidade *</label>
                <Input required value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Orlando, FL" />
              </div>
              <div>
                <label className="f-label">Tipo de Serviço</label>
                <Select required value={form.service_type} onChange={e => setForm({...form, service_type: e.target.value})}>
                  <option value="" disabled>-- Selecione --</option>
                  <option value="Bathroom Remodel">Bathroom Remodel</option>
                  <option value="Kitchen Remodel">Kitchen Remodel</option>
                  <option>Full Renovation</option>
                  <option>Custom Home</option>
                  <option>Outdoor / Deck</option>
                  <option>Painting</option>
                  <option>Flooring</option>
                  <option>Outro</option>
                </Select>
              </div>
              <div>
                <label className="f-label">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="f-label">Telefone</label>
                <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(xxx) xxx-xxxx" />
              </div>
              <div>
                <label className="f-label">Valor Estimado</label>
                <Input type="number" value={form.estimated_value} onChange={e => setForm({...form, estimated_value: e.target.value})} placeholder="15000" />
              </div>
              <div>
                <label className="f-label">Urgência</label>
                <Select required value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}>
                  <option value="" disabled>-- Selecione --</option>
                  <option value="hot">🔥 Quente</option>
                  <option value="warm">🟡 Morno</option>
                  <option value="cool">❄️ Frio</option>
                </Select>
              </div>
              <div>
                <label className="f-label">Parceiro Vinculado</label>
                <Select value={form.partner_id} onChange={e => setForm({...form, partner_id: e.target.value})}>
                  <option value="">-- Selecione --</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.full_name || p.name}</option>)}
                </Select>
              </div>
            </div>
          </div>
          <div className="modal-foot">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="gold">Criar Lead</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
