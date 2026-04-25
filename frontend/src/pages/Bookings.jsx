import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Bookings() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    searchQuery: '',
  });
  const [conflicts, setConflicts] = useState([]);
  const [form, setForm] = useState({
    resourceId: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: 1,
  });
  const [formErrors, setFormErrors] = useState({});

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, [filters]);

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data);
      if (res.data.length && !form.resourceId) {
        setForm((prev) => ({ ...prev, resourceId: res.data[0].id.toString() }));
      }
    } catch (err) {
      toast.error('Failed to load resources');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my');
      let filtered = res.data;

      // Filter by status
      if (filters.status) {
        filtered = filtered.filter(b => b.status === filters.status);
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
          b.resource?.name?.toLowerCase().includes(query) ||
          b.purpose?.toLowerCase().includes(query)
        );
      }

      setBookings(filtered);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.resourceId) errors.resourceId = 'Resource is required';
    if (!form.bookingDate) {
      errors.bookingDate = 'Date is required';
    } else if (form.bookingDate < today) {
      errors.bookingDate = 'Cannot book in the past';
    }
    if (!form.startTime) errors.startTime = 'Start time is required';
    if (!form.endTime) {
      errors.endTime = 'End time is required';
    } else if (form.startTime && form.startTime >= form.endTime) {
      errors.endTime = 'End time must be after start time';
    }
    if (!form.purpose || form.purpose.trim().length === 0) {
      errors.purpose = 'Purpose is required';
    } else if (form.purpose.trim().length < 3) {
      errors.purpose = 'Purpose must be at least 3 characters';
    }
    if (Number(form.attendees) < 1) errors.attendees = 'Attendees must be at least 1';

    return errors;
  };

  const checkConflicts = async () => {
    if (!form.resourceId || !form.bookingDate || !form.startTime || !form.endTime) return;

    try {
      const res = await api.get('/bookings');
      const potentialConflicts = res.data.filter(b =>
        b.resource?.id.toString() === form.resourceId &&
        b.bookingDate === form.bookingDate &&
        ['PENDING', 'APPROVED'].includes(b.status) &&
        form.startTime < b.endTime &&
        form.endTime > b.startTime
      );
      setConflicts(potentialConflicts);
    } catch (err) {
      console.error('Failed to check conflicts:', err);
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (conflicts.length > 0) {
      toast.error('Resource has conflicts during this time. Please select a different time.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/bookings', {
        resource: { id: Number(form.resourceId) },
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        attendees: Number(form.attendees),
      });

      toast.success('Booking request sent successfully');
      setForm({
        resourceId: form.resourceId,
        bookingDate: '',
        startTime: '',
        endTime: '',
        purpose: '',
        attendees: 1,
      });
      setFormErrors({});
      setConflicts([]);
      fetchBookings();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fieldErrors) {
        setFormErrors(data.fieldErrors);
      } else {
        toast.error(data?.message || 'Failed to create booking');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Check for conflicts when time/date/resource changes
  useEffect(() => {
    const timer = setTimeout(() => {
      checkConflicts();
    }, 500);
    return () => clearTimeout(timer);
  }, [form.resourceId, form.bookingDate, form.startTime, form.endTime]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 bg-white shadow-sm z-30 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900">Bookings</h1>
          <div className="flex items-center gap-2">
            <div className="relative w-80">
              <input
                type="text"
                placeholder="Search bookings..."
                className="w-full border border-gray-200 rounded-full px-5 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="material-symbols-outlined absolute right-4 top-2 text-slate-500 text-lg">search</span>
            </div>
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
        <div className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-5 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Request Resource</h2>
              <span className="material-symbols-outlined text-blue-500">edit_calendar</span>
            </div>

            <form className="space-y-4" onSubmit={submitBooking}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Resource & Purpose</label>
                <select
                  className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.resourceId ? 'border-red-400' : 'border-gray-200'}`}
                  value={form.resourceId}
                  onChange={(e) => { setForm((prev) => ({ ...prev, resourceId: e.target.value })); setFormErrors(prev => ({...prev, resourceId: ''})); }}
                >
                  {resources.map((res) => (
                    <option key={res.id} value={res.id}>{res.name}</option>
                  ))}
                </select>
                {formErrors.resourceId && <p className="mt-1 text-xs text-red-600">{formErrors.resourceId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Date</label>
                  <input
                    type="date"
                    className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.bookingDate ? 'border-red-400' : 'border-gray-200'}`}
                    value={form.bookingDate}
                    onChange={(e) => { setForm((prev) => ({ ...prev, bookingDate: e.target.value })); setFormErrors(prev => ({...prev, bookingDate: ''})); }}
                  />
                  {formErrors.bookingDate && <p className="mt-1 text-xs text-red-600">{formErrors.bookingDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="time"
                        className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.startTime ? 'border-red-400' : 'border-gray-200'}`}
                        value={form.startTime}
                        onChange={(e) => { setForm((prev) => ({ ...prev, startTime: e.target.value })); setFormErrors(prev => ({...prev, startTime: ''})); }}
                      />
                      {formErrors.startTime && <p className="mt-1 text-xs text-red-600">{formErrors.startTime}</p>}
                    </div>
                    <div>
                      <input
                        type="time"
                        className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.endTime ? 'border-red-400' : 'border-gray-200'}`}
                        value={form.endTime}
                        onChange={(e) => { setForm((prev) => ({ ...prev, endTime: e.target.value })); setFormErrors(prev => ({...prev, endTime: ''})); }}
                      />
                      {formErrors.endTime && <p className="mt-1 text-xs text-red-600">{formErrors.endTime}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Expected Attendees</label>
                <input
                  type="number"
                  min="1"
                  className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.attendees ? 'border-red-400' : 'border-gray-200'}`}
                  value={form.attendees}
                  onChange={(e) => { setForm((prev) => ({ ...prev, attendees: e.target.value })); setFormErrors(prev => ({...prev, attendees: ''})); }}
                />
                {formErrors.attendees && <p className="mt-1 text-xs text-red-600">{formErrors.attendees}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Purpose</label>
                <input
                  type="text"
                  className={`mt-1 w-full rounded-xl border p-3 text-sm ${formErrors.purpose ? 'border-red-400' : 'border-gray-200'}`}
                  value={form.purpose}
                  onChange={(e) => { setForm((prev) => ({ ...prev, purpose: e.target.value })); setFormErrors(prev => ({...prev, purpose: ''})); }}
                  placeholder="Minimum 3 characters"
                />
                {formErrors.purpose && <p className="mt-1 text-xs text-red-600">{formErrors.purpose}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
              >
                {submitting ? 'Requesting...' : 'Submit Request'}
              </button>
            </form>
          </section>

          <section className="col-span-12 lg:col-span-7 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Schedule Overview</h2>
                <p className="text-sm text-slate-500">Conflict detection for today</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="relative h-64 border border-gray-200 rounded-xl overflow-hidden">
              <div className="absolute inset-0 p-4">
                <div className="flex flex-col h-full justify-between">
                  {['09:00 AM', '12:00 PM', '03:00 PM'].map((label) => (
                    <div key={label} className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-slate-500">
                      <span className="w-14">{label}</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  ))}
                </div>

                <div className="absolute left-36 right-4 top-12 bg-blue-100/80 text-blue-900 p-3 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <p className="text-[10px] font-bold opacity-80">09:30 - 11:30</p>
                  <p className="text-xs font-semibold">Faculty Senate Meeting</p>
                </div>

                <div className="absolute left-44 right-24 top-28 bg-slate-50 border-2 border-dashed border-blue-300 p-3 rounded-xl flex items-center justify-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Selected Slot</p>
                </div>

                <div className="absolute left-52 right-8 bottom-4 bg-slate-200 text-slate-800 p-3 rounded-xl border-l-4 border-slate-500">
                  <p className="text-[10px] font-bold">14:00 - 17:00</p>
                  <p className="text-xs font-semibold">Open Coding Bootcamp</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Bookings</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-blue-600">Export CSV</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Filter by Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Schedule</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Purpose</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-500">Loading bookings...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">You have no bookings yet.</td></tr>
                ) : (
                  bookings.map((booking) => (
                    <React.Fragment key={booking.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{booking.resource?.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div>{booking.bookingDate}</div>
                          <div className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{booking.purpose}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            booking.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            booking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {booking.status === 'APPROVED' || booking.status === 'PENDING' ? (
                            <button
                              onClick={() => cancelBooking(booking.id)}
                              className="text-rose-600 hover:text-rose-900 font-semibold"
                            >
                              Cancel
                            </button>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                      {booking.adminNote && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-6 py-3">
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
        </section>
      </main>
    </div>
  );
}
