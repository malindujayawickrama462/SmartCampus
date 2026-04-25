import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Bell, CheckCircle2, AlertCircle, Info, Calendar } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
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
        )}
      </div>
    </div>
  );
}
