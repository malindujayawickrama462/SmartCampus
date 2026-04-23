import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AdminBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filters, setFilters] = useState({
    status: 'PENDING',
    resourceId: '',
    searchQuery: '',
  });
  const [resources, setResources] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
      window.location.href = '/bookings';
    }
  }, [user]);

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, [filters]);

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to load resources');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = '/bookings';
      if (filters.status) {
        url += `?status=${filters.status}`;
      }
      const res = await api.get(url);
      let filtered = res.data;

      // Filter by resource
      if (filters.resourceId) {
        filtered = filtered.filter(b => b.resource?.id.toString() === filters.resourceId);
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
          b.user?.name?.toLowerCase().includes(query) ||
          b.resource?.name?.toLowerCase().includes(query) ||
          b.purpose?.toLowerCase().includes(query)
        );
      }

      setBookings(filtered);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const openApproveModal = (booking) => {
    setSelectedBooking(booking);
    setActionType('approve');
    setNote('');
    setModalOpen(true);
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setActionType('reject');
    setNote('');
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;

    try {
      setProcessing(true);
      await api.put(`/bookings/${selectedBooking.id}/approve`, { note });
      toast.success('Booking approved');
      setModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !note.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      await api.put(`/bookings/${selectedBooking.id}/reject`, { reason: note });
      toast.success('Booking rejected');
      setModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await api.put(`/bookings/${booking.id}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-700';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleStatusChange = (e) => {
    setFilters(prev => ({
      ...prev,
      status: e.target.value || null
    }));
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm z-30 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Booking Management</h1>
            <p className="text-sm text-slate-500">Review and manage booking requests</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
              {user?.name?.[0] || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status</label>
              <select
                value={filters.status || ''}
                onChange={handleStatusChange}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Resource</label>
              <select
                value={filters.resourceId}
                onChange={(e) => setFilters(prev => ({ ...prev, resourceId: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              >
                <option value="">All Resources</option>
                {resources.map(res => (
                  <option key={res.id} value={res.id}>{res.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by user, resource, or purpose..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold">
              Booking Requests
              <span className="ml-2 text-sm text-slate-500 font-normal">({bookings.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Purpose</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Attendees</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-slate-500">Loading bookings...</td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-slate-500">No bookings found.</td>
                  </tr>
                ) : (
                  bookings.map((booking) => (
                    <React.Fragment key={booking.id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{booking.user?.name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{booking.resource?.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {booking.bookingDate} <br />
                          <span className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{booking.purpose}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{booking.attendees || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          {booking.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => openApproveModal(booking)}
                                className="text-emerald-600 hover:text-emerald-900 font-semibold"
                              >
                                Approve
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                onClick={() => openRejectModal(booking)}
                                className="text-rose-600 hover:text-rose-900 font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          ) : booking.status === 'APPROVED' ? (
                            <button
                              onClick={() => handleCancel(booking)}
                              className="text-rose-600 hover:text-rose-900 font-semibold"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                      {booking.adminNote && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="px-6 py-3">
                            <p className="text-xs text-slate-600"><strong>Admin Note:</strong> {booking.adminNote}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </h3>

            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900">
                {selectedBooking?.user?.name}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {selectedBooking?.resource?.name} - {selectedBooking?.bookingDate}
              </p>
              <p className="text-xs text-slate-600">
                {selectedBooking?.startTime} - {selectedBooking?.endTime}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Attendees: {selectedBooking?.attendees || '-'}
              </p>
              <p className="text-xs text-slate-600 mt-2 italic">{selectedBooking?.purpose}</p>
              {selectedBooking?.adminNote && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-600"><strong>Previous Note:</strong> {selectedBooking.adminNote}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {actionType === 'approve' ? 'Approval Note (optional)' : 'Rejection Reason (required)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={actionType === 'approve' ? 'Add any notes...' : 'Explain why you are rejecting...'}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm resize-none h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={processing || (actionType === 'reject' && !note.trim())}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400'
                }`}
              >
                {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
