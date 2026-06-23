import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  MessageCircle, 
  Search, 
  MoreHorizontal, 
  TrendingUp, 
  Hash, 
  X,
  Sparkles,
  Clock,
  CloudSun,
  Briefcase,
  ShoppingBag,
  UserPlus
} from 'lucide-react';
import { User, Post, AppSettings } from '../types';

interface RightBarProps {
  currentUser: User;
  recentlyVerified: User[];
  onSelectUser?: (user: User) => void;
  posts?: Post[];
  dbProfiles?: Record<string, User>;
  onSelectHashtag?: (hashtag: string | null) => void;
  activeHashtagFilter?: string | null;
  theme: 'dark' | 'light'; // Context layout token synchronization prop injection
  appSettings?: AppSettings;
}

export default function RightBar({ 
  currentUser, 
  recentlyVerified, 
  onSelectUser,
  posts = [],
  dbProfiles = {},
  onSelectHashtag,
  activeHashtagFilter,
  theme,
  appSettings
}: RightBarProps) {
  
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [showSettingsToast, setShowSettingsToast] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDark = theme === 'dark';

  // Calculate 24-Hour Trending Hashtags from real posts
  const trendingTags = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const postsInLast24Hours = posts.filter(post => {
      if (!post.createdAt) return false;
      try {
        const postDate = new Date(post.createdAt);
        return postDate >= oneDayAgo;
      } catch {
        return false;
      }
    });

    postsInLast24Hours.forEach(post => {
      const text = post.content || '';
      const matches = text.match(/#[a-zA-Z0-9_]+/g);
      if (matches) {
        const uniqueInPost = Array.from(new Set(matches.map(m => m)));
        uniqueInPost.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });

    let list = Object.entries(counts).map(([name, count]) => ({ name, count }));
    list.sort((a, b) => b.count - a.count);

    const defaultMockHashtags = [
      { name: "#Trading", count: 1240 },
      { name: "#Web3", count: 980 },
      { name: "#Fintech", count: 850 },
      { name: "#VentureCapital", count: 710 },
      { name: "#DeFi", count: 640 }
    ];

    if (list.length < 5) {
      const existing = new Set(list.map(item => item.name.toLowerCase()));
      for (const mock of defaultMockHashtags) {
        if (!existing.has(mock.name.toLowerCase())) {
          list.push(mock);
          if (list.length >= 5) break;
        }
      }
    }

    return list.slice(0, 5);
  }, [posts]);

  const formatPostCount = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  const sponsoredAds = [
    {
      title: "Funding Pips Prop Firm",
      link: "https://fundingpips.com",
      desc: "Access institutional tier-1 liquidity pools with professional scaling programs matching verified records.",
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&auto=format&fit=crop&q=60",
      domain: "fundingpips.com"
    },
    {
      title: "VeriAuth Hardware Vaults",
      link: "https://veriauth.io",
      desc: "Instant cryptographic biometric offline physical security keys for decentralized social networking trust.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=60",
      domain: "veriauth.io"
    }
  ];

  const contactsList = useMemo(() => {
    const dbUsers = Object.values(dbProfiles || {});
    const map = new Map<string, User>();

    dbUsers.forEach(user => {
      if (user && user.id && user.id !== currentUser.id) {
        map.set(user.id, { ...user, profession: user.profession || 'Verified Contributor' });
      }
    });

    (recentlyVerified || []).forEach(user => {
      if (user && user.id && user.id !== currentUser.id && !map.has(user.id)) {
        map.set(user.id, user);
      }
    });

    const list = Array.from(map.values());

    if (contactSearchQuery.trim()) {
      const q = contactSearchQuery.toLowerCase();
      return list.filter(user => 
        (user.displayName || '').toLowerCase().includes(q) ||
        (user.username || '').toLowerCase().includes(q) ||
        (user.profession || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [dbProfiles, recentlyVerified, currentUser.id, contactSearchQuery]);

  const handleHashtagSelection = (hashtagName: string) => {
    if (!onSelectHashtag) return;
    onSelectHashtag(activeHashtagFilter === hashtagName ? null : hashtagName);
  };

  const triggerSettingsClick = () => {
    setShowSettingsToast(true);
    setTimeout(() => setShowSettingsToast(false), 2000);
  };

  // High-Contrast Context Adaptive Classes System Definitions
  const textPrimaryClass = isDark ? 'text-gray-200' : 'text-gray-950 font-bold';
  const textLabelClass = isDark ? 'text-gray-400' : 'text-gray-600 font-bold';
  const innerRowActiveBtnClass = isDark 
    ? 'bg-zinc-800 text-white font-semibold border-zinc-700' 
    : 'bg-gray-200 text-gray-950 font-semibold border-gray-300 shadow-sm';
  const innerRowHoverBtnClass = isDark 
    ? 'hover:bg-zinc-800/50 text-gray-300 border-transparent' 
    : 'hover:bg-gray-200/60 text-gray-700 border-transparent';

  return (
    <aside 
      className={`w-full flex flex-col gap-5 py-4 px-3 font-sans h-full overflow-y-auto scrollbar-none select-none border-l transition-colors duration-300 ${
        isDark 
          ? 'bg-[#18191a] border-[#242526] text-gray-200' 
          : 'bg-[#f0f2f5] border-gray-200/80 text-gray-800'
      }`} 
      id="right-sidebar-sticky"
    >
      {/* SECTION 1: Trending Hashtags */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="w-4 h-4 text-blue-600 animate-pulse" />
          <h4 className={`text-xs uppercase tracking-wider ${textLabelClass}`}>Trending Topics</h4>
        </div>

        <div className="space-y-0.5">
          {trendingTags.map((tag) => {
            const isActive = activeHashtagFilter === tag.name;
            return (
              <button
                key={tag.name}
                onClick={() => handleHashtagSelection(tag.name)}
                className={`w-full text-left px-2.5 py-2 rounded-xl transition border flex items-center justify-between group cursor-pointer ${
                  isActive ? innerRowActiveBtnClass : innerRowHoverBtnClass
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-blue-500 transition-colors">{tag.name}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{formatPostCount(tag.count)} posts</p>
                </div>
                {isActive ? (
                  <X className="w-3.5 h-3.5 text-blue-500 hover:text-red-500 transition" />
                ) : (
                  <Hash className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500 transition" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <hr className={isDark ? 'border-zinc-800' : 'border-gray-200/60'} />

      {/* SECTION 2: Sponsored Ads */}
      <div className="space-y-3">
        <h4 className={`text-xs uppercase tracking-wider px-1 flex items-center gap-1.5 ${textLabelClass}`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Sponsored
        </h4>
        
        <div className="space-y-1">
          {sponsoredAds.map((ad, i) => (
            <a 
              key={i} href={ad.link} target="_blank" rel="noreferrer"
              className={`flex items-start gap-3 p-2 rounded-xl transition border border-transparent ${
                isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-200/50'
              }`}
            >
              <img src={ad.image} alt={ad.title} className="w-12 h-12 rounded-lg object-cover border border-gray-500/10 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-xs transition-colors truncate ${isDark ? 'text-gray-200' : 'text-gray-950 font-bold'}`}>{ad.title}</p>
                <span className="text-[10px] text-blue-600 block truncate font-mono mt-0.5">{ad.domain}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight line-clamp-2">{ad.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* SECTION 3: Custom Selected Right Sidebar Widget */}
      <div className="space-y-3 flex-1 flex flex-col min-h-0">
        {/* Dynamic header title depending on the selected widget */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <h4 className={`text-xs uppercase tracking-wider flex items-center gap-1.5 ${textLabelClass}`}>
            {(() => {
              const widget = appSettings?.sidebar_right_widget || 'contacts';
              switch (widget) {
                case 'clock':
                  return (
                    <>
                      <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                      ডিজিটাল রিয়েল-টাইম কক (Clock)
                    </>
                  );
                case 'weather':
                  return (
                    <>
                      <CloudSun className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      আজকের আবহাওয়া রিপোর্ট
                    </>
                  );
                case 'friends':
                  return (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                      বন্ধু রিকোমেন্ডেশন (Suggestions)
                    </>
                  );
                case 'jobs':
                  return (
                    <>
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500 animate-bounce-slow" />
                      চাকরির খোঁজখবর (Careers)
                    </>
                  );
                case 'products':
                  return (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-[#2374E1]" />
                      মার্কেটপ্লেস বুকস্টোর (Shop)
                    </>
                  );
                default:
                  return (
                    <>
                      Contacts
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    </>
                  );
              }
            })()}
          </h4>

          {/* Regular Contact Search buttons only available for contacts widget */}
          {(!appSettings?.sidebar_right_widget || appSettings?.sidebar_right_widget === 'contacts') && (
            <div className="flex items-center gap-1 text-gray-400">
              <button 
                onClick={() => setShowContactSearch(!showContactSearch)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-gray-200 hover:text-gray-950 border border-transparent'}`}
              >
                <Search className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
              <button 
                onClick={triggerSettingsClick}
                className={`p-1.5 rounded-lg transition-colors relative cursor-pointer ${isDark ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-gray-200 hover:text-gray-950 border border-transparent'}`}
              >
                <MoreHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
                {showSettingsToast && (
                  <span className="absolute bottom-full right-0 mb-1 bg-gray-950 text-[10px] text-gray-300 py-0.5 px-2 rounded-md shadow-md whitespace-nowrap z-50 font-sans">
                    Settings Live Sync
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Dynamic widget body display area */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-none">
          {(() => {
            const widget = appSettings?.sidebar_right_widget || 'contacts';

            if (widget === 'clock') {
              const formattedTime = currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
              const formattedDate = currentTime.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              return (
                <div className={`p-5 rounded-2xl border text-center space-y-3 flex flex-col justify-center h-full max-h-[180px] ${isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-white border-zinc-250 shadow-xs'}`}>
                  <h5 className="text-[10px] font-black uppercase text-amber-500 font-mono tracking-widest">LIVE ACTIVE CLOCK</h5>
                  <div className="text-2xl font-black font-mono text-zinc-800 dark:text-amber-400 tracking-wider transition animate-pulse">
                    {formattedTime}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-bold bg-zinc-200/55 dark:bg-zinc-900 py-1.5 px-2.5 rounded-xl">
                    {formattedDate}
                  </div>
                </div>
              );
            }

            if (widget === 'weather') {
              return (
                <div className={`p-4 rounded-2xl border space-y-3 text-left ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-blue-500">ঢাকা, বাংলাদেশ</p>
                      <p className="text-[10px] text-zinc-400">মাঝারি মেঘলা আকাশ</p>
                    </div>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black font-mono text-zinc-800 dark:text-zinc-100">২৯°</span>
                    <span className="text-xs font-mono text-zinc-400">সেলসিয়াস (C)</span>
                  </div>
                  <div className="text-[10px] px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/10 font-bold">
                    💡 পরামর্শ: আজ বাহিরে যাওয়ার সময় ছাতা সাথে রাখা উত্তম হতে পারে!
                  </div>
                </div>
              );
            }

            if (widget === 'friends') {
              return (
                <div className="space-y-2">
                  {[
                    { name: "মাহমুদ হাসান (JS Guide)", handle: "@mahmud_js", avatar: "M" },
                    { name: "তাবাসসুম তাব্বি (UI Designer)", handle: "@tabby_ux", avatar: "T" }
                  ].map((s, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#2374E1]/15 text-[#2374E1] font-black flex items-center justify-center text-xs">
                          {s.avatar}
                        </div>
                        <div className="text-left leading-tight min-w-0">
                          <p className="text-[11px] font-bold truncate">{s.name}</p>
                          <p className="text-[9px] text-zinc-400 truncate font-mono">{s.handle}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`"${s.name}" কে ফলো করা সম্পন্ন হয়েছে!`)}
                        className="px-2.5 py-1 rounded-lg bg-[#2374E1] hover:bg-blue-600 text-[9px] text-white font-bold"
                      >
                        Follow
                      </button>
                    </div>
                  ))}
                </div>
              );
            }

            if (widget === 'jobs') {
              return (
                <div className="space-y-2">
                  {[
                    { title: "React Frontend Engineer", company: "DevStream Ltd", type: "Full-Time (Remote)" },
                    { title: "Junior Python Engineer", company: "Cyber Soft BD", type: "On-site (Dhanmondi)" }
                  ].map((j, idx) => (
                    <div key={idx} className={`p-3 rounded-2xl border text-left space-y-2 ${isDark ? 'bg-[#121421] border-slate-900/80' : 'bg-white border-zinc-200'}`}>
                      <div className="leading-tight">
                        <p className="text-xs font-black text-indigo-500">{j.title}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{j.company} • {j.type}</p>
                      </div>
                      <button 
                        onClick={() => alert(`ইমেইল সিভি সফলভাবে প্রসেস করা হয়েছে!`)}
                        className="w-full text-center py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-[9px] text-white font-bold uppercase transition cursor-pointer"
                      >
                        Apply with profile
                      </button>
                    </div>
                  ))}
                </div>
              );
            }

            if (widget === 'products') {
              return (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { title: "Python Algorithm Handbook", price: "BDT ২০০", image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=80&auto=format&fit=crop&q=60" },
                    { title: "Wireless Programmable Mouse", price: "BDT ৮৫০", image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=80&auto=format&fit=crop&q=60" }
                  ].map((pr, idx) => (
                    <div key={idx} className={`p-2.5 rounded-2xl border flex gap-2.5 items-center justify-between ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                      <div className="flex gap-2 items-center min-w-0">
                        <img src={pr.image} alt={pr.title} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                        <div className="text-left leading-tight min-w-0">
                          <p className="text-[10px] font-bold line-clamp-1">{pr.title}</p>
                          <p className="text-[10px] font-extrabold text-emerald-500 mt-0.5">{pr.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => alert(`"${pr.title}" অর্ডার সম্পন্ন করা হয়েছে!`)}
                        className="px-2 py-1 rounded bg-[#2374E1] hover:bg-blue-600 text-[9px] font-bold text-white shrink-0"
                      >
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              );
            }

            // Standard Active Contacts rendering
            return (
              <div className="space-y-0.5">
                {/* Search Input Container */}
                {showContactSearch && (
                  <div className="relative px-1 shrink-0 animate-fade-in mb-2">
                    <input 
                      type="text" placeholder="Search contacts..." value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      className={`w-full border rounded-xl py-1.5 px-3 text-xs outline-none transition font-sans ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 shadow-sm'
                      }`}
                    />
                    {contactSearchQuery && (
                      <button onClick={() => setContactSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {contactsList.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6 font-sans">No active contacts found</p>
                ) : (
                  contactsList.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => onSelectUser && onSelectUser(member)}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition border border-transparent ${
                        isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-gray-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img src={member.avatar} alt={member.displayName} className="w-8 h-8 rounded-full object-cover border border-gray-500/10" />
                          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ${isDark ? 'ring-[#18191a]' : 'ring-[#f0f2f5]'}`} />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className={`text-xs font-semibold truncate transition-colors flex items-center gap-1 ${isDark ? 'text-gray-200 group-hover:text-blue-500' : 'text-gray-950 font-bold group-hover:text-blue-600'}`}>
                            {member.displayName}
                            {member.isVerified && <CheckCircle2 className="w-3 h-3 text-[#1877F2] fill-current" />}
                          </p>
                          <span className="text-[11px] text-gray-500 block truncate font-sans mt-0.5">{member.profession}</span>
                        </div>
                      </div>

                      <div className="shrink-0 pl-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectUser && onSelectUser(member); }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isDark 
                              ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:text-white' 
                              : 'bg-white border-gray-300 text-blue-600 hover:bg-gray-50 shadow-sm'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </aside>
  );
}