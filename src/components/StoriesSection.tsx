import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, X, CheckCircle2, ChevronLeft, ChevronRight, Send, Check } from 'lucide-react';
import { User, AppSettings } from '../types';
import { hasPermission } from '../lib/permissions';

interface StoriesSectionProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  verifiedUsers: User[];
  theme: 'dark' | 'light'; // Core layout theme token input injection link
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  appSettings?: AppSettings;
}

interface StoryItem {
  id: string;
  user: User;
  mediaUrl: string;
  isViewed: boolean;
  text?: string;
  timeLabel?: string;
}

export default function StoriesSection({ currentUser, onSelectUser, verifiedUsers, theme, onShowToast, appSettings }: StoriesSectionProps) {
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  const isDark = theme === 'dark'; // Dynamic theme support

  // Pre-loaded realistic reaction counts for premium user state simulation
  const [reactions, setReactions] = useState<Record<string, { [emoji: string]: number }>>({
    'story_own': { '👍': 4, '❤️': 3, '😮': 1 },
    'story_1_a': { '👍': 14, '❤️': 8, '😮': 1 },
    'story_1_b': { '👍': 19, '❤️': 12, '😮': 3 },
    'story_2': { '👍': 24, '❤️': 15, '😮': 2 },
    'story_3': { '👍': 8, '❤️': 4, '😮': 1 }
  });

  // Sent status active notifications overlay list
  const [messagesSentAlert, setMessagesSentAlert] = useState<{ id: string; text: string }[]>([]);

  // Active floating/rising reaction emojis lists
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Reply text input container
  const [replyText, setReplyText] = useState('');

  const playReactionSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(620, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (_) {}
  };

  const handleReact = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedStory) return;

    playReactionSound();
    const storyId = selectedStory.id;

    // Increment count
    setReactions(prev => {
      const current = prev[storyId] || { '👍': 0, '❤️': 0, '😮': 0 };
      return {
        ...prev,
        [storyId]: {
          ...current,
          [emoji]: (current[emoji] || 0) + 1
        }
      };
    });

    // Spawn floating emojis
    const baseId = Date.now();
    const newEmojis = Array.from({ length: 4 }).map((_, idx) => ({
      id: `${baseId}_${idx}_${Math.random()}`,
      emoji,
      left: Math.floor(Math.random() * 70) + 15, // random path
    }));

    setFloatingEmojis(prev => [...prev, ...newEmojis]);

    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(fe => !newEmojis.some(ne => ne.id === fe.id)));
    }, 1200);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!selectedStory || !replyText.trim()) return;

    const textToSend = replyText.trim();
    setReplyText('');

    // Play chimes sent audio feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(520, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(840, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.18);
    } catch (_) {}

    const replyObj = {
      id: `msg_story_${Date.now()}`,
      sender: 'me' as const,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      recipientAvatar: selectedStory.user.avatar,
      text: `Replied to your story: "${textToSend}"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent' as const
    };

    try {
      const existingReplies = JSON.parse(localStorage.getItem('story_replies') || '[]');
      existingReplies.push({
        recipientName: selectedStory.user.displayName,
        message: replyObj
      });
      localStorage.setItem('story_replies', JSON.stringify(existingReplies));
    } catch (err) {
      console.error(err);
    }

    const alertId = `${Date.now()}_alert`;
    setMessagesSentAlert(prev => [...prev, { id: alertId, text: `Reply sent to ${selectedStory.user.displayName.split(' ')[0]}!` }]);
    
    setTimeout(() => {
      setMessagesSentAlert(prev => prev.filter(x => x.id !== alertId));
    }, 2500);
  };

  const ownStory: StoryItem = {
    id: "story_own",
    user: currentUser,
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    isViewed: false,
    text: "Building high-trust cryptographic layers on verified rails. Active and online! 🌐⚡",
    timeLabel: "Create a story"
  };

  const mockStories: StoryItem[] = [
    {
      id: "story_1_a",
      user: verifiedUsers[0] || currentUser,
      mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
      isViewed: false,
      text: "Checking in from Munich summit! Frame 1 of our product check.",
      timeLabel: "2 new • 21h"
    },
    {
      id: "story_1_b",
      user: verifiedUsers[0] || currentUser,
      mediaUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
      isViewed: false,
      text: "Biometrics and charts are working perfectly. Frame 2 live!",
      timeLabel: "2 new • 21h"
    },
    {
      id: "story_2",
      user: verifiedUsers[1] || currentUser,
      mediaUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
      isViewed: false,
      text: "Verified real developer check 💻 Safe coding everyone!",
      timeLabel: "1 new • 13h"
    },
    {
      id: "story_3",
      user: verifiedUsers[2] || currentUser,
      mediaUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
      isViewed: true,
      text: "Securing identity databases 🛡️ Zero compromised nodes today.",
      timeLabel: "1 new • 19h"
    }
  ];

  const allStories = useMemo(() => [ownStory, ...mockStories], [verifiedUsers, currentUser]);

  const uniqueUsersList = useMemo(() => {
    const map = new Map<string, StoryItem>();
    allStories.forEach(s => {
      if (!map.has(s.user.id)) {
        map.set(s.user.id, s);
      }
    });
    return Array.from(map.values());
  }, [allStories]);

  const activeUserStories = useMemo(() => {
    if (!selectedStory) return [];
    return allStories.filter(s => s.user.id === selectedStory.user.id);
  }, [selectedStory, allStories]);

  const activeSubIndex = activeUserStories.findIndex(s => s.id === selectedStory?.id);

  const handleNextStory = () => {
    if (!selectedStory) return;
    if (activeSubIndex < activeUserStories.length - 1) {
      setSelectedStory(activeUserStories[activeSubIndex + 1]);
    } else {
      const currentGlobalIndex = allStories.findIndex(s => s.id === selectedStory.id);
      if (currentGlobalIndex < allStories.length - 1) {
        setSelectedStory(allStories[currentGlobalIndex + 1]);
      } else {
        setSelectedStory(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (!selectedStory) return;
    if (activeSubIndex > 0) {
      setSelectedStory(activeUserStories[activeSubIndex - 1]);
    } else {
      const currentGlobalIndex = allStories.findIndex(s => s.id === selectedStory.id);
      if (currentGlobalIndex > 0) {
        setSelectedStory(allStories[currentGlobalIndex - 1]);
      }
    }
  };

  useEffect(() => {
    if (!selectedStory) {
      setStoryProgress(0);
      return;
    }
    setStoryProgress(0);
    const duration = 5000;
    const startTime = Date.now();
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setStoryProgress(pct);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        handleNextStory();
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [selectedStory]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setIsAtStart(scrollLeft <= 5);
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
    }
  };

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: direction === 'left' ? -240 : 240, behavior: 'smooth' });
    }
  };

  const handleMobileScreenTapDetection = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.bypass-nav-trigger')) {
      return;
    }
    const { clientWidth } = e.currentTarget;
    const clickXPosition = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const percentageScaleRatio = clickXPosition / clientWidth;

    if (percentageScaleRatio < 0.3) {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  return (
    <div className="w-full relative select-none" id="social-stories-section-root">
      
      {/* 1. HOMEPAGE STREAM ROW CARD PREVIEWS */}
      <div className="relative group/nav-arrows">
        {!isAtStart && (
          <button
            onClick={() => scrollByAmount('left')}
            className={`absolute -left-3 top-[100px] -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition border cursor-pointer ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {!isAtEnd && (
          <button
            onClick={() => scrollByAmount('right')}
            className={`absolute -right-3 top-[100px] -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition border cursor-pointer ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div 
          ref={containerRef} onScroll={handleScroll}
          className="flex gap-2 overflow-x-auto scrollbar-none pb-2 scroll-smooth w-full"
        >
          <div 
            onClick={() => {
              const perm = hasPermission(currentUser, 'canPostStories', appSettings);
              if (!perm.allowed) {
                if (onShowToast) {
                  onShowToast(perm.reason || "আপনার রিল বা স্টোরি তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
                } else {
                  alert(perm.reason || "আপনার রিল বা স্টোরি তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।");
                }
                return;
              }
              setSelectedStory(ownStory);
            }}
            className={`w-[110px] h-[195px] rounded-xl border flex flex-col justify-between overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 shrink-0 relative shadow-sm ${
              isDark ? 'bg-[#242526] border-zinc-800/80 shadow-zinc-950/20' : 'bg-white border-gray-200/85 shadow-slate-200/40'
            }`}
          >
            <div className="flex-grow bg-zinc-950/5 overflow-hidden relative">
              <img src={currentUser.avatar} alt="Me" className="w-[110px] h-[145px] object-cover hover:scale-105 transition-transform duration-300" />
            </div>
            <div className={`h-[50px] relative flex flex-col items-center justify-end pb-2 shrink-0 ${
              isDark ? 'bg-[#242526]' : 'bg-white'
            }`}>
              <div className={`absolute -top-[18px] w-9 h-9 rounded-full bg-[#1877F2] border-[3.5px] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform ${
                isDark ? 'border-[#242526]' : 'border-white'
              }`}>
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className={`text-[11px] font-bold tracking-tight select-none mt-1 ${
                isDark ? 'text-zinc-200' : 'text-[#1c1e21]'
              }`}>Create story</span>
            </div>
          </div>

          {/* Friends Loop Deck cards list layout map */}
          {uniqueUsersList.filter(s => s.id !== 'story_own').map((story) => (
            <div 
              key={story.id} onClick={() => setSelectedStory(story)}
              className={`w-[110px] h-[195px] rounded-xl relative overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300 shrink-0 shadow-sm group border ${
                isDark ? 'border-zinc-800 bg-[#242526] shadow-zinc-950/20' : 'border-gray-200 bg-white shadow-slate-200/40'
              }`}
            >
              <img src={story.mediaUrl} alt={story.user.displayName} className="w-full h-full object-cover group-hover:scale-105 transition duration-350" />
              {/* Premium gradient overlay backdrop at the bottom so user name labels have high contrast and readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
              
              <div className={`absolute top-2.5 left-2.5 rounded-full p-[2px] border ${
                story.isViewed ? 'border-zinc-500/50 bg-black/40' : 'border-[#1877F2] bg-[#1877F2]/10'
              }`}>
                <img src={story.user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-black/10" />
              </div>
              
              <div className="absolute bottom-2 left-2.5 right-2.5 flex flex-col">
                <p className="text-[11.5px] font-bold text-white tracking-wide truncate drop-shadow-[0_1.5px_3.5px_rgba(0,0,0,0.95)] max-w-full font-sans">
                  {story.user.displayName.replace(/^(Dr\.|Mr\.|Mrs\.)\s*/i, '').split(' ')[0]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. FULL SCREEN LIGHTBOX VIEWER PANEL WINDOW */}
      {selectedStory && (
        <div className="fixed inset-0 z-[9999] flex font-sans overflow-hidden bg-black animate-fade-in" id="stories-lightbox-overlay">
          
          {/* DESKTOP MODAL SIDEBAR PANEL GRID */}
          <div className={`w-[360px] h-full hidden md:flex flex-col p-4 shrink-0 justify-between select-none border-r transition-colors duration-300 ${
            isDark 
              ? 'bg-[#18191a] border-[#242526] text-white' 
              : 'bg-white border-gray-250 text-gray-900'
          }`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setSelectedStory(null)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                    isDark 
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
                <span className={`text-lg font-black tracking-tight drop-shadow-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Stories</span>
              </div>
              
              <div className={`text-xs font-bold space-x-3 px-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                <button className="hover:underline cursor-pointer">Archive</button>
                <button className="hover:underline cursor-pointer">Settings</button>
              </div>

              <hr className={isDark ? 'border-zinc-800' : 'border-gray-250'} />

              <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
                <p className={`text-[11px] font-bold uppercase tracking-wider px-1 mb-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>All stories</p>
                
                {uniqueUsersList.map((item) => {
                  const isActive = item.user.id === selectedStory.user.id;
                  return (
                    <div
                      key={item.id} onClick={() => setSelectedStory(item)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition ${
                        isActive 
                          ? isDark 
                            ? 'bg-zinc-800 font-black shadow-inner border border-zinc-700 text-white' 
                            : 'bg-blue-50 font-black shadow-sm border border-blue-250 text-blue-950'
                          : isDark
                            ? 'hover:bg-zinc-800/40 border border-transparent text-gray-300'
                            : 'hover:bg-gray-100 border border-transparent text-gray-700'
                      }`}
                    >
                      <div className={`relative p-[2px] rounded-full bg-zinc-950 border ${item.id === 'story_own' ? 'border-transparent' : item.isViewed ? 'border-zinc-700' : 'border-blue-600'}`}>
                        <img src={item.user.avatar} alt="Avatar Frame" className="w-9 h-9 rounded-full object-cover border border-zinc-900" />
                      </div>
                      <div className="min-w-0 flex-1 leading-tight text-left">
                        <p className={`text-xs font-black drop-shadow-sm ${isActive ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white' : 'text-gray-900')}`}>{item.user.displayName}</p>
                        <span className={`text-[11px] block truncate font-mono mt-0.5 ${isActive ? (isDark ? 'text-indigo-300' : 'text-blue-700') : (isDark ? 'text-zinc-400' : 'text-gray-500')}`}>{item.timeLabel || "Active Tracks"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT CANVAS IMMERSIVE WORKSPACE PREVIEW FRAME WINDOW */}
          <div className="flex-1 h-full flex flex-col items-center justify-center relative bg-black group/viewport">
            
            {/* Mobile View Top Close Button trigger icon layout */}
            <button 
              onClick={() => setSelectedStory(null)}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-zinc-900/80 text-white md:hidden border border-zinc-800 cursor-pointer bypass-nav-trigger"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Nav Switch elements */}
            <button 
              onClick={handlePrevStory}
              className="absolute left-6 z-40 w-11 h-11 rounded-full bg-zinc-900/60 text-white hover:bg-zinc-800 hidden md:flex items-center justify-center opacity-0 group-hover/viewport:opacity-100 transition border border-zinc-800 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNextStory}
              className="absolute right-6 z-40 w-11 h-11 rounded-full bg-zinc-900/60 text-white hover:bg-zinc-800 hidden md:flex items-center justify-center opacity-0 group-hover/viewport:opacity-100 transition border border-zinc-800 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* CENTRAL STORY BOX ASPECT PANEL MODULE CARD LAYOUT ELEMENT CONTAINER */}
            <div 
              onClick={handleMobileScreenTapDetection}
              className="w-full h-full md:h-auto md:max-w-[340px] md:aspect-[9/16] bg-zinc-950 md:rounded-xl overflow-hidden relative shadow-2xl border-none md:border md:border-zinc-900 flex flex-col justify-between cursor-pointer"
            >
              <img src={selectedStory.mediaUrl} alt="Visual Frame Track" className="w-full h-full object-cover absolute inset-0 select-none pointer-events-none z-0" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-transparent to-black/90 z-10 pointer-events-none" />

              {/* TIMING PROCESS LINES PROGRESS OVERLAYS (Locked to active user track boundaries sequence frames matrix data loops) */}
              <div className="absolute top-0 inset-x-0 p-3 pt-6 md:pt-3 space-y-3 z-20 pointer-events-none">
                <div className="flex gap-1 w-full">
                  {activeUserStories.map((s, idx) => {
                    let width = '0%';
                    if (idx < activeSubIndex) width = '100%';
                    else if (idx === activeSubIndex) width = `${storyProgress}%`;
                    return (
                      <div key={s.id} className="h-[2.5px] flex-grow bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-[75ms] linear" style={{ width }} />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2.5">
                  <img src={selectedStory.user.avatar} alt="Author avatar metadata tracking row slot layout" className="w-8 h-8 rounded-full object-cover border border-white/20" />
                  <div className="leading-none text-left">
                    {/* FIXED: text-white enforced across absolute both Day/Night channels view frames boundaries */}
                    <p className="text-sm font-black text-white flex items-center gap-1 font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {selectedStory.user.displayName}
                      {selectedStory.user.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2] fill-current" />}
                    </p>
                    <span className="text-[10px] text-gray-200 font-mono mt-0.5 uppercase tracking-wide block font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                      Frame {activeSubIndex + 1} of {activeUserStories.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* CENTER ACTIVE TEXT FRAME DISCOURSE INTERFACE CARD VIEW DESIGN ELEMENTS */}
              {selectedStory.text && (
                <div className="absolute bottom-24 inset-x-3 p-4 rounded-xl bg-black/90 border border-zinc-800 shadow-2xl z-20 pointer-events-none text-center">
                  <p className="text-base sm:text-lg font-bold text-white tracking-wide leading-snug font-sans drop-shadow-md">
                    {selectedStory.text}
                  </p>
                </div>
              )}

              {/* Rising floating emojis space */}
              <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-xl">
                {floatingEmojis.map((fe) => (
                  <span
                    key={fe.id}
                    className="absolute bottom-20 text-4xl select-none animate-story-float pointer-events-none"
                    style={{ left: `${fe.left}%` }}
                  >
                    {fe.emoji}
                  </span>
                ))}
              </div>

              {/* HUD messages sent alerts overlay */}
              {messagesSentAlert.length > 0 && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none select-none w-[80%]">
                  {messagesSentAlert.map((alert) => (
                    <div 
                      key={alert.id}
                      className="bg-emerald-600/95 text-white text-xs font-black px-3.5 py-2 rounded-full shadow-lg border border-emerald-500/80 flex items-center justify-center gap-2 animate-bounce hover:scale-105 transition"
                      style={{ animationDuration: '0.6s' }}
                    >
                      <span className="bg-white/25 rounded-full p-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <span>{alert.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom Interaction footer input elements fields container panel block */}
              <form 
                onSubmit={handleSendMessage}
                className="absolute bottom-4 inset-x-3 flex flex-col gap-2.5 z-20 bypass-nav-trigger"
              >
                {/* Reaction Pill Controls Row */}
                <div className="flex gap-1.5 justify-center w-full bg-black/45 backdrop-blur-md rounded-2xl py-1.5 px-2.5 border border-zinc-800/40">
                  <button 
                    type="button"
                    onClick={(e) => handleReact('👍', e)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 active:scale-125 transition duration-150 rounded-xl py-1 px-2 text-sm text-white hover:text-blue-400 cursor-pointer border border-transparent hover:border-zinc-700/50"
                  >
                    <span className="text-sm">👍</span>
                    <span className="text-[10px] font-mono font-black text-gray-200">
                      {reactions[selectedStory.id]?.['👍'] ?? 0}
                    </span>
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => handleReact('❤️', e)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 active:scale-125 transition duration-150 rounded-xl py-1 px-2 text-sm text-white hover:text-red-400 cursor-pointer border border-transparent hover:border-zinc-700/50"
                  >
                    <span className="text-sm">❤️</span>
                    <span className="text-[10px] font-mono font-black text-gray-200">
                      {reactions[selectedStory.id]?.['❤️'] ?? 0}
                    </span>
                  </button>

                  <button 
                    type="button"
                    onClick={(e) => handleReact('😮', e)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 active:scale-125 transition duration-150 rounded-xl py-1 px-2 text-sm text-white hover:text-yellow-400 cursor-pointer border border-transparent hover:border-zinc-700/50"
                  >
                    <span className="text-sm">😮</span>
                    <span className="text-[10px] font-mono font-black text-gray-200">
                      {reactions[selectedStory.id]?.['😮'] ?? 0}
                    </span>
                  </button>
                </div>

                {/* Text input reply segment */}
                <div className="flex items-center gap-2 relative">
                  <input 
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/60 border border-zinc-700/60 rounded-full py-2.5 pl-4 pr-10 text-xs text-white placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                  {replyText.trim() && (
                    <button 
                      type="submit"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-1.5 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition cursor-pointer active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>

            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes storyFloatUp {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
            transform: translateY(-20px) scale(1.1) rotate(-6deg);
          }
          100% {
            transform: translateY(-260px) scale(1.5) rotate(16deg);
            opacity: 0;
          }
        }
        .animate-story-float {
          animation: storyFloatUp 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

    </div>
  );
}