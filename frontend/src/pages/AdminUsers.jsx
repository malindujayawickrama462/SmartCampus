import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { User, Shield, Trash2, Edit2, X, Check } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'USER',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setEditingId(user.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ name: '', email: '', role: 'USER' });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await api.put(`/admin/users/${editingId}`, form);
      toast.success('User updated successfully');
      fetchUsers();
      handleCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'TECHNICIAN': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-600" size={28} />
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage system access, roles, and user information</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <span className="text-sm font-medium text-slate-600">Total Users:</span>
          <span className="text-lg font-bold text-blue-600">{users.length}</span>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Fetching users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === u.id ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <div className="space-y-2 max-w-xs">
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Full Name"
                          />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Email Address"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <select
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                          <option value="USER">User</option>
                          <option value="TECHNICIAN">Technician</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(u.role)}`}>
                          {u.role === 'ADMIN' && <Shield size={12} className="mr-1" />}
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md uppercase tracking-tighter">
                        {u.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingId === u.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleSave}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm"
                            title="Save Changes"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="py-20 text-center text-slate-500">
                <User size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="font-medium">No users found in the system.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
