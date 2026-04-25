import React from 'react';
import { X, CheckCheck, Clock, Bell, Info, AlertCircle, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED':
        return {
          icon: <CheckCircle2 className="text-emerald-500" size={20} />,
          bg: 'bg-emerald-50/50',
          border: 'border-emerald-100',
          accent: 'bg-emerald-500'
        };
      case 'BOOKING_REJECTED':
        return {
          icon: <AlertCircle className="text-rose-500" size={20} />,
          bg: 'bg-rose-50/50',
          border: 'border-rose-100',
          accent: 'bg-rose-500'
        };
      case 'BOOKING_CANCELLED':
        return {
          icon: <Info className="text-amber-500" size={20} />,
          bg: 'bg-amber-50/50',
          border: 'border-amber-100',
          accent: 'bg-amber-500'
        };
      case 'TICKET_STATUS_CHANGED':
        return {
          icon: <Bell className="text-blue-500" size={20} />,
          bg: 'bg-blue-50/50',
          border: 'border-blue-100',
          accent: 'bg-blue-500'
        };
      case 'NEW_COMMENT':
        return {
          icon: <MessageSquare className="text-indigo-500" size={20} />,
          bg: 'bg-indigo-50/50',
          border: 'border-indigo-100',
          accent: 'bg-indigo-500'
        };
      default:
        return {
          icon: <Bell className="text-slate-500" size={20} />,
          bg: 'bg-slate-50/50',
          border: 'border-slate-100',
          accent: 'bg-slate-500'
        };
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'BOOKING_APPROVED': return 'Booking Approved';
      case 'BOOKING_REJECTED': return 'Booking Rejected';
      case 'BOOKING_CANCELLED': return 'Booking Cancelled';
      case 'TICKET_STATUS_CHANGED': return 'Ticket Updated';
      case 'NEW_COMMENT': return 'New Comment';
      default: return 'Notification';
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

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Side Panel */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Stay updated with your campus activities</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        {unreadCount > 0 && (
          <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unread Messages</span>
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Syncing notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-10 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Bell size={40} className="text-slate-200" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg">All caught up!</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                You don't have any notifications at the moment. We'll let you know when something happens.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notification) => {
                const styles = getNotificationStyles(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`group relative p-6 cursor-pointer transition-all hover:bg-slate-50/80 ${
                      !notification.isRead ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    {!notification.isRead && (
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${styles.accent}`}></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.bg} border ${styles.border} group-hover:scale-110 transition-transform duration-200`}>
                        {styles.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold truncate ${!notification.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                            {getNotificationTitle(notification.type)}
                          </h4>
                          <div className="flex items-center text-[10px] font-medium text-slate-400 whitespace-nowrap">
                            <Clock size={10} className="mr-1" />
                            {formatTime(notification.createdAt)}
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-1 leading-relaxed ${!notification.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                          {notification.message}
                        </p>
                        
                        {notification.referenceId && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter cursor-pointer group/link">
                            View details
                            <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-100">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
            >
              Clear View
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default NotificationPanel;
