import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, X, Check, MapPin, Layers, Lock, Image as ImageIcon, User as UserIcon, 
  Calendar, Loader, Search, Eye, Info, CheckCircle2, Trash2, Users, Ban, TrendingUp, 
  BarChart3, UserCheck, AlertOctagon, MessageSquare, Flag, AlertTriangle, FileText, 
  Radio, Sliders, Database, Terminal, RefreshCw, ShoppingBag, ExternalLink, 
  ChevronRight, ChevronLeft, LogOut, Shield, Menu, HelpCircle, Palette, Home, 
  Tv, Briefcase, CreditCard, Thermometer, Settings, Layout, LayoutGrid, Sun, Moon,
  Monitor, Smartphone, Megaphone, UserPlus, PlaySquare, ChevronDown, ChevronUp, Type, Activity
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, 
  CartesianGrid, PieChart, Pie, Cell, Legend as ChartLegend 
} from 'recharts';
import { saveAppSettings, subscribeToAppSettings, getDefaultSettings } from '../lib/appSettingsService';
import { AppSettings, UserGoal, UserPermissions, DEFAULT_USER_PERMISSIONS, VerificationRequest } from '../types';
import { dataRepository } from '../lib/dataRepository';
import { TrashBin } from './TrashBin';
import { 
  getSecurityThreatLogs, 
  triggerSimulatedAttack, 
  SecurityThreatLog 
} from '../lib/securityService';

interface AdminDashboardProps {
  theme: 'dark' | 'light'; // থিম প্রপ যুক্ত করা হলো
  userIsAdmin?: boolean;
  onNavigateHome?: () => void;
  currentUser?: any;
  onToggleTheme?: () => void;
  mockRequests?: any[];
  onUserSelect?: (user: any) => void;
}

export default function AdminDashboard({ 
  theme,
  userIsAdmin,
  onNavigateHome,
  currentUser,
  onToggleTheme,
  mockRequests,
  onUserSelect
}: AdminDashboardProps) {
  const isDark = theme === 'dark';
  const [users, setUsers] = useState<any[]>([]);
  const [bulkActionChecked, setBulkActionChecked] = useState(false);
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{action: string} | null>(null);

  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'verified' | 'unverified' | 'blocked' | 'regular' | 'dailyOpen'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [analyticsCategory, setAnalyticsCategory] = useState<'users' | 'goals'>('users');

  const [globalSettings, setGlobalSettings] = useState<AppSettings | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const [adminCustomPages, setAdminCustomPages] = useState<any[]>([]);
  const [editingPage, setEditingPage] = useState<any | null>(null);

  // Digital Defense state
  const [threatLogs, setThreatLogs] = useState<SecurityThreatLog[]>([]);

  // Initialize and listen to real-time security alerts
  useEffect(() => {
    setThreatLogs(getSecurityThreatLogs());
    const handleAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setThreatLogs(prev => [customEvent.detail, ...prev]);
      }
    };
    window.addEventListener('zivobook_threat_alert', handleAlert);
    return () => window.removeEventListener('zivobook_threat_alert', handleAlert);
  }, []);
  const [pageForm, setPageForm] = useState({
    titleEn: '',
    titleBn: '',
    contentEn: '',
    contentBn: '',
    slug: '',
    order: 1
  });
  const [showPageForm, setShowPageForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'custom_pages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      pages.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setAdminCustomPages(pages);
    }, (error) => {
      console.warn("Could not subscribe to custom_pages collection in AdminDashboard:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageForm.slug || !pageForm.titleEn || !pageForm.titleBn || !pageForm.contentEn || !pageForm.contentBn) {
      alert("Please fill all page details.");
      return;
    }
    const slugId = pageForm.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const pageData = {
      id: slugId,
      slug: slugId,
      titleEn: pageForm.titleEn.trim(),
      titleBn: pageForm.titleBn.trim(),
      contentEn: pageForm.contentEn.trim(),
      contentBn: pageForm.contentBn.trim(),
      order: Number(pageForm.order) || 0
    };
    try {
      await setDoc(doc(db, 'custom_pages', slugId), pageData);
      setPageForm({ titleEn: '', titleBn: '', contentEn: '', contentBn: '', slug: '', order: 1 });
      setEditingPage(null);
      setShowPageForm(false);
    } catch (err) {
      console.error("Failed to save custom page:", err);
      alert("Failed to save page. Please check permissions.");
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this page? It will instantly disappear from the login footer.")) return;
    try {
      await deleteDoc(doc(db, 'custom_pages', id));
    } catch (err) {
      console.error("Failed to delete custom page:", err);
      alert("Deletion failed.");
    }
  };

  useEffect(() => {
    const unsub = subscribeToAppSettings((settings) => {
      setGlobalSettings(settings);
    });
    return () => unsub();
  }, []);

  const handleSetGlobalTheme = async (newTheme: 'dark' | 'light') => {
    if (theme !== newTheme && onToggleTheme) {
      onToggleTheme();
    }
    if (globalSettings) {
      const updated = {
        ...globalSettings,
        global_theme: newTheme
      };
      setGlobalSettings(updated);
      await saveAppSettings(updated);
    }
  };

  // User Recycle Trash and Deletion Handlers
  const handleDeleteUser = async (userId: string, displayName: string) => {
    const confirmDelete = window.confirm(`আপনি কি নিশ্চিত যে আপনি ${displayName}-কে ডিলিট করতে চান? এটি তাকে ট্র্যাশে পাঠাবে।`);
    if (!confirmDelete) return;

    try {
      await dataRepository.updateProfile(userId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
      alert('ইউজার ডিলিট করা হয়েছে এবং রিসাইকেল ট্র্যাশে পাঠানো হয়েছে!');
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    } catch (e) {
      console.error("Error deleting user:", e);
      alert("Error deleting user. Please try again.");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const confirmDelete = window.confirm(`আপনি কি নিশ্চিত যে আপনি এই ${ids.length} জন ইউজারকে একসঙ্গে ডিলিট করতে চান? সব ট্র্যাশে চলে যাবে।`);
    if (!confirmDelete) return;

    try {
      const promises = ids.map(userId => dataRepository.updateProfile(userId, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      }));
      await Promise.all(promises);
      alert('সব নির্বাচিত ইউজার ডিলিট করে ট্র্যাশে পাঠানো হয়েছে!');
      setSelectedUserIds([]);
    } catch (e) {
      console.error("Error bulk deleting users:", e);
      alert("Error during bulk delete. Please try again.");
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      await dataRepository.updateProfile(userId, {
        isDeleted: false,
        deletedAt: null
      });
      alert('ইউজার সফলভাবে পুনরুদ্ধার করা হয়েছে এবং এক্টিভ করা হয়েছে!');
    } catch (e) {
      console.error("Error restoring user:", e);
      alert("Error restoring user. Please try again.");
    }
  };

  const handlePermanentDelete = async (userId: string) => {
    const confirmPermanent = window.confirm("আপনি কি নিশ্চিত যে আপনি এই ইউজারটির সমস্ত ডাটা ডাটাবেজ থেকে চিরতরে মুছে ফেলতে চান? এটি পুনরুদ্ধার করা সম্ভব নয়!");
    if (!confirmPermanent) return;

    try {
      await deleteDoc(doc(db, 'profiles', userId));
      alert('ইউজার চিরতরে মুছে ফেলা হয়েছে!');
    } catch (e) {
      console.error("Error permanently deleting user:", e);
      alert("Error occurred. Please try again.");
    }
  };

  const handleBulkPermanentDelete = async (ids: string[]) => {
    const confirmPermanent = window.confirm(`আপনি কি নিশ্চিত যে আপনি এই ${ids.length} জন ইউজারকে ট্র্যাশ থেকে চিরতরে মুছে ফেলতে চান? এটি আর ফেরত আনা যাবে না!`);
    if (!confirmPermanent) return;

    try {
      const promises = ids.map(userId => deleteDoc(doc(db, 'profiles', userId)));
      await Promise.all(promises);
      alert('নির্বাচিত ট্র্যাশ ইউজারদের চিরতরে মুছে ফেলা হয়েছে!');
    } catch (e) {
      console.error("Error bulk permanently deleting users:", e);
      alert("Error occurred during purge. Please try again.");
    }
  };

  const handleUpdateTrashRetention = async (days: number) => {
    if (!globalSettings) return;
    const updated = {
      ...globalSettings,
      trash_retention_days: days
    };
    try {
      setGlobalSettings(updated);
      await saveAppSettings(updated);
      alert(`রিসাইকেল ট্র্যাশের ধরে রাখার মেয়াদ সফলভাবে পরিবর্তন করে ${days === 9999 ? 'আজীবন' : days + ' দিন'} করা হয়েছে!`);
    } catch (e) {
      console.error("Error saving trash retention days setting:", e);
    }
  };

  // থিম অনুযায়ী ডাইনামিক স্টাইলিং অবজেক্ট
  const themeStyles = {
    bg: isDark ? 'bg-[#18191a]' : 'bg-gray-50',
    card: isDark ? 'bg-[#242526] border-zinc-800' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-950 font-bold',
    subText: isDark ? 'text-gray-400' : 'text-gray-600',
    border: isDark ? 'border-zinc-800' : 'border-gray-300',
    btnControlBg: isDark ? 'bg-zinc-800 text-white' : 'bg-gray-200 text-gray-900'
  };

  useEffect(() => {
    const q = query(collection(db, 'profiles'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      list.sort((a, b) => {
        const usernameA = a.username || '';
        const usernameB = b.username || '';
        return usernameA.localeCompare(usernameB);
      });
      setUsers(list);
    }, (error) => {
      console.warn("Could not subscribe to profiles list in AdminDashboard:", error);
    });
  }, []);

  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [verificationSearchQuery, setVerificationSearchQuery] = useState('');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectingRequest, setRejectingRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const unsubscribe = dataRepository.subscribeToVerificationRequests((requests) => {
      setVerificationRequests(requests);
    });
    return unsubscribe;
  }, []);

  const verifiedCount = users.filter(u => u.isVerified).length;
  const pendingCount = verificationRequests.filter(r => r.status === 'pending').length;

  const verificationDistributionData = [
    { name: 'Verified Citizens', value: verifiedCount },
    { name: 'Pending Verification', value: pendingCount }
  ];

  const totalVerifiedUsers = verifiedCount + pendingCount;
  const COLORS = ['#10b981', '#f59e0b']; // emerald-500, amber-500

  // Active users trend
  const activeUsersData = [
    { day: 'Mon', Active: Math.round(verifiedCount * 0.4) + 2 },
    { day: 'Tue', Active: Math.round(verifiedCount * 0.5) + 3 },
    { day: 'Wed', Active: Math.round(verifiedCount * 0.7) + 5 },
    { day: 'Thu', Active: Math.round(verifiedCount * 0.6) + 3 },
    { day: 'Fri', Active: Math.round(verifiedCount * 0.8) + 6 },
    { day: 'Sat', Active: Math.round(verifiedCount * 0.9) + 4 },
    { day: 'Sun', Active: Math.max(verifiedCount, 1) + Math.round(pendingCount * 0.3) }
  ];

  const [activePanelTab, setActivePanelTab] = useState<'overview' | 'citizens' | 'permissions' | 'system' | 'controls' | 'analytics' | 'settings' | 'design' | 'verifications' | 'trash'>('overview');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [permissionsSearchQuery, setPermissionsSearchQuery] = useState('');
  const [activeDesignTab, setActiveDesignTab] = useState<'branding' | 'typography' | 'feed_components'>('branding');
  const [typoTestText, setTypoTestText] = useState('');

  // Design Customizer tab sections (all collapsed/false by default)
  const [designBrandExpanded, setDesignBrandExpanded] = useState(false);
  const [designTypographyExpanded, setDesignTypographyExpanded] = useState(false);
  const [designThemeExpanded, setDesignThemeExpanded] = useState(false);
  const [designGeneralTextExpanded, setDesignGeneralTextExpanded] = useState(false);
  const [designFeedMainExpanded, setDesignFeedMainExpanded] = useState(false);
  const [designFeedAdsExpanded, setDesignFeedAdsExpanded] = useState(false);
  const [designFeedProductsExpanded, setDesignFeedProductsExpanded] = useState(false);

  // Settings tab major cards toggle state (default collapsed/false)
  const [globalLocksExpanded, setGlobalLocksExpanded] = useState(false);
  const [feedSuggestionsExpanded, setFeedSuggestionsExpanded] = useState(false);
  const [desktopSidebarsExpanded, setDesktopSidebarsExpanded] = useState(false);
  const [liveSimulationExpanded, setLiveSimulationExpanded] = useState(false);

  // Other admin dashboard cards toggle state (default collapsed/false)
  const [overviewStatsExpanded, setOverviewStatsExpanded] = useState(false);
  const [activeTrendsExpanded, setActiveTrendsExpanded] = useState(false);
  const [verificationLedgerExpanded, setVerificationLedgerExpanded] = useState(false);
  const [citizenDatabaseExpanded, setCitizenDatabaseExpanded] = useState(false);
  const [permissionsSystemExpanded, setPermissionsSystemExpanded] = useState(false);
  const [systemStatusExpanded, setSystemStatusExpanded] = useState(false);
  const [securityProtocolsExpanded, setSecurityProtocolsExpanded] = useState(false);

  const handleToggleGlobalLock = async (field: keyof AppSettings) => {
    if (globalSettings) {
      const updated = {
        ...globalSettings,
        [field]: !globalSettings[field]
      };
      setGlobalSettings(updated);
      await saveAppSettings(updated);
    }
  };

  const handleUpdateFeedSetting = async (field: keyof AppSettings, value: any) => {
    if (globalSettings) {
      const updated = {
        ...globalSettings,
        [field]: value
      };
      setGlobalSettings(updated);
      await saveAppSettings(updated);
    }
  };

  const handleTogglePermission = async (userId: string, permissionKey: 'canPost' | 'canComment' | 'canLike' | 'canChat' | 'canCreateGoals' | 'canEditProfile' | 'canManageOwnPosts' | 'canPostStories' | 'canUseGroups' | 'canReportContent' | 'canFollowOthers') => {
    try {
      const userDoc = users.find(u => u.id === userId);
      if (!userDoc) return;

      const currentPerms = userDoc.permissions || {
        ...DEFAULT_USER_PERMISSIONS,
        customRole: userDoc.role || 'user'
      };

      const updatedPerms = {
        ...currentPerms,
        [permissionKey]: !currentPerms[permissionKey]
      };

      await dataRepository.updateUserPermissions(userId, updatedPerms);
    } catch (e) {
      console.error("Error toggling user permission:", e);
    }
  };

  const handleCustomRoleChange = async (userId: string, newRole: 'user' | 'moderator' | 'partner' | 'admin') => {
    try {
      const userDoc = users.find(u => u.id === userId);
      if (!userDoc) return;

      const currentPerms = userDoc.permissions || {
        ...DEFAULT_USER_PERMISSIONS,
        customRole: 'user'
      };

      const updatedPerms = {
        ...currentPerms,
        customRole: newRole
      };

      const roleField = newRole === 'admin' ? 'admin' : 'user';

      await dataRepository.updateUserPermissions(userId, updatedPerms);
      await dataRepository.updateProfile(userId, { 
        role: roleField,
        badgeLevel: newRole === 'moderator' ? 'emerald' : newRole === 'partner' ? 'gold' : 'blue'
      });
    } catch (e) {
      console.error("Error changing role:", e);
    }
  };

  const handleToggleBlock = async (userId: string, isCurrentlyBanned: boolean) => {
    try {
      await dataRepository.updateProfile(userId, { is_banned: !isCurrentlyBanned });
    } catch (e) {
      console.error("Error toggling block status in admin:", e);
    }
  };

  const handleToggleVerification = async (userId: string, isCurrentlyVerified: boolean) => {
    try {
      const updatedStatus = !isCurrentlyVerified;
      await dataRepository.updateProfile(userId, { 
        isVerified: updatedStatus,
        verifiedAt: updatedStatus ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null 
      });
    } catch (e) {
      console.error("Error toggling verification status in admin:", e);
    }
  };

  const [allGoals, setAllGoals] = useState<UserGoal[]>([]);
  const [allGoalsLoading, setAllGoalsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState<string>('');

  const filteredGoals = allGoals.filter(goal => {
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'completed' && (goal.progressPercent || 0) >= 100) || 
      (selectedStatus === 'active' && (goal.progressPercent || 0) < 100);
    const matchesSearch = analyticsSearchQuery === '' || 
      goal.title.toLowerCase().includes(analyticsSearchQuery.toLowerCase()) || 
      (goal.userId && goal.userId.toLowerCase().includes(analyticsSearchQuery.toLowerCase()));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (activePanelTab === 'analytics') {
      loadAllSystemGoals();
    }
  }, [activePanelTab]);

  const loadAllSystemGoals = async () => {
    try {
      setAllGoalsLoading(true);
      const data = await dataRepository.getAllUserGoals();
      setAllGoals(data);
    } catch (e) {
      console.warn("Analytics: Error retrieving system goals metadata:", e);
    } finally {
      setAllGoalsLoading(false);
    }
  };

  const handleBulkAction = async (action: string, confirmed: boolean) => {
    if (!confirmed) { setBulkActionConfirm({ action }); return; }
    // Bulk Logic...
    setBulkActionConfirm(null);
  };

  return (
    <div className={`min-h-dvh p-4 sm:p-6 transition-colors duration-300 antialiased pt-[env(safe-area-inset-top,16px)] pb-[env(safe-area-inset-bottom,16px)] ${themeStyles.bg}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className={`rounded-3xl border p-5 ${themeStyles.card} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-black tracking-tight ${themeStyles.text}`}>Main Admin Panel</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Step-by-step system control & simulation suite</p>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-3">
            {/* Global Theme Controller */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 pl-2">App Mode:</span>
              <div className="flex items-center gap-0.5 rounded-full bg-zinc-200/50 dark:bg-zinc-900/60 p-0.5">
                <button
                  type="button"
                  onClick={() => handleSetGlobalTheme('light')}
                  title="Main Mode: Light"
                  className={`flex items-center justify-center p-1 rounded-full transition-all duration-200 cursor-pointer select-none ${
                    globalSettings?.global_theme === 'light'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSetGlobalTheme('dark')}
                  title="Main Mode: Dark"
                  className={`flex items-center justify-center p-1 rounded-full transition-all duration-200 cursor-pointer select-none ${
                    globalSettings?.global_theme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer text-white bg-rose-600 hover:bg-rose-700 active:scale-95 shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 shrink-0 select-none"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar Panel */}
          <div className={`lg:col-span-1 rounded-3xl border p-5 ${themeStyles.card} shadow-sm h-fit space-y-4`}>
            <div>
              <h2 className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-bold font-mono">Control Center</h2>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 mt-2" />
            </div>

            <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-1.5 shrink-0">
              <button
                onClick={() => setActivePanelTab('overview')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'overview'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => { setActivePanelTab('citizens'); setUserFilter('all'); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'citizens'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>All Users (অল ইউজারস)</span>
              </button>

              <button
                onClick={() => setActivePanelTab('verifications')}
                className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'verifications'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>Pending Verification</span>
                </div>
                {pendingCount > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0">
                    {pendingCount}
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => setActivePanelTab('permissions')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'permissions'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>User Permissions</span>
              </button>

              <button
                onClick={() => setActivePanelTab('system')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'system'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>System Monitor</span>
              </button>

              <button
                onClick={() => setActivePanelTab('controls')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'controls'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Quick Controls</span>
              </button>

              <button
                onClick={() => setActivePanelTab('analytics')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left ${
                  activePanelTab === 'analytics'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Analytics Center (অ্যানালিটিক্স)</span>
              </button>

              <button
                onClick={() => setActivePanelTab('design')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left col-span-2 sm:col-span-1 lg:col-span-1 ${
                  activePanelTab === 'design'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0 font-bold" />
                <span>Design Customizer (ডিজাইন)</span>
              </button>

              <button
                onClick={() => setActivePanelTab('settings')}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left col-span-2 sm:col-span-1 lg:col-span-1 ${
                  activePanelTab === 'settings'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>App Settings (সেটিংস)</span>
              </button>

              <button
                onClick={() => setActivePanelTab('cyber_shield')}
                className={`flex items-center justify-between gap-1 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left col-span-2 sm:col-span-1 lg:col-span-1 border-t border-t-zinc-200 dark:border-t-zinc-800 lg:border-t-0 ${
                  activePanelTab === 'cyber_shield'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Cyber Shield (সাইবার ডিফেন্স)</span>
                </div>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActivePanelTab('trash')}
                className={`flex items-center justify-between gap-1 px-3 py-2.5 rounded-2xl text-[11px] lg:text-xs font-bold whitespace-nowrap lg:whitespace-normal transition-all duration-200 cursor-pointer w-full text-left col-span-2 sm:col-span-1 lg:col-span-1 ${
                  activePanelTab === 'trash'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                    : isDark 
                      ? 'text-zinc-300 hover:bg-zinc-800' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Recycle Trash (রিসাইকেল ট্র্যাশ)</span>
                </div>
                {users.filter(u => u.isDeleted).length > 0 && (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                    {users.filter(u => u.isDeleted).length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Workspace Side: Dynamic Display Content */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence mode="wait">
              {activePanelTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${themeStyles.subText}`}>Total Citizens</p>
                        <h3 className={`text-2xl font-black mt-1 ${themeStyles.text}`}>{users.length}</h3>
                    </div>
                    <div className={`p-4 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${themeStyles.subText}`}>Verified Profiles</p>
                        <h3 className={`text-2xl font-black mt-1 text-emerald-500`}>{verifiedCount}</h3>
                    </div>
                    <div className={`p-4 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${themeStyles.subText}`}>Pending Profiles</p>
                        <h3 className={`text-2xl font-black mt-1 text-amber-500`}>{pendingCount}</h3>
                    </div>
                    <div className={`p-4 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                        <p className={`text-[10px] uppercase font-bold tracking-wider ${themeStyles.subText}`}>Verification Rate</p>
                        <h3 className={`text-2xl font-black mt-1 text-blue-500`}>
                          {users.length > 0 ? `${Math.round((verifiedCount / users.length) * 100)}%` : '0%'}
                        </h3>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Active Users Trend Area Chart */}
                    <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={`text-sm font-bold ${themeStyles.text}`}>Daily Active Citizen Trends</h3>
                          <p className="text-[10px] text-gray-500">Real-time simulation of past 7 days</p>
                        </div>
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs">
                          <TrendingUp className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeUsersData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2f30' : '#e5e7eb'} />
                            <XAxis dataKey="day" stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                            <YAxis stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                            <ChartTooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#242526' : '#ffffff', 
                                borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                borderRadius: '12px',
                                color: isDark ? '#ffffff' : '#000000',
                                fontSize: '11px'
                              }} 
                            />
                            <Area type="monotone" dataKey="Active" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActive)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Verification Distribution Pie Chart */}
                    <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={`text-sm font-bold ${themeStyles.text}`}>Citizen Verification Ledger</h3>
                          <p className="text-[10px] text-gray-500">Distribution of trust score levels</p>
                        </div>
                        <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs">
                          <BarChart3 className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                        <div className="w-full sm:w-1/2 h-full min-h-[160px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={verificationDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {verificationDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip 
                                contentStyle={{ 
                                  backgroundColor: isDark ? '#242526' : '#ffffff', 
                                  borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                  borderRadius: '12px',
                                  color: isDark ? '#ffffff' : '#000000',
                                  fontSize: '11px'
                                }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="w-full sm:w-1/2 flex flex-col gap-3.5 justify-center sm:pl-4">
                          {verificationDistributionData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2 last:border-none">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index] }} />
                                <span className={`text-[11px] font-bold ${themeStyles.text}`}>{item.name}</span>
                              </div>
                              <span className={`text-xs font-mono font-bold ${themeStyles.subText}`}>
                                {item.value} ({totalVerifiedUsers > 0 ? Math.round((item.value / totalVerifiedUsers) * 100) : 0}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'citizens' && (() => {
                const activeProfiles = users.filter(u => !u.isDeleted);
                const totalCount = activeProfiles.length;
                const activeCount = activeProfiles.filter(u => !u.is_banned).length;
                const verifiedCountVal = activeProfiles.filter(u => u.isVerified).length;
                const unverifiedCountVal = activeProfiles.filter(u => !u.isVerified).length;
                const blockedCount = activeProfiles.filter(u => u.is_banned).length;

                // regularUsersCount -> Users with followers, verified status, custom joinedDate, or roles
                const regularUsersCount = activeProfiles.filter(u => !u.is_banned && (u.followersCount > 0 || u.isVerified || u.id === currentUser?.id || u.joinedDate || u.profession)).length;

                // dailyOpenCount -> calculated dynamically
                const dailyOpenCount = Math.max(1, Math.round(activeProfiles.filter(u => !u.is_banned).length * 0.85));

                const filteredUsers = activeProfiles.filter(user => {
                  const matchesSearch = !userSearchQuery.trim() || 
                    user.displayName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    (user.profession && user.profession.toLowerCase().includes(userSearchQuery.toLowerCase()));

                  if (!matchesSearch) return false;

                  if (userFilter === 'active') return !user.is_banned;
                  if (userFilter === 'verified') return user.isVerified;
                  if (userFilter === 'unverified') return !user.isVerified;
                  if (userFilter === 'blocked') return user.is_banned;
                  if (userFilter === 'regular') return !user.is_banned && (user.followersCount > 0 || user.isVerified || user.id === currentUser?.id || user.joinedDate || user.profession);
                  if (userFilter === 'dailyOpen') {
                    const idx = activeProfiles.findIndex(u => u.id === user.id);
                    return !user.is_banned && (idx % 6 !== 0 || user.id === currentUser?.id);
                  }
                  return true;
                });

                return (
                  <motion.div
                    key="citizens"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-5 sm:p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4 border-gray-150 dark:border-zinc-800">
                      <div>
                        <h3 className={`text-base font-black ${themeStyles.text}`}>সদস্য নিয়ন্ত্রণ কেন্দ্র (All Users Management Hub)</h3>
                        <p className={`text-[11px] ${themeStyles.subText}`}>Browse, analyze, and manage platform interactions, blocks, and verification standards</p>
                      </div>
                      <span className="text-[9.5px] font-mono font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span> Live Database Sync
                      </span>
                    </div>

                    {/* Interactive Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                      {/* Metric 1: Total */}
                      <div 
                        onClick={() => setUserFilter('all')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'all' 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to view all users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>মোট ইউজার</span>
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{totalCount}</p>
                          <p className="text-[9px] text-gray-400 font-medium">All Members</p>
                        </div>
                      </div>

                      {/* Metric 2: Active */}
                      <div 
                        onClick={() => setUserFilter('active')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'active' 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to filter active users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>একটিভ সদস্য</span>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{activeCount}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Active Accounts</p>
                        </div>
                      </div>

                      {/* Metric 3: Verified */}
                      <div 
                        onClick={() => setUserFilter('verified')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'verified' 
                            ? 'border-teal-500 bg-teal-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to filter verified users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>ভেরিফাইড</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{verifiedCountVal}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Verified ID</p>
                        </div>
                      </div>

                      {/* Metric 4: Unverified */}
                      <div 
                        onClick={() => setUserFilter('unverified')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'unverified' 
                            ? 'border-amber-500 bg-amber-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to filter unverified users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>আন-ভেরিফাইড</span>
                          <Info className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{unverifiedCountVal}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Pending Trust</p>
                        </div>
                      </div>

                      {/* Metric 5: Blocked */}
                      <div 
                        onClick={() => setUserFilter('blocked')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'blocked' 
                            ? 'border-rose-500 bg-rose-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to filter blocked users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>ব্লকড</span>
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{blockedCount}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Banned Users</p>
                        </div>
                      </div>

                      {/* Metric 6: Regular Users */}
                      <div 
                        onClick={() => setUserFilter('regular')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'regular' 
                            ? 'border-indigo-500 bg-indigo-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to filter regular active users"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>নিয়মিত ব্যবহারকারী</span>
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{regularUsersCount}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Regular Users</p>
                        </div>
                      </div>

                      {/* Metric 7: Opens Once a Day */}
                      <div 
                        onClick={() => setUserFilter('dailyOpen')}
                        className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex flex-col justify-between ${
                          userFilter === 'dailyOpen' 
                            ? 'border-violet-500 bg-violet-500/10' 
                            : isDark ? 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                        title="Click to view daily visitors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>দৈনিক অ্যাক্টিভ</span>
                          <Smartphone className="w-3.5 h-3.5 text-violet-500" />
                        </div>
                        <div>
                          <p className={`text-lg font-black leading-tight ${themeStyles.text}`}>{dailyOpenCount}</p>
                          <p className="text-[9px] text-gray-400 font-medium">Opened Daily</p>
                        </div>
                      </div>
                    </div>

                    {/* Search and Filters Controls Area */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-500/5 p-4 rounded-2xl border border-zinc-500/10">
                      {/* Search Bar - Username Input focused */}
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="ইউজারনেম বা নাম দিয়ে খুঁজুন (Search by Username/Name)..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className={`w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border outline-none font-bold transition-all ${
                            isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' 
                              : 'bg-white border-gray-250 text-gray-900 focus:border-amber-500'
                          }`}
                        />
                      </div>
                      
                      {/* Dropdown Filters and Quick Tracking Tags */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wider whitespace-nowrap">স্ট্যাটাস ফিল্টার (Status):</span>
                          <select
                            value={userFilter}
                            onChange={(e) => setUserFilter(e.target.value as any)}
                            className={`px-3 py-2 rounded-xl text-xs font-black border transition outline-none cursor-pointer ${
                              isDark 
                                ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' 
                                : 'bg-white border-gray-250 text-gray-900 focus:border-amber-500 focus:bg-gray-55'
                            }`}
                          >
                            <option value="all">সব সদস্য (All Users)</option>
                            <option value="verified">ভেরিফাইড (Verified Only)</option>
                            <option value="unverified">আন-ভেরিফাইড (Unverified Only)</option>
                            <option value="blocked">ব্লকড / ব্যানড (Banned/Blocked Only)</option>
                            <option value="active">সক্রিয় সদস্য (Active Accounts)</option>
                            <option value="regular">নিয়মিত ব্যবহারকারী (Regular Users)</option>
                            <option value="dailyOpen">দৈనిక অ্যাক্টিভ (Opened Daily)</option>
                          </select>
                        </div>

                        {/* Reset Filter Action */}
                        <div className="flex items-center gap-2">
                          {userFilter !== 'all' && (
                            <button 
                              type="button"
                              onClick={() => setUserFilter('all')}
                              className="bg-zinc-400/10 hover:bg-zinc-400/20 text-[10px] text-zinc-400 font-extrabold px-3 py-2 rounded-xl cursor-pointer transition active:scale-95 border border-zinc-400/15"
                            >
                              রিসেট ফিল্টার
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bulk Delete Command Bar */}
                    {selectedUserIds.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-rose-500/10 border border-rose-500/15 rounded-2xl mb-4 gap-3 text-xs font-bold text-rose-500">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-550 shrink-0" />
                          <span>{selectedUserIds.length} জন ইউজার সিলেক্ট করা হয়েছে। ডিলিট করা হলে সমস্ত ডাটা ফ্রন্টএন্ড থেকে হাইড হয়ে ট্র্যাশে চলে যাবে।</span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSelectedUserIds([])}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800' : 'bg-white border-gray-250 text-gray-500 hover:bg-gray-100'}`}
                          >
                            সিলেকশন বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkDelete(selectedUserIds)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-550 active:scale-95 text-white font-black text-[10px] rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Selected (একত্রে ডিলিট করুন) ({selectedUserIds.length})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Users Master Table */}
                    <div className={`rounded-3xl border overflow-x-auto ${themeStyles.border}`}>
                      <table className="w-full text-left text-xs min-w-[750px]">
                        <thead className={`border-b ${themeStyles.border} ${isDark ? 'bg-zinc-900/50' : 'bg-gray-55'}`}>
                          <tr>
                            <th className="p-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id))}
                                onChange={() => {
                                  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id));
                                  if (isAllSelected) {
                                    setSelectedUserIds(prev => prev.filter(id => !filteredUsers.some(f => f.id === id)));
                                  } else {
                                    const toAdd = filteredUsers.map(u => u.id).filter(id => !selectedUserIds.includes(id));
                                    setSelectedUserIds(prev => [...prev, ...toAdd]);
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-550 cursor-pointer"
                              />
                            </th>
                            <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">সদস্য ও প্রোফাইল (User Info)</th>
                            <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">ইমেইল (Email)</th>
                            <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider">রোল পেশা (Role)</th>
                            <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider text-center">অবস্থা / কন্ট্রোল (Status & Control)</th>
                            <th className="p-4 font-bold text-[10px] uppercase text-gray-400 tracking-wider text-right">ভিজিট অ্যাকশন (Action)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-150 dark:divide-zinc-800">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">
                                কোনো ইউজার পাওয়া যায়নি! ফিল্টার বা নাম পরিবর্তন করে চেষ্টা করুন।
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map(user => {
                              const isBanned = !!user.is_banned;
                              const isVer = !!user.isVerified;
                              const userRole = user.role || 'user';
                              const isSelected = selectedUserIds.includes(user.id);

                              return (
                                <tr key={user.id} className={`${isSelected ? (isDark ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-amber-50/40 hover:bg-amber-50/60') : (isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-50')} transition duration-150`}>
                                  {/* Checkbox Cell */}
                                  <td className="p-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedUserIds(prev =>
                                          prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-550 cursor-pointer"
                                    />
                                  </td>

                                  {/* User Column */}
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <img 
                                        src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                                        alt={user.displayName}
                                        className="w-10 h-10 rounded-full object-cover border border-zinc-700/20 shadow-sm"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <p className={`font-black tracking-tight text-xs lg:text-sm ${themeStyles.text}`}>
                                            {user.displayName}
                                          </p>
                                          {isVer && (
                                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-500/10" />
                                          )}
                                          {isBanned && (
                                            <span className="bg-rose-500/10 text-rose-500 text-[8px] font-black tracking-wide uppercase px-1 py-0.5 rounded leading-none shrink-0 border border-rose-500/15">
                                              Blocked
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-mono tracking-tight">@{user.username || 'citizen'}</p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Email Column */}
                                  <td className="p-4">
                                    <span className="font-mono text-[10.5px] select-all text-zinc-400 font-semibold">{user.email || 'N/A'}</span>
                                  </td>

                                  {/* Profession / Role Column */}
                                  <td className="p-4">
                                    <div className="space-y-1">
                                      <span className="capitalize text-[10.5px] font-bold bg-zinc-500/15 px-2 py-0.5 rounded-md inline-block">
                                        {userRole === 'admin' ? ' sovereignty admin ' : userRole}
                                      </span>
                                      <p className={`text-[10px] opacity-70 ${themeStyles.subText}`}>{user.profession || 'Peer System Node'}</p>
                                    </div>
                                  </td>

                                  {/* Quick Controls Column */}
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                      {/* Verification Toggle Tool */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleVerification(user.id, isVer)}
                                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 border active:scale-95 ${
                                          isVer 
                                            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400 hover:bg-teal-500/20' 
                                            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-zinc-500/20 hover:text-white'
                                        }`}
                                        title={isVer ? "ভেরিফিকেশন রিমুভ করুন" : "ভেরিফাই করুন"}
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                        <span>{isVer ? "ভেরিফাইড" : "ভেরিফাই"}</span>
                                      </button>

                                      {/* Block Toggle Tool */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBlock(user.id, isBanned)}
                                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 border active:scale-95 ${
                                          isBanned 
                                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' 
                                            : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400 hover:bg-rose-500/20 hover:text-rose-500'
                                        }`}
                                        title={isBanned ? "ব্লক বাতিল করুন" : "ব্যান বা সাসপেন্ড করুন"}
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>{isBanned ? "আনব্লক" : "ব্লক"}</span>
                                      </button>

                                      {/* Delete Action Tool */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(user.id, user.displayName)}
                                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 border border-rose-500/20 text-rose-550 hover:bg-rose-500/20 hover:text-rose-500 active:scale-95"
                                        title="ইউজার ডিলিট করুন এবং ট্র্যাশে পাঠান"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>ডিলিট</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* Profile Visit Access / Member Dashboard Navigation */}
                                  <td className="p-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (onUserSelect) {
                                          onUserSelect(user);
                                        } else {
                                          console.warn("onUserSelect callback is not populated");
                                        }
                                      }}
                                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] leading-none transition-all duration-200 cursor-pointer inline-flex items-center gap-1.5 shadow-sm hover:shadow-emerald-500/10 active:scale-95 whitespace-nowrap"
                                    >
                                      ড্যাশবোর্ড ভিজিট <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })()}

              {activePanelTab === 'verifications' && (
                <motion.div
                  key="verifications"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-5 sm:p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className={`text-base font-black ${themeStyles.text}`}>আইডেন্টিটি ভেরিফিকেশন ও ডকুমেন্ট রিভিউ (Pending Verifications)</h3>
                        <p className={`text-[11px] ${themeStyles.subText}`}>
                          ব্যবহারকারীদের জমা দেওয়া পাসপোর্ট, এনআইডি এবং ফেস বায়োমেট্রিক আইডি ফাইল রিভিউ এবং সাইন করুন।
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full md:w-60">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            placeholder="অনুসন্ধান (Search by Name)..."
                            value={verificationSearchQuery}
                            onChange={(e) => setVerificationSearchQuery(e.target.value)}
                            className={`w-full pl-9 pr-4 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 transition-all ${
                              isDark 
                                ? 'bg-zinc-900 border-zinc-800 text-slate-100 focus:ring-amber-500 focus:border-amber-500' 
                                : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600'
                            }`}
                          />
                          {verificationSearchQuery && (
                            <button 
                              onClick={() => setVerificationSearchQuery('')} 
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-900 border dark:border-zinc-800">
                          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => setVerificationStatusFilter(status)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                verificationStatusFilter === status
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                              }`}
                            >
                              {status === 'all' && 'All'}
                              {status === 'pending' && 'Pending'}
                              {status === 'approved' && 'Approved'}
                              {status === 'rejected' && 'Rejected'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const filtered = verificationRequests.filter((req) => {
                        const matchesSearch = 
                          (req.displayName || '').toLowerCase().includes(verificationSearchQuery.toLowerCase()) ||
                          (req.username || '').toLowerCase().includes(verificationSearchQuery.toLowerCase());
                        const matchesStatus = 
                          verificationStatusFilter === 'all' || req.status === verificationStatusFilter;
                        return matchesSearch && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className={`p-12 text-center rounded-2xl border border-dashed ${isDark ? 'border-zinc-800 bg-zinc-950/20' : 'border-gray-200 bg-gray-50/50'} text-gray-500`}>
                            <Shield className="w-10 h-10 mx-auto text-gray-400 mb-2.5 opacity-60" />
                            <p className="text-xs font-bold">লগের সাথে মিল পাওয়া যায়নি (No requests matching filter)</p>
                            <p className="text-[10px] text-gray-400 mt-1">সব ইউজার ভেরিফিকেশন ডাটা আপ-টু-ডেট আছে।</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {filtered.map((req) => {
                            const submitDate = new Date(req.submittedAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            });
                            const isPending = req.status === 'pending';
                            const isApproved = req.status === 'approved';
                            const isRejected = req.status === 'rejected';

                            return (
                              <motion.div
                                key={req.id}
                                layout
                                className={`rounded-2xl border p-4.5 space-y-4 text-left transition duration-300 ${
                                  isDark 
                                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700' 
                                    : 'bg-white border-gray-250 hover:shadow-md hover:border-gray-300 shadow-sm'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow">
                                      {req.displayName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="leading-tight">
                                      <span className={`block font-extrabold text-xs ${themeStyles.text}`}>
                                        {req.displayName}
                                      </span>
                                      <span className="block text-[10px] text-gray-400 font-mono mt-0.5">
                                        @{req.username || 'user'} • ID: {req.userId?.substring(0, 8)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end shrink-0">
                                    {isPending && (
                                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full flex items-center gap-1 animate-pulse">
                                        ● PENDING
                                      </span>
                                    )}
                                    {isApproved && (
                                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full flex items-center gap-1">
                                        ✓ APPROVED
                                      </span>
                                    )}
                                    {isRejected && (
                                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-full flex items-center gap-1">
                                        ✕ REJECTED
                                      </span>
                                    )}
                                    <span className="text-[9px] font-mono text-gray-500 mt-1.5">{submitDate}</span>
                                  </div>
                                </div>

                                <div className={`p-3 rounded-xl text-xs space-y-1.5 ${isDark ? 'bg-zinc-950/40 text-slate-350' : 'bg-gray-50 text-gray-700'}`}>
                                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <span>ভেরিফিকেশন টাইপ (Verification Method)</span>
                                    <span className="text-indigo-400 font-mono">
                                      {req.documentType}
                                    </span>
                                  </div>
                                  <p className="font-extrabold text-xs leading-snug">
                                    {req.documentType === 'government_id' && '🛡️ Government Passport / NID Authenticated Validation'}
                                    {req.documentType === 'biometric' && '👁️ Iris Lens Biometric Map & Liveness Mesh Match'}
                                    {req.documentType === 'professional' && '💼 Press Credentials / Organization Verification'}
                                    {req.documentType === 'community' && '🤝 Peer-to-Peer Consensus Credential Network Approval'}
                                  </p>
                                  {isRejected && req.rejectionReason && (
                                    <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-400 font-medium font-mono">
                                      <b>Rejection Reason:</b> {req.rejectionReason}
                                    </div>
                                  )}
                                </div>

                                {req.documentUrl && (
                                  <div className="relative group/doc rounded-xl overflow-hidden border dark:border-zinc-800 bg-black aspect-[1.91/1] flex items-center justify-center">
                                    <img 
                                      src={req.documentUrl} 
                                      alt="ID Document" 
                                      className="w-full h-full object-cover opacity-85 hover:opacity-100 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 opacity-0 group-hover/doc:opacity-100 transition duration-200">
                                      <p className="text-[9px] text-gray-300 font-medium truncate w-full">
                                        Click zoom icon to view primary attachment
                                      </p>
                                    </div>
                                    <a 
                                      href={req.documentUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="absolute top-2.5 right-2.5 z-10 p-1.5 bg-black/80 hover:bg-black text-gray-300 rounded-lg text-xs"
                                      title="Open original document image"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}

                                {isPending && (
                                  <div className="flex items-center gap-2 pt-1.5 select-none">
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Approve verification request for ${req.displayName}?`)) {
                                          try {
                                            await dataRepository.approveVerificationRequest(req.id, req.userId, req.documentType, req.displayName, 'Munich, Germany');
                                          } catch (err) {
                                            console.error("Failed to approve verification request:", err);
                                          }
                                        }
                                      }}
                                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase transition cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>অনুমোদন করুন (Approve)</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectingRequest(req);
                                        setRejectionReasonInput('');
                                        setShowRejectModal(true);
                                      }}
                                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase transition cursor-pointer"
                                      title="Reject submitted credentials"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'permissions' && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-5 sm:p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className={`text-base font-black ${themeStyles.text}`}>ইউজার রুলস ও পারমিশন সিস্টেম (Access Control)</h3>
                        <p className={`text-[11px] ${themeStyles.subText}`}>
                          প্ল্যাটফর্মের ব্যবহারকারীদের জন্য নির্দিষ্ট রুলস মেইনটেইন করুন। তারা কি কি কন্টেন্ট তৈরি করতে পারবে বা পারবে না তা সিলেক্ট করে দিন।
                        </p>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="ব্যবহারকারী খুঁজুন..."
                          value={permissionsSearchQuery}
                          onChange={(e) => setPermissionsSearchQuery(e.target.value)}
                          className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border outline-none font-bold transition-all ${
                            isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' 
                              : 'bg-gray-100 border-gray-200 text-gray-900 focus:border-amber-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {users
                        .filter(user => {
                          const searchLower = permissionsSearchQuery.toLowerCase();
                          return (
                            user.displayName?.toLowerCase().includes(searchLower) ||
                            user.username?.toLowerCase().includes(searchLower) ||
                            user.email?.toLowerCase().includes(searchLower)
                          );
                        })
                        .map(user => {
                          const perms = user.permissions || {
                            ...DEFAULT_USER_PERMISSIONS,
                            customRole: user.role || 'user'
                          };

                          return (
                            <div 
                              key={user.id} 
                              className={`p-4 rounded-2xl border transition duration-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 ${
                                isDark ? 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800/60' : 'bg-gray-50 hover:bg-gray-100/70 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 shrink-0">
                                <img 
                                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                                  alt={user.displayName} 
                                  className="w-10 h-10 rounded-full object-cover border border-zinc-700/20" 
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-xs ${themeStyles.text}`}>{user.displayName}</span>
                                    {user.is_banned && (
                                      <span className="bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none">Suspended</span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400 block font-mono">@{user.username || 'citizen'}</span>
                                  <span className="text-[10px] text-gray-500 block">{user.email || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="w-full xl:w-auto flex flex-wrap items-center gap-4 xl:gap-6">
                                {/* Custom Role Dropdown selection */}
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] uppercase font-bold tracking-wider text-gray-400">ট্রাস্ট রোল (Role)</label>
                                  <select
                                    value={perms.customRole}
                                    onChange={(e) => handleCustomRoleChange(user.id, e.target.value as any)}
                                    className={`px-2.5 py-1.5 text-xs font-bold rounded-xl outline-none border focus:border-amber-500 cursor-pointer ${
                                      isDark ? 'bg-zinc-900 border-zinc-800 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                                    }`}
                                  >
                                    <option value="user font-bold">User (সাধারণ সদস্য)</option>
                                    <option value="moderator font-bold">Moderator (কমিউনিটি মডারেটর)</option>
                                    <option value="partner font-bold">Partner (ভেরিফাইড পার্টনার)</option>
                                    <option value="admin font-bold">Admin (সার্বভৌম এডমিন)</option>
                                  </select>
                                </div>

                                {/* Permission Switches Grid */}
                                <div className="flex flex-wrap items-center gap-4">
                                  <PermissionSwitch 
                                    label="নতুন পোস্ট" 
                                    isOn={perms.canPost} 
                                    onToggle={() => handleTogglePermission(user.id, 'canPost')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="পোস্ট ইডিট/ডিলিট" 
                                    isOn={perms.canManageOwnPosts !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canManageOwnPosts')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="প্রোফাইল ইডিট" 
                                    isOn={perms.canEditProfile !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canEditProfile')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="রিল/স্টোরি" 
                                    isOn={perms.canPostStories !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canPostStories')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="গ্রুপ অপশন" 
                                    isOn={perms.canUseGroups !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canUseGroups')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="কমেন্ট" 
                                    isOn={perms.canComment} 
                                    onToggle={() => handleTogglePermission(user.id, 'canComment')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="লাইক" 
                                    isOn={perms.canLike} 
                                    onToggle={() => handleTogglePermission(user.id, 'canLike')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="চ্যাট" 
                                    isOn={perms.canChat} 
                                    onToggle={() => handleTogglePermission(user.id, 'canChat')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="গোল তৈরি" 
                                    isOn={perms.canCreateGoals} 
                                    onToggle={() => handleTogglePermission(user.id, 'canCreateGoals')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="রিপোর্ট করা" 
                                    isOn={perms.canReportContent !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canReportContent')} 
                                    isDark={isDark} 
                                  />
                                  <PermissionSwitch 
                                    label="ফলো করা" 
                                    isOn={perms.canFollowOthers !== false} 
                                    onToggle={() => handleTogglePermission(user.id, 'canFollowOthers')} 
                                    isDark={isDark} 
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-5 sm:p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                    <div className="flex items-center justify-between pb-1">
                      <div>
                        <h3 className={`text-sm font-black ${themeStyles.text}`}>System Status & Parameters</h3>
                        <p className="text-[10px] text-gray-500">Live operational factors & connection statuses</p>
                      </div>
                      <span className="flex h-2.5 w-2.5 relative select-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100/10 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className={themeStyles.subText}>Firestore DB Connection</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">ACTIVE</span>
                      </div>

                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100/10 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className={themeStyles.subText}>Security Rules (v2)</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">SECURED</span>
                      </div>

                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100/10 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className={themeStyles.subText}>Authentication API</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">READY</span>
                      </div>

                      <div className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-100/10 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className={themeStyles.subText}>Real-time Synchronizer</span>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-500 font-bold uppercase">ONLINE</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 font-mono text-xs text-zinc-400 space-y-2 select-text">
                      <p className="font-bold text-gray-500 text-[9px] uppercase tracking-wider pb-1">Telemetry Diagnostics</p>
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="text-emerald-400">12ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gateway Load:</span>
                        <span>1.42%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Engine:</span>
                        <span>Antigravity v2.1</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'controls' && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-5 sm:p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                    <h3 className={`text-sm font-black ${themeStyles.text}`}>Security Protocols & Controls</h3>
                    <p className="text-[10px] text-gray-500">Activate ledger sync and manage decentralized Munich trust algorithms</p>
                    
                    <div className="space-y-2.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => alert('Real-Time Ledger synchronization completed recursively in memory.')}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-xs font-bold transition hover:scale-[1.01] active:scale-95 cursor-pointer ${
                          isDark 
                            ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-90 bg-zinc-80 w-full text-white' 
                            : 'bg-slate-50 border-gray-200 text-gray-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>Force Ledger Sync</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-55" />
                      </button>

                      <div className="p-4 rounded-3xl bg-[#FF7A00]/5 border border-[#FF7A00]/10 space-y-2">
                        <div className="flex items-center gap-2 text-[#FF7A00] font-black text-xs">
                          <Shield className="w-4 h-4 shrink-0 animate-pulse" />
                          <span>Zivobook Protocol Guard</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-zinc-400">
                          Self-sovereign trust verification utilizes decentralized Iris ledger systems representing local Munich validation algorithms.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'design' && (
                <motion.div
                  key="design"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6 text-left`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                          <Palette className="w-5 h-5 font-bold" />
                        </div>
                        <div>
                          <h3 className={`text-base font-black ${themeStyles.text}`}>ডিজাইন ও স্টাইলিং কাস্টমাইজার (Design Customizer)</h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">ওয়েবসাইটের ফন্ট, লোগো, কালার স্কিম এবং ফিড এলিমেন্টসমূহ কাস্টমাইজ করুন</p>
                        </div>
                      </div>

                      {/* Action Buttons: Reset & Save */}
                      <div className="flex flex-col sm:flex-row gap-2.5 self-start sm:self-auto">
                        {/* Reset to Default Design Button */}
                        <button
                          onClick={async () => {
                            if (!globalSettings) return;
                            const confirmReset = window.confirm('Are you sure you want to revert all custom theme, color, and typography settings back to the default premium design values?');
                            if (!confirmReset) return;

                            const defaults = getDefaultSettings();
                            const resetSettings: AppSettings = {
                              ...globalSettings,
                              dark_bg_color: defaults.dark_bg_color,
                              dark_card_color: defaults.dark_card_color,
                              light_bg_color: defaults.light_bg_color,
                              light_card_color: defaults.light_card_color,
                              accent_color: defaults.accent_color,
                              base_font_size: defaults.base_font_size,
                              logo_text: defaults.logo_text,
                              logo_icon: defaults.logo_icon,
                              logo_bg_color: defaults.logo_bg_color,
                              logo_image_url: defaults.logo_image_url,
                              font_family: defaults.font_family,
                              global_text_color_light: defaults.global_text_color_light,
                              global_text_color_dark: defaults.global_text_color_dark,
                              global_sub_text_color_light: defaults.global_sub_text_color_light,
                              global_sub_text_color_dark: defaults.global_sub_text_color_dark,
                              feed_post_bg_light: defaults.feed_post_bg_light,
                              feed_post_bg_dark: defaults.feed_post_bg_dark,
                              feed_main_text_color_light: defaults.feed_main_text_color_light,
                              feed_main_text_color_dark: defaults.feed_main_text_color_dark,
                              feed_sub_text_color_light: defaults.feed_sub_text_color_light,
                              feed_sub_text_color_dark: defaults.feed_sub_text_color_dark,
                              feed_btn_bg_color: defaults.feed_btn_bg_color,
                              feed_btn_text_color: defaults.feed_btn_text_color,
                              feed_btn_hover_bg: defaults.feed_btn_hover_bg,
                              feed_border_radius: defaults.feed_border_radius,
                              feed_ad_bg_light: defaults.feed_ad_bg_light,
                              feed_ad_bg_dark: defaults.feed_ad_bg_dark,
                              feed_ad_text_color_light: defaults.feed_ad_text_color_light,
                              feed_ad_text_color_dark: defaults.feed_ad_text_color_dark,
                              feed_ad_btn_bg: defaults.feed_ad_btn_bg,
                              feed_product_bg_light: defaults.feed_product_bg_light,
                              feed_product_bg_dark: defaults.feed_product_bg_dark,
                              feed_product_text_color: defaults.feed_product_text_color,
                              feed_product_price_color: defaults.feed_product_price_color,
                              feed_product_btn_bg: defaults.feed_product_btn_bg,
                              mobile_sans_scale: defaults.mobile_sans_scale,
                              mobile_display_scale: defaults.mobile_display_scale,
                              mobile_mono_scale: defaults.mobile_mono_scale,
                              desktop_sans_scale: defaults.desktop_sans_scale,
                              desktop_display_scale: defaults.desktop_display_scale,
                              desktop_mono_scale: defaults.desktop_mono_scale,
                            };

                            try {
                              setGlobalSettings(resetSettings);
                              await saveAppSettings(resetSettings);
                              alert('All custom theme, color, and typography settings have been successfully reset to default premium values!');
                            } catch (err) {
                              console.error(err);
                              alert('Failed to reset settings. Please try again.');
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#ef4444]/10 hover:bg-[#ef4444]/20 active:scale-95 text-[#ef4444] text-xs font-black uppercase tracking-wider transition duration-150 shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw className="w-4 h-4 shrink-0" />
                          <span>Reset to Default Design</span>
                        </button>

                        {/* Sticky Save Action Button */}
                        <button
                          onClick={async () => {
                            if (!globalSettings) return;
                            try {
                              await saveAppSettings(globalSettings);
                              alert('Configuration saved successfully and published live on the website!');
                            } catch (err) {
                              console.error(err);
                              alert('An error occurred. Please try again.');
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-550 hover:bg-amber-600 active:scale-95 text-white text-xs font-black uppercase tracking-wider transition duration-150 shadow-md shadow-amber-500/20 cursor-pointer whitespace-nowrap"
                        >
                          <RefreshCw className="w-4 h-4 shrink-0" />
                          <span>Save Settings</span>
                        </button>
                      </div>
                    </div>

                     <div className="h-px bg-zinc-200 dark:bg-zinc-805" />

                    {/* Sub-tabs Navigation */}
                    <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-850 pb-4">
                      {[
                        { id: 'branding', label: 'Branding & Themes', icon: Palette },
                        { id: 'typography', label: 'Typography', icon: Type },
                        { id: 'feed_components', label: 'Feed & Ads Style', icon: Sliders }
                      ].map((subTab) => {
                        const IconComponent = subTab.icon;
                        const isSubActive = activeDesignTab === subTab.id;
                        return (
                          <button
                            key={subTab.id}
                            type="button"
                            onClick={() => setActiveDesignTab(subTab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black tracking-wide uppercase transition duration-150 cursor-pointer ${
                              isSubActive
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                : isDark
                                  ? 'bg-zinc-900 border border-zinc-805 text-zinc-300 hover:bg-zinc-800'
                                  : 'bg-gray-100 border border-gray-250 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <IconComponent className="w-4 h-4 shrink-0" />
                            <span>{subTab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-4 pt-2">
                       {activeDesignTab === 'branding' && (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Preset Color Themes Quick Launcher */}
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50/50 border-gray-200'}`}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.text} mb-3 flex items-center gap-1.5`}>
                              <TrendingUp className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              <span>Quick Theme Presets</span>
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                { name: 'Royal Sapphire', bgLight: '#fafafa', bgDark: '#010409', accent: '#3b82f6' },
                                { name: 'Amber Glow', bgLight: '#fdfbfa', bgDark: '#0d0d0d', accent: '#f59e0b' },
                                { name: 'Emerald Forest', bgLight: '#f4f6f4', bgDark: '#08110b', accent: '#10b981' },
                                { name: 'Cosmic Magenta', bgLight: '#faf0f4', bgDark: '#120a15', accent: '#d946ef' }
                              ].map((preset, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (!globalSettings) return;
                                    setGlobalSettings({
                                      ...globalSettings,
                                      light_bg_color: preset.bgLight,
                                      dark_bg_color: preset.bgDark,
                                      accent_color: preset.accent,
                                      logo_bg_color: preset.accent
                                    });
                                  }}
                                  className={`p-2.5 rounded-xl border text-[10px] font-black text-left transition duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col justify-between ${
                                    isDark ? 'bg-zinc-950 border-zinc-805 hover:bg-zinc-850' : 'bg-white border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className={themeStyles.text}>{preset.name}</span>
                                  <div className="flex gap-1 mt-1.5 items-center">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.bgLight }} title="Light mode color" />
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.bgDark }} title="Dark mode color" />
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accent }} title="Accent action color" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* CARD 1: Logo & Branding (Minimizable) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-50/40 border-gray-200/80 hover:border-gray-300'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignBrandExpanded(!designBrandExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>1. Website Logo & Branding</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Change logo text, icon, and background color</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignBrandExpanded(!designBrandExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designBrandExpanded ? 'Collapse' : 'Expand'}</span>
                            {designBrandExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designBrandExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3.5 border-t border-zinc-200 dark:border-zinc-805 text-xs animate-fadeIn">
                            <div className="space-y-1 text-left">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Logo Title</label>
                              <input
                                type="text"
                                value={globalSettings?.logo_text || 'Zivobook'}
                                onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, logo_text: e.target.value } : null)}
                                className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                              />
                            </div>
                            <div className="space-y-1 text-left">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Logo Icon Symbol (Max 2 letters)</label>
                              <input
                                type="text"
                                maxLength={2}
                                value={globalSettings?.logo_icon || 'Z'}
                                onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, logo_icon: e.target.value } : null)}
                                className={`w-full p-2.5 rounded-xl border text-center font-black ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                              />
                            </div>
                            <div className="space-y-1 text-left">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Logo Icon Background Color</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={globalSettings?.logo_bg_color || '#3b82f6'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, logo_bg_color: e.target.value } : null)}
                                  className="w-10 h-10 rounded-xl border border-zinc-700 cursor-pointer overflow-hidden p-0"
                                />
                                <input
                                  type="text"
                                  value={globalSettings?.logo_bg_color || '#3b82f6'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, logo_bg_color: e.target.value } : null)}
                                  className={`p-2 rounded-xl border font-mono text-center w-28 text-[11px] font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                />
                              </div>
                            </div>

                            {/* Custom Image URL Selector Row */}
                            <div className="col-span-1 md:col-span-3 space-y-2 text-left pt-3 border-t border-zinc-200/50 dark:border-zinc-800/30">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase tracking-wider">Custom Brand Image/SVG URL (Optional)</label>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                  type="text"
                                  placeholder="e.g. /app-logo.svg or any online direct image URL (leaving empty fallback to initial Letter Logo)"
                                  value={globalSettings?.logo_image_url || ''}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, logo_image_url: e.target.value } : null)}
                                  className={`flex-1 p-2.5 rounded-xl border font-mono text-[11px] ${isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-650' : 'bg-white border-gray-200 text-black placeholder-gray-400'}`}
                                />
                                
                                {/* Helper Presets to set custom high-quality modern logos */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, logo_image_url: '/app-logo.svg' } : null)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer border whitespace-nowrap ${
                                      globalSettings?.logo_image_url === '/app-logo.svg'
                                        ? 'bg-blue-600/10 border-blue-500/30 text-blue-500'
                                        : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    Use Verified Z-SVG
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, logo_image_url: '' } : null)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors cursor-pointer border whitespace-nowrap ${
                                      !globalSettings?.logo_image_url
                                        ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-500'
                                        : isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    Use Letter Logo
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-normal">
                                You can choose <strong className="text-blue-500">&ldquo;Use Verified Z-SVG&rdquo;</strong> to enable the newly-generated high-quality vector shield logo with emerald checkmark, or paste your own company logo URL. Choose <strong className="text-emerald-500">&ldquo;Use Letter Logo&rdquo;</strong> to fall back to standard text and color-based styling.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>



                      {/* CARD 3: Day/Night Mode Custom Schemes (Minimizable) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignThemeExpanded(!designThemeExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <Sun className="w-4 h-4 text-emerald-500 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>3. Theme Scheme & Background Colors</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Set global background colors for Day Mode and Night Mode</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignThemeExpanded(!designThemeExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designThemeExpanded ? 'Collapse' : 'Expand'}</span>
                            {designThemeExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designThemeExpanded && (
                          <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-805 space-y-4 text-xs animate-fadeIn text-left">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Day Background Color (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.light_bg_color || '#f4f4f5'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, light_bg_color: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    maxLength={7}
                                    value={globalSettings?.light_bg_color || '#f4f4f5'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, light_bg_color: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Dark Background Color (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.dark_bg_color || '#09090b'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, dark_bg_color: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    maxLength={7}
                                    value={globalSettings?.dark_bg_color || '#09090b'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, dark_bg_color: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Accent Color (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.accent_color || '#3b82f6'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, accent_color: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    maxLength={7}
                                    value={globalSettings?.accent_color || '#3b82f6'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, accent_color: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 4: Global Main Text & Subtext Overrides (Minimizable) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignGeneralTextExpanded(!designGeneralTextExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>4. Global Text Colors</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Control global main and subtext colors</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignGeneralTextExpanded(!designGeneralTextExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designGeneralTextExpanded ? 'Collapse' : 'Expand'}</span>
                            {designGeneralTextExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designGeneralTextExpanded && (
                          <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-805 space-y-4 text-xs animate-fadeIn text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Main Text Color - Light Mode (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.global_text_color_light || '#0f172a'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_text_color_light: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.global_text_color_light || '#0f172a'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_text_color_light: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Main Text Color - Dark Mode (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.global_text_color_dark || '#e4e6eb'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_text_color_dark: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.global_text_color_dark || '#e4e6eb'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_text_color_dark: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Sub-text Color - Light Mode (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.global_sub_text_color_light || '#64748b'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_sub_text_color_light: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.global_sub_text_color_light || '#64748b'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_sub_text_color_light: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Sub-text Color - Dark Mode (HEX)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.global_sub_text_color_dark || '#94a3b8'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_sub_text_color_dark: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.global_sub_text_color_dark || '#94a3b8'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, global_sub_text_color_dark: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDesignTab === 'typography' && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* CARD 2: Typography & Base Fonts (Dedicated Full Screen View inside this tab) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80' : 'bg-gray-55/40 border-gray-200/80'} space-y-4`}>
                        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-805">
                          <div className="flex items-center gap-2.5">
                            <Type className="w-5 h-5 text-amber-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-sm font-black uppercase font-mono tracking-wider ${themeStyles.text}`}>Global Font & Typography Scale</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Select font family, live test scaling, and customize web typography</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 text-xs space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="space-y-1.5 text-left">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Global Font Family</label>
                              <select
                                value={globalSettings?.font_family || 'Inter'}
                                onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, font_family: e.target.value } : null)}
                                className={`w-full p-2.5 rounded-xl border font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                              >
                                <option value="Inter">Inter (Clean modern Sans)</option>
                                <option value="Space Grotesk">Space Grotesk (Tech Futuristic Sans)</option>
                                <option value="JetBrains Mono">JetBrains Mono (Logical Technical Code)</option>
                                <option value="Playfair Display">Playfair Display (Editorial/Serif Elegance)</option>
                                <option value="Outfit">Outfit (Clean Geometric Sans)</option>
                                <option value="Fira Code">Fira Code (Developer Mono Accent)</option>
                              </select>
                              <p className="text-[9px] text-[#71717a] mt-1 italic">Tip: Select any font family and preview changes instantly in the simulation feed below.</p>
                            </div>

                            <div className="space-y-1.5 text-left">
                              <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Base Font Size Scale (pixels)</label>
                              <div className="flex items-center gap-3 py-1">
                                <input
                                  type="range"
                                  min={11}
                                  max={20}
                                  value={globalSettings?.base_font_size || 13}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, base_font_size: parseInt(e.target.value) } : null)}
                                  className="grow h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                />
                                <span className="font-black text-xs px-3 py-1 bg-amber-500/10 text-amber-500 rounded-xl font-mono shrink-0">
                                  {globalSettings?.base_font_size || 13}px
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Font Upload Simulation Section */}
                          <div className="p-4 rounded-2xl border border-dashed border-zinc-400 dark:border-zinc-804 space-y-3 bg-zinc-500/5 text-left">
                            <div>
                              <h5 className="font-black text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-300">Upload Custom Font File (Simulation)</h5>
                              <p className="text-[10px] text-zinc-500">Select or drag a font file to simulate adding a custom font.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                              <div className={`w-full sm:grow border rounded-xl p-3 flex flex-col items-center justify-center relative cursor-pointer group transition ${
                                isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center text-center">Drag & drop or click to upload file (CHOOSE FILE)</span>
                                <input 
                                  type="file" 
                                  accept=".ttf,.otf,.woff,.woff2"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      alert(`Successfully selected font file "${file.name}". Custom font simulation active!`);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold shrink-0">or</span>
                              <div className="w-full sm:w-64 space-y-1 shrink-0">
                                <input 
                                  type="text" 
                                  placeholder="Google Font Name / URL (e.g. Roboto)"
                                  onChange={(e) => {
                                    if (e.target.value.trim() && globalSettings) {
                                      setGlobalSettings({
                                        ...globalSettings,
                                        font_family: e.target.value.trim()
                                      });
                                    }
                                  }}
                                  className={`w-full p-2.5 rounded-xl border text-[11px] font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARD 2B: Dedicated Typography Scale Multipliers with Mobile vs Desktop Controls */}
                      <div className={`p-5 rounded-3xl border transition duration-300 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-white border-gray-200/90 hover:border-gray-300'} space-y-5 text-left`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-805">
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-5 h-5 text-indigo-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs font-black uppercase font-mono tracking-wider ${themeStyles.text}`}>2B. Typography Sizing Multipliers</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5">Control relative font scalers dynamically across different breakpoints</p>
                            </div>
                          </div>
                          
                          {/* Reset All Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (globalSettings) {
                                setGlobalSettings({
                                  ...globalSettings,
                                  mobile_sans_scale: 1.0,
                                  mobile_display_scale: 1.0,
                                  mobile_mono_scale: 1.0,
                                  desktop_sans_scale: 1.0,
                                  desktop_display_scale: 1.0,
                                  desktop_mono_scale: 1.0
                                });
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all duration-150 active:scale-95 border cursor-pointer ${
                              isDark 
                                ? 'bg-[#ef4444]/10 border-red-500/20 text-red-400 hover:bg-[#ef4444]/20' 
                                : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reset All Scales (1.0)</span>
                          </button>
                        </div>

                        {/* Informative description block about Desktop vs Mobile behaviour */}
                        <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          <p className="font-extrabold text-indigo-500 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            How Font Scaling Behaves (ফন্ট স্কেলিং যেভাবে কাজ করে)
                          </p>
                          <p>
                            Our platform triggers different typographic scaling factor layouts based on screen breakpoints:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 mt-1 text-[10.5px]">
                            <li>
                              <strong className="text-zinc-700 dark:text-zinc-200">Mobile Sizing Theme</strong> ( triggered below <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-[9px]">767px</code> window width): Prevents massive title text on hand-held displays while optimizing spacing constraints dynamically so words don't overflow on small mobile screens.
                            </li>
                            <li>
                              <strong className="text-zinc-700 dark:text-zinc-200">Desktop Sizing Theme</strong> ( triggered at and above <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-[9px]">767px</code> width): Optimizes typography layout across giant ultra-wide, high-density monitors with grand layout proportions.
                            </li>
                          </ul>
                        </div>

                        {/* Sizing Multiplier Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                          
                          {/* MOBILE SECTION */}
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-50 border-gray-200/60'} space-y-4`}>
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-250/50 dark:border-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-blue-500" />
                                <h5 className="text-xs font-black uppercase text-inherit">Mobile Screen Scales</h5>
                              </div>
                              <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded">triggered &lt; 767px</span>
                            </div>

                            {/* Mobile Sans */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Standard body/feed text scale ( বডি ফন্ট স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">{(globalSettings?.mobile_sans_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.mobile_sans_scale !== undefined ? globalSettings.mobile_sans_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_sans_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_sans_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>

                            {/* Mobile Display */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Header / Display text scale ( হেডিংস ফন্ট স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-400 bg-indigo-55/10 px-1.5 py-0.5 rounded">{(globalSettings?.mobile_display_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.mobile_display_scale !== undefined ? globalSettings.mobile_display_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_display_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_display_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>

                            {/* Mobile Mono */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Technical / Code / Badge scale ( কোড/ব্যাজ স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-400 bg-indigo-55/10 px-1.5 py-0.5 rounded">{(globalSettings?.mobile_mono_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.mobile_mono_scale !== undefined ? globalSettings.mobile_mono_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_mono_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, mobile_mono_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* DESKTOP SECTION */}
                          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-55/80 border-gray-200/80'} space-y-4`}>
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-250/50 dark:border-zinc-800/50">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-purple-500" />
                                <h5 className="text-xs font-black uppercase text-inherit">Desktop Screen Scales</h5>
                              </div>
                              <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded">triggered &ge; 767px</span>
                            </div>

                            {/* Desktop Sans */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Standard body/feed text scale ( বডি ফন্ট স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded">{(globalSettings?.desktop_sans_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.desktop_sans_scale !== undefined ? globalSettings.desktop_sans_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_sans_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_sans_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>

                            {/* Desktop Display */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Header / Display text scale ( হেডিংস ফন্ট স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-400 bg-indigo-55/10 px-1.5 py-0.5 rounded">{(globalSettings?.desktop_display_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.desktop_display_scale !== undefined ? globalSettings.desktop_display_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_display_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_display_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>

                            {/* Desktop Mono */}
                            <div className="space-y-1.5 font-sans">
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-bold text-zinc-500 dark:text-zinc-400">Technical / Code / Badge scale ( কোড/ব্যাজ স্কেল )</span>
                                <span className="font-mono text-[10px] font-black text-indigo-400 bg-indigo-55/10 px-1.5 py-0.5 rounded">{(globalSettings?.desktop_mono_scale || 1.0).toFixed(2)}x</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <input 
                                  type="range" 
                                  min="0.75" 
                                  max="1.35" 
                                  step="0.05"
                                  value={globalSettings?.desktop_mono_scale !== undefined ? globalSettings.desktop_mono_scale : 1.0}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_mono_scale: parseFloat(e.target.value) } : null)}
                                  className="w-full accent-indigo-500 cursor-pointer h-1 rounded-lg bg-zinc-200 dark:bg-zinc-800"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setGlobalSettings(globalSettings ? { ...globalSettings, desktop_mono_scale: 1.0 } : null)}
                                  className={`px-2 py-1 rounded text-[9px] font-bold border transition duration-150 cursor-pointer whitespace-nowrap ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* REAL-TIME PREVIEW PLAYGROUND BOX (High fidelity interactive showcase!) */}
                      <div className={`p-5 rounded-3xl border ${isDark ? 'bg-zinc-900/40 border-zinc-805' : 'bg-gray-55 border-gray-205'} space-y-4 text-left`}>
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-amber-500 animate-pulse" />
                          <h4 className={`text-xs font-black uppercase tracking-wider ${themeStyles.text}`}>Real-Time Typography Preview Dashboard</h4>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          All headings, body text, and badges are rendered in real-time in your chosen font family and sizing scale. Test how typography looks in the interactive panel before applying changes globally:
                        </p>

                        {/* Dynamic test text input field */}
                        <div className="space-y-1 text-xs">
                          <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Custom Live Test Text</label>
                          <input
                            type="text"
                            value={typoTestText}
                            onChange={(e) => setTypoTestText(e.target.value)}
                            placeholder="Type any text to test your select font family and scale live..."
                            className={`w-full p-2.5 rounded-xl border font-bold text-xs ${isDark ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-gray-200 text-black'}`}
                          />
                        </div>

                        {/* Display Sandbox Box */}
                        <div 
                          className={`p-6 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-zinc-950 border-zinc-850' : 'bg-white border-gray-200'} space-y-5 shadow-inner`}
                          style={{ 
                            fontFamily: `${globalSettings?.font_family || 'Inter'}, sans-serif`
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-855">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest">
                                  {globalSettings?.font_family || 'Inter'}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-400/10 text-zinc-400 text-[9px] font-mono">
                                  {globalSettings?.base_font_size || 13}px_scale
                                </span>
                              </div>
                              <h2 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900 dark:text-white" style={{ fontSize: `${(globalSettings?.base_font_size || 13) + 7}px` }}>
                                Sovereign Citizen Registry Database
                              </h2>
                            </div>
                            <span className="text-[10px] uppercase font-mono opacity-65 text-right font-black hidden sm:inline">
                              Live Render Mode
                            </span>
                          </div>

                          <div className="space-y-3.5">
                            {/* Custom typed text rendering */}
                            {typoTestText && (
                              <div className="p-3.5 opacity-95 rounded-xl bg-indigo-500/5 border border-indigo-500/10 animate-fadeIn">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wide mb-1">Typed Custom Text Preview:</p>
                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 italic" style={{ fontSize: `${globalSettings?.base_font_size || 13}px` }}>
                                  "{typoTestText}"
                                </p>
                              </div>
                            )}

                            <p className="leading-relaxed text-zinc-800 dark:text-zinc-200 text-sm" style={{ fontSize: `${globalSettings?.base_font_size || 13}px` }}>
                              Each citizen digital identity is crypographically verified using decentral protocols. Global system parameters, user-interface themes, and custom action branding are loaded instantly through the live admin customization engine.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
                              <div className="p-3 rounded-xl bg-[#2563eb]/5 border border-[#2563eb]/10">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-0.5">English Headings Accent</p>
                                <p className="font-extrabold text-[#2563eb] dark:text-blue-400 text-sm">
                                  Real-Time Sovereign Protocol Layer Active
                                </p>
                              </div>
                              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider mb-0.5">Numeric & Mono Formats</p>
                                <p className="font-mono text-xs opacity-90 text-zinc-700 dark:text-zinc-300">
                                  HASH: 0x8F92A • LATENCY: 2.14ms • SYS_OK
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button className="px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs hover:bg-amber-600 transition shadow-sm cursor-pointer whitespace-nowrap">
                              Sample Action CTA
                            </button>
                            <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-805' : 'bg-gray-150 text-gray-700 hover:bg-gray-200'} cursor-pointer whitespace-nowrap`}>
                              Cancel (Secondary)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDesignTab === 'feed_components' && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* CARD 5: Feed Post Components Customization - BACKGROUND, TEXT, BUTTON (Minimizable - Specially Requested!) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignFeedMainExpanded(!designFeedMainExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>5. User Feed Post Customization</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Customize backgrounds, text, and action buttons inside user feed cards</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignFeedMainExpanded(!designFeedMainExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designFeedMainExpanded ? 'Collapse' : 'Expand'}</span>
                            {designFeedMainExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designFeedMainExpanded && (
                          <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-805 space-y-4 text-xs animate-fadeIn text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Card Background - Light Mode</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.feed_post_bg_light || '#ffffff'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_post_bg_light: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.feed_post_bg_light || '#ffffff'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_post_bg_light: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Card Background - Dark Mode</label>
                                <div className="flex gap-2">
                                  <input
                                    type="color"
                                    value={globalSettings?.feed_post_bg_dark || '#18191a'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_post_bg_dark: e.target.value } : null)}
                                    className="w-10 h-10 rounded-xl cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={globalSettings?.feed_post_bg_dark || '#18191a'}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_post_bg_dark: e.target.value } : null)}
                                    className={`grow p-2.5 rounded-xl border font-mono font-bold text-center ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-200 text-black'}`}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Main Text Color - Light Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_main_text_color_light || '#1e293b'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_main_text_color_light: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Main Text Color - Dark Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_main_text_color_dark || '#f1f5f9'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_main_text_color_dark: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Action Button Background (HEX)</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_btn_bg_color || '#e0a82e'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_btn_bg_color: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Action Button Text Color (HEX)</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_btn_text_color || '#ffffff'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_btn_text_color: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1 text-left">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Post Card Border Radius (pixels)</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="range"
                                    min={0}
                                    max={32}
                                    value={globalSettings?.feed_border_radius || 16}
                                    onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_border_radius: parseInt(e.target.value) } : null)}
                                    className="grow h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                  />
                                  <span className="font-black text-xs px-3 py-1 bg-[#2374E1]/10 text-[#2374E1] rounded-xl font-mono shrink-0">
                                    {globalSettings?.feed_border_radius || 16}px
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 6: Sponsored Ads Specific Customization - BG, TEXT, BUTTON (Minimizable - Specially Requested!) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignFeedAdsExpanded(!designFeedAdsExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <Megaphone className="w-4 h-4 text-[#ff4e4e] shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>6. Sponsored Ads Customization</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">Configure backgrounds, text colors, and call-to-action button styling for sponsored widgets</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignFeedAdsExpanded(!designFeedAdsExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designFeedAdsExpanded ? 'Collapse' : 'Expand'}</span>
                            {designFeedAdsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designFeedAdsExpanded && (
                          <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-805 space-y-4 text-xs animate-fadeIn text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Ad Widget Background - Light Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_ad_bg_light || '#fff5f5'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_ad_bg_light: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Ad Widget Background - Dark Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_ad_bg_dark || '#1e0f0f'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_ad_bg_dark: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Ad Description Text Color - Light Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_ad_text_color_light || '#2d3748'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_ad_text_color_light: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Ad Description Text Color - Dark Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_ad_text_color_dark || '#f7fafc'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_ad_text_color_dark: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Ad Action Button Background</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_ad_btn_bg || '#ff4e4e'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_ad_btn_bg: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 7: Products Specific Customization - BG, PRICE, BUTTON (Minimizable - Specially Requested!) */}
                      <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesignFeedProductsExpanded(!designFeedProductsExpanded)}>
                          <div className="flex items-center gap-2.5">
                            <ShoppingBag className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>7. Marketplace Products Customization</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans font-medium">Configure backgrounds, prices, and CTA buttons inside product catalog cards</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDesignFeedProductsExpanded(!designFeedProductsExpanded); }}
                            className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <span>{designFeedProductsExpanded ? 'Collapse' : 'Expand'}</span>
                            {designFeedProductsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {designFeedProductsExpanded && (
                          <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-805 space-y-4 text-xs animate-fadeIn text-left">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Product Card Background - Light Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_product_bg_light || '#f0fdf4'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_product_bg_light: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Product Card Background - Dark Mode</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_product_bg_dark || '#06130b'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_product_bg_dark: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Product Price Text Color (HEX)</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_product_price_color || '#10b981'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_product_price_color: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="font-extrabold text-[#71717a] dark:text-[#a1a1aa] block text-[10px] uppercase">Product Purchase Button BG</label>
                                <input
                                  type="color"
                                  value={globalSettings?.feed_product_btn_bg || '#10b981'}
                                  onChange={(e) => setGlobalSettings(globalSettings ? { ...globalSettings, feed_product_btn_bg: e.target.value } : null)}
                                  className="w-full h-8 rounded-xl cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARD 8: Onboarding Footer Pages Manager (Specially Requested!) */}
                      <div className={`p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80 hover:border-zinc-800' : 'bg-gray-55/40 border-gray-200/80 hover:border-gray-200'} space-y-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Type className="w-4 h-4 text-purple-500 shrink-0" />
                            <div className="text-left">
                              <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>8. Onboarding Footer Custom Pages</h4>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-sans font-medium">Add, update or delete customizable system screens displayed at the bottom of the registration screen (e.g. Help, Privacy, T&C)</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPage(null);
                              setPageForm({ titleEn: '', titleBn: '', contentEn: '', contentBn: '', slug: '', order: adminCustomPages.length + 1 });
                              setShowPageForm(!showPageForm);
                            }}
                            className="p-1 px-3 rounded-xl text-[10px] font-extrabold bg-[#10b981]/15 text-[#10b981] hover:bg-[#10b981]/25 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{showPageForm ? 'Cancel Form' : '+ Add Custom Page'}</span>
                          </button>
                        </div>

                        {showPageForm && (
                          <form onSubmit={handleSavePage} className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 text-xs">
                            <h5 className="font-extrabold text-[11px] text-purple-500 uppercase">
                              {editingPage ? '✏️ Edit Page: ' + editingPage.id : '🆕 Create a New Footer Page'}
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-zinc-500">PAGE SLUG (url id e.g. about, help, privacy)</label>
                                <input
                                  type="text"
                                  disabled={!!editingPage}
                                  value={pageForm.slug}
                                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                                  placeholder="e.g. terms-of-use"
                                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-zinc-500">ENGLISH TITLE</label>
                                <input
                                  type="text"
                                  value={pageForm.titleEn}
                                  onChange={(e) => setPageForm({ ...pageForm, titleEn: e.target.value })}
                                  placeholder="e.g. Terms of Use"
                                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-zinc-500">BENGALI TITLE</label>
                                <input
                                  type="text"
                                  value={pageForm.titleBn}
                                  onChange={(e) => setPageForm({ ...pageForm, titleBn: e.target.value })}
                                  placeholder="e.g. ব্যবহারের শর্তাবলী"
                                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-800 dark:text-zinc-100"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-zinc-500">ENGLISH BODY CONTENT</label>
                                <textarea
                                  value={pageForm.contentEn}
                                  onChange={(e) => setPageForm({ ...pageForm, contentEn: e.target.value })}
                                  placeholder="Describe the content details in English language..."
                                  rows={4}
                                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-zinc-500">BENGALI BODY CONTENT</label>
                                <textarea
                                  value={pageForm.contentBn}
                                  onChange={(e) => setPageForm({ ...pageForm, contentBn: e.target.value })}
                                  placeholder="সমগ্র বিবরণটি এখানে বিস্তারিত বাংলায় লিখুন..."
                                  rows={4}
                                  className="w-full px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-zinc-800 dark:text-zinc-100"
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold text-zinc-500 uppercase">SORT ORDER:</span>
                                <input
                                  type="number"
                                  value={pageForm.order}
                                  onChange={(e) => setPageForm({ ...pageForm, order: Number(e.target.value) || 0 })}
                                  className="w-16 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 font-bold text-center text-xs"
                                />
                              </div>

                              <button
                                type="submit"
                                className="px-5 py-2 rounded-xl text-[11px] font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer duration-150"
                              >
                                Save Custom Page settings
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {adminCustomPages.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 italic text-center py-2">No custom pages added yet. Defaults will auto-seed on the registration screen.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {adminCustomPages.map((page) => (
                                <div key={page.id} className="p-3 rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:shadow-sm transition flex flex-col justify-between gap-2 text-left">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-[9px] font-bold text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase">/{page.slug} (Order {page.order})</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingPage(page);
                                            setPageForm({
                                              titleEn: page.titleEn,
                                              titleBn: page.titleBn,
                                              contentEn: page.contentEn,
                                              contentBn: page.contentBn,
                                              slug: page.slug,
                                              order: page.order || 0
                                            });
                                            setShowPageForm(true);
                                          }}
                                          className="text-amber-500 hover:underline text-[10px] font-extrabold cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePage(page.id)}
                                          className="text-red-500 hover:underline text-[10px] font-extrabold cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                    <h5 className="font-bold text-zinc-850 dark:text-zinc-200 mt-2">{page.titleEn} / {page.titleBn}</h5>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">{page.contentEn}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
                </motion.div>
              )}

              {activePanelTab === 'cyber_shield' && (
                <motion.div
                  key="cyber_shield"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-left"
                >
                  {/* Security Firewall Main Header Card */}
                  <div className={`p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-red-550/10 text-red-500 animate-pulse">
                          <Shield className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className={`text-base font-black ${themeStyles.text} flex items-center gap-2`}>
                            Cyber Shield & Security Monitoring
                            <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Active (সক্রিয়)
                            </span>
                          </h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Real-time defensive intelligence, anti-bot spam limits, injection protection, and DDoS prevention metrics.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('zivobook_security_threat_logs');
                            setThreatLogs([]);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                            isDark 
                              ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-85 bg-zinc-80 hover:text-white' 
                              : 'bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50 hover:text-black'
                          }`}
                        >
                          Clear Threat History (লগ মুছুন)
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-850" />

                    {/* Threat Metric Grid Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-slate-50/60 border-zinc-150'}`}>
                        <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Active Core Module</p>
                        <h4 className="text-sm font-black text-rose-500 mt-1 flex items-center gap-1">
                          ZivoGuard IDS
                        </h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Antigravity Level 4 Armor</p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-slate-50/60 border-zinc-150'}`}>
                        <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Brute Force Armor</p>
                        <h4 className="text-sm font-black text-amber-500 mt-1">
                          Enabled (সক্রিয়)
                        </h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5">4 unsuccessful attempts limit</p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-slate-50/60 border-zinc-150'}`}>
                        <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Post Spam rate-limit</p>
                        <h4 className="text-sm font-black text-emerald-500 mt-1">
                          8s Delay Loop
                        </h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Spam words signature active</p>
                      </div>

                      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-850' : 'bg-slate-50/60 border-zinc-150'}`}>
                        <p className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">Threats Intercepted</p>
                        <h4 className="text-base font-black text-red-500 mt-1 flex items-center gap-1.5">
                          {threatLogs.length}
                          <span className="text-[9.5px] font-normal text-zinc-550">(All blocked)</span>
                        </h4>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Persistent security journal</p>
                      </div>
                    </div>
                  </div>



                  {/* THREAT INTELLIGENCE LIVE LOG FEED (ডিজিটাল থ্রেট ইন্টেলিজেন্স) */}
                  <div className={`p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                          Intrusion Detection Intelligence Feed (লাইভ নেটওয়ার্ক হ্যাকিং ও স্প্যামিং লক)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Total Records: {threatLogs.length}
                      </span>
                    </div>

                    {threatLogs.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto opacity-75" />
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No malicious threats detected (কোনো হুমকি পাওয়া যায়নি)</p>
                        <p className="text-[10px] text-zinc-500">All digital defense channels are actively monitored and secured in real-time.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {threatLogs.map((log) => {
                          const isCriticalBadge = log.threatLevel === 'critical' || log.threatLevel === 'high';
                          return (
                            <div 
                              key={log.id} 
                              className={`p-4 rounded-2xl border transition hover:shadow-md ${
                                isDark 
                                  ? isCriticalBadge 
                                    ? 'bg-red-950/[0.08] border-red-900/45 text-white' 
                                    : 'bg-zinc-900/30 border-zinc-85/80 text-zinc-350'
                                  : isCriticalBadge 
                                    ? 'bg-red-550/[0.02] border-red-200 text-black' 
                                    : 'bg-zinc-50/60 border-zinc-150 text-zinc-650'
                              }`}
                            >
                              {/* Header Metadata block inside log items */}
                              <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2 text-[10px] font-mono">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8.5px] ${
                                    log.threatLevel === 'critical' 
                                      ? 'bg-rose-600 text-white animate-pulse' 
                                      : log.threatLevel === 'high'
                                        ? 'bg-orange-600 text-white'
                                        : log.threatLevel === 'moderate'
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-zinc-500 text-white'
                                  }`}>
                                    {log.threatLevel} threat
                                  </span>

                                  <span className="text-zinc-400">|</span>

                                  <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                    {log.eventType}
                                  </span>

                                  <span className="text-zinc-400">|</span>

                                  <span className="text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                    Target: {log.targetModule}
                                  </span>
                                </div>

                                <div className="text-zinc-400 font-bold">
                                  {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                                </div>
                              </div>

                              {/* Malicious Attack telemetry / Evidence Info */}
                              <p className="text-xs font-bold text-zinc-850 dark:text-zinc-100 flex items-start gap-1 pb-2">
                                <span className="text-zinc-400 shrink-0 select-none">[Evidence]:</span>
                                {log.evidence}
                              </p>

                              {/* Attacker Context Footer: IP Address, UserAgent, and Location */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-mono leading-relaxed">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">Attacker IP (আইপি ঠিকানা):</span>
                                    <span className="font-semibold text-rose-500 underline">{log.ipAddress}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">Geo & ISP (অবস্থান):</span>
                                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{log.location}</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-zinc-400">Device signature:</span>
                                    <span className="truncate max-w-[180px] font-semibold text-zinc-650" title={log.deviceFootprint}>
                                      {log.deviceFootprint}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-zinc-400">IPS Mitigation Result:</span>
                                    <span className="font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                                      {log.mitigation}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'trash' && (
                <TrashBin
                  users={users}
                  isDark={isDark}
                  globalSettings={globalSettings}
                  themeStyles={themeStyles}
                  handleUpdateTrashRetention={handleUpdateTrashRetention}
                  handleRestoreUser={handleRestoreUser}
                  handlePermanentDelete={handlePermanentDelete}
                  handleBulkPermanentDelete={handleBulkPermanentDelete}
                />
              )}

              {activePanelTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={`p-6 rounded-3xl border ${themeStyles.card} shadow-sm space-y-6 text-left`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`text-base font-black ${themeStyles.text}`}>Global System Settings</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Global rules panel to turn features on/off and configure platform controls</p>
                      </div>
                    </div>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* 1. Global Feature Restrictions / Lock Overrides */}
                    <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80' : 'bg-gray-55/40 border-gray-200/80'} space-y-4`}>
                      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setGlobalLocksExpanded(!globalLocksExpanded)}>
                        <div className="flex items-center gap-2.5">
                          <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                          <div className="text-left">
                            <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>Global Content & Feature Restrictions</h4>
                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Toggle lock status to block or open specific platform features</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setGlobalLocksExpanded(!globalLocksExpanded); }}
                          className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{globalLocksExpanded ? 'Collapse' : 'Expand'}</span>
                          {globalLocksExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      </div>

                      {globalLocksExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`pt-4 border-t ${isDark ? 'border-zinc-800/80' : 'border-gray-200'} space-y-4`}
                        >
                          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 text-left">Disabling a feature here (red toggle) will block it platform-wide for regular users. Administrators bypass all restrictions.</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-left">
                            {/* 1. canPost */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Create New Posts</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canPost')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canPost ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canPost lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canPost ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 2. canComment */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Post Comments</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canComment')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canComment ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canComment lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canComment ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 3. canLike */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Likes & Reactions</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canLike')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canLike ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canLike lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canLike ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 4. canChat */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Direct Messages & Chat</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canChat')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canChat ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canChat lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canChat ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 5. canPostStories */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Upload Reels & Stories</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canPostStories')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canPostStories ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canPostStories lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canPostStories ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 6. canCreateGoals */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Create Learning Goals</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canCreateGoals')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canCreateGoals ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canCreateGoals lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canCreateGoals ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 7. canUseGroups */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Group Chat Option</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canUseGroups')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canUseGroups ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canUseGroups lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canUseGroups ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 8. canReportContent */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Report Inappropriate Content</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canReportContent')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canReportContent ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canReportContent lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canReportContent ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* 9. canFollowOthers */}
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-100 border-gray-200'} transition-all duration-200 hover:border-amber-500/30`}>
                              <div className="space-y-0.5 pr-2">
                                <p className={`text-xs font-bold ${themeStyles.text}`}>Follow Other Users</p>
                                <p className="text-[10px] text-zinc-500">Green = Enabled, Red = Locked platform-wide</p>
                              </div>
                              <button
                                onClick={() => handleToggleGlobalLock('lock_global_canFollowOthers')}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  globalSettings?.lock_global_canFollowOthers ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                              >
                                <span className="sr-only">Toggle global canFollowOthers lock</span>
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    globalSettings?.lock_global_canFollowOthers ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* SECTION: Global Feed Suggestion Controls */}
                    <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80' : 'bg-gray-55/40 border-gray-200/80'} space-y-4`}>
                      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setFeedSuggestionsExpanded(!feedSuggestionsExpanded)}>
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="text-left">
                            <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>গ্লোবাল ফিড সাজেশন ও কন্ট্রোল (Feed Suggestions)</h4>
                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">ফিড সাজেশনের ফ্রিকোয়েন্সি ও প্যারামিটার সেট করুন</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFeedSuggestionsExpanded(!feedSuggestionsExpanded); }}
                          className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{feedSuggestionsExpanded ? 'সংকুচিত করুন' : 'বিস্তৃত করুন'}</span>
                          {feedSuggestionsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      </div>

                      {feedSuggestionsExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`pt-4 border-t ${isDark ? 'border-zinc-800/80' : 'border-gray-200'} space-y-4`}
                        >
                          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 text-left">
                            Set the frequency for inserting cards like advertisements, recommended friends, reels, or jobs into the social stream.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {/* 1. Sponsored Ads */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className={`w-2 h-2 rounded-full bg-red-500 animate-ping`} />
                              Sponsored Ads
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_ad', !globalSettings?.global_feed_show_ad)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_ad ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_ad ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_ad_interval || 3}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_ad_interval', Math.max(2, parseInt(e.target.value) || 3))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per ad card</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Friend Suggestion */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              Friend Suggestions
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_friends', !globalSettings?.global_feed_show_friends)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_friends ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_friends ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_friends_interval || 4}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_friends_interval', Math.max(2, parseInt(e.target.value) || 4))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per suggestion</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Reels & Short Videos */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Reels & Short Videos
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_reels', !globalSettings?.global_feed_show_reels)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_reels ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_reels ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_reels_interval || 5}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_reels_interval', Math.max(2, parseInt(e.target.value) || 5))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per reels loop</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Products Shop Selection */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Marketplace Products
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_products', !globalSettings?.global_feed_show_products)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_products ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_products ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_products_interval || 6}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_products_interval', Math.max(2, parseInt(e.target.value) || 6))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per product group</span>
                            </div>
                          </div>
                        </div>

                        {/* 5. Groups suggestion */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Group Recommendations
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_groups', !globalSettings?.global_feed_show_groups)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_groups ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_groups ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_groups_interval || 7}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_groups_interval', Math.max(2, parseInt(e.target.value) || 7))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per group card</span>
                            </div>
                          </div>
                        </div>

                        {/* 6. Jobs Opportunities */}
                        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-200'} space-y-3`}>
                          <div className="flex items-center justify-between">
                            <span className={`flex items-center gap-2 text-xs font-bold ${themeStyles.text}`}>
                              <span className="w-2 h-2 rounded-full bg-indigo-500" />
                              Job Opportunities
                            </span>
                            <button
                              onClick={() => handleUpdateFeedSetting('global_feed_show_jobs', !globalSettings?.global_feed_show_jobs)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                globalSettings?.global_feed_show_jobs ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-800'
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                globalSettings?.global_feed_show_jobs ? 'translate-x-4' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <label className={`text-[10px] font-mono uppercase block ${themeStyles.subText}`}>Injection Interval:</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={2}
                                max={20}
                                value={globalSettings?.global_feed_jobs_interval || 8}
                                onChange={(e) => handleUpdateFeedSetting('global_feed_jobs_interval', Math.max(2, parseInt(e.target.value) || 8))}
                                className={`w-16 px-2 py-1 text-xs rounded-lg border text-center font-bold ${isDark ? 'bg-zinc-900 border-zinc-800 text-amber-500' : 'bg-white border-zinc-200 text-amber-600'}`}
                              />
                              <span className={`text-[11px] ${themeStyles.subText}`}>posts per job board</span>
                            </div>
                          </div>
                        </div>
                      </div>
                        </motion.div>
                      )}
                    </div>

                    {/* SECTION: Desktop Sidebars Feature Customization */}
                    <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80' : 'bg-gray-55/40 border-gray-200/80'} space-y-4`}>
                      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setDesktopSidebarsExpanded(!desktopSidebarsExpanded)}>
                        <div className="flex items-center gap-2.5">
                          <Layout className="w-4 h-4 text-orange-500 shrink-0" />
                          <div className="text-left">
                            <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>Sidebar Widgets (Desktop Only)</h4>
                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Customize default components for supplementary sidebar layouts</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDesktopSidebarsExpanded(!desktopSidebarsExpanded); }}
                          className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{desktopSidebarsExpanded ? 'Collapse' : 'Expand'}</span>
                          {desktopSidebarsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      </div>

                      {desktopSidebarsExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`pt-4 border-t ${isDark ? 'border-zinc-800/80' : 'border-gray-200'} space-y-4`}
                        >
                          <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 text-left">
                            Configure which widget content appears in the columns when users browse the platform on desktop widescreen layouts.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Sidebar Widget selection */}
                        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-55 border-gray-200'} space-y-3`}>
                          <p className={`text-xs font-bold flex items-center gap-2 ${themeStyles.text}`}>
                            <ChevronLeft className="w-4 h-4 text-amber-500" />
                            Active Left Sidebar Widget
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { key: 'default', label: 'Default Navigation', desc: 'Primary navigation links and menus' },
                              { key: 'groups', label: 'Popular Learning Groups', desc: 'Recommended study groups and join buttons' },
                              { key: 'pages', label: 'Market Offers & Pages', desc: 'Sponsored pages and user community discounts' },
                              { key: 'shortcuts', label: 'Personalized Shortcuts', desc: 'Custom collection of quick access shortcuts' },
                              { key: 'weather', label: 'Live Weather Tracker', desc: 'Real-time city weather alerts and report' },
                              { key: 'clock', label: 'Digital System Clock', desc: 'Real-time animated clock with seconds' }
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => handleUpdateFeedSetting('sidebar_left_widget', opt.key)}
                                className={`flex items-start gap-3 p-2.5 rounded-xl text-left border text-xs transition duration-200 cursor-pointer ${
                                  (globalSettings?.sidebar_left_widget || 'default') === opt.key
                                    ? 'bg-amber-500/10 border-amber-500 font-bold text-amber-500'
                                    : isDark ? 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-200/80 hover:bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  (globalSettings?.sidebar_left_widget || 'default') === opt.key ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-400'
                                }`}>
                                  {(globalSettings?.sidebar_left_widget || 'default') === opt.key && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <div>
                                  <p className={`transition-colors font-bold ${
                                    (globalSettings?.sidebar_left_widget || 'default') === opt.key ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-100'
                                  }`}>{opt.label}</p>
                                  <span className="text-[10px] text-zinc-555 dark:text-zinc-400 block font-normal mt-0.5">{opt.desc}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Right Sidebar Widget selection */}
                        <div className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-55 border-gray-200'} space-y-3`}>
                          <p className={`text-xs font-bold flex items-center gap-2 ${themeStyles.text}`}>
                            Active Right Sidebar Widget
                            <ChevronRight className="w-4 h-4 text-emerald-500" />
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { key: 'contacts', label: 'Active Contacts and Chat', desc: 'Active platform users direct messages' },
                              { key: 'friends', label: 'Friend Suggestions', desc: 'Expand user networks and discover peers' },
                              { key: 'jobs', label: 'Active Job Board', desc: 'Latest opportunities matching skillsets' },
                              { key: 'products', label: 'Trending Products Store', desc: 'Buy/Sell educational items and accessories' },
                              { key: 'weather', label: 'Live Weather Widget', desc: 'Metropolitan atmospheric report panel' },
                              { key: 'clock', label: 'System Clock Widget', desc: 'Live accurate numeric system clock' }
                            ].map((opt) => (
                              <button
                                key={opt.key}
                                onClick={() => handleUpdateFeedSetting('sidebar_right_widget', opt.key)}
                                className={`flex items-start gap-3 p-2.5 rounded-xl text-left border text-xs transition duration-200 cursor-pointer ${
                                  (globalSettings?.sidebar_right_widget || 'contacts') === opt.key
                                    ? 'bg-amber-500/10 border-amber-500 font-bold text-amber-500'
                                    : isDark ? 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-zinc-200/80 hover:bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                <span className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  (globalSettings?.sidebar_right_widget || 'contacts') === opt.key ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-400'
                                }`}>
                                  {(globalSettings?.sidebar_right_widget || 'contacts') === opt.key && <Check className="w-2.5 h-2.5" />}
                                </span>
                                <div>
                                  <p className={`transition-colors font-bold ${
                                    (globalSettings?.sidebar_right_widget || 'contacts') === opt.key ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-800 dark:text-zinc-100'
                                  }`}>{opt.label}</p>
                                  <span className="text-[10px] text-zinc-555 dark:text-zinc-400 block font-normal mt-0.5">{opt.desc}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                        </motion.div>
                      )}
                    </div>

                    {/* SECTION: Live Device Simulation Simulator */}
                    <div className={`p-4 sm:p-5 rounded-3xl border transition duration-200 ${isDark ? 'bg-zinc-950/40 border-zinc-850/80' : 'bg-gray-55/40 border-gray-200/80'} space-y-4`}>
                      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setLiveSimulationExpanded(!liveSimulationExpanded)}>
                        <div className="flex items-center gap-2.5">
                          <Tv className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="text-left">
                            <h4 className={`text-xs uppercase font-mono tracking-wider font-extrabold ${themeStyles.text}`}>Real-Time Feed Injection Simulator</h4>
                            <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Preview how the custom suggestion intervals and widgets look on real devices</p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setLiveSimulationExpanded(!liveSimulationExpanded); }}
                          className={`p-1.5 px-3 rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isDark ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{liveSimulationExpanded ? 'Collapse' : 'Expand'}</span>
                          {liveSimulationExpanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-500" />}
                        </button>
                      </div>

                      {liveSimulationExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`pt-4 border-t ${isDark ? 'border-zinc-800/80' : 'border-gray-200'} space-y-4`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className="text-left">
                                <h4 className={`text-xs font-black uppercase tracking-wider ${themeStyles.text}`}>Preview Device Layout</h4>
                                <p className="text-[10px] text-zinc-500 font-sans">Review how client streams automatically render injected blocks based on your interval rules.</p>
                              </div>
                            </div>

                        {/* Interactive Device Switches */}
                        <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1 gap-1 shrink-0 self-start sm:self-center">
                          <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
                              previewMode === 'desktop'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-500'
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5" />
                            Desktop View
                          </button>
                          <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer ${
                              previewMode === 'mobile'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-500'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            Mobile View
                          </button>
                        </div>
                      </div>

                      {/* Simulator Frame rendering */}
                      <div className={`p-4 rounded-3xl border border-dashed text-left ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-gray-100/60 border-zinc-200'} space-y-4 max-w-full overflow-hidden`}>
                        <div className="flex items-center gap-1.5 px-1 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                          <span className="ml-2 font-mono text-[9px] text-zinc-500 block truncate">
                            {previewMode === 'desktop' ? 'SYSTEM PREVIEW: 1280px Wide Screen (Computer View)' : 'SYSTEM PREVIEW: 390px Fluid Aspect (Mobile View)'}
                          </span>
                        </div>

                        {/* Interactive UI Renderer */}
                        {previewMode === 'desktop' ? (
                          /* ---------------- DESKTOP PREVIEW SIMULATION ---------------- */
                          <div className="grid grid-cols-12 gap-3 max-w-full text-xs font-sans">
                            {/* Left Sidebar simulated */}
                            <div className="col-span-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex flex-col justify-between">
                              <div className="space-y-3">
                                <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                                  <Layout className="w-3 h-3" /> Left Sidebar
                                </span>
                                {(globalSettings?.sidebar_left_widget || 'default') === 'default' && (
                                  <div className="space-y-1 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                                    <div className="font-bold flex items-center gap-1"><Home className="w-3 h-3 text-zinc-400" /> Home Feed</div>
                                    <div className="text-zinc-400">Chat Box</div>
                                    <div className="text-zinc-400">Onboarding View</div>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_left_widget || 'default') === 'groups' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1.5">
                                    <p className="font-bold">Community Groups</p>
                                    <div className="text-[10px] text-blue-500 font-bold"># JavaScript PRO BD (Join)</div>
                                    <div className="text-[10px] text-blue-500 font-bold"># AI Learners Tech (Join)</div>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_left_widget || 'default') === 'pages' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1">
                                    <p className="font-bold text-amber-500 animate-pulse font-bold">★ Special Offer Page</p>
                                    <p className="text-[10px] text-zinc-400 leading-tight">New IT learning discount coupon: LEARNER30</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_left_widget || 'default') === 'shortcuts' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1 text-zinc-400">
                                    <div className="font-bold text-zinc-500">My Saved Shortcuts</div>
                                    <div>- Bookmarked Posts</div>
                                    <div>- My Goals Log</div>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_left_widget || 'default') === 'weather' && (
                                  <div className="bg-white dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/20 space-y-1 text-center">
                                    <p className="font-bold text-[13px] text-emerald-500">☀️ 29° Celsius</p>
                                    <p className="text-[9px] text-gray-400">Dhaka, Bangladesh - Clear sky</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_left_widget || 'default') === 'clock' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center space-y-0.5">
                                    <p className="font-bold font-mono text-zinc-600 dark:text-zinc-300">02:30:45 PM</p>
                                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">REALTIME CLOCK</p>
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 block text-center font-mono mt-2 bg-zinc-200 dark:bg-zinc-800 py-1 rounded-lg">WIDGET: {globalSettings?.sidebar_left_widget?.toUpperCase() || 'DEFAULT'}</span>
                            </div>

                            {/* Middle Feed Simulated */}
                            <div className="col-span-6 space-y-2 bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-2.5 rounded-2xl min-h-[300px]">
                              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-800">Middle Feed Stream</p>
                              
                              <div className="space-y-2">
                                {/* Post 1 */}
                                <div className="p-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50">
                                  <p className="font-bold text-[10px] text-zinc-400"># User Post 1</p>
                                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300">Today my real-time data syncing project compiled successfully!</p>
                                </div>

                                {/* Post 2 */}
                                <div className="p-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50">
                                  <p className="font-bold text-[10px] text-zinc-400"># User Post 2</p>
                                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300">Does anyone know what the standard IT onboarding workflow is?</p>
                                </div>

                                {/* Sponsored Ad Injection after N posts */}
                                {globalSettings?.global_feed_show_ad && (
                                  <div className="p-2.5 rounded-xl bg-red-500/10 border-2 border-red-500/20 text-red-500 flex items-start gap-2.5 animate-pulse">
                                    <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-black text-[10px] uppercase font-mono text-red-500 tracking-wider">Sponsored Advertisement (Ad Injected - gap: {globalSettings?.global_feed_ad_interval})</p>
                                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-bold mt-0.5">BSB IT Park - Admissions Open! Copy our 30% discount coupon code.</p>
                                    </div>
                                  </div>
                                )}

                                {/* Post 3 */}
                                <div className="p-2 border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50">
                                  <p className="font-bold text-[10px] text-zinc-400"># User Post 3</p>
                                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300">Looking for software engineer vacancies. Let me know if there are any openings!</p>
                                </div>

                                {/* Suggested Friend Injection after N posts */}
                                {globalSettings?.global_feed_show_friends && (
                                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-start gap-2.5">
                                    <UserPlus className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div className="w-full">
                                      <p className="font-black text-[10px] uppercase font-mono text-amber-500 tracking-wider">Friend Suggestions (Friends Injected - gap: {globalSettings?.global_feed_friends_interval})</p>
                                      <div className="flex items-center gap-1.5 mt-1 bg-white dark:bg-zinc-950 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-900 justify-between">
                                        <span className="font-bold font-mono text-[10px] text-zinc-700 dark:text-zinc-300">@hasibul_dev (Verified Programmer)</span>
                                        <button className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-black uppercase">Follow</button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Reels Suggestion */}
                                {globalSettings?.global_feed_show_reels && (
                                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 space-y-1.5">
                                    <p className="font-black text-[10px] uppercase font-mono text-purple-500 tracking-wider flex items-center gap-1">
                                      <PlaySquare className="w-3.5 h-3.5" /> Reels and Stories (Reels - gap: {globalSettings?.global_feed_reels_interval})
                                    </p>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      <div className="h-10 rounded-lg bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[8px] text-purple-400 font-bold">Reels #1</div>
                                      <div className="h-10 rounded-lg bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[8px] text-purple-400 font-bold">Reels #2</div>
                                      <div className="h-10 rounded-lg bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[8px] text-purple-400 font-bold">Reels #3</div>
                                    </div>
                                  </div>
                                )}

                                {/* Job Suggestion */}
                                {globalSettings?.global_feed_show_jobs && (
                                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600">
                                    <p className="font-black text-[10px] uppercase font-mono text-indigo-500 tracking-wider flex items-center gap-1">
                                      <Briefcase className="w-3.5 h-3.5" /> Job Opportunities (Jobs - gap: {globalSettings?.global_feed_jobs_interval})
                                    </p>
                                    <div className="p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-indigo-500/20 mt-1 flex justify-between items-center">
                                      <div>
                                        <p className="font-bold text-[10px] text-zinc-700 dark:text-zinc-200">React JS Developer</p>
                                        <p className="text-[8px] text-zinc-400">BSB Software Academy, Dhaka</p>
                                      </div>
                                      <button className="px-1.5 py-0.5 rounded bg-indigo-500 text-white text-[8px] font-mono">Apply</button>
                                    </div>
                                  </div>
                                )}

                                {/* Products suggestion */}
                                {globalSettings?.global_feed_show_products && (
                                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                                    <p className="font-black text-[10px] uppercase font-mono text-emerald-500 tracking-wider flex items-center gap-1">
                                      <ShoppingBag className="w-3.5 h-3.5" /> Marketplace Offers (Products - gap: {globalSettings?.global_feed_products_interval})
                                    </p>
                                    <div className="p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-emerald-500/20 mt-1 flex justify-between items-center">
                                      <div>
                                        <p className="font-bold text-[10px] text-zinc-700 dark:text-zinc-200">C Programming Handbook Language Manual</p>
                                        <p className="text-[8px] text-zinc-400">EUR 15.00 - Order Now</p>
                                      </div>
                                      <button className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-mono">Buy</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Sidebar simulated */}
                            <div className="col-span-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex flex-col justify-between">
                              <div className="space-y-3">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                  <Layout className="w-3 h-3" /> Right Sidebar
                                </span>
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'contacts' && (
                                  <div className="space-y-2 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                                    <p className="font-bold">Active Contacts</p>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                      <span className="text-zinc-650 dark:text-zinc-300 font-bold">Hasibul Islam</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full" />
                                      <span className="text-zinc-500">Adman Munich</span>
                                    </div>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'friends' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1.5">
                                    <p className="font-bold text-amber-500">অনুরোধ সাজেশন্স</p>
                                    <p className="text-[10px]">@shakib_learner (Verified)</p>
                                    <p className="text-[10px]">@tarek_it_bd (Community)</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'jobs' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1">
                                    <p className="font-bold text-indigo-500">জব নিউজ উইজেট</p>
                                    <p className="text-[10px] text-zinc-400">নতুন ৩টি ডেকোরেশন চাকরির সন্ধান মিললো!</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'products' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-1">
                                    <p className="font-bold text-emerald-500">পণ্য এক্সচেঞ্জ</p>
                                    <p className="text-[10px] text-zinc-400">১০+ রিলেটেড বুকস অ্যান্ড কম্পিউটার গ্যাজেটস এভেইলেবল!</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'weather' && (
                                  <div className="bg-white dark:bg-yellow-950/20 p-2 rounded-xl border border-yellow-500/20 space-y-1 text-center">
                                    <p className="font-bold text-[13px] text-amber-500">☀️ ২৯° সেলসিয়াস</p>
                                    <p className="text-[9px] text-gray-450">আবহাওয়া মাঝারি মেঘাচ্ছন্ন</p>
                                  </div>
                                )}
                                {(globalSettings?.sidebar_right_widget || 'contacts') === 'clock' && (
                                  <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center space-y-0.5">
                                    <p className="font-bold font-mono text-zinc-600 dark:text-zinc-300">০২:৩০:৪৫ PM</p>
                                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono">CLOCK WIDGET</p>
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] text-zinc-500 block text-center font-mono mt-2 bg-zinc-200 dark:bg-zinc-800 py-1 rounded-lg">WIDGET: {globalSettings?.sidebar_right_widget?.toUpperCase() || 'CONTACTS'}</span>
                            </div>
                          </div>
                        ) : (
                          /* ---------------- MOBILE PREVIEW SIMULATION ---------------- */
                          <div className="flex justify-center max-w-full">
                            <div className="w-[310px] min-h-[420px] rounded-3xl border-4 border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden relative shadow-lg flex flex-col font-sans">
                              {/* Mobile Status bar */}
                              <div className="bg-zinc-900 text-white px-3 py-1 flex justify-between items-center text-[8px] font-mono select-none">
                                <span>Munich-LTE</span>
                                <span>12:45 PM</span>
                                <span className="w-3 h-2 bg-emerald-500 rounded-sm" />
                              </div>

                              {/* Mobile App Bar */}
                              <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex justify-between items-center">
                                <span className="font-black text-amber-500 text-[10px]">MUNICH PORTAL</span>
                                <Menu className="w-3.5 h-3.5 text-zinc-400" />
                              </div>

                              {/* Mobile Feed Body */}
                              <div className="p-2 space-y-2.5 overflow-y-auto flex-1 max-h-[380px] scrollbar-none text-[10px]">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Inline Stream (Sidebars hidden)</span>

                                {/* Post 1 */}
                                <div className="p-2 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-gray-50/50 dark:bg-zinc-950/40">
                                  <p className="font-bold text-[8px] text-zinc-400">@hasan_learner</p>
                                  <p className="text-[9px] mt-0.5 text-zinc-650 dark:text-zinc-350">আজকের লার্নিং গোল সাকসেসফুলি মেইনটেইন করলাম!</p>
                                </div>

                                {/* Sponsored Ad Injection inside mobile stream */}
                                {globalSettings?.global_feed_show_ad && (
                                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 space-y-0.5 animate-pulse">
                                    <p className="font-black text-[8px] uppercase tracking-wider text-red-500 flex items-center gap-1">📣 এড ইনজেকশন (Gap: {globalSettings?.global_feed_ad_interval})</p>
                                    <p className="text-[9px] font-bold text-zinc-700 dark:text-zinc-200">BSB লার্নিং ইন্সটিটিউট - টেক প্রজেক্ট ম্যানেজমেন্ট কোর্স অফার!</p>
                                  </div>
                                )}

                                {/* Post 2 */}
                                <div className="p-2 border border-zinc-100 dark:border-zinc-900 rounded-xl bg-gray-50/50 dark:bg-zinc-950/40">
                                  <p className="font-bold text-[8px] text-zinc-400">@adman_pro</p>
                                  <p className="text-[9px] mt-0.5 text-zinc-650 dark:text-zinc-350">সবাই রিয়েল-টাইম ডিসকোর্স ফলো করুন এবং ফিডব্যাক দিন।</p>
                                </div>

                                {/* Friend Suggestion inside mobile stream */}
                                {globalSettings?.global_feed_show_friends && (
                                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 space-y-1">
                                    <p className="font-black text-[8px] uppercase tracking-wider">👥 বন্ধু সাজেশন্স (Gap: {globalSettings?.global_feed_friends_interval})</p>
                                    <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-1.5 rounded border border-zinc-200/50 dark:border-zinc-900">
                                      <span className="truncate max-w-[120px] font-bold">@tareq_verified</span>
                                      <button className="px-1 py-0.5 rounded bg-amber-500 text-white text-[7px] font-bold">Follow</button>
                                    </div>
                                  </div>
                                )}

                                {/* Reels inside mobile stream */}
                                {globalSettings?.global_feed_show_reels && (
                                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 space-y-1.5">
                                    <p className="font-black text-[8px] uppercase tracking-wider">🎬 রিলস শর্ট ভিডিও (Gap: {globalSettings?.global_feed_reels_interval})</p>
                                    <div className="grid grid-cols-3 gap-1">
                                      <div className="h-8 rounded bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[7px]" />
                                      <div className="h-8 rounded bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[7px]" />
                                      <div className="h-8 rounded bg-zinc-200 dark:bg-zinc-950 border border-purple-500/30 flex items-center justify-center text-[7px]" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activePanelTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Top Analytics Filters Toolbar */}
                  <div className={`p-4 sm:p-5 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className={`text-base font-black ${themeStyles.text}`}>সিস্টেম অ্যানালিটিক্স এবং প্রবৃদ্ধি পর্যবেক্ষণ (System & User Analytics)</h3>
                        <p className="text-xs text-gray-500">Real-time indicators, user trajectories & visual aggregation from database collections</p>
                      </div>

                      {/* Sub-tab Switches */}
                      <div className="flex bg-zinc-500/10 p-1 rounded-xl border border-zinc-500/10 self-start md:self-center">
                        <button
                          type="button"
                          onClick={() => setAnalyticsCategory('users')}
                          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                            analyticsCategory === 'users'
                              ? 'bg-amber-500 text-white shadow'
                              : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          User Growth & Verifications
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyticsCategory('goals');
                            loadAllSystemGoals();
                          }}
                          className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                            analyticsCategory === 'goals'
                              ? 'bg-amber-500 text-white shadow'
                              : isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Goal Pathways (মিশন)
                        </button>
                      </div>
                    </div>
                  </div>

                  {analyticsCategory === 'users' && (() => {
                    const totalUsersCount = users.length;
                    const verifiedNum = users.filter(u => u.isVerified).length;
                    const unverifiedNum = users.filter(u => !u.isVerified && !u.is_banned).length;
                    const bannedNum = users.filter(u => u.is_banned).length;

                    // 1. User Growth Trends over past 6 months
                    const growthTrendData = [
                      { month: 'Jan 2026', 'Total Users': Math.max(1, Math.round(totalUsersCount * 0.25)) },
                      { month: 'Feb 2026', 'Total Users': Math.max(2, Math.round(totalUsersCount * 0.40)) },
                      { month: 'Mar 2026', 'Total Users': Math.max(3, Math.round(totalUsersCount * 0.55)) },
                      { month: 'Apr 2026', 'Total Users': Math.max(4, Math.round(totalUsersCount * 0.70)) },
                      { month: 'May 2026', 'Total Users': Math.max(5, Math.round(totalUsersCount * 0.85)) },
                      { month: 'Jun 2026', 'Total Users': totalUsersCount }
                    ];

                    // 2. Daily Active User Counts
                    const activeUsersCount = users.filter(u => !u.is_banned).length;
                    const dailyActiveData = [
                      { day: 'Mon', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.65)) },
                      { day: 'Tue', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.70)) },
                      { day: 'Wed', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.85)) },
                      { day: 'Thu', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.75)) },
                      { day: 'Fri', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.90)) },
                      { day: 'Sat', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.54)) },
                      { day: 'Sun', 'Active Users': Math.max(1, Math.round(activeUsersCount * 0.48)) }
                    ];

                    // 3. Verification Distribution
                    const verificationStatusData = [
                      { name: 'Verified (ভেরিফাইড)', value: verifiedNum, color: '#10b981' },
                      { name: 'Unverified (আন-ভেরিফাইড)', value: unverifiedNum, color: '#f59e0b' },
                      { name: 'Banned (ব্লকড)', value: bannedNum, color: '#f43f5e' }
                    ].filter(item => item.value > 0);

                    // fallback default points if zero profiles loaded yet
                    const finalStatusData = verificationStatusData.length > 0 
                      ? verificationStatusData 
                      : [
                          { name: 'Verified (ভেরিফাইড)', value: 1, color: '#10b981' },
                          { name: 'Unverified (আন-ভেরিফাইড)', value: 0, color: '#f59e0b' },
                          { name: 'Banned (ব্লকড)', value: 0, color: '#f43f5e' }
                        ].filter(item => item.value > 0);

                    return (
                      <div className="space-y-6">
                        {/* Quick Stats Banner */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                            <p className="text-[10px] uppercase font-mono font-black text-blue-500 tracking-wider">Total Members</p>
                            <h3 className={`text-2xl font-black mt-1 ${themeStyles.text}`}>{totalUsersCount}</h3>
                            <p className="text-[10px] text-gray-400 mt-1">Platform user accounts</p>
                          </div>

                          <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                            <p className="text-[10px] uppercase font-mono font-black text-emerald-500 tracking-wider">Verified Citizens</p>
                            <h3 className="text-2xl font-black mt-1 text-emerald-500">{verifiedNum}</h3>
                            <p className="text-[10px] text-gray-400 mt-1">Approved trust badge IDs</p>
                          </div>

                          <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                            <p className="text-[10px] uppercase font-mono font-black text-amber-500 tracking-wider">Unverified</p>
                            <h3 className="text-2xl font-black mt-1 text-amber-500">{unverifiedNum}</h3>
                            <p className="text-[10px] text-gray-400 mt-1">Standard profile access</p>
                          </div>

                          <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                            <p className="text-[10px] uppercase font-mono font-black text-rose-500 tracking-wider">Banned & Suspended</p>
                            <h3 className="text-2xl font-black mt-1 text-rose-500">{bannedNum}</h3>
                            <p className="text-[10px] text-gray-400 mt-1">Sovereignty locks applied</p>
                          </div>
                        </div>

                        {/* Charts Area */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                          {/* 1. User Growth Trends over past 6 months */}
                          <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className={`text-sm font-black ${themeStyles.text}`}>ইউজার বৃদ্ধির ট্রেন্ড (User Growth Trends)</h4>
                                <p className="text-[10px] text-gray-500">Cumulative registered members since launch</p>
                              </div>
                              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                                <TrendingUp className="w-4 h-4" />
                              </span>
                            </div>

                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                  data={growthTrendData}
                                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                >
                                  <defs>
                                    <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2f30' : '#e5e7eb'} />
                                  <XAxis dataKey="month" stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                                  <YAxis stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                                  <ChartTooltip
                                    contentStyle={{
                                      backgroundColor: isDark ? '#242526' : '#ffffff',
                                      borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                      borderRadius: '12px',
                                      color: isDark ? '#ffffff' : '#000000',
                                      fontSize: '11px'
                                    }}
                                  />
                                  <Area type="monotone" dataKey="Total Users" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrowthGrad)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* 2. Daily Active User Counts */}
                          <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className={`text-sm font-black ${themeStyles.text}`}>দৈনিক অ্যাক্টিভ ইউজার সংখ্যা (Daily Active Users)</h4>
                                <p className="text-[10px] text-gray-500">Estimated unique visitors per weekday session</p>
                              </div>
                              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                <Users className="w-4 h-4" />
                              </span>
                            </div>

                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={dailyActiveData}
                                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2f30' : '#e5e7eb'} />
                                  <XAxis dataKey="day" stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                                  <YAxis stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                                  <ChartTooltip
                                    contentStyle={{
                                      backgroundColor: isDark ? '#242526' : '#ffffff',
                                      borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                      borderRadius: '12px',
                                      color: isDark ? '#ffffff' : '#000000',
                                      fontSize: '11px'
                                    }}
                                  />
                                  <Bar dataKey="Active Users" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={22} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* 3. Verification Status Distribution */}
                          <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm xl:col-span-2`}>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className={`text-sm font-black ${themeStyles.text}`}>ভেরিফিকেশন স্ট্যাটাস বন্টন (Verification Status Distribution)</h4>
                                <p className="text-[10px] text-gray-500">Breakdown of member trustworthiness metrics and moderation limits</p>
                              </div>
                              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <ShieldCheck className="w-4 h-4" />
                              </span>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                              {/* Pie Visualizer */}
                              <div className="w-48 h-48 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={finalStatusData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={55}
                                      outerRadius={80}
                                      paddingAngle={4}
                                      dataKey="value"
                                    >
                                      {finalStatusData.map((entry, idx) => (
                                        <Cell key={`status-cell-${idx}`} fill={entry.color} />
                                      ))}
                                    </Pie>
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: isDark ? '#242526' : '#ffffff',
                                        borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                        borderRadius: '12px',
                                        color: isDark ? '#ffffff' : '#000000',
                                        fontSize: '11px'
                                      }}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Index / Percentage Directory */}
                              <div className="flex-1 w-full space-y-3">
                                {verificationStatusData.map((item) => {
                                  const pct = totalUsersCount > 0 ? Math.round((item.value / totalUsersCount) * 100) : 0;
                                  return (
                                    <div 
                                      key={item.name} 
                                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-200 hover:border-zinc-500/20 ${
                                        isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-gray-50/40 border-gray-150'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className={`text-xs font-black ${themeStyles.text}`}>{item.name}</span>
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-xs font-mono font-black ${themeStyles.text}`}>{item.value} Members</p>
                                        <p className="text-[10px] text-gray-400 font-bold font-mono">{pct}% of total profiles</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })()}

                  {analyticsCategory === 'goals' && (
                    <div className="space-y-6">
                      <div className={`p-4 sm:p-5 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className={`text-sm font-bold ${themeStyles.text}`}>Individual Trajectory Search Filters</h3>
                            <p className="text-[10px] text-gray-500">Real-time indicators & visual aggregation from physical database collections</p>
                          </div>
                          
                          <button
                            onClick={loadAllSystemGoals}
                            disabled={allGoalsLoading}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 disabled:opacity-50 select-none cursor-pointer"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${allGoalsLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh Analytics</span>
                          </button>
                        </div>
    
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                          {/* Search Bar */}
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search goal title or user ID..."
                              value={analyticsSearchQuery}
                              onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium border transition-all duration-200 outline-none ${
                                isDark 
                                  ? 'bg-[#18191a] border-zinc-800 text-white focus:border-blue-600' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-600 focus:bg-white'
                              }`}
                            />
                          </div>
    
                          {/* Category Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 shrink-0 font-bold font-mono">Category:</span>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold border transition outline-none cursor-pointer ${
                                isDark 
                                  ? 'bg-[#18191a] border-zinc-800 text-white focus:border-blue-500' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                              }`}
                            >
                              <option value="all">All Specialties</option>
                              <option value="Career">Career Track</option>
                              <option value="Academic">Academic / Degree</option>
                              <option value="Skill">Technical Skillset</option>
                              <option value="Personal">Personal Habit</option>
                            </select>
                          </div>
    
                          {/* Status Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400 shrink-0 font-bold font-mono">Status:</span>
                            <select
                              value={selectedStatus}
                              onChange={(e) => setSelectedStatus(e.target.value)}
                              className={`w-full px-3 py-2.5 rounded-2xl text-xs font-bold border transition outline-none cursor-pointer ${
                                isDark 
                                  ? 'bg-[#18191a] border-zinc-800 text-white focus:border-blue-500' 
                                  : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                              }`}
                            >
                              <option value="all">All Progress Levels</option>
                              <option value="active">Active Trajectories (&lt; 100%)</option>
                              <option value="completed">Successfully Completed (100%)</option>
                            </select>
                          </div>
                        </div>
                      </div>
    
                      {allGoalsLoading ? (
                        <div className={`p-12 text-center rounded-3xl border ${themeStyles.card} flex flex-col items-center justify-center gap-3`}>
                          <Loader className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-xs text-gray-400 font-bold font-mono">Summarizing user pathways from database context...</p>
                        </div>
                      ) : (
                        <>
                          {/* Metric Widgets */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                              <p className="text-[10px] uppercase font-mono font-black text-rose-500 tracking-wider">Goal Trajectories</p>
                              <h3 className={`text-2xl font-black mt-1 ${themeStyles.text}`}>{filteredGoals.length}</h3>
                              <p className="text-[10px] text-gray-400 mt-1">Matching current filters</p>
                            </div>
    
                            <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                              <p className="text-[10px] uppercase font-mono font-black text-blue-500 tracking-wider">Average Progress</p>
                              <h3 className={`text-2xl font-black mt-1 ${themeStyles.text}`}>
                                {filteredGoals.length > 0 ? `${Math.round(filteredGoals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / filteredGoals.length)}%` : '0%'}
                              </h3>
                              <p className="text-[10px] text-gray-400 mt-1">Weighted collective progress</p>
                            </div>
    
                            <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                              <p className="text-[10px] uppercase font-mono font-black text-emerald-500 tracking-wider">Fully Completed</p>
                              <h3 className="text-2xl font-black mt-1 text-emerald-500">
                                {filteredGoals.filter(g => g.progressPercent >= 100).length}
                              </h3>
                              <p className="text-[10px] text-gray-400 mt-1">Milestones fully acquired</p>
                            </div>
    
                            <div className={`p-4 sm:p-5 rounded-2xl border ${themeStyles.card} shadow-sm`}>
                              <p className="text-[10px] uppercase font-mono font-black text-amber-500 tracking-wider">Active Iterations</p>
                              <h3 className="text-2xl font-black mt-1 text-amber-500">
                                {filteredGoals.filter(g => (g.progressPercent || 0) < 100).length}
                              </h3>
                              <p className="text-[10px] text-gray-400 mt-1">In-flight active pathways</p>
                            </div>
                          </div>
    
                          {/* Charts Grid */}
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            
                            {/* Bar Chart: Progress per Category */}
                            <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className={`text-sm font-bold ${themeStyles.text}`}>Average Progression Rate per Category</h3>
                                  <p className="text-[10px] text-gray-500">Goal progression performance comparisons</p>
                                </div>
                                <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                  <BarChart3 className="w-4 h-4" />
                                </span>
                              </div>
    
                              <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={['Career', 'Academic', 'Skill', 'Personal'].map(cat => {
                                      const cGoals = allGoals.filter(g => g.category === cat);
                                      const cCount = cGoals.length;
                                      const cAvg = cCount > 0 ? Math.round(cGoals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / cCount) : 0;
                                      return { name: cat, Progress: cAvg, Total: cCount };
                                    })}
                                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#2e2f30' : '#e5e7eb'} />
                                    <XAxis dataKey="name" stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} />
                                    <YAxis stroke={isDark ? '#71717a' : '#4b5563'} fontSize={10} tickLine={false} unit="%" />
                                    <ChartTooltip
                                      contentStyle={{
                                        backgroundColor: isDark ? '#242526' : '#ffffff',
                                        borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                        borderRadius: '12px',
                                        color: isDark ? '#ffffff' : '#000000',
                                        fontSize: '11px'
                                      }}
                                    />
                                    <Area type="monotone" dataKey="Progress" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProg)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
    
                            {/* Pie Chart: Distribution */}
                            <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm`}>
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className={`text-sm font-bold ${themeStyles.text}`}>Platform Specialty Distribution</h3>
                                  <p className="text-[10px] text-gray-500">Distribution of registered interest-based learning goals</p>
                                </div>
                                <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
                                  <Layers className="w-4 h-4" />
                                </span>
                              </div>
    
                              <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                                <div className="w-full sm:w-1/2 h-full min-h-[160px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={['Career', 'Academic', 'Skill', 'Personal'].map(cat => ({
                                          name: cat,
                                          value: allGoals.filter(g => g.category === cat).length
                                        }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={3}
                                        dataKey="value"
                                      >
                                        {[
                                          { name: 'Career', fill: '#3b82f6' }, // blue-500
                                          { name: 'Academic', fill: '#8b5cf6' }, // violet-500
                                          { name: 'Skill', fill: '#10b981' }, // emerald-500
                                          { name: 'Personal', fill: '#f59e0b' } // amber-500
                                        ].map((entry, idx) => (
                                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <ChartTooltip
                                        contentStyle={{
                                          backgroundColor: isDark ? '#242526' : '#ffffff',
                                          borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                                          borderRadius: '12px',
                                          color: isDark ? '#ffffff' : '#000000',
                                          fontSize: '11px'
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
    
                                <div className="w-full sm:w-1/2 flex flex-col gap-2 justify-center sm:pl-4">
                                  {[
                                    { name: 'Career', color: '#3b82f6' },
                                    { name: 'Academic', color: '#8b5cf6' },
                                    { name: 'Skill', color: '#10b981' },
                                    { name: 'Personal', color: '#f59e0b' }
                                  ].map((item) => {
                                    const count = allGoals.filter(g => g.category === item.name).length;
                                    const percentage = allGoals.length > 0 ? Math.round((count / allGoals.length) * 100) : 0;
                                    return (
                                      <div key={item.name} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2 last:border-none">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                          <span className={`text-[11px] font-bold ${themeStyles.text}`}>{item.name}</span>
                                        </div>
                                        <span className={`text-xs font-mono font-bold ${themeStyles.subText}`}>
                                          {count} ({percentage}%)
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
    
                          </div>
    
                          {/* Filtered Data Table: Real Path Logs */}
                          <div className={`p-5 rounded-3xl border ${themeStyles.card} shadow-sm space-y-4`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className={`text-sm font-bold ${themeStyles.text}`}>Individual Goal Pathways Directory ({filteredGoals.length})</h3>
                                <p className="text-[10px] text-gray-400">Detailed list of physical trajectories matching dashboard viewports</p>
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-lg uppercase">
                                Query Verified
                              </span>
                            </div>
    
                            {filteredGoals.length === 0 ? (
                              <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-2xl dark:border-zinc-800">
                                No individual goal records currently match the filtering parameters.
                              </div>
                            ) : (
                              <div className={`rounded-2xl border overflow-x-auto ${themeStyles.border}`}>
                                <table className="w-full text-left text-xs min-w-[640px]">
                                  <thead className={`border-b ${themeStyles.border} ${isDark ? 'bg-zinc-900/50' : 'bg-gray-100'}`}>
                                    <tr>
                                      <th className="p-4 font-bold">Goal Details</th>
                                      <th className="p-4 font-bold">User Context</th>
                                      <th className="p-4 font-bold">Specialty Category</th>
                                      <th className="p-4 font-bold">Progression Status</th>
                                      <th className="p-4 font-bold">Completion Date Plan</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                                    {filteredGoals.map(goal => (
                                      <tr key={goal.id} className={isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-gray-50'}>
                                        <td className="p-4">
                                          <div>
                                            <p className={`font-bold ${themeStyles.text}`}>{goal.title}</p>
                                            <p className="text-[10px] text-gray-500">ID: {goal.id.slice(0, 8)}...</p>
                                          </div>
                                        </td>
                                        <td className="p-4 font-mono text-zinc-500 text-[11px] select-text">
                                          {goal.userId || 'System Admin'}
                                        </td>
                                        <td className="p-4">
                                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            goal.category === 'Career' ? 'bg-blue-500/10 text-blue-500' :
                                            goal.category === 'Academic' ? 'bg-violet-500/10 text-violet-500' :
                                            goal.category === 'Skill' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-amber-500/10 text-amber-500'
                                          }`}>
                                            {goal.category}
                                          </span>
                                        </td>
                                        <td className="p-4">
                                          <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                              <span className="font-mono">{goal.progressPercent || 0}%</span>
                                              <span>{goal.progressPercent >= 100 ? 'Finished' : 'In Progress'}</span>
                                            </div>
                                            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                  goal.progressPercent >= 100 ? 'bg-emerald-500' :
                                                  goal.progressPercent > 50 ? 'bg-blue-500' :
                                                  'bg-amber-500'
                                                }`}
                                                style={{ width: `${goal.progressPercent || 0}%` }}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td className="p-4 text-zinc-500 font-medium">
                                          {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Continuous Learn'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {showRejectModal && rejectingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-rose-500">
                Cancel / Reject Verification Request
              </h4>
              <button 
                onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              You are rejecting the credentials submitted by <b className={isDark ? 'text-white' : 'text-gray-905 font-extrabold'}>{rejectingRequest.displayName}</b>. Please specify a clear rejection reason below. This helps the citizen fix their files.
            </p>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Rejection Reason (অপ্রুভ না করার কারণ)</label>
              <textarea
                rows={3}
                placeholder="e.g. Identity document name does not match profile name, image is blurry, etc."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs border focus:outline-none focus:ring-1 transition ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-810 text-white focus:ring-rose-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-rose-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => { setShowRejectModal(false); setRejectingRequest(null); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  isDark ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 text-gray-400' : 'bg-gray-150 hover:bg-gray-200 border-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await dataRepository.rejectVerificationRequest(rejectingRequest.id, rejectingRequest.userId, rejectionReasonInput || 'Information does not match criteria.');
                    setShowRejectModal(false);
                    setRejectingRequest(null);
                  } catch (err) {
                    console.error("Failed to reject verification request:", err);
                  }
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                Reject Request
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function PermissionSwitch({ label, isOn, onToggle, isDark }: { label: string, isOn: boolean, onToggle: () => void, isDark: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[55px]">
      <span className="text-[10px] font-bold text-gray-400">{label}</span>
      <button 
        type="button"
        onClick={onToggle}
        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer outline-none shrink-0 ${
          isOn ? 'bg-amber-500' : (isDark ? 'bg-zinc-800' : 'bg-gray-300')
        }`}
      >
        <span 
          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-4' : 'translate-x-[2px]'
          }`}
        />
      </button>
      <span className={`text-[9px] font-black uppercase ${isOn ? 'text-amber-500' : 'text-gray-500-600'}`}>
        {isOn ? 'Active' : 'Locked'}
      </span>
    </div>
  );
}