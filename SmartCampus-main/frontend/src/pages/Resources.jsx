import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '' });

  useEffect(() => {
    fetchResources();
  }, [filters]);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/resources?${params.toString()}`);
      setResources(res.data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-[#e4e9f2] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Facilities & Assets</h1>
            <p className="text-sm text-slate-500">Browse, filter and request campus spaces or equipment.</p>
          </div>
          <div className="inline-flex gap-2">
            <select
              value={filters.type}
              onChange={e => setFilters({...filters, type: e.target.value})}
              className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="LECTURE_HALL">Lecture Hall</option>
              <option value="LAB">Lab</option>
              <option value="MEETING_ROOM">Meeting Room</option>
              <option value="EQUIPMENT">Equipment</option>
            </select>

            <select
              value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading resources...</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((res) => (
            <div key={res.id} className="bg-white rounded-xl border border-[#e4e9f2] shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">{res.name}</h3>
                    <p className="text-sm text-slate-500">{res.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    res.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                    res.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {res.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 text-sm text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-700">Location:</span> {res.location}</p>
                  {res.capacity && <p><span className="font-semibold text-slate-700">Capacity:</span> {res.capacity} people</p>}
                  {res.description && <p className="line-clamp-2">{res.description}</p>}
                </div>
              </div>
              <div className="bg-[#f8fafc] px-5 py-3 border-t border-[#e2e8f0]">
                <button
                  disabled={res.status !== 'ACTIVE'}
                  className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#0f6bff] hover:bg-[#0f58d1] disabled:bg-[#cbd5e1] disabled:text-slate-500"
                >
                  Book Resource
                </button>
              </div>
            </div>
          ))}

          {resources.length === 0 && (
            <div className="col-span-full text-center py-14 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
              No resources found matching the criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
