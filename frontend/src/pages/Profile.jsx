import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  User as UserIcon, Mail, ShieldCheck, Calendar,
  AlertCircle, Clock, CheckCircle2, XCircle, ChevronRight
} from 'lucide-react';

const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-orange-100 text-orange-700',
  USER: 'bg-blue-100 text-blue-700',
};

const BOOKING_STATUS_ICON = {
  PENDING: <Clock className="w-4 h-4 text-yellow-500" />,
  APPROVED: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  REJECTED: <XCircle className="w-4 h-4 text-red-500" />,
  CANCELLED: <XCircle className="w-4 h-4 text-gray-400" />,
};

export default function Profile() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, tRes] = await Promise.all([
          api.get('/bookings/my'),
          api.get('/tickets/my'),
        ]);
        setBookings(bRes.data.slice(0, 3));
        setTickets(tRes.data.slice(0, 3));
      } catch (e) {
        console.error('Failed to load profile data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account details and recent activity</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-blue-100 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{user?.name || 'Unknown User'}</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user?.email}</span>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold self-center ${ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'}`}>
              <ShieldCheck className="w-3 h-3" />
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading activity...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-800">Recent Bookings</h3>
              </div>
              <Link to="/bookings" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {bookings.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <li key={b.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="flex-shrink-0">{BOOKING_STATUS_ICON[b.status] || <Clock className="w-4 h-4 text-gray-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{b.resource?.name || 'Unknown Resource'}</p>
                      <p className="text-xs text-gray-500 truncate">{b.startTime ? new Date(b.startTime).toLocaleDateString() : ''}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{b.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-800">Recent Incidents</h3>
              </div>
              <Link to="/tickets" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {tickets.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No incidents reported yet.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {tickets.map(t => (
                  <li key={t.id} className="px-6 py-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.category}</p>
                      <p className="text-xs text-gray-500 truncate">{t.location}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      t.status === 'OPEN' ? 'bg-orange-100 text-orange-700' :
                      t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{t.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
