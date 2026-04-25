import React, { useState } from 'react';
import { X, Check, CheckCheck, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState(null);

  const getNotificationColor = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return 'border-l-4 border-l-green-500 bg-green-50';
      case 'BOOKING_REJECTED':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'BOOKING_CANCELLED':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50';
      case 'TICKET_STATUS_CHANGED':
        return 'border-l-4 border-l-blue-500 bg-blue-50';
      case 'NEW_COMMENT':
        return 'border-l-4 border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-4 border-l-gray-500 bg-gray-50';
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

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">{unreadCount} unread</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Action Bar */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Clock size={48} className="mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${getNotificationColor(notification.type)} ${
                    !notification.isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                  }`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {getNotificationTitle(notification.type)}
                        </h3>
                        {!notification.isRead && (
                          <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-4 bg-gray-50">
            <a
              href="/notifications"
              onClick={() => onClose()}
              className="text-center block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all notifications →
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
