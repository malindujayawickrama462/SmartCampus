import React, { useState, useEffect } from 'react';
import api from '../lib/api';
<<<<<<< HEAD
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
=======
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
>>>>>>> 5790bd8e3919f72408af9dd6590a2ac90f8d8919
  }, []);

  const fetchNotifications = async () => {
    try {
<<<<<<< HEAD
      const [notifRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
=======
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
>>>>>>> 5790bd8e3919f72408af9dd6590a2ac90f8d8919
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
<<<<<<< HEAD
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
      toast.success('Notification marked as read');
    } catch (err) {
=======
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
>>>>>>> 5790bd8e3919f72408af9dd6590a2ac90f8d8919
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
<<<<<<< HEAD
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
=======
      toast.success('All notifications marked as read');
    } catch (error) {
>>>>>>> 5790bd8e3919f72408af9dd6590a2ac90f8d8919
      toast.error('Failed to mark all as read');
    }
  };

<<<<<<< HEAD
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition transform hover:scale-105 ${
                  notification.isRead
                    ? 'bg-gray-100 border-gray-300'
                    : `${getSeverityColor(notification.severity)} border-solid`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`text-xl ${
                      notification.severity === 'success' ? 'text-green-600' :
                      notification.severity === 'warning' ? 'text-yellow-600' :
                      notification.severity === 'error' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {getSeverityIcon(notification.severity)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{notification.message}</h3>
                      {notification.details && (
                        <p className="text-sm text-gray-600 mt-1">{notification.details}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded-full text-gray-700">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
=======
  const getIcon = (type) => {
    switch(type) {
      case 'BOOKING_APPROVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'BOOKING_REJECTED': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'TICKET_STATUS_CHANGED': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-500">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-12 h-12 text-gray-200 mb-3" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                className={`p-5 transition flex items-start space-x-4 ${notification.isRead ? 'bg-white' : 'bg-blue-50/50 cursor-pointer hover:bg-blue-50'}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500 space-x-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
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
>>>>>>> 5790bd8e3919f72408af9dd6590a2ac90f8d8919
        )}
      </div>
    </div>
  );
}
