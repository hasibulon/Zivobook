import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  ArrowLeft, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  Share2, 
  ShieldCheck, 
  Sparkles,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Notification, User } from '../types';

interface NotificationsViewProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => Promise<void> | void;
  onClearNotifications: () => Promise<void> | void;
  onMarkSingleRead: (id: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onGoBack: () => void;
  theme: 'dark' | 'light'; // গ্লোবাল থিম সিঙ্ক টোকেন ইনজেকশন
}

export default function NotificationsView({
  notifications = [],
  unreadCount,
  onMarkAllRead,
  onClearNotifications,
  onMarkSingleRead,
  onSelectUser,
  onGoBack,
  theme
}: NotificationsViewProps) {
  
  // Tab layout active tab state inside notifications window
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const isDark = theme === 'dark';

  // Dynamic filter processing algorithm tracking rules
  const displayList = useMemo(() => {
    if (filterType === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filterType]);

  // Dynamic verification helper to extract matching icons context maps
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Heart className="w-4 h-4 fill-current" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
        );
      case 'follow':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'repost':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-zinc-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const getFriendlyTime = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    try {
      const created = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Active';
    }
  };

  // High Contrast Context Theme Adaptation Configuration Rules Matrix
  const containerClass = 'bg-slate-950 border-slate-800 text-slate-200 shadow-xl';

  const rowHoverClass = 'hover:bg-slate-900';

  const unreadRowBg = 'bg-[#1877F2]/5 hover:bg-[#1877F2]/10';

  return (
    <div className="w-full max-w-[600px] mx-auto p-0 sm:p-2 animate-fade-in select-none" id="notifications-center-viewport">
      
      <div className={`w-full rounded-2xl border overflow-hidden transition-all duration-300 ${containerClass}`}>
        
        {/* TOP LEVEL NAVIGATION ACTIONS CONTROLLER HEADER ROW */}
        <div className="p-4 border-b border-slate-800/60 flex flex-col gap-3.5 select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <button 
                onClick={onGoBack}
                className="p-2 rounded-xl transition cursor-pointer flex items-center justify-center bg-slate-900 text-slate-350 hover:text-slate-100 border border-slate-805"
                title="Go Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div className="leading-none mt-0.5">
                <h2 className="text-base font-black tracking-tight text-slate-100 font-display">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold text-blue-500 block mt-1 uppercase tracking-wider">
                    {unreadCount} New Update Nodes Checked
                  </span>
                )}
              </div>
            </div>

            {/* Fast Trigger Ledger Actions Button widgets links panel */}
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-900"
                  title="Mark all logs as read sync"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                  <span className="hidden xs:inline text-slate-100">Read All</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="p-2 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border bg-red-950/10 hover:bg-red-950/20 border-red-900/30 text-red-500 hover:text-red-400 shadow-sm"
                  title="Clear registry database cache log"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span className="hidden xs:inline">Clear Log</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB ROUTING FILTERS (Facebook Style All / Unread Pills row switch component) */}
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-tight transition cursor-pointer border ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white border-transparent shadow'
                  : 'text-slate-400 border-transparent hover:bg-slate-900'
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-tight transition cursor-pointer border relative ${
                filterType === 'unread'
                  ? 'bg-blue-600 text-white border-transparent shadow'
                  : 'text-slate-400 border-transparent hover:bg-slate-800'
              }`}
            >
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-mono font-black shadow-sm leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* FEED BUFFER SCROLL BODY STREAM SECTION */}
        <div className="divide-y divide-slate-800/50 overflow-y-auto max-h-[640px] scrollbar-none" id="notifications-scrolling-node-stream">
          {displayList.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 rounded-full bg-slate-900 text-slate-400"><Bell className="w-6 h-6 opacity-60" /></div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-350 font-sans">No recent notification logs discovered.</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Your decentralized citizen audit pipeline ledger record book matches perfectly.</p>
              </div>
            </div>
          ) : (
            displayList.map((notif) => {
              const sender = notif.sender || {
                id: 'system',
                displayName: 'System Agent',
                username: 'system',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
                isVerified: true
              };
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) onMarkSingleRead(notif.id);
                    if (onSelectUser && notif.sender) onSelectUser(notif.sender);
                  }}
                  className={`p-4 flex items-start gap-3.5 cursor-pointer transition relative group/row border-l-2 ${
                    notif.read 
                      ? `border-transparent ${rowHoverClass}` 
                      : `border-blue-500 ${unreadRowBg}`
                  }`}
                  id={`notif-item-row-${notif.id}`}
                >
                  
                  {/* Avatar wrapper node section with sub action type category icon badge floating layout */}
                  <div className="relative shrink-0 select-none">
                    <img 
                      src={sender.avatar} alt={sender.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-800 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 z-10 scale-90">
                      {getNotificationIcon(notif.type)}
                    </div>
                  </div>

                  {/* Inside Main Message description container block field */}
                  <div className="flex-1 text-left min-w-0 pr-6 leading-tight">
                    <div className="text-xs text-slate-200 font-medium font-sans whitespace-normal break-words leading-relaxed select-text">
                      <strong className="font-black hover:underline cursor-pointer text-slate-100">
                        {sender.displayName}
                      </strong>
                      {sender.isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-[#1877F2] fill-current inline-block mx-1 mt-[-2px] shrink-0" />
                      )}
                      <span className="ml-0.5 text-slate-205">
                        {notif.message || notif.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 mt-1.5 font-mono font-bold select-none">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{getFriendlyTime(notif.createdAt)}</span>
                      {!notif.read && (
                        <>
                          <span>•</span>
                          <span className="text-blue-500 uppercase tracking-widest font-mono text-[9px] font-black animate-pulse">New Node</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Dynamic floating specific inline row action widgets components controls */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition duration-150 bypass-nav-trigger">
                    {!notif.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkSingleRead(notif.id);
                        }}
                        className="p-1.5 rounded-lg border transition cursor-pointer bg-slate-900 border-slate-800 text-emerald-500 hover:bg-slate-800 hover:text-emerald-400"
                        title="Mark single item log as read sync"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    )}
                  </div>

                  {/* Floating blue unread bullet dot tracking marker layout slots anchor widget link */}
                  {!notif.read && (
                    <div className="absolute right-4 top-4 w-2 h-2 bg-blue-500 rounded-full shadow-sm animate-scale-up" id="unread-dot-indicator-node" />
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Meta bottom footer summary node stamp links track */}
        <div className="p-3 bg-slate-900/40 text-center text-[9px] font-mono tracking-widest text-slate-450 border-t border-slate-800">
          SECURE NOTIFICATION ENGINE LEDGER • AUDIT PORTAL V2.4
        </div>

      </div>

    </div>
  );
}