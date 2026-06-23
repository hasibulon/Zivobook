import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface MemberSearchProps {
  dbProfiles: Record<string, User>;
  verifiedUsersMock: User[];
  onSelectUser: (user: User) => void;
  theme: 'dark' | 'light'; // থিম প্রপ যুক্ত করা হলো
}

export default function MemberSearch({ dbProfiles, verifiedUsersMock, onSelectUser, theme }: MemberSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  // Combine unique profiles from Firestore and mock fallbacks
  const allProfiles = useMemo(() => {
    const map = new Map<string, User>();
    verifiedUsersMock.forEach((u) => { if (u && u.id) map.set(u.id, u); });
    Object.values(dbProfiles).forEach((u) => { if (u && u.id) map.set(u.id, u); });
    return Array.from(map.values());
  }, [dbProfiles, verifiedUsersMock]);

  // Filter profiles on query match
  const filteredProfiles = useMemo(() => {
    if (!query.trim()) return [];
    const cleanQuery = query.toLowerCase().trim();
    return allProfiles.filter((u) => {
      const displayNameMatch = u.displayName?.toLowerCase().includes(cleanQuery);
      const usernameMatch = u.username?.toLowerCase().includes(cleanQuery);
      return displayNameMatch || usernameMatch;
    });
  }, [query, allProfiles]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full z-20" id="member-search-container">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          id="member-search-input"
          placeholder="Search members by name or username..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none transition-all shadow-sm ${
            isDark 
              ? 'bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25'
              : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25'
          }`}
        />
      </div>

      {isOpen && query.trim() !== '' && (
        <div 
          id="member-search-dropdown" 
          className={`absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-xl shadow-xl z-50 divide-y ${
            isDark 
              ? 'bg-zinc-900 border border-zinc-800 divide-zinc-800'
              : 'bg-white border border-gray-300 divide-gray-100'
          }`}
        >
          {filteredProfiles.length === 0 ? (
            <div className={`p-3 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
              No matching members found for "{query}"
            </div>
          ) : (
            filteredProfiles.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-all duration-150 group cursor-pointer ${
                  isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'
                }`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-500/10"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-gray-900'}`}>
                      {user.displayName}
                    </span>
                    {user.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2] fill-[#1877F2]/10 shrink-0" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className={`text-[10px] block truncate ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
                    @{user.username}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}