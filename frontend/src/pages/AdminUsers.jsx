import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Search, Users, ShieldCheck, UserCog, Wrench, ChevronDown, Ban, CheckCircle, KeyRound, X, Eye, EyeOff } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Password reset modal state
  const [resetModal, setResetModal] = useState({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({});
  const [resetting, setResetting] = useState(false);

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
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setProcessing(null);
      setOpenDropdown(null);
    }
  };

  const handleToggleStatus = async (userId, userName, currentlyActive) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    const action = currentlyActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} "${userName}"?\n\n${currentlyActive ? 'They will be unable to log in or access the system.' : 'They will regain access to the system.'}`)) {
      return;
    }

    setProcessing(userId);
    try {
      const res = await api.put(`/admin/users/${userId}/status`);
      const updatedUser = res.data;
      toast.success(`${userName} has been ${updatedUser.active ? 'reactivated' : 'deactivated'}`);
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, active: updatedUser.active } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} user`);
    } finally {
      setProcessing(null);
    }
  };

  const openResetModal = (user) => {
    if (user.provider !== 'local') {
      toast.error('Cannot reset password for OAuth (Google) accounts.');
      return;
    }
    setResetModal({ open: true, user });
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setResetErrors({});
  };

  const closeResetModal = () => {
    setResetModal({ open: false, user: null });
    setNewPassword('');
    setConfirmPassword('');
    setResetErrors({});
  };

  const handleResetPassword = async () => {
    const errors = {};
    if (!newPassword) {
      errors.password = 'Password is required';
    } else if (newPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      errors.confirm = 'Please confirm the password';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setResetErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setResetting(true);
    try {
      await api.put(`/admin/users/${resetModal.user.id}/reset-password`, { password: newPassword });
      toast.success(`Password for "${resetModal.user.name}" has been reset successfully`);
      closeResetModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetting(false);
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
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && u.active !== false) ||
      (statusFilter === 'deactivated' && u.active === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleCounts = {
    total: users.length,
    USER: users.filter(u => u.role === 'USER').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    TECHNICIAN: users.filter(u => u.role === 'TECHNICIAN').length,
    deactivated: users.filter(u => u.active === false).length,
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-30 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Manage user accounts, roles, and access control</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">Deactivated</p>
            <p className="text-3xl font-black text-rose-700 mt-1">{roleCounts.deactivated}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
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
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleConfig = ROLE_CONFIG[u.role] || ROLE_CONFIG.USER;
                    const RoleIcon = roleConfig.icon;
                    const isSelf = u.id === currentUser?.id;
                    const isDeactivated = u.active === false;

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 transition ${isDeactivated ? 'opacity-60' : ''}`}>
                        {/* User info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isDeactivated ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
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

                        {/* Status */}
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isDeactivated
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isDeactivated ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                            {isDeactivated ? 'Deactivated' : 'Active'}
                          </span>
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
                          <div className="flex items-center gap-2">
                            {/* Role change */}
                            {isSelf ? (
                              <span className="text-xs text-slate-400 italic">You</span>
                            ) : (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(openDropdown === u.id ? null : u.id);
                                  }}
                                  disabled={processing === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-gray-50 transition disabled:opacity-50"
                                  title="Change role"
                                >
                                  {processing === u.id ? (
                                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserCog className="w-3 h-3" />
                                  )}
                                  Role
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

                            {/* Deactivate / Reactivate */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(u.id, u.name, u.active !== false)}
                                disabled={processing === u.id}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                                  isDeactivated
                                    ? 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                    : 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                }`}
                                title={isDeactivated ? 'Reactivate account' : 'Deactivate account'}
                              >
                                {isDeactivated ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                {isDeactivated ? 'Activate' : 'Deactivate'}
                              </button>
                            )}

                            {/* Reset Password */}
                            {!isSelf && u.provider === 'local' && (
                              <button
                                onClick={() => openResetModal(u)}
                                disabled={processing === u.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition disabled:opacity-50"
                                title="Reset password"
                              >
                                <KeyRound className="w-3 h-3" />
                                Reset PW
                              </button>
                            )}
                          </div>
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

      {/* Password Reset Modal */}
      {resetModal.open && resetModal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Reset Password</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set a new password for <strong>{resetModal.user.name}</strong>
                </p>
              </div>
              <button onClick={closeResetModal} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800 font-medium">
                  ⚠️ This will immediately change the user's password. Make sure to communicate the new password to them securely.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setResetErrors(prev => ({...prev, password: ''})); }}
                    placeholder="Minimum 6 characters"
                    className={`w-full rounded-lg border p-2 pr-10 text-sm focus:outline-none focus:ring-2 ${
                      resetErrors.password ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.password && <p className="mt-1 text-xs text-red-600">{resetErrors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setResetErrors(prev => ({...prev, confirm: ''})); }}
                  placeholder="Re-enter the new password"
                  className={`w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-2 ${
                    resetErrors.confirm ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {resetErrors.confirm && <p className="mt-1 text-xs text-red-600">{resetErrors.confirm}</p>}
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={closeResetModal}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-slate-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
