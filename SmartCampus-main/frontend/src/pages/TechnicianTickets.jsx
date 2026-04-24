import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, Clock, AlertCircle, MessageSquare, 
  Search, Filter, User, MapPin, Tag, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const TechnicianTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchAssignedTickets();
  }, []);

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/assigned');
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load assigned tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (id) => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setSelectedTicket(res.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      setUpdatingStatus(true);
      const res = await api.put(`/tickets/${selectedTicket.id}/status`, { status });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === res.data.id ? res.data : t));
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(`/tickets/${selectedTicket.id}/comments`, {
        content: newComment
      });
      setSelectedTicket({
        ...selectedTicket,
        comments: [...(selectedTicket.comments || []), res.data]
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="w-5 h-5 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-slate-500" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredTickets = tickets
    .filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.id.toString().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assigned Tasks</h1>
          <p className="text-slate-500 text-sm">Manage and update your assigned incident tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID, location or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Ticket List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center text-slate-500">
            No assigned tickets found matching your criteria.
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => fetchTicketDetail(ticket.id)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="font-bold text-slate-900">#{ticket.id} - {ticket.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {ticket.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Task Details #{selectedTicket.id}</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Actions */}
              <div className="bg-slate-50 p-4 rounded-xl flex flex-wrap gap-3 items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Update Status:</span>
                <div className="flex gap-2">
                  {selectedTicket.status !== 'IN_PROGRESS' && selectedTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      Start Working
                    </button>
                  )}
                  {selectedTicket.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</h3>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">{selectedTicket.description}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</h3>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-blue-500" /> {selectedTicket.location}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporter</h3>
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-4 h-4 text-blue-500" /> {selectedTicket.reporter?.name} ({selectedTicket.reporter?.email})
                    </div>
                  </div>
                  {selectedTicket.contactDetails && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact Info</h3>
                      <p className="text-slate-700">{selectedTicket.contactDetails}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" /> Technical Comments
                </h3>
                
                <div className="space-y-3">
                  {selectedTicket.comments?.map(comment => (
                    <div key={comment.id} className={`p-3 rounded-xl border ${
                      comment.author?.role === 'TECHNICIAN' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{comment.author?.name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a technical update or note..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianTickets;
