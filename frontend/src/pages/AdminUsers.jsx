import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, Users, ShieldCheck, UserCog, Wrench, ChevronDown } from 'lucide-react';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

const ROLE_CONFIG = {
  USER: { label: 'User', color: 'bg-blue-100 text-blue-800', icon: Users },
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: ShieldCheck },
  TECHNICIAN: { label: 'Technician', color: 'bg-amber-100 text-amber-800', icon: Wrench },
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [processing, setProcessing] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      window.location.href = '/';
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot change your own role.");
      setOpenDropdown(null);
      return;
    }

    setProcessing(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setProcessing(null);
      setOpenDropdown(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    if (openDropdown !== null) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [openDropdown]);

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    total: users.length,
    USER: users.filter(u => u.role === 'USER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    TECHNICIAN: users.filter(u => u.role === 'TECHNICIAN').length,
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-30 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Manage user accounts and role assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-700">
              {currentUser?.name?.[0] || 'A'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Users</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{roleCounts.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Users</p>
            <p className="text-3xl font-black text-blue-700 mt-1">{roleCounts.USER}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Admins</p>
            <p className="text-3xl font-black text-purple-700 mt-1">{roleCounts.ADMIN}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Technicians</p>
            <p className="text-3xl font-black text-amber-700 mt-1">{roleCounts.TECHNICIAN}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                {ROLES.map(r => (
                  <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold">
              Registered Users
              <span className="ml-2 text-sm text-slate-500 font-normal">({filteredUsers.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Provider</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
                    const RoleIcon = roleConfig.icon;
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                              ) : (
                                u.name?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {u.name}
                                {isSelf && (
                                  <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">You</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>

                        {/* Provider */}
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            u.provider === 'google'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.provider === 'google' ? 'Google' : 'Local'}
                          </span>
                        </td>

                        {/* Joined date */}
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>

                        {/* Current role badge */}
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${roleConfig.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-sm">
                          {isSelf ? (
                            <span className="text-xs text-slate-400 italic">Cannot edit own role</span>
                          ) : (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(openDropdown === u.id ? null : u.id);
                                }}
                                disabled={processing === u.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-gray-50 transition disabled:opacity-50"
                              >
                                {processing === u.id ? (
                                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UserCog className="w-3 h-3" />
                                )}
                                Change Role
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {openDropdown === u.id && (
                                <div
                                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px] py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {ROLES.map(role => {
                                    const rc = ROLE_CONFIG[role];
                                    const Icon = rc.icon;
                                    const isActive = u.role === role;

                                    return (
                                      <button
                                        key={role}
                                        onClick={() => handleRoleChange(u.id, role)}
                                        disabled={isActive}
                                        className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition ${
                                          isActive
                                            ? 'bg-gray-50 text-slate-400 cursor-default'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <Icon className="w-4 h-4" />
                                        {rc.label}
                                        {isActive && (
                                          <span className="ml-auto text-xs text-slate-400">Current</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
