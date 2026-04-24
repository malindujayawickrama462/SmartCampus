import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Send, Edit2, Trash2, AlertCircle, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminTickets() {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [statusForm, setStatusForm] = useState({ status: '', resolutionNotes: '', rejectionReason: '' });
  const [assignForm, setAssignForm] = useState({ technicianId: '' });
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Access denied. Admin only.');
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchTechnicians();
  }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin tickets with filters:', { filterStatus, filterPriority });
      const res = await api.get('/tickets', {
        params: {
          status: filterStatus || undefined,
          priority: filterPriority || undefined
        }
      });
      console.log('Admin tickets response:', res.data);
      if (!res.data) {
        console.warn('Received empty response from server');
        setTickets([]);
        return;
      }
      const ticketArray = Array.isArray(res.data) ? res.data : [];
      console.log('Setting tickets count:', ticketArray.length);
      setTickets(ticketArray);
    } catch (err) {
      console.error('Failed to load tickets:', err?.response?.data || err?.message);
      toast.error(err.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      console.log('Fetching technicians...');
      const res = await api.get('/tickets/technicians');
      console.log('Technicians response:', res.data);
      const techArray = Array.isArray(res.data) ? res.data : [];
      console.log('Setting technicians count:', techArray.length);
      setTechnicians(techArray);
    } catch (err) {
      console.error('Failed to load technicians:', err?.response?.data || err?.message);
      toast.error('Failed to load technicians. Make sure you are logged in as an admin.');
      setTechnicians([]);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusForm.status) {
      toast.error('Please select a status');
      return;
    }
    if (statusForm.status === 'REJECTED' && !statusForm.rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const res = await api.put(`/tickets/${selectedTicket.id}/status`, {
        status: statusForm.status,
        resolutionNotes: statusForm.resolutionNotes || null,
        rejectionReason: statusForm.rejectionReason || null
      });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === res.data.id ? res.data : t));
      setStatusForm({ status: '', resolutionNotes: '', rejectionReason: '' });
      toast.success('Ticket status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAssignTechnician = async () => {
    if (!assignForm.technicianId) {
      toast.error('Please select a technician');
      return;
    }

    try {
      const res = await api.put(`/tickets/${selectedTicket.id}/assign`, {
        technicianId: parseInt(assignForm.technicianId)
      });
      setSelectedTicket(res.data);
      setTickets(tickets.map(t => t.id === res.data.id ? res.data : t));
      setAssignForm({ technicianId: '' });
      toast.success('Technician assigned');
    } catch (err) {
      toast.error('Failed to assign technician');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!selectedTicket || !selectedTicket.id) {
      toast.error('Ticket not loaded. Please try again.');
      return;
    }
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
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    if (!selectedTicket || !selectedTicket.id) {
      toast.error('Ticket not loaded. Please try again.');
      return;
    }
    try {
      const res = await api.put(`/tickets/comments/${commentId}`, {
        content: editingCommentText
      });
      setSelectedTicket({
        ...selectedTicket,
        comments: (selectedTicket.comments || []).map(c => c.id === commentId ? res.data : c)
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    if (!selectedTicket || !selectedTicket.comments) {
      toast.error('Ticket not loaded. Please try again.');
      return;
    }
    try {
      await api.delete(`/tickets/comments/${commentId}`);
      setSelectedTicket({
        ...selectedTicket,
        comments: (selectedTicket.comments || []).filter(c => c.id !== commentId)
      });
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const fetchTicketDetail = async (ticketId) => {
    setLoadingTicketDetail(true);
    setSelectedTicket(null);
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      if (res.data && res.data.id) {
        setSelectedTicket({
          id: res.data.id,
          category: res.data.category || '',
          location: res.data.location || '',
          priority: res.data.priority || '',
          status: res.data.status || 'OPEN',
          description: res.data.description || '',
          contactDetails: res.data.contactDetails || '',
          reporter: res.data.reporter || {},
          assignee: res.data.assignee || null,
          resolutionNotes: res.data.resolutionNotes || '',
          rejectionReason: res.data.rejectionReason || '',
          images: res.data.images || [],
          comments: res.data.comments || [],
          createdAt: res.data.createdAt || ''
        });
        setShowDetailModal(true);
      } else {
        toast.error('Invalid ticket data received');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = "w-4 h-4";
    switch (status) {
      case 'OPEN': return <AlertCircle className={`${iconProps} text-green-600`} />;
      case 'IN_PROGRESS': return <Clock className={`${iconProps} text-blue-600`} />;
      case 'RESOLVED': return <CheckCircle className={`${iconProps} text-slate-600`} />;
      case 'CLOSED': return <CheckCircle className={`${iconProps} text-slate-400`} />;
      case 'REJECTED': return <XCircle className={`${iconProps} text-red-600`} />;
      default: return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'LOW': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'RESOLVED': return 'bg-slate-100 text-slate-700';
      case 'CLOSED': return 'bg-slate-200 text-slate-600';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const filteredTickets = (tickets || [])
    .filter(t => {
      if (!t) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (t.id && t.id.toString().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          (t.reporter?.name && t.reporter.name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[#e4e9f2]">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Incident Management</h1>
          <p className="text-sm text-slate-500">Review, assign, and manage all incident tickets.</p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e4e9f2]">
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, category, location, or reporter..."
            className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm font-medium"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0f172a] mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm font-medium"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Tickets Table */}
      <section className="bg-white rounded-xl shadow-sm border border-[#e4e9f2] overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-[#e4e9f2]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[#e4e9f2] hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-bold text-[#0f172a]">#{ticket.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{ticket.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{ticket.reporter?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {ticket.assignee ? (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {ticket.assignee.name}
                        </div>
                      ) : (
                        <span className="text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchTicketDetail(ticket.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-[#e4e9f2] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0f172a]">Ticket #{selectedTicket.id} Management</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-500 hover:text-[#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingTicketDetail ? (
              <div className="p-8 text-center text-slate-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-sm">Loading ticket details...</p>
              </div>
            ) : (
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Category</p>
                  <p className="text-sm font-bold text-[#0f172a]">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Location</p>
                  <p className="text-sm font-bold text-[#0f172a]">{selectedTicket.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Priority</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Reporter and Assignee */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-2">Reporter</p>
                  <p className="text-sm font-bold text-[#0f172a]">{selectedTicket.reporter?.name || 'Unknown'}</p>
                  {selectedTicket.contactDetails && (
                    <p className="text-xs text-slate-600">{selectedTicket.contactDetails}</p>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-2">Assigned To</p>
                  {selectedTicket.assignee ? (
                    <p className="text-sm font-bold text-[#0f172a]">{selectedTicket.assignee.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Not assigned</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-slate-500 font-bold uppercase mb-2">Description</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolutionNotes && (
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase mb-2">Resolution Notes</p>
                  <p className="text-sm text-slate-700 bg-blue-50 p-4 rounded-lg">{selectedTicket.resolutionNotes}</p>
                </div>
              )}

              {selectedTicket.rejectionReason && (
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase mb-2">Rejection Reason</p>
                  <p className="text-sm text-red-800 bg-red-50 p-4 rounded-lg">{selectedTicket.rejectionReason}</p>
                </div>
              )}

              {/* Images */}
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 font-bold uppercase mb-3">Evidence Images</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedTicket.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={`/uploads/${img.filePath.split('/').pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#e4e9f2] rounded-lg overflow-hidden hover:shadow-md transition"
                      >
                        <img
                          src={`/uploads/${img.filePath.split('/').pop()}`}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-32 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900">Admin Actions</p>

                {/* Assign Technician */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Assign Technician</label>
                  <div className="flex gap-2">
                    <select
                      value={assignForm.technicianId}
                      onChange={(e) => setAssignForm({ technicianId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm"
                    >
                      <option value="">Select technician...</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignTechnician}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Update Status</label>
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm mb-2"
                  >
                    <option value="">Select status...</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {statusForm.status === 'RESOLVED' && (
                    <textarea
                      value={statusForm.resolutionNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, resolutionNotes: e.target.value })}
                      placeholder="Add resolution notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm mb-2"
                    />
                  )}

                  {statusForm.status === 'REJECTED' && (
                    <textarea
                      value={statusForm.rejectionReason}
                      onChange={(e) => setStatusForm({ ...statusForm, rejectionReason: e.target.value })}
                      placeholder="Explain rejection reason..."
                      rows={2}
                      className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm mb-2"
                    />
                  )}

                  {statusForm.status && (
                    <button
                      onClick={handleUpdateStatus}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Comments & Notes</p>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-3 rounded-lg border border-[#e4e9f2]">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="text-xs font-bold text-[#0f172a]">{comment.author?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {(comment.author?.id === user.id || user.role === 'ADMIN') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.content);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full px-2 py-1 border border-[#cbd5e1] rounded text-xs"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2 py-1 bg-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-700">{comment.content}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No comments yet.</p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
