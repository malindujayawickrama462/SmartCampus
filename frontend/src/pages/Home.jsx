import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { LayoutGrid, Calendar, AlertCircle } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ resources: 0, pendingBookings: 0, openTickets: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resRes, bookRes, tickRes] = await Promise.all([
          api.get('/resources'),
          api.get('/bookings/my'),
          api.get('/tickets/my')
        ]);
        const resources = Array.isArray(resRes.data) ? resRes.data : [];
        const bookings = Array.isArray(bookRes.data) ? bookRes.data : [];
        const tickets = Array.isArray(tickRes.data) ? tickRes.data : [];
        
        setStats({
          resources: resources.length,
          pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
          openTickets: tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#e3e8ef]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0f172a]">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-sm text-slate-600">Your central command for Campus Booking & Incident operations.</p>
          </div>
          <Link to="/resources" className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-[#0f6bff] to-[#1631b0] px-5 py-2 text-white text-sm font-semibold hover:opacity-95">
            <LayoutGrid className="w-4 h-4" /> Explore Resources
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <article className="bg-[#ffffff] border border-[#e6ebf5] rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#eef4ff] text-[#0f6bff]">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase text-[#64748b] font-bold tracking-wider">Total Resources</p>
              <p className="text-3xl font-bold text-[#0f172a]">{stats.resources}</p>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/resources" className="text-[#0f6bff] font-semibold hover:underline">Browse catalogue</Link>
          </div>
        </article>

        <article className="bg-[#ffffff] border border-[#e6ebf5] rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#fff7ed] text-[#b45309]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase text-[#64748b] font-bold tracking-wider">Pending Bookings</p>
              <p className="text-3xl font-bold text-[#0f172a]">{stats.pendingBookings}</p>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/bookings" className="text-[#b45309] font-semibold hover:underline">View booking queue</Link>
          </div>
        </article>

        <article className="bg-[#ffffff] border border-[#e6ebf5] rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#fee2e2] text-[#b91c1c]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase text-[#64748b] font-bold tracking-wider">Open Incidents</p>
              <p className="text-3xl font-bold text-[#0f172a]">{stats.openTickets}</p>
            </div>
          </div>
          <div className="mt-4 text-sm">
            <Link to="/tickets" className="text-[#b91c1c] font-semibold hover:underline">Manage tickets</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
