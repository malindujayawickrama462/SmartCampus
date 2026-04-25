import React, { useEffect, useState } from 'react';
import { Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const getNotificationColor = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return { bg: 'bg-green-50', border: 'border-l-green-500', text: 'text-green-800' };
      case 'BOOKING_REJECTED':
        return { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-800' };
      case 'BOOKING_CANCELLED':
        return { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-800' };
      case 'TICKET_STATUS_CHANGED':
        return { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-800' };
      case 'NEW_COMMENT':
        return { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800' };
      default:
        return { bg: 'bg-gray-50', border: 'border-l-gray-500', text: 'text-gray-800' };
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return '✅';
      case 'BOOKING_REJECTED':
        return '❌';
      case 'BOOKING_CANCELLED':
        return '⏸️';
      case 'TICKET_STATUS_CHANGED':
        return '🔄';
      case 'NEW_COMMENT':
        return '💬';
      default:
        return '📢';
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return 'Booking Approved';
      case 'BOOKING_REJECTED':
        return 'Booking Rejected';
      case 'BOOKING_CANCELLED':
        return 'Booking Cancelled';
      case 'TICKET_STATUS_CHANGED':
        return 'Ticket Status Updated';
      case 'NEW_COMMENT':
        return 'New Comment';
      default:
        return 'Notification';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === sortedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(sortedNotifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => {
      const notif = notifications.find(n => n.id === id);
      if (!notif.isRead) {
        markAsRead(id);
      }
    });
    setSelectedNotifications([]);
    toast.success('Selected notifications marked as read');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {notifications.length} total notifications
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Filter
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedNotifications.length > 0 && (
                <button
                  onClick={handleMarkSelectedAsRead}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Mark as Read ({selectedNotifications.length})
                </button>
              )}
              
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 flex items-center gap-2"
                >
                  <CheckCheck size={16} />
                  Mark All as Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          ) : sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
              <Filter size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500">No notifications to display</p>
            </div>
          ) : (
            <>
              {/* Select All Checkbox */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      sortedNotifications.length > 0 &&
                      selectedNotifications.length === sortedNotifications.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select all on this page ({sortedNotifications.length})
                  </span>
                </label>
              </div>

              {/* Individual Notifications */}
              {sortedNotifications.map((notification) => {
                const colors = getNotificationColor(notification.type);
                const isSelected = selectedNotifications.includes(notification.id);

                return (
                  <div
                    key={notification.id}
                    className={`${colors.bg} border-l-4 ${colors.border} rounded-lg shadow-sm p-4 transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectNotification(notification.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mt-1 flex-shrink-0"
                      />

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <h3 className={`font-semibold ${colors.text}`}>
                                {getNotificationTitle(notification.type)}
                              </h3>
                              {!notification.isRead && (
                                <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span title={formatDateTime(notification.createdAt)}>
                                {formatTime(notification.createdAt)}
                              </span>
                              {notification.referenceId && (
                                <span className="text-gray-400">
                                  ID: {notification.referenceId}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                title="Mark as read"
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                              >
                                <Check size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
