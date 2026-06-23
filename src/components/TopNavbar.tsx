import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, Home as HomeIcon, Tv as WatchIcon, Users as GroupsIcon, MessageCircle, 
  Bell, Menu as MenuIcon, ShieldCheck, CheckCircle2, Sun, Moon, LogOut, Settings, 
  Layers, Database, ArrowRight, ShieldAlert, Bot, Plus, Globe, ArrowLeft, Hash, 
  TrendingUp, Sparkles, ChevronRight, Lock, PenSquare, Briefcase, Wallet, X
} from 'lucide-react';
import { User, Notification, AppSettings } from '../types';

interface TopNavbarProps {
  currentTab: string;
  onTabChange: (tab: any) => void;
  currentUser: User;
  dbProfiles: Record<string, User>;
  verifiedUsersMock: User[];
  onSelectUser: (user: User) => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearNotifications: () => void;
  onMarkSingleRead: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
  userIsAdmin?: boolean;
  onSelectHashtag?: (hashtag: string | null) => void;
  onOpenCreatePost?: () => void;
  appSettings?: AppSettings;
  pendingVerificationCount?: number;
  firestoreQuotaExceeded?: boolean;
}

export default function TopNavbar({
  currentTab, onTabChange, currentUser, dbProfiles, verifiedUsersMock, onSelectUser, 
  notifications, unreadCount, onMarkAllRead, onClearNotifications, onMarkSingleRead, 
  theme, onToggleTheme, onLogout, userIsAdmin, onSelectHashtag, onOpenCreatePost,
  appSettings, pendingVerificationCount = 0, firestoreQuotaExceeded = false
}: TopNavbarProps) {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchRowOpen, setIsSearchRowOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // ডাইনামিক স্টাইলিং ভ্যারিয়বল
  const bgNavbar = isDark ? 'bg-[#18191a]' : 'bg-white';
  const borderNavbar = isDark ? 'border-zinc-800' : 'border-gray-200';
  const textColor = isDark ? 'text-white' : 'text-gray-950';
  const iconColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverBg = isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100';
  const bgMenu = isDark ? 'bg-[#242526] border-zinc-800 shadow-zinc-950/40' : 'bg-white border-gray-100 shadow-slate-200/50';

  return (
    <div className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 pt-[env(safe-area-inset-top,0px)] max-md:pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-1 md:pb-0 ${bgNavbar} ${borderNavbar}`}>
      <nav className="max-w-7xl mx-auto h-14 flex items-center justify-between px-4">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-4">
          <div onClick={() => onTabChange('home')} className="flex items-center gap-2 cursor-pointer">
            {appSettings?.logo_image_url ? (
              <img 
                src={appSettings.logo_image_url} 
                alt="Logo"
                className="w-9 h-9 rounded-xl object-cover border border-gray-500/10 transition-all shadow-sm active:scale-95 bg-white dark:bg-zinc-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                style={{ backgroundColor: appSettings?.logo_bg_color || '#3b82f6' }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xl transition-all shadow-sm active:scale-95"
              >
                {appSettings?.logo_icon || 'Z'}
              </div>
            )}
            <span className={`font-black tracking-tight text-lg ${textColor}`}>
              {appSettings?.logo_text || 'Zivobook'}
            </span>
          </div>

          {/* Connection / Sync Status Badge */}
          {firestoreQuotaExceeded ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-[10px] font-mono font-bold text-orange-400 select-none animate-pulse" title="Firebase database quota exceeded. Seamlessly operating in high-trust local persistent fallback mode.">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
              </span>
              <Database className="w-3 h-3 text-orange-400/80" />
              <span className="max-sm:hidden">Offline Fallback</span>
              <span className="sm:hidden">Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-500 dark:text-emerald-400 select-none" title="Connected and synced to real-time high-trust sovereign ledger network.">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              <Database className="w-3 h-3 text-emerald-500/75 dark:text-emerald-400/75" />
              <span className="max-sm:hidden">Synced</span>
              <span className="sm:hidden">Live</span>
            </div>
          )}
        </div>

        {/* Right Side: Navigation & Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button (Mobile) */}
          <button onClick={() => setIsSearchRowOpen(!isSearchRowOpen)} className={`p-2 rounded-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button onClick={onToggleTheme} className={`p-2 rounded-full ${iconColor} ${hoverBg}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Avatar Menu with Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)} 
              className="w-9 h-9 rounded-full overflow-hidden border border-gray-300 dark:border-zinc-700 active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="User Menu"
            >
              <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </button>
            {userIsAdmin && (
              <span className={`absolute -bottom-1 -right-1 text-white rounded-full p-0.5 border border-white dark:border-[#18191a] flex items-center justify-center shadow-lg pointer-events-none select-none transition-all ${pendingVerificationCount > 0 ? 'bg-rose-500 animate-pulse scale-105' : 'bg-amber-500'}`} title={pendingVerificationCount > 0 ? `${pendingVerificationCount} Pending Verifications` : 'Admin User'}>
                <ShieldCheck className="w-2.5 h-2.5" />
              </span>
            )}

            {showUserMenu && (
              <div className={`absolute right-0 mt-2 w-48 rounded-2xl border p-2.5 shadow-xl z-50 text-left transition-all duration-200 ${bgMenu}`}>
                <div className="px-2.5 py-2 border-b border-gray-100 dark:border-zinc-850 mb-1.5">
                  <p className="text-xs font-bold truncate leading-tight">{currentUser.displayName}</p>
                  <p className="text-[10px] opacity-60 truncate">@{currentUser.username || 'citizen'}</p>
                </div>

                <div className="space-y-1">
                  <button 
                    onClick={() => {
                      onTabChange('profile');
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-left transition cursor-pointer ${hoverBg}`}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>

                  {userIsAdmin && (
                    <button 
                      onClick={() => {
                        onTabChange('admin');
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-left transition text-amber-500 cursor-pointer ${hoverBg}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Admin System</span>
                      </div>
                      {pendingVerificationCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 shadow-sm animate-pulse">
                          {pendingVerificationCount}
                        </span>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      onToggleTheme();
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-left transition cursor-pointer ${hoverBg}`}
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-500 shrink-0" /> : <Moon className="w-4 h-4 text-indigo-500 shrink-0" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <div className="border-t border-gray-100 dark:border-zinc-850 my-1 pt-1">
                    <button 
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-left transition text-rose-500 cursor-pointer ${hoverBg}`}
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {isSearchRowOpen && (
        <div className={`absolute inset-0 z-50 p-4 ${bgNavbar}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSearchRowOpen(false)} className={`p-2 rounded-full ${hoverBg}`}>
              <ArrowLeft className={`w-5 h-5 ${iconColor}`} />
            </button>
            <input 
              autoFocus
              placeholder="Search..."
              className={`w-full p-3 rounded-xl border-none outline-none font-semibold text-xs transition-all ${isDark ? 'bg-zinc-900 text-white' : 'bg-gray-100 text-gray-950'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}