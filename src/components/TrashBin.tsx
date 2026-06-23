import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Sliders, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Search, 
  X, 
  UserX,
  History,
  Info
} from 'lucide-react';
import { User } from '../types';

interface TrashBinProps {
  users: User[];
  isDark: boolean;
  globalSettings: any;
  themeStyles: {
    bg: string;
    card: string;
    text: string;
    border: string;
  };
  handleUpdateTrashRetention: (days: number) => Promise<void>;
  handleRestoreUser: (userId: string) => Promise<void>;
  handlePermanentDelete: (userId: string) => Promise<void>;
  handleBulkPermanentDelete: (ids: string[]) => Promise<void>;
}

export const TrashBin: React.FC<TrashBinProps> = ({
  users,
  isDark,
  globalSettings,
  themeStyles,
  handleUpdateTrashRetention,
  handleRestoreUser,
  handlePermanentDelete,
  handleBulkPermanentDelete,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [retentionSearchQuery, setRetentionSearchQuery] = useState<'all' | 'expiring' | 'safe'>('all');

  const trashedUsers = useMemo(() => {
    return users.filter(u => u.isDeleted);
  }, [users]);

  const retentionPeriodDays = globalSettings?.trash_retention_days || 30;

  // Filtered trashed users according to search query and extra filters
  const filteredTrashedUsers = useMemo(() => {
    return trashedUsers.filter(user => {
      const matchesSearch = 
        (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (retentionSearchQuery === 'all') return true;

      const deletedDateStr = user.deletedAt || new Date().toISOString();
      const deletedAtObj = new Date(deletedDateStr);
      const expiryDate = new Date(deletedAtObj.getTime() + retentionPeriodDays * 24 * 60 * 60 * 1000);
      const msRemaining = expiryDate.getTime() - Date.now();
      const daysRemaining = retentionPeriodDays === 9999 ? 9999 : Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

      if (retentionSearchQuery === 'expiring') {
        return daysRemaining !== 9999 && daysRemaining < 5;
      } else if (retentionSearchQuery === 'safe') {
        return daysRemaining === 9999 || daysRemaining >= 5;
      }

      return true;
    });
  }, [trashedUsers, searchQuery, retentionSearchQuery, retentionPeriodDays]);

  const handleToggleSelectAll = () => {
    const isAllSelected = filteredTrashedUsers.length > 0 && filteredTrashedUsers.every(u => selectedUserIds.includes(u.id));
    if (isAllSelected) {
      setSelectedUserIds(prev => prev.filter(id => !filteredTrashedUsers.some(f => f.id === id)));
    } else {
      const toAdd = filteredTrashedUsers.map(u => u.id).filter(id => !selectedUserIds.includes(id));
      setSelectedUserIds(prev => [...prev, ...toAdd]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <motion.div
      key="trash"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 text-left"
    >
      {/* Visual Statistics Cards for Trash Bin */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Trashed Row Card */}
        <div className={`p-5 rounded-3xl border ${themeStyles.card} flex items-center justify-between shadow-sm`}>
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-black">মোট ট্র্যাশড অ্যাকাউন্ট</span>
            <h3 className={`text-2xl font-black ${themeStyles.text}`}>{trashedUsers.length}</h3>
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
            <UserX className="w-6 h-6" />
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className={`p-5 rounded-3xl border ${themeStyles.card} flex items-center justify-between shadow-sm`}>
          <div className="space-y-1">
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-black">তাড়াতাড়ি ডিলিট হবে ({"< 5"} দিন)</span>
            <h3 className={`text-2xl font-black ${themeStyles.text}`}>
              {trashedUsers.filter(u => {
                const deletedDateStr = u.deletedAt || new Date().toISOString();
                const deletedAtObj = new Date(deletedDateStr);
                const expiryDate = new Date(deletedAtObj.getTime() + retentionPeriodDays * 24 * 60 * 60 * 1000);
                const msRemaining = expiryDate.getTime() - Date.now();
                const daysRemaining = retentionPeriodDays === 9999 ? 9999 : Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
                return daysRemaining !== 9999 && daysRemaining < 5;
              }).length}
            </h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl animate-pulse">
            <History className="w-6 h-6" />
          </div>
        </div>

        {/* Informative Alert Card */}
        <div className={`p-5 rounded-3xl border ${themeStyles.card} flex items-center gap-3.5 shadow-sm bg-gradient-to-br from-amber-500/5 to-transparent`}>
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className={`text-xs font-black ${themeStyles.text}`}>অটো-পার্জ অ্যাকশন পলিসি</h4>
            <p className="text-[10px] text-zinc-400 leading-normal">মেয়াদ পেরিয়ে যাওয়ার সাথে সাথে ডাটাবেজ সিস্টেম ডিলিট হওয়া সদস্য প্রোফাইল স্বয়ংক্রিয়ভাবে চিরতরে বিলুপ্ত করবে।</p>
          </div>
        </div>
      </div>

      {/* Trash & Retention Period Management Settings */}
      <div className={`p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black ${themeStyles.text}`}>ইউজার রিসাইকেল বিন ও ট্র্যাশ ধরে রাখার মেয়াদ</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                ডিলিট করা ইউজারদের ডেটা ট্র্যাশ বক্সে কতদিন সংরক্ষিত রাখা হবে তা নির্ধারণ করুন। মেয়াদ ফুরিয়ে গেলে ডাটাগুলো স্বয়ংক্রিয়ভাবে মুছে যাবে।
              </p>
            </div>
          </div>

          {/* Current setting status display */}
          <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl text-xs font-black">
            বর্তমান মেয়াদ: {retentionPeriodDays === 9999 ? 'আজীবন' : `${retentionPeriodDays} দিন`}
          </div>
        </div>

        {/* Config presets list */}
        <div className="bg-zinc-500/5 p-4 rounded-2xl border border-zinc-500/10">
          <h4 className="text-[11.5px] font-black uppercase text-zinc-400 mb-3 tracking-wide flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-500 font-bold" />
            মেয়াদ পরিবর্তন করুন (Set Retention Period):
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '৩০ দিন (১ মাস)', value: 30 },
              { label: '৬০ দিন (২ মাস)', value: 60 },
              { label: '৩৬াস দিন (১ বছর)', value: 365 },
              { label: 'আজীবন (Unlimited)', value: 9999 }
            ].map((preset) => {
              const isPresetSelected = retentionPeriodDays === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleUpdateTrashRetention(preset.value)}
                  className={`px-4 py-3 rounded-2xl font-black text-xs transition duration-200 cursor-pointer text-center border ${
                    isPresetSelected
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10 active:scale-95'
                      : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search Bar and Action Panel wrapper */}
      <div className={`p-4 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Real-time search filter */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 font-bold" />
            <input
              type="text"
              placeholder="ট্র্যাশ ইউজার খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-8 py-2 text-xs rounded-2xl border transition focus:outline-none focus:ring-1 focus:ring-amber-550 ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Expire / safe retention tabs */}
          <div className="flex bg-zinc-500/5 p-1 rounded-2xl border border-zinc-500/10 text-[11px] font-black shrink-0">
            <button
              onClick={() => setRetentionSearchQuery('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                retentionSearchQuery === 'all'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              সব ট্র্যাশ ({trashedUsers.length})
            </button>
            <button
              onClick={() => setRetentionSearchQuery('expiring')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                retentionSearchQuery === 'expiring'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-rose-450'
              }`}
            >
              শীঘ্রই ডিলিট হবে
            </button>
            <button
              onClick={() => setRetentionSearchQuery('safe')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                retentionSearchQuery === 'safe'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-450'
              }`}
            >
              সুরক্ষিত
            </button>
          </div>
        </div>

        {/* Selected Items Bulk Actions Bar */}
        <AnimatePresence>
          {selectedUserIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -5 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -5 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-amber-500/10 border border-amber-500/15 rounded-3xl gap-3 text-xs font-bold text-amber-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>নির্বাচিত {selectedUserIds.length} জন ট্র্যাশ ইউজারের ওপর ব্যবস্থা নিন:</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border-gray-255 text-gray-500 hover:bg-gray-100'}`}
                  >
                    সিলেকশন বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const validIds = selectedUserIds.filter(id => trashedUsers.some(u => u.id === id));
                      if (validIds.length === 0) return;
                      // Restoration of selected users
                      const confirmRestore = window.confirm(`আপনি কি নিশ্চিত যে আপনি এই ${validIds.length} জন ইউজারকে পুনরুদ্ধার করে সচল করতে চান?`);
                      if (!confirmRestore) return;
                      Promise.all(validIds.map(id => handleRestoreUser(id))).then(() => {
                        setSelectedUserIds([]);
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[10px] rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-500/15"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                    <span>পুনরুদ্ধার করুন (Restore)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const validIds = selectedUserIds.filter(id => trashedUsers.some(u => u.id === id));
                      if (validIds.length === 0) return;
                      handleBulkPermanentDelete(validIds);
                      setSelectedUserIds([]);
                    }}
                    className="px-3 py-1.5 bg-rose-650 hover:bg-rose-600 active:scale-95 text-white font-black text-[10px] rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md animate-pulse"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>স্থায়ীভাবে মুছে ফেলুন (Purge)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recycle Bin Grid and Table View */}
        <div className={`p-4 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm lg:text-base font-black ${themeStyles.text}`}>ডিলিট করা ইউজার ও ট্র্যাশ ফাইলসমূহ ({filteredTrashedUsers.length})</h3>
              <p className="text-[11px] text-zinc-400">এখান থেকে আপনি ইউজারকে সরাসরি রিলিজ করতে পারেন বা পার্মানেন্ট ডিস্ট্রয় করতে পারেন।</p>
            </div>
          </div>

          {/* Main Table */}
          <div className={`rounded-3xl border overflow-x-auto ${themeStyles.border}`}>
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className={`border-b ${themeStyles.border} ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredTrashedUsers.length > 0 && filteredTrashedUsers.every(u => selectedUserIds.includes(u.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-550 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">ডিলিট হওয়া সদস্য (Trashed User Profiles)</th>
                  <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">ডিলিট করার তারিখ (Date Trashed)</th>
                  <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">অপসারনের বাকি মেয়াদ (Retention Remaining)</th>
                  <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider text-right">ম্যানেজমেন্ট অ্যাকশন (Trash Tool actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-zinc-800">
                {filteredTrashedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-zinc-500 font-bold">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                          <p className={`text-sm font-black ${themeStyles.text}`}>কোনো ট্র্যাশ সদস্য পাওয়া যায়নি!</p>
                          <p className="text-[10px] text-zinc-400 mt-1">সব ইউজার অ্যাক্টিভ আছেন অথবা ফিল্টার অনুযায়ী কোনো সদস্য নেই।</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTrashedUsers.map((user) => {
                    const deletedDateStr = user.deletedAt || new Date().toISOString();
                    const deletedAtObj = new Date(deletedDateStr);
                    const expiryDate = new Date(deletedAtObj.getTime() + retentionPeriodDays * 24 * 60 * 60 * 1000);
                    const msRemaining = expiryDate.getTime() - Date.now();
                    const daysRemaining = retentionPeriodDays === 9999 ? 9999 : Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

                    const isTimeLow = daysRemaining < 5 && daysRemaining !== 9999;
                    const isSelected = selectedUserIds.includes(user.id);

                    return (
                      <tr 
                        key={user.id} 
                        className={`${
                          isSelected 
                            ? (isDark ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-amber-50/45' ) 
                            : (isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-50')
                        } transition duration-150`}
                      >
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-550 cursor-pointer"
                          />
                        </td>

                        {/* User Column */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                              alt={user.displayName}
                              className="w-10 h-10 rounded-full object-cover border border-zinc-700/20 shadow-sm filter grayscale"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className={`font-black tracking-tight text-xs lg:text-sm ${themeStyles.text}`}>
                                {user.displayName}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">@{user.username || 'citizen'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Date Deletion Column */}
                        <td className="p-4 font-mono text-[11px] text-zinc-400">
                          {deletedAtObj.toLocaleDateString('bn-BD', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        {/* Retention Exp Column */}
                        <td className="p-4 font-bold text-[11px]">
                          {daysRemaining === 9999 ? (
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                              আজীবন ধরে রাখা হবে
                            </span>
                          ) : daysRemaining <= 0 ? (
                            <span className="text-red-500 bg-rose-500/10 px-2 py-0.5 rounded animate-pulse border border-rose-500/20 text-[10px]">
                              মেয়াদ উত্তীর্ণ (অটো অপসারণযোগ্য)
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded border text-[10px] ${
                              isTimeLow 
                                ? 'text-red-500 bg-rose-500/10 border-rose-500/20 animate-pulse' 
                                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {daysRemaining} দিন বাকি
                            </span>
                          )}
                        </td>

                        {/* Actions Option */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestoreUser(user.id)}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-emerald-400 rounded-xl text-[10.5px] font-black tracking-wide transition cursor-pointer flex items-center gap-1 active:scale-95"
                              title="পুনরুদ্ধার করুন"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>পুনরুদ্ধার</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handlePermanentDelete(user.id);
                                setSelectedUserIds(prev => prev.filter(id => id !== user.id));
                              }}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 rounded-xl text-[10.5px] font-black tracking-wide transition cursor-pointer flex items-center gap-1 active:scale-95"
                              title="ডাটাবেজ থেকে চিরতরে ডিলিট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>স্থায়ী অপসারণ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
