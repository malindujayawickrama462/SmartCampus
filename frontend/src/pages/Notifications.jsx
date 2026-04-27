import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread'

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unreadCount);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'BOOKING_APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'BOOKING_REJECTED': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'TICKET_STATUS_CHANGED': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your bookings and incidents</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-200 mb-3" />
            <p>You have no {filter === 'unread' ? 'unread ' : ''}notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <li 
                key={notification.id} 
                onClick={() => {
                  if (!notification.isRead) markAsRead(notification.id);
                  if (notification.actionUrl) window.location.href = notification.actionUrl;
                }}
                className={`p-5 transition flex items-start space-x-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50/50 cursor-pointer hover:bg-blue-50'}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                    {notification.message}
                  </p>
                  {notification.details && (
                    <p className="text-sm text-gray-600 mt-1">{notification.details}</p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500 space-x-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 text-[10px] uppercase font-medium">{notification.type}</span>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
