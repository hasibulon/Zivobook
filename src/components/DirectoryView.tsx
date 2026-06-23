import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, User as UserIcon, MessageSquare, Globe, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { User } from '../types';

interface DirectoryViewProps {
  dbProfiles: Record<string, User>;
  verifiedUsersMock: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onNavigateToMessages: (user: User) => void;
  theme: 'dark' | 'light'; // থিম প্রপ যুক্ত করা হলো
}

export default function DirectoryView({
  dbProfiles,
  verifiedUsersMock,
  currentUser,
  onSelectUser,
  onNavigateToMessages,
  theme
}: DirectoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'gold' | 'emerald' | 'blue'>('all');
  const isDark = theme === 'dark';

  const allProfiles = useMemo(() => {
    const map = new Map<string, User>();
    verifiedUsersMock.forEach((u) => { if (u && u.id) map.set(u.id, u); });
    Object.values(dbProfiles).forEach((u) => { if (u && u.id) map.set(u.id, u); });
    return Array.from(map.values()).filter(p => !p.is_banned);
  }, [dbProfiles, verifiedUsersMock]);

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter((user) => {
      const matchesSearch = 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profession?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = selectedTier === 'all' || user.badgeLevel === selectedTier;
      return matchesSearch && matchesTier;
    });
  }, [allProfiles, searchTerm, selectedTier]);

  const metrics = useMemo(() => {
    const total = allProfiles.length;
    const gold = allProfiles.filter(p => p.badgeLevel === 'gold').length;
    return { total, gold };
  }, [allProfiles]);

  // স্টাইলিং ভ্যারিয়েবল
  const bgColor = isDark ? 'bg-[#18191a]' : 'bg-white';
  const containerClass = isDark ? 'bg-[#18191a] border-[#242526]' : 'bg-white border-gray-200';
  const panelBg = isDark ? 'bg-[#242526]' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-950 font-black';
  const subTextColor = isDark ? 'text-slate-400' : 'text-gray-600 font-semibold';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-300';

  return (
    <div className={`space-y-6 animate-fade-in text-left select-none font-sans p-6 rounded-3xl transition-colors duration-300 ${isDark ? 'bg-zinc-950/20' : 'bg-gray-50/50'}`} id="veritrust-panel-directory">
      {/* Header Panel */}
      <div className={`border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderColor}`}>
        <div>
          <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${textColor}`}>
            <Globe className="w-5 h-5 text-[#2374E1] animate-pulse" />
            VeriTrust Panel Directory
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Public identity registry ledger with decentralised cryptographic verification logs.
          </p>
        </div>

        <div className={`flex items-center gap-3 border px-3 py-1.5 rounded-2xl text-[10px] font-mono shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-300 shadow-sm'}`}>
          <div className="text-gray-500">Active Nodes: <span className="text-emerald-400 font-bold">{metrics.total}</span></div>
          <div className={`w-px h-3 ${isDark ? 'bg-zinc-800' : 'bg-gray-300'}`} />
          <div className="text-gray-500">Gold Tier: <span className="text-cyan-400 font-bold">{metrics.gold}</span></div>
        </div>
      </div>

      {/* Lookup controls */}
      <div className={`p-4 border rounded-2xl space-y-4 ${isDark ? 'bg-zinc-900/40 border-zinc-900' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search citizens by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none transition-all ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div className={`flex items-center gap-1.5 p-1 rounded-xl overflow-x-auto w-full sm:w-auto shrink-0 ${isDark ? 'bg-zinc-950 border border-zinc-800' : 'bg-gray-100 border border-gray-200'}`}>
            {(['all', 'gold', 'emerald', 'blue'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition capitalize cursor-pointer shrink-0 ${
                  selectedTier === tier
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {filteredProfiles.length === 0 ? (
        <div className={`py-20 text-center border-2 border-dashed rounded-3xl ${isDark ? 'border-zinc-800' : 'border-gray-300'}`}>
          <Award className="w-9 h-9 text-gray-400 mx-auto mb-3" />
          <p className={`text-xs font-semibold ${subTextColor}`}>No verified matches present in local ledger segments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((user) => (
            <div key={user.id} className={`p-4 border rounded-2xl flex flex-col justify-between gap-4 transition duration-200 group relative overflow-hidden ${isDark ? 'bg-[#242526] border-zinc-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-zinc-800" />
                  {user.isVerified && (
                    <span className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 p-0.5 rounded-full ring-2 ring-white dark:ring-zinc-950">
                      <CheckCircle2 className="w-4 h-4 text-[#1877F2] fill-[#1877F2]/10" />
                    </span>
                  )}
                </div>
                
                <div className="min-w-0">
                  <h3 className={`font-bold text-xs truncate ${textColor}`}>{user.displayName}</h3>
                  <p className="text-[10px] text-blue-500 font-mono mt-0.5">@{user.username}</p>
                  <p className={`text-[11px] font-medium truncate mt-2 ${subTextColor}`}>{user.profession || 'Citizen'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t pt-3 border-gray-200 dark:border-zinc-800">
                <button onClick={() => onSelectUser(user)} className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold cursor-pointer">View Biography</button>
                <button onClick={() => onNavigateToMessages(user)} className="p-1.5 px-3 bg-gray-100 dark:bg-zinc-800 text-blue-500 rounded-xl cursor-pointer"><MessageSquare className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}