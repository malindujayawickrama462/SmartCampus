import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ResourceManagement() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'LECTURE_HALL',
    capacity: '',
    location: '',
    description: '',
    status: 'ACTIVE',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources');
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setForm({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', description: '', status: 'ACTIVE' });
    setEditingId(null);
    setIsAdding(true);
  };

  const handleEdit = (resource) => {
    setForm({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity || '',
      location: resource.location,
      description: resource.description || '',
      status: resource.status,
    });
    setEditingId(resource.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm({ name: '', type: 'LECTURE_HALL', capacity: '', location: '', description: '', status: 'ACTIVE' });
  };

  const validateResource = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!form.location.trim()) {
      errors.location = 'Location is required';
    } else if (form.location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }
    if (form.capacity && Number(form.capacity) < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateResource();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        capacity: form.capacity ? Number(form.capacity) : null,
        location: form.location.trim(),
        description: form.description || null,
        status: form.status,
      };

      if (editingId) {
        await api.put(`/resources/${editingId}`, payload);
        toast.success('Resource updated');
      } else {
        await api.post('/resources', payload);
        toast.success('Resource created');
      }
      fetchResources();
      handleCancel();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fieldErrors) {
        setFormErrors(data.fieldErrors);
      } else {
        toast.error(data?.message || 'Failed to save resource');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/resources/${id}`);
      toast.success('Resource deleted');
      fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[#e4e9f2]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Resource Catalogue</h1>
            <p className="text-sm text-slate-500">Manage bookable facilities and assets</p>
          </div>
          {!editingId && !isAdding && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-[#0f6bff] text-white rounded-lg font-semibold hover:bg-[#0f58d1]"
            >
              + Add Resource
            </button>
          )}
        </div>
      </section>

      {(isAdding || editingId) && (
        <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e4e9f2]">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors(prev => ({...prev, name: ''})); }}
                className={`mt-1 w-full rounded-lg border p-2 text-sm ${formErrors.name ? 'border-red-400' : 'border-slate-300'}`}
              />
              {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              >
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Location *</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => { setForm({ ...form, location: e.target.value }); setFormErrors(prev => ({...prev, location: ''})); }}
                className={`mt-1 w-full rounded-lg border p-2 text-sm ${formErrors.location ? 'border-red-400' : 'border-slate-300'}`}
              />
              {formErrors.location && <p className="mt-1 text-xs text-red-600">{formErrors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => { setForm({ ...form, capacity: e.target.value }); setFormErrors(prev => ({...prev, capacity: ''})); }}
                className={`mt-1 w-full rounded-lg border p-2 text-sm ${formErrors.capacity ? 'border-red-400' : 'border-slate-300'}`}
              />
              {formErrors.capacity && <p className="mt-1 text-xs text-red-600">{formErrors.capacity}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#0f6bff] text-white rounded-lg font-semibold hover:bg-[#0f58d1]"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading resources...</div>
      ) : (
        <section className="bg-white rounded-xl border border-[#e4e9f2] shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Capacity</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.map((res) => (
                <tr key={res.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{res.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{res.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{res.location}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{res.capacity || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        res.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : res.status === 'UNDER_MAINTENANCE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {res.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEdit(res)}
                      className="text-blue-600 hover:text-blue-900 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="text-rose-600 hover:text-rose-900 font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resources.length === 0 && <div className="p-6 text-center text-slate-500">No resources found.</div>}
        </section>
      )}
    </div>
  );
}
