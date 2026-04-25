import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { X, Plus, Send, Edit2, Trash2, Upload, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    location: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    contactDetails: '',
    resourceId: '',
    images: []
  });
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching user tickets...');
      const res = await api.get('/tickets/my');
      console.log('User tickets response:', res.data);
      const ticketArray = Array.isArray(res.data) ? res.data : [];
      console.log('Setting user tickets count:', ticketArray.length);
      setTickets(ticketArray);
    } catch (err) {
      console.error('Failed to load tickets:', err?.response?.data || err?.message);
      toast.error(err.response?.data?.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const validateTicketForm = () => {
    const errors = {};
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    } else if (formData.location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    } else if (formData.category.trim().length < 2) {
      errors.category = 'Category must be at least 2 characters';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    return errors;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateTicketForm();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      const formPayload = new FormData();
      formPayload.append('location', formData.location);
      formPayload.append('category', formData.category);
      formPayload.append('description', formData.description);
      formPayload.append('priority', formData.priority);
      formPayload.append('contactDetails', formData.contactDetails);
      if (formData.resourceId) formPayload.append('resourceId', formData.resourceId);
      
      formData.images.forEach(img => {
        formPayload.append('images', img);
      });

      const res = await api.post('/tickets', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTickets([res.data, ...tickets]);
      setShowCreateModal(false);
      setFormData({
        location: '',
        category: '',
        description: '',
        priority: 'MEDIUM',
        contactDetails: '',
        resourceId: '',
        images: []
      });
      setFormErrors({});
      toast.success('Incident ticket created successfully!');
    } catch (err) {
      const data = err.response?.data;
      if (data?.fieldErrors) {
        setFormErrors(data.fieldErrors);
      } else {
        toast.error(data?.message || 'Failed to create ticket');
      }
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    setFormData({
      ...formData,
      images: [...formData.images, ...files]
    });
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
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

  const filteredTickets = tickets.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-[#e4e9f2]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0f172a]">Incident Tickets</h1>
            <p className="text-sm text-slate-500">Track and resolve service incidents quickly.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ef4444] text-white rounded-lg font-semibold text-sm hover:bg-[#dc2626]"
          >
            <Plus className="w-4 h-4" /> Report Incident
          </button>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-[#e4e9f2]">
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
      </section>

      {/* Tickets List */}
      <section className="bg-white rounded-xl shadow-sm border border-[#e4e9f2]">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading incident tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            {tickets.length === 0 ? 'No incident tickets yet.' : 'No tickets match your filters.'}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {filteredTickets.map((ticket) => (
              <article
                key={ticket.id}
                onClick={() => fetchTicketDetail(ticket.id)}
                className="p-4 rounded-xl border border-[#edf2f7] hover:border-[#cbd5e1] hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(ticket.status)}
                      <p className="text-base font-bold text-[#0f172a]">#{ticket.id} - {ticket.category}</p>
                    </div>
                    <p className="text-sm text-slate-500">Location: {ticket.location}</p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{ticket.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-[#e4e9f2] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0f172a]">Report an Incident</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-[#0f172a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => { setFormData({...formData, location: e.target.value}); setFormErrors(prev => ({...prev, location: ''})); }}
                  placeholder="e.g., Building A, Room 201"
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.location ? 'border-red-400' : 'border-[#cbd5e1]'}`}
                />
                {formErrors.location && <p className="mt-1 text-xs text-red-600">{formErrors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => { setFormData({...formData, category: e.target.value}); setFormErrors(prev => ({...prev, category: ''})); }}
                  placeholder="e.g., Broken Projector, Network Down"
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${formErrors.category ? 'border-red-400' : 'border-[#cbd5e1]'}`}
                />
                {formErrors.category && <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => { setFormData({...formData, description: e.target.value}); setFormErrors(prev => ({...prev, description: ''})); }}
                  placeholder="Describe the issue in detail (minimum 10 characters)..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-medium ${formErrors.description ? 'border-red-400' : 'border-[#cbd5e1]'}`}
                />
                {formErrors.description && <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm font-medium"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">Contact Details</label>
                <input
                  type="text"
                  value={formData.contactDetails}
                  onChange={(e) => setFormData({...formData, contactDetails: e.target.value})}
                  placeholder="Phone or email for follow up"
                  className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                  Evidence Images (up to 3)
                </label>
                <div className="border-2 border-dashed border-[#cbd5e1] rounded-lg p-6 text-center">
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Click to upload images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-100 p-2 rounded">
                        <span className="text-sm font-medium text-slate-700">{img.name}</span>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-[#cbd5e1] rounded-lg font-semibold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#ef4444] text-white rounded-lg font-semibold text-sm hover:bg-[#dc2626]"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-[#e4e9f2] p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0f172a]">Ticket #{selectedTicket.id}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Category</p>
                  <p className="text-base font-bold text-[#0f172a]">{selectedTicket.category}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Location</p>
                  <p className="text-base font-bold text-[#0f172a]">{selectedTicket.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Priority</p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                    {selectedTicket.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Status</p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm text-slate-500 font-medium mb-2">Description</p>
                <p className="text-base text-slate-700 bg-slate-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              {selectedTicket.contactDetails && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-2">Contact Details</p>
                  <p className="text-base text-slate-700">{selectedTicket.contactDetails}</p>
                </div>
              )}

              {selectedTicket.assignee && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-2">Assigned To</p>
                  <p className="text-base text-slate-700">{selectedTicket.assignee.name}</p>
                </div>
              )}

              {selectedTicket.resolutionNotes && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-2">Resolution Notes</p>
                  <p className="text-base text-slate-700 bg-blue-50 p-4 rounded-lg">{selectedTicket.resolutionNotes}</p>
                </div>
              )}

              {selectedTicket.rejectionReason && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-2">Rejection Reason</p>
                  <p className="text-base text-red-800 bg-red-50 p-4 rounded-lg">{selectedTicket.rejectionReason}</p>
                </div>
              )}

              {/* Images */}
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-3">Evidence Images</p>
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

              {/* Comments */}
              <div>
                <p className="text-sm text-slate-500 font-medium mb-3">Comments</p>
                <div className="space-y-3">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold text-[#0f172a]">{comment.author.name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          {(comment.author.id === user.id || user.role === 'ADMIN') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.content);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full px-3 py-2 border border-[#cbd5e1] rounded-lg text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-3 py-1 bg-slate-300 text-slate-700 rounded text-xs font-semibold hover:bg-slate-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700">{comment.content}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No comments yet.</p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="mt-4 flex gap-2">
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" /> Send
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
