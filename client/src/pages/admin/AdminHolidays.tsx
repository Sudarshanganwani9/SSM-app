import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { holidayApi } from '../../api/holidays';
import { getErrorMessage } from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { EmptyState } from '../../components/common/States';
import { formatDate, toDateInputValue } from '../../utils/format';
import type { Holiday } from '../../types';

const typeMeta: Record<string, string> = {
  NATIONAL: 'bg-navy-100 text-navy-700',
  REGIONAL: 'bg-info-light text-info',
  COMPANY: 'bg-brass-100 text-brass-700',
  OPTIONAL: 'bg-plum-light text-plum',
};

interface FormState {
  name: string;
  date: string;
  type: Holiday['type'];
  description: string;
  isRecurringYearly: boolean;
}

const emptyForm: FormState = { name: '', date: '', type: 'COMPANY', description: '', isRecurringYearly: false };

export default function AdminHolidays() {
  const year = new Date().getFullYear();
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => holidayApi.list({ year }).then((r) => r.data.data),
  });

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(h: Holiday) {
    setEditTarget(h);
    setForm({ name: h.name, date: toDateInputValue(h.date), type: h.type, description: h.description || '', isRecurringYearly: Boolean(h.isRecurringYearly) });
    setFormOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editTarget) {
        await holidayApi.update(editTarget._id, form);
        toast.success('Holiday updated.');
      } else {
        await holidayApi.create(form);
        toast.success('Holiday added.');
      }
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setFormOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await holidayApi.remove(deleteTarget._id);
      toast.success('Holiday deleted.');
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add holiday
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-navy-400">Loading holidays...</p>
      ) : (data ?? []).length === 0 ? (
        <div className="card">
          <EmptyState icon={CalendarDays} title="No holidays added yet" description="Add your company's holiday calendar for this year." />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((h) => (
            <div key={h._id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{h.name}</p>
                  <p className="text-sm text-navy-500">{formatDate(h.date, 'EEEE, dd MMM yyyy')}</p>
                </div>
                <Badge label={h.type} className={typeMeta[h.type]} />
              </div>
              {h.description && <p className="mt-2 text-xs text-navy-400">{h.description}</p>}
              <div className="mt-3 flex gap-2 border-t border-navy-100 pt-3">
                <button type="button" onClick={() => openEdit(h)} className="flex items-center gap-1 text-xs font-medium text-navy-600 hover:text-navy-900">
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" onClick={() => setDeleteTarget(h)} className="flex items-center gap-1 text-xs font-medium text-danger hover:underline">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit holiday' : 'Add holiday'}
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.date}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Holiday name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Holiday['type'] })}>
              <option value="NATIONAL">National</option>
              <option value="REGIONAL">Regional</option>
              <option value="COMPANY">Company</option>
              <option value="OPTIONAL">Optional</option>
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-600">
            <input
              type="checkbox"
              checked={form.isRecurringYearly}
              onChange={(e) => setForm({ ...form, isRecurringYearly: e.target.checked })}
            />
            Recurs every year
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete holiday"
        message={`Delete "${deleteTarget?.name}" from the holiday calendar? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
