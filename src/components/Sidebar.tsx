import React, { useState } from 'react';
import { 
  Users, 
  User, 
  Sparkles, 
  Globe2, 
  CheckCircle2,
  Sun,
  Moon,
  LogOut,
  Layers,
  Home,
  ShieldCheck,
  MessageCircle,
  Settings,
  Bell,
  Target,
  Activity,
  ShieldAlert,
  Newspaper,
  FileText,
  LayoutGrid
} from 'lucide-react';
import { SidebarTab, User as UserType, AppSettings } from '../types';

interface SidebarProps {
  currentTab: SidebarTab | 'admin';
  onTabChange: (tab: any) => void;
  currentUser: UserType;
  unreadCount: number;
  userIsAdmin?: boolean;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  appSettings?: AppSettings;
  pendingVerificationCount?: number;
}

export default function Sidebar({ 
  currentTab, 
  onTabChange, 
  currentUser, 
  unreadCount, 
  userIsAdmin, 
  onLogout,
  theme,
  onToggleTheme,
  appSettings,
  pendingVerificationCount = 0
}: SidebarProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
  };

  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const isDark = theme === 'dark';

  const primaryNavigation = [
    { 
      id: 'home' as const, 
      label: 'Social Feed', 
      icon: Home, 
      color: 'bg-blue-600', 
    },
    { 
      id: 'directory' as const, 
      label: 'Members Directory', 
      icon: Globe2, 
      color: 'bg-teal-600', 
    },
    { 
      id: 'messages' as const, 
      label: 'Direct Messaging', 
      icon: MessageCircle, 
      color: 'bg-sky-500', 
    },
    { 
      id: 'notifications' as const, 
      label: 'Notification Center', 
      icon: Bell, 
      color: 'bg-indigo-600', 
    },
    { 
      id: 'goals' as const, 
      label: 'Goals & AI Paths', 
      icon: Target, 
      color: 'bg-emerald-600', 
    },
    { 
      id: 'settings' as const, 
      label: 'User Settings', 
      icon: Settings, 
      color: 'bg-slate-600', 
    },
    ...(userIsAdmin ? [{
      id: 'admin' as any,
      label: 'Admin Control Center',
      icon: Layers,
      color: 'bg-rose-600',
    }] : [])
  ];

  return (
    <aside 
      className={`w-full flex flex-col justify-between py-4 px-3 font-sans h-full scrollbar-none select-none transition-colors duration-300 border-r ${
        isDark 
          ? 'bg-[#18191a] border-[#242526] text-gray-200' 
          : 'bg-[#f0f2f5] border-gray-200/80 text-gray-800'
      }`} 
      id="left-sidebar-navigation"
    >
      
      {/* Top Main Section */}
      <div className="space-y-4">
        
        {/* User Profile Card */}
        <button
          onClick={() => onTabChange('profile')}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition ${
            currentTab === 'profile' 
              ? isDark ? 'bg-zinc-800 text-white font-semibold' : 'bg-gray-200/80 text-gray-950 font-semibold' 
              : isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-gray-200/50'
          }`}
          id="sidebar-user-row"
        >
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-gray-500/10"
            />
            {currentUser.isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-[#18191a] rounded-full p-0.5">
                <CheckCircle2 className="w-3 h-3 text-[#1877F2] fill-current" />
              </span>
            )}
          </div>
          <div className="min-w-0 leading-tight flex-1">
            <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-950'}`}>{currentUser.displayName}</p>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block truncate">My Account</span>
          </div>
        </button>

        <hr className={isDark ? 'border-zinc-800' : 'border-gray-200/60'} />

        {/* Navigation Items Links */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-450 dark:text-gray-500 px-2.5 mb-2">Navigation Nodes</p>
          
          {primaryNavigation.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition rounded-xl ${
                  isActive 
                    ? isDark ? 'bg-zinc-800 text-white font-semibold' : 'bg-gray-200/80 text-gray-950 font-semibold' 
                    : isDark ? 'hover:bg-zinc-800/50 text-gray-300' : 'hover:bg-gray-200/50 text-gray-700'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${isActive && !isDark ? 'text-gray-950' : ''}`}>{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shrink-0">
                      {unreadCount}
                    </span>
                  )}
                  {item.id === 'admin' && pendingVerificationCount > 0 && (
                    <span id="admin-pending-verification-badge" className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white shrink-0 shadow-sm animate-pulse">
                      {pendingVerificationCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {/* Custom Left Sidebar Dynamic Widget */}
          {appSettings?.sidebar_left_widget && appSettings.sidebar_left_widget !== 'default' && (
            <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 text-left animate-fade-in" id="left-sidebar-custom-widget">
              {/* Dynamic Left Widget Header */}
              <div className="flex items-center gap-1.5 px-2">
                {(() => {
                  const lw = appSettings.sidebar_left_widget;
                  switch (lw) {
                    case 'groups':
                      return (
                        <>
                          <Users className="w-3.5 h-3.5 text-[#2374E1] animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">স্টাডি গ্রুপসমুহ (Groups)</span>
                        </>
                      );
                    case 'pages':
                      return (
                        <>
                          <Globe2 className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">মার্কেট প্রমো ও পেজ (Pages)</span>
                        </>
                      );
                    case 'shortcuts':
                      return (
                        <>
                          <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">সহজ শর্টকাট (Shortcuts)</span>
                        </>
                      );
                    case 'weather':
                      return (
                        <>
                          <Sun className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">আজকের আবহাওয়া (Weather)</span>
                        </>
                      );
                    case 'clock':
                      return (
                        <>
                          <Activity className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">প্রো সিস্টেম রিয়েলটাইম ঘড়ি</span>
                        </>
                      );
                    default:
                      return null;
                  }
                })()}
              </div>

              {/* Dynamic Left Widget UI Content */}
              <div className="px-1">
                {(() => {
                  const lw = appSettings.sidebar_left_widget;
                  
                  if (lw === 'groups') {
                    return (
                      <div className="space-y-2 text-[11px] leading-tight">
                        {[
                          { text: "Python BD Study", count: "১.২k লার্নার" },
                          { text: "Next.js Pioneers", count: "৮৫০ মেন্টর" }
                        ].map((ac, idx) => (
                          <div key={idx} className={`p-2 rounded-xl border flex items-center justify-between ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-white border-zinc-150'}`}>
                            <div>
                              <p className="font-semibold text-zinc-700 dark:text-zinc-300">{ac.text}</p>
                              <span className="text-[9px] text-zinc-400">{ac.count}</span>
                            </div>
                            <button
                              onClick={() => alert(`"${ac.text}" গ্রুপে যোগ দেওয়ার রিকুয়েস্ট পাঠানো হয়েছে!`)}
                              className="px-2 py-1 rounded bg-[#2374E1] text-[9px] text-white font-bold cursor-pointer hover:bg-blue-600"
                            >
                              Join
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (lw === 'pages') {
                    return (
                      <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed space-y-1.5 ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-white border-zinc-200'}`}>
                        <p className="font-bold text-purple-600 dark:text-purple-400">স্পন্সরড প্রোমো:</p>
                        <p className="text-zinc-550 dark:text-zinc-300">১০% বিশেষ ছাড়ে টেক-বুক অর্ডার করতে পোর্টাল শপ ঘুরে আসুন!</p>
                      </div>
                    );
                  }

                  if (lw === 'shortcuts') {
                    return (
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { title: "সোশ্যাল ফিড", tab: "home" },
                          { title: "মেম্বার্স খুঁজুন", tab: "directory" },
                          { title: "এআই গোলস", tab: "goals" },
                          { title: "সেটিংস ভিউ", tab: "settings" }
                        ].map((sh, idx) => (
                          <button
                            key={idx}
                            onClick={() => onTabChange(sh.tab)}
                            className={`p-2.5 rounded-xl border text-[10px] font-bold text-center hover:border-[#2374E1] hover:text-[#2374E1] transition cursor-pointer ${isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-350' : 'bg-white border-zinc-200 text-zinc-650'}`}
                          >
                            {sh.title}
                          </button>
                        ))}
                      </div>
                    );
                  }

                  if (lw === 'weather') {
                    return (
                      <div className={`p-3 rounded-xl border text-[11.5px] space-y-1 ${isDark ? 'bg-zinc-950/60 border-zinc-900 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                        <p className="font-bold text-emerald-500">বন্যা ও বৃষ্টিহীন দিন</p>
                        <p className="text-[10px] text-zinc-400">তাপমাত্রা: ৩০° সেলসিয়াস</p>
                      </div>
                    );
                  }

                  if (lw === 'clock') {
                    return (
                      <div className={`p-3 rounded-xl border text-center space-y-1 ${isDark ? 'bg-zinc-950/60 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'}`}>
                        <div className="text-xl font-mono font-black text-amber-500 animate-pulse">
                          {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-[9px] text-zinc-400">চলতি সময় (মিনিট)</p>
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Configurations Section (Bottom Area) */}
      <div className="space-y-1 mt-auto pt-4">
        <hr className={`mb-3 ${isDark ? 'border-zinc-800' : 'border-gray-200/60'}`} />

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition ${
            isDark ? 'hover:bg-zinc-800/60' : 'hover:bg-gray-200/50'
          }`}
          title="Toggle Screen Theme"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-yellow-400' : 'bg-white border-gray-300 text-amber-600 shadow-sm'
            }`}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="min-w-0 text-left leading-none">
              <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-gray-950'}`}>Theme Palette</span>
              <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase">{theme} mode</span>
            </div>
          </div>
          
          {/* Custom Toggle Slider Bar */}
          <div className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors duration-200 shrink-0 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-sm ${isDark ? 'translate-x-3' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Logout Control Button */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition ${
            isDark ? 'hover:bg-red-950/20 text-red-400' : 'hover:bg-red-50 text-red-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            isDark ? 'bg-red-950/30 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
            <LogOut className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left leading-none">
            <span className={`text-xs font-semibold block ${!isDark && 'text-red-700'}`}>Logout Session</span>
            <span className="text-[9px] font-mono text-gray-500 dark:text-gray-400">DISCONNECT</span>
          </div>
        </button>

        {/* Global Toast Container */}
        {toastMessage && (
          <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2.5 rounded-xl shadow-lg border border-gray-500/10 ${
            isDark ? 'bg-zinc-900 text-white' : 'bg-white text-gray-900'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <p className="text-xs font-medium">{toastMessage}</p>
          </div>
        )}
      </div>

    </aside>
  );
}