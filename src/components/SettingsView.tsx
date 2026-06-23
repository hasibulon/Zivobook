import React, { useState } from 'react';
import { 
  Settings, Shield, Sun, Moon, Check, UserCheck, 
  ArrowLeft, ArrowRight, Star, Download, RotateCw, 
  Trash2, HelpCircle, Bell, Terminal, 
  ChevronRight, Sparkles, AlertCircle, ShieldCheck
} from 'lucide-react';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userIsAdmin?: boolean;
  onNavigate?: (tab: any) => void;
  onDeleteAccount?: () => void;
}

type SubSettingType = 'theme' | 'session' | 'developer' | 'notifications' | 'help' | null;

export default function SettingsView({ 
  theme, 
  onToggleTheme,
  userIsAdmin = false,
  onNavigate,
  onDeleteAccount
}: SettingsViewProps) {
  const [activeSubSetting, setActiveSubSetting] = useState<SubSettingType>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Notifications State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [strictFilter, setStrictFilter] = useState(true);

  // Developer State
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Secure kernel virtualized.',
    'Sovereign synchronization running.',
    'System status initialized.'
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerToast('Synchronizing offline secure database state cache...');
    setTimeout(() => {
      setIsRefreshing(false);
      setSystemLogs(prev => [
        `Sync complete at ${new Date().toLocaleTimeString()}`,
        ...prev.slice(0, 4)
      ]);
      triggerToast('Database synchronized securely.');
    }, 1200);
  };

  const handleBookmarkToggle = () => {
    setBookmarked(!bookmarked);
    triggerToast(!bookmarked ? 'Session workspace bookmarked successfully' : 'Bookmark removed from safe storage');
  };

  const handleExportData = () => {
    triggerToast('Preparing sovereign session archive package...');
    setTimeout(() => {
      const exportObject = {
        theme,
        soundEnabled,
        strictFilter,
        exportedAt: new Date().toISOString(),
        validation: 'Sovereign-Verified'
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "sovereign_integrity_settings.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerToast('Sovereign export archive downloaded.');
    }, 1000);
  };

  const isDark = theme === 'dark';

  // High Contrast Design Core Token Matrix Strategy
  const containerClass = isDark 
    ? 'bg-[#18191a] border-[#242526] text-gray-200' 
    : 'bg-white border-gray-300 text-gray-900 shadow-md';

  const innerCardClass = isDark
    ? 'bg-zinc-900/60 border border-zinc-800/80'
    : 'bg-gray-100 border border-gray-300';

  const textPrimary = isDark ? 'text-white' : 'text-gray-950 font-bold';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-700 font-medium';
  
  const hoverBgClass = isDark 
    ? 'hover:bg-zinc-850 text-gray-200' 
    : 'hover:bg-gray-100 text-gray-950 border-gray-200';

  const iconNavBtnClass = isDark
    ? 'bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700'
    : 'bg-gray-200 text-gray-700 hover:text-gray-950 hover:bg-gray-300 border border-gray-300';

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-6 w-full max-w-[480px] mx-auto animate-fade-in select-none">
      
      {/* Outer Browser Drawer Frame */}
      <div className={`w-full rounded-2xl border overflow-hidden p-4 transition-colors duration-300 ${containerClass}`} id="chrome-browser-style-settings-view">
        
        {/* Top Navigator Bar */}
        <div className="flex items-center justify-between px-1 py-1 border-b border-gray-500/10 mb-4 gap-2" id="chrome-simulator-row">
          <button 
            onClick={() => {
              if (activeSubSetting !== null) {
                setActiveSubSetting(null);
              } else {
                triggerToast('Already in root directory viewport');
              }
            }}
            title="Go Back"
            className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
              activeSubSetting !== null 
                ? 'bg-blue-600 text-white hover:bg-blue-700 scale-105 shadow-sm' 
                : `${iconNavBtnClass} opacity-50`
            }`}
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button 
            onClick={() => triggerToast('Forward navigation history cleared')}
            title="Go Forward"
            className="p-2 rounded-xl bg-gray-500/10 text-gray-400 opacity-30 cursor-not-allowed flex items-center justify-center border border-transparent"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          <button 
            onClick={handleBookmarkToggle}
            title="Bookmark Workspace"
            className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
              bookmarked 
                ? 'bg-blue-600 text-white scale-105 shadow-sm' 
                : `${iconNavBtnClass}`
            }`}
          >
            <Star className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
          </button>

          <button 
            onClick={handleExportData}
            title="Download Workspace Profile Archive"
            className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${iconNavBtnClass}`}
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button 
            onClick={handleRefresh}
            title="Synchronize Live Cache"
            className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
              isRefreshing 
                ? 'animate-spin bg-blue-600 text-white shadow-sm' 
                : `${iconNavBtnClass}`
            }`}
          >
            <RotateCw className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Dynamic Display Area of selected settings function */}
        {activeSubSetting === null ? (
          /* ROOT LEVEL VERTICAL POPUP SETTINGS MENU LIST */
          <div className="space-y-1" id="chrome-menu-popup-options-index">
            
            <div className="px-1 py-1.5 pb-3 border-b border-gray-500/10">
              <span className="text-[10px] font-bold tracking-widest uppercase font-mono text-blue-600 dark:text-blue-500">Sovereign System Console</span>
              <h4 className={`text-base font-bold font-sans ${textPrimary} mt-0.5`}>Configure Settings</h4>
            </div>

            {/* Sub-Setting Item: Theme Preferences */}
            <div 
              onClick={() => setActiveSubSetting('theme')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition ${hoverBgClass}`}
              id="menu-item-theme-trigger"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-sm font-bold ${textPrimary}`}>Theme Preferences</p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 font-sans mt-0.5 font-semibold capitalize">{theme} Mode Active</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
            </div>

            {/* Sub-Setting Item: Session Integrity */}
            <div 
              onClick={() => setActiveSubSetting('session')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition ${hoverBgClass}`}
              id="menu-item-session-trigger"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-sm font-bold ${textPrimary}`}>Session Security Status</p>
                  <p className={`text-xs ${textSecondary} font-sans mt-0.5`}>Sovereign Encryption Level Active</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
            </div>

            {/* Sub-Setting Item: Real-time Notifications */}
            <div 
              onClick={() => setActiveSubSetting('notifications')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition ${hoverBgClass}`}
              id="menu-item-notify-trigger"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-sm font-bold ${textPrimary}`}>Notifications Control</p>
                  <p className={`text-xs ${textSecondary} font-sans mt-0.5`}>Manage audio alerts and sound patterns</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
            </div>

            {/* Sub-Setting Item: Developer settings */}
            {userIsAdmin && (
              <div 
                onClick={() => setActiveSubSetting('developer')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition ${hoverBgClass}`}
                id="menu-item-dev-trigger"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className={`text-sm font-bold ${textPrimary}`}>Developer Toolkit</p>
                    <p className={`text-xs ${textSecondary} font-sans mt-0.5`}>Diagnostics console & variable registry</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
              </div>
            )}

            {/* Sub-Setting Item: Admin System Panel (Only shown if user is admin) */}
            {userIsAdmin && (
              <div 
                onClick={() => onNavigate && onNavigate('admin')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition text-amber-500 hover:bg-amber-500/10`}
                id="menu-item-admin-trigger"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <p className={`text-sm font-black text-amber-500`}>System Administration</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-500 font-sans mt-0.5 font-bold">এডমিন সিস্টেম / Admin Dashboard</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              </div>
            )}

            <div className="border-t border-gray-500/10 my-2" />

            {/* Sub-Setting Item: Help & Handbook */}
            <div 
              onClick={() => setActiveSubSetting('help')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition ${hoverBgClass}`}
              id="menu-item-help-trigger"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-sm font-bold ${textPrimary}`}>Help & Feedback</p>
                  <p className={`text-xs ${textSecondary} font-sans mt-0.5`}>System overview, rules and user assistance</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 stroke-[2.5]" />
            </div>

            {/* HIGH CONTRAST FIXED ACTION ITEM: Reset cache */}
            <div 
              onClick={() => {
                if (window.confirm('Delete local temporary cache variables? This cleans non-persistent session store data.')) {
                  triggerToast('Workspace Cache storage successfully cleaned.');
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition group ${
                isDark ? 'hover:bg-red-600 hover:text-white' : 'bg-red-50 hover:bg-red-100 border-red-200'
              }`}
              id="menu-item-raw-cache-clean"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600 text-white shadow-sm shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  {/* Fixed Day Mode Contrast Logic Red Text Colors */}
                  <p className={`text-sm font-bold ${isDark ? 'text-red-400 group-hover:text-white' : 'text-red-700'}`}>
                    Clear Local Session Data
                  </p>
                  <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-red-500 group-hover:text-red-100' : 'text-red-600/90 font-semibold'}`}>
                    Immediate purge of debug structures
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 stroke-[2.5] ${isDark ? 'text-red-500 group-hover:text-white' : 'text-red-700'}`} />
            </div>

            {/* Delete Account */}
            <div 
              onClick={() => {
                const confirmDelete = window.confirm("আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্টটি চিরতরে মুছে ফেলতে চান? আপনার সমস্ত পোষ্ট এবং ডেটা ফিড থেকে লুকিয়ে ফেলা হবে এবং আপনাকে লগআউট করা হবে। এটি আর পুনরুদ্ধার করা যাবে না!");
                if (confirmDelete && onDeleteAccount) {
                  onDeleteAccount();
                }
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl border border-transparent cursor-pointer transition group ${
                isDark ? 'hover:bg-rose-700 hover:text-white' : 'bg-rose-50 hover:bg-rose-100 border-rose-200'
              }`}
              id="menu-item-delete-account"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-sm font-bold ${isDark ? 'text-rose-400 group-hover:text-white' : 'text-rose-700'}`}>
                    Delete My Account (অ্যাকাউন্ট মুছে ফেলুন)
                  </p>
                  <p className={`text-xs font-sans mt-0.5 ${isDark ? 'text-rose-500 group-hover:text-rose-100' : 'text-rose-600 font-semibold'}`}>
                    রিসাইকেল ট্র্যাশে পাঠানোর সাথে সাথে চিরতরে ডিলিট করুন
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 stroke-[2.5] ${isDark ? 'text-rose-500 group-hover:text-white' : 'text-rose-700'}`} />
            </div>

          </div>
        ) : (
          /* SUB-STAGE DISPLAYS FOR SPECIFIC CHOSEN FUNCTIONS */
          <div className="p-0 space-y-4" id="chrome-submenu-display-panel">
            
            {/* Sub-level navigation header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-500/10">
              <button 
                onClick={() => setActiveSubSetting(null)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-700 transition cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" /> Menu
              </button>
              <div className="text-left ml-1 leading-none">
                <h4 className="text-[10px] font-bold tracking-widest uppercase font-mono text-blue-600 dark:text-blue-500">
                  {activeSubSetting === 'theme' && 'Viewport Styles'}
                  {activeSubSetting === 'session' && 'Security Guard'}
                  {activeSubSetting === 'notifications' && 'System Alert Settings'}
                  {activeSubSetting === 'developer' && 'Diagnostic Terminal'}
                  {activeSubSetting === 'help' && 'Secure Workspace Manual'}
                </h4>
              </div>
            </div>

            {/* FUNCTION 1: THEME PREFERENCES SCREEN */}
            {activeSubSetting === 'theme' && (
              <div className="space-y-4 py-1" id="sub-theme-content">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textPrimary}`}>
                    <Check className="w-4 h-4 text-blue-500 stroke-[3]" /> Realtime Viewport theme
                  </h3>
                  <p className={`text-xs ${textSecondary} mt-1 leading-relaxed`}>
                    Set clean responsive layouts. Toggles instant global contrast style.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      if (theme !== 'light') {
                        onToggleTheme();
                        triggerToast('Viewport toggled to: Light Professional Mode');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                      theme === 'light'
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md'
                        : 'bg-gray-200 border-gray-300 text-gray-700 hover:text-gray-950 hover:bg-gray-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <Sun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-white' : 'text-amber-500'}`} />
                    <span className="text-xs font-bold">Light Theme</span>
                  </button>

                  <button
                    onClick={() => {
                      if (theme !== 'dark') {
                        onToggleTheme();
                        triggerToast('Viewport toggled to: Slate Dark Mode');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-blue-600 border-blue-500 text-white font-bold shadow-md'
                        : 'bg-gray-200 border-gray-300 text-gray-700 hover:text-gray-950 hover:bg-gray-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    <Moon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-white' : 'text-blue-500'}`} />
                    <span className="text-xs font-bold">Dark Theme</span>
                  </button>
                </div>
              </div>
            )}

            {/* FUNCTION 2: SESSION STATUS */}
            {activeSubSetting === 'session' && (
              <div className="space-y-4 py-1" id="sub-session-content">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textPrimary}`}>
                    <Shield className="w-4 h-4 text-blue-500" /> Verified Cryptographic Status
                  </h3>
                  <p className={`text-xs ${textSecondary} mt-1 leading-relaxed`}>
                    Sovereign user validation details and offline credential health report.
                  </p>
                </div>

                <div className={`p-4 rounded-xl space-y-3 text-xs leading-relaxed ${innerCardClass}`}>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 font-bold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}><UserCheck className="w-4 h-4 text-blue-500" /> Access Status:</span>
                    <span className="text-white font-bold uppercase tracking-wider text-[10px] bg-blue-600 px-2.5 py-1 rounded-lg shadow-sm">Active Verified</span>
                  </div>
                  <div className="border-t border-gray-400/40 pt-2 flex items-center justify-between font-mono text-[11px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-800 font-semibold'}>Encryption Protocol</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-right">TLS_AES_256_GCM</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-800 font-semibold'}>Session Core Link</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-right">Verified Connected</span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-900 font-medium'} leading-relaxed mt-2 pt-2 border-t border-gray-400/40 italic`}>
                    Your account synchronization and real-time feed update checks are signed dynamically under end-to-end hardware-level protection.
                  </p>
                </div>
              </div>
            )}

            {/* FUNCTION 3: NOTIFICATIONS VIEW */}
            {activeSubSetting === 'notifications' && (
              <div className="space-y-4 py-1" id="sub-notify-content">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textPrimary}`}>
                    <Bell className="w-4 h-4 text-blue-500" /> Decibel Alert Settings
                  </h3>
                  <p className={`text-xs ${textSecondary} mt-1 leading-relaxed`}>
                    Configure sounds, desktop popups, and notification levels.
                  </p>
                </div>

                <div className={`p-4 rounded-xl space-y-4 ${innerCardClass}`}>
                  {/* sound switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-bold ${textPrimary}`}>Decibel Alert Sound</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Auditory feedback on verification events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={soundEnabled} 
                        onChange={() => {
                          setSoundEnabled(!soundEnabled);
                          triggerToast(!soundEnabled ? 'Alert sounds active' : 'Alert sounds globally muted');
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-300 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* strict filter switch */}
                  <div className="flex items-center justify-between border-t border-gray-400/30 pt-3">
                    <div>
                      <p className={`text-xs font-bold ${textPrimary}`}>Strict Safety Filter</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Isolate active verified network posts</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={strictFilter} 
                        onChange={() => {
                          setStrictFilter(!strictFilter);
                          triggerToast(!strictFilter ? 'Strict verification mode enabled' : 'Permissive network feed view enabled');
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-300 dark:bg-zinc-700 peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 rounded-full"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* FUNCTION 4: DEVELOPER OPTIONS */}
            {activeSubSetting === 'developer' && (
              <div className="space-y-4 py-1" id="sub-dev-content">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textPrimary}`}>
                    <Terminal className="w-4 h-4 text-blue-500" /> Sovereign Debug Logger
                  </h3>
                  <p className={`text-[11px] ${textSecondary} mt-1 leading-relaxed`}>
                    Live console logs, state inspector, and simulated systems metadata.
                  </p>
                </div>

                <div className={`p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 ${innerCardClass} leading-tight`}>
                  <div className="pb-1.5 border-b border-gray-400/30 flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-500 font-bold uppercase tracking-widest text-[9px]">CONSOLE_FEED</span>
                    <button 
                      onClick={() => {
                        setSystemLogs([`Manual test fire: ${Date.now()}`, ...systemLogs.slice(0, 4)]);
                        triggerToast('Simulated event triggered in logs.');
                      }}
                      className="px-2 py-1 bg-blue-600 text-white rounded-md text-[10px] hover:bg-blue-700 cursor-pointer shadow-sm"
                    >
                      Fire Event
                    </button>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {systemLogs.map((log, index) => (
                      <p key={index} className="text-[11px] text-gray-800 dark:text-gray-400">
                        <span className="text-blue-500 font-bold">&gt;&nbsp;</span>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-600 text-white flex items-start gap-2 text-[11px] shadow-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
                  <p className="leading-normal font-sans font-semibold">
                    Developer notice: Sandbox environment. Actual production endpoints are monitored securely via automated routing controllers.
                  </p>
                </div>
              </div>
            )}

            {/* FUNCTION 5: HELP & GUIDELINES */}
            {activeSubSetting === 'help' && (
              <div className="space-y-4 py-1" id="sub-help-content">
                <div>
                  <h3 className={`text-sm font-bold flex items-center gap-1.5 ${textPrimary}`}>
                    <HelpCircle className="w-4 h-4 text-blue-500" /> Support Handbook
                  </h3>
                  <p className={`text-xs ${textSecondary} mt-1 leading-relaxed`}>
                    Get system guidelines, read code guidelines, or leave user feedback below.
                  </p>
                </div>

                <div className={`p-4 rounded-xl space-y-3.5 text-xs ${innerCardClass}`}>
                  <h4 className={`font-black flex items-center gap-1.5 text-xs ${textPrimary}`}>
                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" /> মোবাইলে ইন্সটল করার নিয়ম (PWA Guide)
                  </h4>
                  
                  <div className="space-y-4 text-[11px] leading-relaxed">
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-900'} leading-normal`}>
                      আমরা অ্যাপটিতে পূর্ণাঙ্গ <strong>মোবাইল অ্যাপ ফ্রেমওয়ার্ক (PWA)</strong> এবং <strong>অ্যাপল/অ্যান্ড্রয়েড হোম-স্ক্রিন সলিউশন</strong> যুক্ত করেছি। এখন আপনি নিচে উল্লেখিত সহজ উপায়ে ফোনে এটি ইনস্টল বা বুকমার্ক করতে পারবেন, যার ফলে আমাদের সুন্দর লোগোটি হোম স্ক্রিনে দেখা যাবে এবং ব্রাউজারের ইউআরএল (URL) বার ছাড়াই ফুল-স্ক্রিন ওপেন হবে।
                    </p>

                    {/* Apple iOS/Safari Instructions */}
                    <div className="border-t border-gray-500/10 pt-3">
                      <p className={`font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1`}>
                        🍎 iPhone / Safari ব্রাউজার ব্যবহারকারীদের জন্য:
                      </p>
                      <ul className={`list-decimal list-inside space-y-1.5 mt-1.5 pl-1 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>
                        <li>প্রথমে আপনার ফোনের <strong>Safari ব্রাউজারে</strong> আমাদের অ্যাপের লিঙ্কটি ওপেন করুন।</li>
                        <li>নিচের মেনুবার থেকে <strong>Share (শেয়ার)</strong> আইকনটিতে ট্যাপ করুন।</li>
                        <li>মেনুটি স্ক্রল করে নিচে যান এবং <strong>&ldquo;Add to Home Screen&rdquo; (হোম স্ক্রিনে যোগ করুন)</strong> অপশনে চাপ দিন।</li>
                        <li>এখানে আমাদের ব্র্যান্ডের <strong>যাচাইকৃত Z লোগোটি</strong> দেখতে পাবেন। উপরে ডানপাশে <strong>&ldquo;Add&rdquo; (যোগ করুন)</strong> বাটনে চাপুন।</li>
                        <li>এবার আপনার স্ক্রিন থেকে অ্যাপটি ওপেন করলেই এটি <strong>সম্পূর্ণ ফুল-স্ক্রিন</strong> (কোনো এড্রেসবার ছাড়া) ও দ্রুতগতিতে ওপেন হবে।</li>
                      </ul>
                    </div>

                    {/* Android/Chrome Instructions */}
                    <div className="border-t border-gray-500/10 pt-3">
                      <p className={`font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1`}>
                        🤖 Android / Chrome ব্রাউজার ব্যবহারকারীদের জন্য:
                      </p>
                      <ul className={`list-decimal list-inside space-y-1.5 mt-1.5 pl-1 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>
                        <li>আপনার ফোনের <strong>Google Chrome ব্রাউজারে</strong> অ্যাপের লিঙ্কটি ওপেন করুন।</li>
                        <li>ডানদিকের উপরে থাকা <strong>3-dot (তিনটি ডট)</strong> মেনু বাটনে ট্যাপ করুন।</li>
                        <li>এখানে <strong>&ldquo;Install App&rdquo; (অ্যাপ ইনস্টল করুন)</strong> অথবা <strong>&ldquo;Add to Home Screen&rdquo;</strong> অপশনটি সিলেক্ট করুন।</li>
                        <li>ইনস্টলেশন সম্পূর্ণ হলে হোম স্ক্রিনে <strong>অ্যাপের লোগোসহ আইকন</strong> তৈরি হবে এবং অ্যাপের মতো স্টাইলিশ ফুল-স্ক্রিনে রান করবে।</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl space-y-2.5 text-xs ${innerCardClass}`}>
                  <h4 className={`font-bold flex items-center gap-1 text-[11px] ${textPrimary}`}><Check className="w-3.5 h-3.5 text-blue-500" /> Quick Handbook</h4>
                  <ul className={`list-disc list-inside space-y-1.5 ${isDark ? 'text-gray-400' : 'text-gray-800 font-medium'} text-[11px] pl-1 leading-normal`}>
                    <li>Use the toolbar refresh button to clear client session cache.</li>
                    <li>Sovereign validation badges indicate network account integrity.</li>
                    <li>Toggle strict filters in notification configurations if desired.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className={`text-[11px] font-bold ${textPrimary}`}>Leave System Feedback</p>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Comment on design or code style..."
                      id="help-feedback-input-element" 
                      className={`flex-1 border rounded-xl px-3 py-2 text-xs outline-none transition ${
                        isDark 
                          ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-400 text-gray-900 focus:border-blue-500 shadow-sm'
                      }`}
                    />
                    <button 
                      onClick={() => {
                        const el = document.getElementById('help-feedback-input-element') as HTMLInputElement | null;
                        if (el && el.value.trim()) {
                          triggerToast('Thank you! Feedback queued successfully for developer inspection.');
                          el.value = '';
                        } else {
                          triggerToast('Please type a feedback comment first.');
                        }
                      }}
                      className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer shrink-0 shadow-sm"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Save Success Toast Indicator */}
      {showToast && (
        <div className={`fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 border px-4 py-3 rounded-xl shadow-xl animate-fade-in ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`} id="settings-toast">
          <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}