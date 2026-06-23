import React from 'react';
import { Home, Users, Bell, MessageCircle, Settings, Globe2 } from 'lucide-react';
import { User } from '../types';

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  currentUser: User;
  theme: 'dark' | 'light';
  onStartVerification?: () => void;
  onOpenCreatePost?: () => void;
  onToggleTheme?: () => void;
}

export default function BottomNavbar({
  activeTab,
  onTabChange,
  currentUser,
  theme,
  onStartVerification,
  onOpenCreatePost,
  onToggleTheme
}: BottomNavbarProps) {
  const isDark = theme === 'dark';

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', activeColor: 'text-[#1877F2]' },
    { id: 'directory', icon: Users, label: 'Groups', activeColor: 'text-[#1877F2]' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', activeColor: 'text-[#1877F2]' },
    { id: 'notifications', icon: Bell, label: 'Notifications', activeColor: 'text-[#1877F2]' },
    { id: 'settings', icon: Settings, label: 'Settings', activeColor: 'text-[#1877F2]' },
    { id: 'profile', icon: null, label: 'Profile', activeColor: 'text-[#1877F2]' },
  ];

  const bgStyle = isDark
    ? 'bg-[#18191a]/95 border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.55)]'
    : 'bg-white/95 border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]';

  const iconDefaultClass = isDark ? 'text-zinc-500' : 'text-gray-500';
  const iconHoverClass = isDark ? 'hover:text-white' : 'hover:text-gray-900';

  return (
    <>
      <div 
        className={`fixed bottom-0 left-0 right-0 h-[calc(60px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] md:hidden border-t z-40 flex items-center justify-around px-2 select-none backdrop-blur-lg transition-all duration-300 ${bgStyle}`}
        id="mobile-bottom-navbar"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer focus:outline-none transition-transform active:scale-95"
            >
              <div className="relative flex items-center justify-center">
                {item.id === 'profile' ? (
                  <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                    isActive ? 'border-[#1877F2] scale-105' : 'border-gray-300 dark:border-zinc-700'
                  }`}>
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  React.createElement(item.icon!, {
                    className: `w-6 h-6 transition-colors duration-200 stroke-[2.2] ${
                      isActive ? item.activeColor : `${iconDefaultClass} ${iconHoverClass}`
                    }`
                  })
                )}

                {item.id === 'messages' && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[8px] font-bold text-white ring-1 ring-white dark:ring-[#18191a]">
                    9
                  </span>
                )}
                {item.id === 'notifications' && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-1.5 w-1.5 rounded-full bg-rose-600 ring-1 ring-white dark:ring-[#18191a]"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
