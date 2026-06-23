import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  BookOpen, 
  Heart, 
  Camera, 
  Calendar, 
  DollarSign, 
  Layers, 
  PlusCircle, 
  Tv, 
  Settings, 
  MousePointer, 
  Globe, 
  MapPin, 
  Activity, 
  Award, 
  CheckCircle2, 
  Megaphone,
  ChevronRight,
  Sparkles,
  PieChart,
  BarChart2,
  Share2,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  Palette
} from 'lucide-react';
import { User, Post } from '../types';

interface ProfileDashboardProps {
  user: User;
  currentUser: User;
  theme: 'dark' | 'light';
  isDark: boolean;
  posts: Post[];
  onNavigate?: (tab: string) => void;
}

interface NewPageOrGroup {
  name: string;
  category: string;
  description: string;
  type: 'page' | 'group';
}

interface AdCampaign {
  id: string;
  postTitle: string;
  budget: number;
  duration: number; // in days
  audience: string;
  location: string;
  platform: string;
  impressions: number;
  clicks: number;
  status: 'Pending' | 'Active' | 'Completed';
  createdAt: string;
}

export default function ProfileDashboard({ 
  user, 
  currentUser, 
  theme, 
  isDark, 
  posts,
  onNavigate
}: ProfileDashboardProps) {
  // Navigation sidebar state
  const [activeTab, setActiveTab] = useState<'overview' | 'social' | 'reels' | 'pages-groups' | 'ad-center'>('overview');
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<'7days' | '30days' | '90days'>('30days');

  // Interactive states for Page/Group creation
  const [ownedPages, setOwnedPages] = useState<any[]>(() => {
    const saved = localStorage.getItem(`vt_owned_pages_${user.id}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'p1', name: 'Zivobook Creators Guild', category: 'Community & Art', members: 4520, reach: '12.4K', growth: '+15.2%', logo: '🎨' },
      { id: 'p2', name: 'EcoTech Innovations BD', category: 'Technology', members: 1850, reach: '5.1K', growth: '+8.4%', logo: '🌱' }
    ];
  });

  const [ownedGroups, setOwnedGroups] = useState<any[]>(() => {
    const saved = localStorage.getItem(`vt_owned_groups_${user.id}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'g1', name: 'Sovereign Nodes Bangladesh', category: 'Education', members: 2410, activity: 'High', growth: '+22.1%', logo: '🌐' },
      { id: 'g2', name: 'Youth Entrepreneurs Circle', category: 'Business', members: 980, activity: 'Medium', growth: '+12.5%', logo: '🚀' }
    ];
  });

  // Pages & groups creation form
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [creationTab, setCreationTab] = useState<'page' | 'group'>('page');
  const [newEntity, setNewEntity] = useState<NewPageOrGroup>({
    name: '',
    category: 'Technology',
    description: '',
    type: 'page'
  });

  // Ad campaign states
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>(() => {
    const saved = localStorage.getItem(`vt_ad_campaigns_${user.id}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ad_1',
        postTitle: 'Zivobook Launch Strategy Presentation',
        budget: 45,
        duration: 7,
        audience: 'Tech Professionals, Entrepreneurs',
        location: 'Dhaka, Chittagong',
        platform: 'all',
        impressions: 4820,
        clicks: 341,
        status: 'Active',
        createdAt: '2026-06-15'
      }
    ];
  });

  // New Ad Campaign Creator Form
  const [adPostSelection, setAdPostSelection] = useState<string>('custom');
  const [adCustomText, setAdCustomText] = useState<string>('');
  const [adBudget, setAdBudget] = useState<number>(20);
  const [adDuration, setAdDuration] = useState<number>(5);
  const [adAudience, setAdAudience] = useState<string>('Young Creators & Techs');
  const [adLocation, setAdLocation] = useState<string>('Bangladesh (National Wide)');
  const [adPlatform, setAdPlatform] = useState<string>('all');
  
  // Simulated Profile Visit tracker
  const [profileVisits, setProfileVisits] = useState(() => {
    const key = `vt_profile_visits_${user.id}`;
    const value = localStorage.getItem(key);
    if (value) return parseInt(value);
    const initial = Math.floor(Math.random() * 800) + 1200;
    localStorage.setItem(key, initial.toString());
    return initial;
  });

  // Calculate dynamic stats from posts
  const userPosts = useMemo(() => {
    return posts.filter(p => p.author.id === user.id);
  }, [posts, user.id]);

  const totalLikes = useMemo(() => {
    return userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  }, [userPosts]);

  const totalReelsSupport = useMemo(() => {
    const reels = userPosts.filter(p => p.imageUrl && (p.imageUrl.includes('.mp4') || p.id.startsWith('reel') || p.content.toLowerCase().includes('reel')));
    return reels.length * 150 + reels.reduce((acc, r) => acc + (r.likes || 0) + (r.reposts || 0), 0) * 8;
  }, [userPosts]);

  // Persist creations to localStorage
  const handleCreateEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntity.name.trim()) return;

    const emojiMap: { [key: string]: string } = {
      'Technology': '💻',
      'Community & Art': '🎨',
      'Education': '📚',
      'Business': '📈',
      'Entertainment': '🎬',
      'Science': '🔬'
    };

    const logo = emojiMap[newEntity.category] || (creationTab === 'page' ? '📄' : '👥');

    if (creationTab === 'page') {
      const updated = [
        ...ownedPages,
        {
          id: 'p_' + Date.now(),
          name: newEntity.name,
          category: newEntity.category,
          description: newEntity.description,
          members: 1, // creator
          reach: '0',
          growth: '+100%',
          logo
        }
      ];
      setOwnedPages(updated);
      localStorage.setItem(`vt_owned_pages_${user.id}`, JSON.stringify(updated));
    } else {
      const updated = [
        ...ownedGroups,
        {
          id: 'g_' + Date.now(),
          name: newEntity.name,
          category: newEntity.category,
          description: newEntity.description,
          members: 1,
          activity: 'New',
          growth: '+100%',
          logo
        }
      ];
      setOwnedGroups(updated);
      localStorage.setItem(`vt_owned_groups_${user.id}`, JSON.stringify(updated));
    }

    // Reset Form
    setNewEntity({ name: '', category: 'Technology', description: '', type: 'page' });
    setShowCreationModal(false);
  };

  const handleDeletePage = (id: string) => {
    const updated = ownedPages.filter(p => p.id !== id);
    setOwnedPages(updated);
    localStorage.setItem(`vt_owned_pages_${user.id}`, JSON.stringify(updated));
  };

  const handleDeleteGroup = (id: string) => {
    const updated = ownedGroups.filter(g => g.id !== id);
    setOwnedGroups(updated);
    localStorage.setItem(`vt_owned_groups_${user.id}`, JSON.stringify(updated));
  };

  // Launch mock ad campaign handler
  const handleLaunchAd = (e: React.FormEvent) => {
    e.preventDefault();
    const adTitle = adPostSelection === 'custom' 
      ? (adCustomText.trim() ? adCustomText.substring(0, 35) + '...' : 'Custom Audience Boost')
      : (userPosts.find(p => p.id === adPostSelection)?.content.substring(0, 35) + '...') || 'Profile Boost Banner';

    const newCampaign: AdCampaign = {
      id: 'ad_' + Date.now(),
      postTitle: adTitle,
      budget: adBudget,
      duration: adDuration,
      audience: adAudience,
      location: adLocation,
      platform: adPlatform,
      impressions: 0,
      clicks: 0,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newCampaign, ...adCampaigns];
    setAdCampaigns(updated);
    localStorage.setItem(`vt_ad_campaigns_${user.id}`, JSON.stringify(updated));

    // Reset setup
    setAdCustomText('');
    setAdBudget(20);
    setAdDuration(5);
  };

  // Run dynamic simulated growth for active ads on interval
  useEffect(() => {
    const timer = setInterval(() => {
      let changed = false;
      const updated = adCampaigns.map(ad => {
        if (ad.status === 'Pending') {
          changed = true;
          return { ...ad, status: 'Active' };
        } else if (ad.status === 'Active') {
          changed = true;
          const addedImpressions = Math.floor(Math.random() * (ad.budget * 4)) + 5;
          const addedClicks = Math.floor(addedImpressions * (0.05 + Math.random() * 0.1));
          return {
            ...ad,
            impressions: ad.impressions + addedImpressions,
            clicks: ad.clicks + addedClicks
          };
        }
        return ad;
      });

      if (changed) {
        setAdCampaigns(updated);
        localStorage.setItem(`vt_ad_campaigns_${user.id}`, JSON.stringify(updated));
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [adCampaigns, user.id]);

  // Projected Reach Calculation based on Slider
  const projectedReach = useMemo(() => {
    return {
      min: adBudget * 420 * adDuration,
      max: adBudget * 920 * adDuration,
      clicksMin: Math.floor(adBudget * 28 * adDuration),
      clicksMax: Math.floor(adBudget * 68 * adDuration)
    };
  }, [adBudget, adDuration]);

  // Dynamic Chart points for Drawing Custom Interactive SVG Chart
  const chartPoints = useMemo(() => {
    const daysCount = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
    const points: { label: string; reach: number; engagement: number; visits: number }[] = [];
    
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      
      const modifier = Math.sin(i / 3) * 0.2 + 0.8;
      const noise = 1 + (Math.sin(i * 1.5) * 0.15);
      
      const reach = Math.floor((300 + (daysCount - i) * 12 + (i % 5) * 45) * modifier * noise);
      const engagement = Math.floor((15 + (daysCount - i) * 0.5 + (i % 3) * 5) * modifier * noise);
      const visits = Math.floor((40 + (daysCount - i) * 1.2 + (i % 4) * 8) * modifier * noise);
      
      points.push({ label, reach, engagement, visits });
    }
    return points;
  }, [dateFilter]);

  // Find max values to scale SVG coordinates
  const maxReachPointsValue = useMemo(() => {
    const maxVal = Math.max(...chartPoints.map(p => p.reach));
    return maxVal > 0 ? maxVal : 1000;
  }, [chartPoints]);

  const maxVisitsPointsValue = useMemo(() => {
    const maxVal = Math.max(...chartPoints.map(p => p.visits));
    return maxVal > 0 ? maxVal : 500;
  }, [chartPoints]);

  // Convert points to SVG polyline coordinates
  const svgReachCoordinates = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const width = 500;
    const height = 150;
    const padX = 20;
    const padY = 20;

    const points = chartPoints.map((pt, index) => {
      const x = padX + (index / (chartPoints.length - 1)) * (width - padX * 2);
      const y = height - padY - (pt.reach / maxReachPointsValue) * (height - padY * 2);
      return `${x},${y}`;
    });

    return points.join(' ');
  }, [chartPoints, maxReachPointsValue]);

  const svgVisitsCoordinates = useMemo(() => {
    if (chartPoints.length === 0) return '';
    const width = 500;
    const height = 150;
    const padX = 20;
    const padY = 20;

    const points = chartPoints.map((pt, index) => {
      const x = padX + (index / (chartPoints.length - 1)) * (width - padX * 2);
      const y = height - padY - (pt.visits / maxVisitsPointsValue) * (height - padY * 2);
      return `${x},${y}`;
    });

    return points.join(' ');
  }, [chartPoints, maxVisitsPointsValue]);

  // Hover tracker for custom SVG chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Tab translations for display - ALL TRANSLATED TO ENGLISH
  const sidebarTabsList = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, desc: 'Key metrics & growth analytical data' },
    { id: 'social', label: 'Social Connections', icon: Users, desc: 'Follower growth & network insights' },
    { id: 'reels', label: 'Feed & Reels Support', icon: Tv, desc: 'Real-time video & engagement loops' },
    { id: 'pages-groups', label: 'My Pages & Groups', icon: Layers, desc: 'Manage your owned custom assets' },
    { id: 'ad-center', label: 'Ad Center & Boost', icon: Megaphone, desc: 'Target reach & active campaigns' },
  ] as const;

  return (
    <div className="w-full space-y-5 animate-fade-in text-left font-sans px-1" id="user-analytic-dashboard-root">
      
      {/* 1. Header Information Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-950/60 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-gray-900'} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-sm">
              Creative Suite Pro
            </span>
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight">Personal Creator Dashboard</h2>
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
            Monitor real-time analytics, organic reach metrics, custom brand pages, public groups, and active ad boosting.
          </p>
        </div>

        {/* Short info badge */}
        <div className="flex items-center gap-3 self-start md:self-center shrink-0">
          {currentUser?.role === 'admin' && onNavigate && (
            <button 
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow transition cursor-pointer"
              title="Open website theme design settings"
            >
              <Palette className="w-4 h-4" />
              <span>Website Design Panel</span>
            </button>
          )}
          <button 
            onClick={() => setShowCreationModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-750 text-white rounded-xl shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Asset</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Dashboard Body Grid Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        
        {/* LEFT COLUMN: Sidebar Navigation inside the Dashboard (Optimized for Mobile scroll bar and Desktop sticky rail) */}
        <div className="lg:col-span-1 space-y-2 lg:sticky lg:top-[80px]">
          <div className={`hidden lg:block p-3 rounded-2xl border ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-gray-200'} space-y-1`}>
            <p className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider px-3 pb-1">
              Dashboard Sections
            </p>
            {sidebarTabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white font-bold shadow' 
                      : `${isDark ? 'text-zinc-300 hover:bg-zinc-900' : 'text-zinc-700 hover:bg-gray-100'}`
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                    <div className="leading-tight">
                      <p className="text-[11px] font-bold">{tab.label}</p>
                      <p className={`text-[9px] font-normal ${isActive ? 'text-zinc-200' : 'text-zinc-405'}`}>{tab.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-60" />
                </button>
              );
            })}
          </div>

          {/* Mobile responsive view: Horizontal slide tab bar */}
          <div className="lg:hidden flex overflow-x-auto gap-2 py-1 pb-2 scrollbar-none select-none">
            {sidebarTabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 p-2 px-3.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow' 
                      : `${isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-gray-100 border border-gray-200 text-zinc-700'}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Tab Content Display */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* ================= TAB 1: OVERVIEW PANEL ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              {/* Stats Highlights Header Rows: Optimized grid-level responsive sizes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                
                {/* 1. Followers */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-905/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-tight">Followers</span>
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black">{user.followersCount || 1240}</p>
                  <span className="text-[9px] text-emerald-500 font-bold font-mono">▲ +8.4% Growth</span>
                </div>

                {/* 2. Friends */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-905/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-tight">Connections</span>
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black">{user.followingCount || 840}</p>
                  <span className="text-[9px] text-zinc-400 font-bold font-mono">Stable Partners</span>
                </div>

                {/* 3. Total Posts */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-905/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-tight">Total Posts</span>
                    <Camera className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black">{userPosts.length || 12}</p>
                  <span className="text-[9px] text-blue-500 font-bold">10 Memories Vaulted</span>
                </div>

                {/* 4. Profile Visits */}
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-905/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-tight">Views</span>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-xl sm:text-2xl font-black">{profileVisits}</p>
                  <span className="text-[9px] text-emerald-500 font-bold font-mono">▲ +12% Last 30d</span>
                </div>

              </div>

              {/* Graphical Custom Interactive Chart Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-950/60 border-zinc-850 text-white' : 'bg-white border-zinc-200 text-gray-900'} shadow-sm space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-500/10 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-500" />
                      <span>Organic Reach & Profile Visits</span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">Review reach trends over time by selecting different view intervals.</p>
                  </div>

                  {/* Interval Switches */}
                  <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-0.5 text-[10px] font-bold gap-1 self-start sm:self-center select-none">
                    <button 
                      onClick={() => setDateFilter('7days')}
                      className={`p-1 px-3 rounded-md cursor-pointer transition ${dateFilter === '7days' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                    >
                      7D
                    </button>
                    <button 
                      onClick={() => setDateFilter('30days')}
                      className={`p-1 px-3 rounded-md cursor-pointer transition ${dateFilter === '30days' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                    >
                      30D
                    </button>
                    <button 
                      onClick={() => setDateFilter('90days')}
                      className={`p-1 px-3 rounded-md cursor-pointer transition ${dateFilter === '90days' ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
                    >
                      90D
                    </button>
                  </div>
                </div>

                {/* The Custom Responsive Reactive SVG Vector Chart */}
                <div className="relative pt-1 overflow-visible">
                  <div className="flex items-center gap-4 text-[9px] text-zinc-400 font-mono pb-2 justify-start">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />Reach Impressions</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />Unique Visits</span>
                  </div>

                  <div className="relative border border-zinc-500/15 rounded-xl bg-zinc-950/20 dark:bg-zinc-950/40 p-2 sm:p-4">
                    <svg viewBox="0 0 500 150" className="w-full h-[150px] sm:h-[180px] overflow-visible">
                      {/* Gridlines */}
                      <line x1="20" y1="20" x2="480" y2="20" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500/15" />
                      <line x1="20" y1="52.5" x2="480" y2="52.5" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500/15" />
                      <line x1="20" y1="85" x2="480" y2="85" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500/15" />
                      <line x1="20" y1="117.5" x2="480" y2="117.5" stroke="currentColor" strokeWidth="0.5" className="text-zinc-500/15" />
                      <line x1="20" y1="130" x2="480" y2="130" stroke="currentColor" strokeWidth="1" className="text-zinc-500/20" />

                      {/* Reach Line Path (Blue) */}
                      <polyline
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        points={svgReachCoordinates}
                        className="transition-all duration-300 drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
                      />

                      {/* Profile Visits Line Path (Green) */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={svgVisitsCoordinates}
                        className="transition-all duration-300 stroke-dasharray-[3] drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]"
                      />

                      {/* Interactable Dots / Grid columns */}
                      {chartPoints.map((pt, idx) => {
                        const x = 20 + (idx / (chartPoints.length - 1)) * (500 - 40);
                        const reachY = 150 - 20 - (pt.reach / maxReachPointsValue) * 110;
                        const visitY = 150 - 20 - (pt.visits / maxVisitsPointsValue) * 110;

                        return (
                          <g key={idx} className="cursor-pointer group/dot" onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)}>
                            {/* Hover projection vertical line */}
                            {hoveredPointIndex === idx && (
                              <line x1={x} y1="10" x2={x} y2="130" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3" className="opacity-60" />
                            )}
                            {/* Reach dot */}
                            <circle
                              cx={x}
                              cy={reachY}
                              r={hoveredPointIndex === idx ? 6 : 4}
                              className="fill-blue-500 stroke-white dark:stroke-zinc-950 transition-all duration-150"
                              strokeWidth="1.5"
                            />
                            {/* Visit dot */}
                            <circle
                              cx={x}
                              cy={visitY}
                              r={hoveredPointIndex === idx ? 5.5 : 3.5}
                              className="fill-emerald-500 stroke-white dark:stroke-zinc-950 transition-all duration-150"
                              strokeWidth="1.5"
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Dynamic Tooltip inside the chart */}
                    {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                      <div 
                        className={`absolute top-2 left-1/2 -translate-x-1/2 p-2 px-3 rounded-xl border text-[10px] font-mono leading-tight shadow-xl transition-all z-30 ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-gray-800'
                        }`}
                      >
                        <p className="font-bold text-[9px] text-zinc-400 mb-0.5">Report on {chartPoints[hoveredPointIndex].label}</p>
                        <p className="font-sans flex items-center justify-between gap-4">
                          <span>Reach:</span>
                          <strong className="text-blue-500">{chartPoints[hoveredPointIndex].reach} Imps</strong>
                        </p>
                        <p className="font-sans flex items-center justify-between gap-4">
                          <span>Visits:</span>
                          <strong className="text-emerald-500">{chartPoints[hoveredPointIndex].visits} Clicks</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] sm:text-[10px] text-zinc-400 font-mono text-center mt-2">
                    * Hover over data points (or tap on mobile viewport) for precise daily reports.
                  </p>
                </div>
              </div>

              {/* Extra Stats Cards: Platform summaries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Pages stat brief */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50 border-gray-200'} flex items-center gap-3.5`}>
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">My Managed Pages</p>
                    <p className="text-sm sm:text-base font-black">{ownedPages.length} Live Pages</p>
                  </div>
                  <button onClick={() => setActiveTab('pages-groups')} className="p-1 text-zinc-550 hover:text-blue-500 transition cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Groups stat brief */}
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50 border-gray-200'} flex items-center gap-3.5`}>
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Managed Communities</p>
                    <p className="text-sm sm:text-base font-black">{ownedGroups.length} Active Groups</p>
                  </div>
                  <button onClick={() => setActiveTab('pages-groups')} className="p-1 text-zinc-550 hover:text-blue-500 transition cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 2: SOCIAL CONNECTIONS ACCOUNT ================= */}
          {activeTab === 'social' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3.5`}>
                <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-500/10">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold">Social Connection Metrics</h3>
                    <p className="text-[10px] text-zinc-400">Track follower conversion rates and network retention</p>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Your connections flow primarily from organic content shares, recommendations, and active partnership prompts. You added 54 new followers this month.
                </p>

                {/* Conversion indicators - Stack nicely on mobile, side-by-side on tablet/desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* conversions ring */}
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-zinc-950/25 border-zinc-800' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400">Visitor Conversion Ratio</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4.5" className="text-zinc-300 dark:text-zinc-800" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeDasharray="125" strokeDashoffset="32" />
                        </svg>
                        <span className="text-[10px] font-black">74%</span>
                      </div>
                      <div className="space-y-0.5 leading-snug">
                        <p className="text-[11px] font-bold">High Visitor Retention</p>
                        <p className="text-[9px] text-zinc-400">74 out of 100 unique profile visitors clicked follow.</p>
                      </div>
                    </div>
                  </div>

                  {/* network status */}
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-zinc-950/25 border-zinc-800' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                    <p className="text-[9px] font-extrabold uppercase text-zinc-405">Network Interaction index</p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4.5" className="text-zinc-300 dark:text-zinc-800" />
                          <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="125" strokeDashoffset="18" />
                        </svg>
                        <span className="text-[10px] font-black">85%</span>
                      </div>
                      <div className="space-y-0.5 leading-snug">
                        <p className="text-[11px] font-bold">Active Partner Core</p>
                        <p className="text-[9px] text-zinc-400">85% of your registered connections interacted with posts.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Geographical Network Spread */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3.5`}>
                <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Geographic Audience Spread</span>
                </h4>
                
                <div className="space-y-3">
                  {[
                    { location: 'Dhaka Division, BD', percentage: 65, count: '546 followers' },
                    { location: 'Chittagong Division, BD', percentage: 18, count: '151 followers' },
                    { location: 'Sylhet Division, BD', percentage: 9, count: '76 followers' },
                    { location: 'Rajshahi Division, BD', percentage: 8, count: '67 followers' }
                  ].map((loc, index) => (
                    <div key={index} className="space-y-1 text-[11px] sm:text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                          <MapPin className="w-3 h-3 text-zinc-400" /> {loc.location}
                        </span>
                        <span>{loc.percentage}% ({loc.count})</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${loc.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: FEED & REELS SUPPORT ================= */}
          {activeTab === 'reels' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-4`}>
                <div className="flex items-center gap-2.5 border-b border-zinc-500/10 pb-3">
                  <Tv className="w-4 h-4 text-teal-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold">Engagement & Reels Support</h3>
                    <p className="text-[10px] text-zinc-400">Regular posts, video loops and audience interactions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  
                  {/* Organic support */}
                  <div className="p-3.5 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-center space-y-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Organic Reposts</p>
                    <p className="text-2xl sm:text-3xl font-black text-rose-500">
                      {userPosts.reduce((acc, p) => acc + (p.reposts || 0), 0) + 4}
                    </p>
                    <p className="text-[9px] text-zinc-400">Total times content re-shared</p>
                  </div>

                  {/* Reels views estimate */}
                  <div className="p-3.5 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-center space-y-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Reels Loop Index</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-500">{totalReelsSupport || 420}</p>
                    <p className="text-[9px] text-zinc-400">Video loops & replay frequency</p>
                  </div>

                  {/* Overall Engagement Rate */}
                  <div className="p-3.5 rounded-xl bg-zinc-500/5 border border-zinc-500/10 text-center space-y-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Avg Engagement Rate</p>
                    <p className="text-2xl sm:text-3xl font-black text-blue-500">12.8%</p>
                    <p className="text-[9px] text-zinc-400">Creator industry standard is 9.2%</p>
                  </div>

                </div>

                {/* Popular posts analysis logs */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">Top Performing Posts Analysis</h4>
                  {userPosts.length === 0 ? (
                    <div className="p-8 border border-dashed rounded-xl text-center text-zinc-500 text-xs">
                      No active posts logged for analytics yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {userPosts.slice(0, 3).map((post, idx) => (
                        <div key={post.id} className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] sm:text-xs transition ${isDark ? 'bg-zinc-950/40 border-zinc-855' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="w-5.5 h-5.5 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-[9px] shrink-0">#{idx + 1}</span>
                            <p className="truncate font-medium text-zinc-650 dark:text-zinc-300 max-w-[150px] xs:max-w-xs sm:max-w-md">{post.content}</p>
                          </div>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="flex items-center gap-0.5 text-rose-500"><Heart className="w-3 h-3 fill-current" /> {post.likes}</span>
                            <span className="text-zinc-400 font-bold">{(10.5 + idx * 3.1).toFixed(1)}% reach</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Goal Calculator widget */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3.5`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <h4 className="text-[10px] sm:text-xs font-extrabold uppercase text-zinc-400">Support & Engagement Goal Calculator</h4>
                </div>
                
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-405 leading-relaxed">
                  Input your next organic post's target impression reach, and our suite will estimate the total comment velocity and reaction counts needed to viralize it.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* calculator inputs */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400 block">Target Reach Goal</label>
                      <select 
                        defaultValue="5000" id="calc-target-reach"
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-805' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="1000">1,000 Organic Reach</option>
                        <option value="5000">5,000 Professional Reach</option>
                        <option value="10000">10,000 Creative Hub Dominance</option>
                        <option value="55000">50,000 Viral Status Explosion</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400 block">Content Media Type</label>
                      <select 
                        defaultValue="reels" id="calc-content-cat"
                        className={`w-full border rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-805' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="text">Text & Links only</option>
                        <option value="photo">Aesthetic Photos / Gallery</option>
                        <option value="reels">Interactive Video Reels</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculator output result indicators */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-850' : 'bg-amber-500/5 border-amber-500/20'} flex flex-col justify-center space-y-1.5`}>
                    <p className="text-[10px] font-bold uppercase text-amber-500">Expected Engagement Milestones:</p>
                    <div className="space-y-1 text-[11px] sm:text-xs leading-tight">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Reaction Velocity:</span>
                        <strong className="text-zinc-800 dark:text-zinc-200 font-mono">280+ reactions</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Comment Thread Depth:</span>
                        <strong className="text-zinc-800 dark:text-zinc-200 font-mono">45+ structured reply lines</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-zinc-500/10 mt-1">
                        <span className="font-extrabold text-blue-600">Viral Projection Probability:</span>
                        <strong className="text-emerald-500 font-bold font-mono">89% confidence</strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 4: OWNED PAGES & GROUPS MANAGER ================= */}
          {activeTab === 'pages-groups' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              {/* Header inside view */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>My Custom Pages & Groups</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Launch and organize community assets and digital portfolios</p>
                </div>

                <button 
                  onClick={() => { setCreationTab('page'); setShowCreationModal(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Asset</span>
                </button>
              </div>

              {/* Grid: 1. Pages owned list */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-500/10 pb-1">
                  <span className="w-1.5 h-3 bg-orange-500 rounded-full" />
                  <h4 className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase">My Launched Brands ({ownedPages.length})</h4>
                </div>

                {ownedPages.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl text-center text-zinc-404 text-xs">
                    No active brand pages found. Click the button above to launch one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownedPages.map((page) => (
                      <div key={page.id} className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-909/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} relative group flex flex-col justify-between space-y-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-lg shadow-inner shrink-0">
                              {page.logo}
                            </span>
                            <div className="leading-tight truncate">
                              <h5 className="font-extrabold text-xs truncate max-w-[130px] sm:max-w-xs">{page.name}</h5>
                              <p className="text-[9px] text-zinc-400 truncate">{page.category}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeletePage(page.id)}
                            className="p-1 px-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-[10px] font-bold shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs bg-zinc-500/5 p-2 px-3 rounded-xl leading-tight">
                          <div className="text-left">
                            <span className="text-[8px] text-zinc-400 block uppercase">Total Reach</span>
                            <strong className="font-mono text-[11px] text-zinc-700 dark:text-zinc-200">{page.reach || '0'} imps</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-zinc-400 block uppercase">Weekly Index</span>
                            <strong className="text-emerald-500 font-mono text-[11px] font-bold">{page.growth || '+100%'}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid: 2. Groups owned list */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 border-b border-zinc-500/10 pb-1">
                  <span className="w-1.5 h-3 bg-teal-500 rounded-full" />
                  <h4 className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase">My Launched Groups ({ownedGroups.length})</h4>
                </div>

                {ownedGroups.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-2xl text-center text-zinc-404 text-xs">
                    No registered groups found. Start one today and invite colleagues!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownedGroups.map((group) => (
                      <div key={group.id} className={`p-3.5 rounded-2xl border ${isDark ? 'bg-zinc-909/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} relative group flex flex-col justify-between space-y-3`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center text-lg shadow-inner shrink-0">
                              {group.logo}
                            </span>
                            <div className="leading-tight truncate">
                              <h5 className="font-extrabold text-xs truncate max-w-[130px] sm:max-w-xs">{group.name}</h5>
                              <p className="text-[9px] text-zinc-400 truncate">{group.category}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1 px-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-[10px] font-bold shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs bg-zinc-500/5 p-2 px-3 rounded-xl leading-tight">
                          <div className="text-left">
                            <span className="text-[8px] text-zinc-400 block uppercase">Member Base</span>
                            <strong className="text-zinc-700 dark:text-zinc-200 font-mono text-[11px]">{group.members} base</strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-zinc-400 block uppercase">Index growth</span>
                            <strong className="text-blue-500 font-mono text-[11px] font-bold">{group.growth || '+100%'}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 5: MOCK AD CENTER & BOOST CAMPAIGN ================= */}
          {activeTab === 'ad-center' && (
            <div className="space-y-5 animate-fade-in text-left">
              
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3.5`}>
                <div className="flex items-center gap-3 border-b border-zinc-500/10 pb-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Megaphone className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold">Ad Campaign Promotion Center</h3>
                    <p className="text-[10px] text-zinc-400">Expand your reach, promote critical thoughts, or direct link views</p>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Select your promo budget and configure targeting constraints. Our predictive simulation engine displays real-time estimated reach metrics live on-screen.
                </p>

                {/* Main Ad builder form layout split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start pt-1">
                  
                  {/* Left formulation col */}
                  <form onSubmit={handleLaunchAd} className="space-y-3">
                    
                    {/* Post selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400 pb-0.5">Content to Promote</label>
                      <select 
                        value={adPostSelection} 
                        onChange={(e) => setAdPostSelection(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                      >
                        <option value="custom">Promote custom ad headline copy (Write below)</option>
                        {userPosts.map(p => (
                          <option key={p.id} value={p.id}>Post: {p.content.substring(0, 40)}...</option>
                        ))}
                      </select>
                    </div>

                    {adPostSelection === 'custom' && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase text-zinc-400">Custom Ad Slogan or Copy</label>
                        <textarea 
                          value={adCustomText}
                          onChange={(e) => setAdCustomText(e.target.value)}
                          placeholder="Type custom ad copy message to broadcast..."
                          className={`w-full h-14 border rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                        />
                      </div>
                    )}

                    {/* Target Audience selection */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400">Target Audience Cluster</label>
                      <select 
                        value={adAudience} 
                        onChange={(e) => setAdAudience(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                      >
                        <option value="Young Creators & Techs">Tech Enthusiasts & Young Creators (18-32)</option>
                        <option value="Entrepreneurs">Entrepreneurs & Small Business Executives (25-50)</option>
                        <option value="General Public">Broad National Audience (No specific demographic filtering)</option>
                      </select>
                    </div>

                    {/* Regional Targeting */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-400">Geographic Regions</label>
                      <select 
                        value={adLocation} 
                        onChange={(e) => setAdLocation(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                      >
                        <option value="Bangladesh (National Wide)">Nationwide (Bangladesh Entire)</option>
                        <option value="Dhaka Metropolitan Area">Dhaka division metropolitan hub only</option>
                        <option value="Chittagong & Sylhet Zone">Chittagong, Sylhet & Rajshahi combined zones</option>
                      </select>
                    </div>

                    {/* Platform */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase text-zinc-405">Placement Network Placements</label>
                      <select 
                        value={adPlatform} 
                        onChange={(e) => setAdPlatform(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}
                      >
                        <option value="all">Social Feed stream & Sponsored Reels (Optimal Broad Placements)</option>
                        <option value="feeds">Primary text feed slots only</option>
                        <option value="reels">Interactive short reels video loop spaces of partner networks</option>
                      </select>
                    </div>

                    {/* Slider element budget */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-bold leading-none">
                        <span>Daily Promotion Budget:</span>
                        <strong className="text-blue-500 font-mono font-black">${adBudget} USD / day</strong>
                      </div>
                      <input 
                        type="range" min="5" max="250" value={adBudget}
                        onChange={(e) => setAdBudget(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Slider element duration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold leading-none">
                        <span>Duration of Booster run:</span>
                        <strong className="text-indigo-500 font-mono font-black">{adDuration} days</strong>
                      </div>
                      <input 
                        type="range" min="1" max="30" value={adDuration}
                        onChange={(e) => setAdDuration(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer active:scale-[0.98] mt-2 block"
                    >
                      Launch Ad Booster Campaign
                    </button>

                  </form>

                  {/* Right projection preview system */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold uppercase text-zinc-400">Pre-launch Delivery Insights Engine</p>
                    
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-blue-50/50 border-blue-105'} text-[11px] sm:text-xs space-y-3.5`}>
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <TrendingUp className="w-4 h-4 animate-bounce" />
                        <span className="font-extrabold text-xs">Aesthetic Reach Radius Estimations</span>
                      </div>

                      <div className="space-y-2 border-b border-zinc-500/10 pb-3 font-medium">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Impressions Expected:</span>
                          <strong className="text-zinc-800 dark:text-zinc-100 font-mono">{projectedReach.min.toLocaleString()} - {projectedReach.max.toLocaleString()} users reached</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Total Direct Link Clicks:</span>
                          <strong className="text-zinc-800 dark:text-zinc-100 font-mono">{projectedReach.clicksMin} - {projectedReach.clicksMax} link clicks</strong>
                        </div>
                        <div className="flex justify-between pt-1 font-bold">
                          <span className="text-zinc-550">Booster Run Cost Budget:</span>
                          <strong className="text-indigo-600 dark:text-indigo-400 font-black">${adBudget * adDuration} USD Total Spend</strong>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] sm:text-[11px] leading-tight text-zinc-500 text-left">
                        <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> <span>Target audience cluster tracking optimization active</span></div>
                        <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> <span>Nationwide delivery routing placement index fully active</span></div>
                        <div className="flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> <span>Booster goes live instantly following an automated 5-minute content review.</span></div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Campaigns ledger track */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'} space-y-3.5`}>
                <h4 className="text-[10px] sm:text-xs font-black uppercase text-zinc-400 tracking-wider">My Campaigns Ledger ({adCampaigns.length})</h4>
                
                {adCampaigns.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 border border-dashed rounded-xl text-xs">
                    No active campaigns launched. Try initiating an ad booster.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adCampaigns.map((ad) => (
                      <div key={ad.id} className={`p-3.5 rounded-xl border ${isDark ? 'bg-zinc-950/40 border-zinc-850' : 'bg-gray-50 border-gray-200'} text-xs space-y-3`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-500/10 pb-2">
                          <div className="space-y-0.5 text-left">
                            <strong className="text-zinc-800 dark:text-zinc-100 block text-xs">{ad.postTitle}</strong>
                            <p className="text-[9px] text-zinc-405 font-medium">Demographics: {ad.audience} • Regions: {ad.location}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black self-start sm:self-center uppercase leading-none ${
                            ad.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 animate-pulse' : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            ● {ad.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left leading-snug">
                          <div>
                            <span className="text-[8px] text-zinc-400 block uppercase">Total Spend</span>
                            <strong className="font-mono text-xs text-zinc-700 dark:text-zinc-200">${ad.budget * ad.duration} USD</strong>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-400 block uppercase">Impressions</span>
                            <strong className="font-mono text-xs text-blue-500">{ad.impressions.toLocaleString()} views</strong>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-400 block uppercase">Link Clicks</span>
                            <strong className="font-mono text-xs text-emerald-500">{ad.clicks.toLocaleString()} clicks</strong>
                          </div>
                          <div>
                            <span className="text-[8px] text-zinc-400 block uppercase">Avg CTR</span>
                            <strong className="font-mono text-xs text-indigo-505 font-bold">
                              {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'}%
                            </strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ================= OWNED ASSET CREATION MODAL ================= */}
      {showCreationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in text-xs">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            
            <div className="flex items-center justify-between border-b border-zinc-500/10 pb-2.5">
              <h3 className="font-black text-xs sm:text-sm uppercase flex items-center gap-1.5">
                <PlusCircle className="w-5 h-5 text-blue-500" />
                <span>Create New Custom Asset</span>
              </h3>
              <button 
                onClick={() => setShowCreationModal(false)}
                className="text-zinc-400 hover:text-blue-500 cursor-pointer p-1.5 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Selection tab within creation */}
            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl text-center font-bold">
              <button 
                onClick={() => setCreationTab('page')}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer transition text-xs ${creationTab === 'page' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400'}`}
              >
                New Page
              </button>
              <button 
                onClick={() => setCreationTab('group')}
                className={`flex-1 py-1.5 rounded-lg cursor-pointer transition text-xs ${creationTab === 'group' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400'}`}
              >
                New Group
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-3 pt-1 text-left">
              
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 block">Asset Name Name</label>
                <input 
                  type="text" required value={newEntity.name}
                  onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                  placeholder={creationTab === 'page' ? "e.g. Creative Painters Guild" : "e.g. Master Developer Alliance"}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 block font-bold">Category Sector</label>
                <select 
                  value={newEntity.category}
                  onChange={(e) => setNewEntity({ ...newEntity, category: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                >
                  <option value="Technology">Technology & Devices 💻</option>
                  <option value="Community & Art">Art, Painting & Community 🎨</option>
                  <option value="Education">Education & Courses 📚</option>
                  <option value="Business">Business & Corporate 📈</option>
                  <option value="Entertainment">Entertainment & Film 🎬</option>
                  <option value="Science">Science & Labs 🔬</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase text-zinc-405 block font-bold">Short Description / Purpose</label>
                <textarea 
                  required value={newEntity.description}
                  onChange={(e) => setNewEntity({ ...newEntity, description: e.target.value })}
                  placeholder="Detail the core objectives and values of your custom brand page or public group here..."
                  className={`w-full h-14 border rounded-xl p-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-300'}`}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wide transition cursor-pointer shadow-md mt-2 block"
              >
                Launch Brand Asset
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
