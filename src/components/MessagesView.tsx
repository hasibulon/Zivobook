import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SquarePen, 
  Search, 
  Send, 
  ChevronLeft, 
  MessageSquare, 
  X,
  Phone,
  Video,
  Info,
  Sun,
  Moon,
  Check,
  CheckCheck,
  Home,
  Users,
  Flag,
  Globe,
  Inbox,
  Ban,
  Settings,
  CircleUser,
  Paperclip,
  Smile,
  FileText,
  MapPin,
  Image as ImageIcon,
  Mic,
  Volume2,
  Play,
  Pause,
  Trash2,
  Star,
  Pin,
  PhoneOff,
  MicOff,
  VideoOff,
  VolumeX
} from 'lucide-react';
import { User, AppSettings } from '../types';
import { hasPermission } from '../lib/permissions';

interface MessagesViewProps {
  currentUser: User;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onSelectUser: (user: User) => void;
  onGoToFeed?: () => void;
  initialChatUser?: User | null;
  onClearInitialUser?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  appSettings?: AppSettings;
}

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  senderName: string;
  senderAvatar: string;
  text: string;
  time: string;
  status: 'sent' | 'read';
  isStarred?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  attachment?: {
    type: 'image' | 'file' | 'location' | 'voice';
    url?: string;
    name?: string;
    size?: string;
    duration?: number;
  };
}

interface Thread {
  id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  isOnline: boolean;
  messages: ChatMessage[];
  category?: 'direct' | 'group' | 'page' | 'community';
  isPinned?: boolean;
  isBlocked?: boolean;
}

export default function MessagesView({ 
  currentUser, 
  onShowToast, 
  onSelectUser, 
  onGoToFeed, 
  initialChatUser, 
  onClearInitialUser,
  theme = 'dark',
  onToggleTheme,
  appSettings
}: MessagesViewProps) {
  const isLight = theme === 'light';
  const isDark = !isLight;

  // Responsive and active thread state
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showThreadSearch, setShowThreadSearch] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'group' | 'page' | 'community'>('all');
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Calling simulation state
  const [activeCall, setActiveCall] = useState<{
    id: string;
    type: 'audio' | 'video';
    status: 'ringing' | 'connected' | 'ended';
    isMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOn: boolean;
    duration: number;
  } | null>(null);

  // Active Thread draft system, search, and info sidebar
  const [drafts, setDrafts] = useState<{ [threadId: string]: string }>({});
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Switch thread with draft backing
  const handleSelectThread = (threadId: string | null) => {
    if (activeThreadId) {
      setDrafts(prev => ({
        ...prev,
        [activeThreadId]: inputText
      }));
    }
    if (isRecording) {
      handleCancelVoiceRecording();
    }
    setActiveThreadId(threadId);
    if (threadId) {
      setInputText(drafts[threadId] || '');
    } else {
      setInputText('');
    }
    setInChatSearchQuery('');
  };

  // Toggle stargroup message
  const handleToggleStarMessage = (messageId: string) => {
    if (!activeThreadId) return;
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: t.messages.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m)
        };
      }
      return t;
    }));
    onShowToast("Updated starred message references.", "success");
  };

  // Voice messaging & Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);
  const longPressTimerRef = useRef<any>(null);

  // Simulated Voice playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [msgId: string]: number }>({});
  const playbackIntervalRef = useRef<{ [msgId: string]: any }>({});

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      Object.values(playbackIntervalRef.current).forEach((timer: any) => clearInterval(timer));
    };
  }, []);

  // Simulated call timer
  useEffect(() => {
    let timer: any;
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall?.status]);

  // Start Voice Recording
  const handleStartVoiceRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
    onShowToast("Voice Recording started...", "success");
  };

  // Discard Voice Recording
  const handleCancelVoiceRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);
    onShowToast("Voice recording discarded.", "error");
  };

  // Dispatch simulated Voice message
  const handleSendVoiceRecording = () => {
    if (!isRecording || !activeThreadId) return;

    const chatPerm = hasPermission(currentUser, 'canChat', appSettings);
    if (!chatPerm.allowed) {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingSeconds(0);
      onShowToast(chatPerm.reason || "আপনার চ্যাট বা মেসেজ অপশন অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }

    const activeThread = threads.find(t => t.id === activeThreadId);
    if (activeThread && (activeThread.isGroup || activeThread.category === 'group')) {
      const groupPerm = hasPermission(currentUser, 'canUseGroups', appSettings);
      if (!groupPerm.allowed) {
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingSeconds(0);
        onShowToast(groupPerm.reason || "গ্রুপ চ্যাট বা গ্রুপ অপশন ব্যবহার করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
        return;
      }
    }

    const recordedSeconds = recordingSeconds || 3;
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingSeconds(0);

    const descriptionText = `🎤 Voice Message (${recordedSeconds}s)`;
    const newMessage: ChatMessage = {
      id: `msg_voice_${Date.now()}`,
      sender: 'me',
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      text: descriptionText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachment: { type: 'voice', duration: recordedSeconds }
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastMessage: descriptionText,
          lastMessageTime: newMessage.time,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));

    onShowToast("Voice message dispatched.", "success");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          if (t.isBlocked) return t;
          const replyId = `reply_voice_${Date.now()}`;
          const botSeconds = Math.floor(Math.random() * 9) + 4;
          const botText = `🎤 Voice Message (${botSeconds}s)`;
          const autoReply: ChatMessage = {
            id: replyId,
            sender: 'them',
            senderName: t.name,
            senderAvatar: t.avatar,
            text: botText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            attachment: { type: 'voice', duration: botSeconds }
          };
          return {
            ...t,
            lastMessage: `Sent a voice audio clip (${botSeconds}s).`,
            lastMessageTime: autoReply.time,
            messages: [...t.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' as const } : m), autoReply]
          };
        }
        return t;
      }));
      onShowToast("Received a voice reply audio message.", "success");
    }, 2200);
  };

  // Toggle play/pause for simulated custom voice player
  const handleTogglePlayVoice = (msgId: string, durationSeconds: number) => {
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
      if (playbackIntervalRef.current[msgId]) {
        clearInterval(playbackIntervalRef.current[msgId]);
        delete playbackIntervalRef.current[msgId];
      }
      return;
    }
    if (playingVoiceId && playbackIntervalRef.current[playingVoiceId]) {
      clearInterval(playbackIntervalRef.current[playingVoiceId]);
      delete playbackIntervalRef.current[playingVoiceId];
    }
    setPlayingVoiceId(msgId);
    
    const currentProgress = playbackProgress[msgId] || 0;
    const startProgress = currentProgress >= 100 ? 0 : currentProgress;
    setPlaybackProgress(prev => ({ ...prev, [msgId]: startProgress }));

    let progress = startProgress;
    const stepTimeMs = 120;
    const totalDurationMs = durationSeconds * 1000;
    const stepPercentage = (stepTimeMs / totalDurationMs) * 100;

    playbackIntervalRef.current[msgId] = setInterval(() => {
      progress += stepPercentage;
      if (progress >= 100) {
        progress = 100;
        setPlaybackProgress(prev => ({ ...prev, [msgId]: 100 }));
        setPlayingVoiceId(null);
        clearInterval(playbackIntervalRef.current[msgId]);
        delete playbackIntervalRef.current[msgId];
      } else {
        setPlaybackProgress(prev => ({ ...prev, [msgId]: progress }));
      }
    }, stepTimeMs);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(560, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.09);
    } catch(err) {}
  };

  // Close settings dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  // Close active reaction message options when clicking outside the message group
  useEffect(() => {
    function handleGlobalClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (activeReactionMessageId && target) {
        const msgElement = target.closest('.relative.group');
        if (!msgElement) setActiveReactionMessageId(null);
      }
    }
    document.addEventListener("mousedown", handleGlobalClick);
    return () => { document.removeEventListener("mousedown", handleGlobalClick); };
  }, [activeReactionMessageId]);

  useEffect(() => {
    setShowSettingsDropdown(false);
  }, [activeThreadId]);

  // Initial boilerplate threads
  const [threads, setThreads] = useState<Thread[]>(() => {
    return [
      {
        id: '1',
        name: 'Dr. Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        isGroup: false,
        unreadCount: 2,
        lastMessage: 'Hi! I have verified our research reports.',
        lastMessageTime: '10:42 AM',
        isOnline: true,
        category: 'direct',
        messages: [
          { id: 'm1', sender: 'them', senderName: 'Dr. Elena Rostova', senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', text: 'Hello there! Let me know when you have checked the local database.', time: '10:30 AM', status: 'read' },
          { id: 'm2', sender: 'me', senderName: currentUser.displayName, senderAvatar: currentUser.avatar, text: 'Absolutely! I will run the checks now.', time: '10:35 AM', status: 'read' },
          { id: 'm3', sender: 'them', senderName: 'Dr. Elena Rostova', senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', text: 'Hi! I have verified our research reports.', time: '10:42 AM', status: 'sent' }
        ]
      },
      {
        id: '2',
        name: 'Workspace Team Chat',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=200',
        isGroup: true,
        category: 'group',
        unreadCount: 0,
        lastMessage: 'Aria: Can we review tomorrow afternoon?',
        lastMessageTime: 'Yesterday',
        isOnline: true,
        messages: [
          { id: 'm4', sender: 'them', senderName: 'Aria Bennett', senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', text: 'Can we review tomorrow afternoon?', time: '5:15 PM', status: 'read' }
        ]
      },
      {
        id: 'page_1',
        name: 'Prothom Alo Tech',
        avatar: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=200',
        isGroup: false,
        category: 'page',
        unreadCount: 1,
        lastMessage: 'Check out the list of top 10 gadgets of this month!',
        lastMessageTime: '09:15 AM',
        isOnline: false,
        messages: [
          { id: 'p1_m1', sender: 'them', senderName: 'Prothom Alo Tech', senderAvatar: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=200', text: 'Hello followers! Here is the list of top 10 gadgets of this month.', time: '09:15 AM', status: 'sent' }
        ]
      },
      {
        id: 'comm_1',
        name: 'Bangladesh Programmers Hub',
        avatar: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=200',
        isGroup: true,
        category: 'community',
        unreadCount: 3,
        lastMessage: 'Rakib: We are organizing a webinar on System Design.',
        lastMessageTime: 'Yesterday',
        isOnline: true,
        messages: [
          { id: 'c1_m1', sender: 'them', senderName: 'Rakib Chowdhury', senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', text: 'We are organizing a webinar on System Design.', time: 'Yesterday', status: 'sent' }
        ]
      }
    ];
  });

  const threadsRef = useRef(threads);
  useEffect(() => { threadsRef.current = threads; }, [threads]);

  useEffect(() => {
    if (initialChatUser) {
      const currentThreads = threadsRef.current;
      const existing = currentThreads.find(t => t.name === initialChatUser.displayName);
      if (existing) {
        setActiveThreadId(existing.id);
      } else {
        const newId = `new_${Date.now()}`;
        const newThread: Thread = {
          id: newId,
          name: initialChatUser.displayName,
          avatar: initialChatUser.avatar,
          isGroup: false,
          unreadCount: 0,
          lastMessage: 'Opened a new direct chat channel.',
          lastMessageTime: 'Now',
          isOnline: true,
          messages: []
        };
        setThreads(prev => [newThread, ...prev]);
        setActiveThreadId(newId);
      }
      if (onClearInitialUser) {
        setTimeout(() => { onClearInitialUser(); }, 0);
      }
    }
  }, [initialChatUser, onClearInitialUser]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages]);

  useEffect(() => {
    if (activeThreadId) {
      setThreads(prev => prev.map(t => t.id === activeThreadId ? { ...t, unreadCount: 0 } : t));
    }
  }, [activeThreadId]);

  useEffect(() => {
    const syncStoryReplies = () => {
      const rawReplies = localStorage.getItem('story_replies');
      if (!rawReplies) return;
      try {
        const replies = JSON.parse(rawReplies) as { recipientName: string; message: any }[];
        if (replies.length === 0) return;

        setThreads(prev => {
          let updatedThreads = [...prev];
          let updatedAny = false;

          replies.forEach(reply => {
            let threadIndex = updatedThreads.findIndex(t => 
              t.name.toLowerCase() === reply.recipientName.toLowerCase() || 
              (reply.recipientName.includes("Elena") && t.name.includes("Elena")) ||
              (t.name.includes("Elena") && reply.recipientName.includes("Elena"))
            );

            if (threadIndex !== -1) {
              const thread = updatedThreads[threadIndex];
              const exists = thread.messages.some(m => m.id === reply.message.id);
              if (!exists) {
                updatedThreads[threadIndex] = {
                  ...thread,
                  lastMessage: reply.message.text,
                  lastMessageTime: reply.message.time,
                  messages: [...thread.messages, reply.message]
                };
                updatedAny = true;
              }
            } else {
              const newId = `story_thread_${Date.now()}_${Math.random()}`;
              const newThread = {
                id: newId,
                name: reply.recipientName,
                avatar: reply.message.recipientAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                isGroup: false,
                category: 'direct' as const,
                unreadCount: 0,
                lastMessage: reply.message.text,
                lastMessageTime: reply.message.time,
                isOnline: true,
                messages: [reply.message]
              };
              updatedThreads = [newThread, ...updatedThreads];
              updatedAny = true;
            }
          });
          return updatedAny ? updatedThreads : prev;
        });
      } catch (e) { console.error(e); }
    };
    syncStoryReplies();
    const interval = setInterval(syncStoryReplies, 1500);
    return () => clearInterval(interval);
  }, []);

  const activeFriends = [
    { id: 'active_1', name: 'Dr. Elena Krylova', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' },
    { id: 'active_2', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
    { id: 'active_3', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { id: 'active_4', name: 'Oliver Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' }
  ];

  const handleSelectActiveFriend = (friend: { name: string; avatar: string }) => {
    const existing = threads.find(t => t.name.toLowerCase() === friend.name.toLowerCase());
    if (existing) {
      handleSelectThread(existing.id);
    } else {
      const newId = `thread_${Date.now()}`;
      const newThread: Thread = {
        id: newId,
        name: friend.name,
        avatar: friend.avatar,
        isGroup: false,
        unreadCount: 0,
        lastMessage: 'Active secure messaging channel opened.',
        lastMessageTime: 'Now',
        isOnline: true,
        messages: []
      };
      setThreads(prev => [newThread, ...prev]);
      handleSelectThread(newId);
    }
    onShowToast(`Opened message with ${friend.name}`, "success");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId) return;

    const chatPerm = hasPermission(currentUser, 'canChat', appSettings);
    if (!chatPerm.allowed) {
      onShowToast(chatPerm.reason || "আপনার চ্যাট বা মেসেজ অপশন অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }

    const activeThread = threads.find(t => t.id === activeThreadId);
    if (activeThread && (activeThread.isGroup || activeThread.category === 'group')) {
      const groupPerm = hasPermission(currentUser, 'canUseGroups', appSettings);
      if (!groupPerm.allowed) {
        onShowToast(groupPerm.reason || "গ্রুপ চ্যাট বা গ্রুপ অপশন ব্যবহার করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
        return;
      }
    }

    const userText = inputText.trim();
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastMessage: userText,
          lastMessageTime: newMessage.time,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));
    setInputText('');
    setIsTyping(true);

    const txtLower = userText.toLowerCase();
    let replyText = `Awesome! Received your message. Everything is in sync and running securely.`;
    if (txtLower.includes('hi') || txtLower.includes('hello')) {
      replyText = `Hello! Hope you are having a wonderful day. Let me know how I can assist with our tasks.`;
    } else if (txtLower.includes('project') || txtLower.includes('code')) {
      replyText = `Working smoothly! The current workspace state is synchronized.`;
    }

    setTimeout(() => {
      setIsTyping(false);
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          if (t.isBlocked) return t;
          const autoReply: ChatMessage = {
            id: `reply_${Date.now()}`,
            sender: 'them',
            senderName: t.name,
            senderAvatar: t.avatar,
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          };
          return {
            ...t,
            lastMessage: autoReply.text,
            lastMessageTime: autoReply.time,
            messages: [...t.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' as const } : m), autoReply]
          };
        }
        return t;
      }));
      onShowToast("Received a new response.", "success");
    }, 1800);
  };

  const handleSendAttachment = (type: 'image' | 'file' | 'location') => {
    if (!activeThreadId) return;

    const chatPerm = hasPermission(currentUser, 'canChat', appSettings);
    if (!chatPerm.allowed) {
      onShowToast(chatPerm.reason || "আপনার চ্যাট বা মেসেজ অপশন অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }

    const activeThread = threads.find(t => t.id === activeThreadId);
    if (activeThread && (activeThread.isGroup || activeThread.category === 'group')) {
      const groupPerm = hasPermission(currentUser, 'canUseGroups', appSettings);
      if (!groupPerm.allowed) {
        onShowToast(groupPerm.reason || "গ্রুপ চ্যাট বা গ্রুপ অপশন ব্যবহার করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
        return;
      }
    }

    let attachmentPayload: any = null;
    let descriptionText = "";

    if (type === 'image') {
      attachmentPayload = { type: 'image', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600', name: 'abstract_gradient.jpg', size: '1.2 MB' };
      descriptionText = `Sent an image: abstract_gradient.jpg`;
    } else if (type === 'file') {
      attachmentPayload = { type: 'file', name: 'System_Architecture_Specs.docx', size: '1.5 MB' };
      descriptionText = `Sent a document: System_Architecture_Specs.docx`;
    } else if (type === 'location') {
      attachmentPayload = { type: 'location', name: 'Dhaka, Bangladesh', url: 'https://maps.google.com/?q=Dhaka,Bangladesh' };
      descriptionText = `Shared location: Dhaka, Bangladesh`;
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'me',
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      text: descriptionText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      attachment: attachmentPayload
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastMessage: descriptionText,
          lastMessageTime: newMessage.time,
          messages: [...t.messages, newMessage]
        };
      }
      return t;
    }));
    setShowAttachmentMenu(false);
    onShowToast(`Dispatched simulated ${type} media.`, "success");
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!activeThreadId) return;
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        const updatedMessages = t.messages.map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingIndex = reactions.findIndex(r => r.emoji === emoji);
            let newReactions = [...reactions];
            if (existingIndex > -1) {
              const reaction = reactions[existingIndex];
              const userIndex = reaction.users.indexOf(currentUser.displayName);
              if (userIndex > -1) {
                const updatedUsers = [...reaction.users];
                updatedUsers.splice(userIndex, 1);
                if (updatedUsers.length === 0) newReactions.splice(existingIndex, 1);
                else newReactions[existingIndex] = { emoji, count: reaction.count - 1, users: updatedUsers };
              } else {
                newReactions[existingIndex] = { emoji, count: reaction.count + 1, users: [...reaction.users, currentUser.displayName] };
              }
            } else {
              newReactions.push({ emoji, count: 1, users: [currentUser.displayName] });
            }
            return { ...msg, reactions: newReactions };
          }
          return msg;
        });
        return { ...t, messages: updatedMessages };
      }
      return t;
    }));
    setActiveReactionMessageId(null);
  };

  const handleToggleBlock = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    const nextBlocked = !thread.isBlocked;
    onShowToast(nextBlocked ? `${thread.name} has been blocked.` : `${thread.name} has been unblocked.`, nextBlocked ? 'error' : 'success');
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isBlocked: nextBlocked } : t));
  };

  const handleTogglePinThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    const nextPinned = !thread.isPinned;
    onShowToast(nextPinned ? `Conversation pinned.` : `Conversation unpinned.`, 'success');
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, isPinned: nextPinned } : t));
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeThreadId) return;
    const activeThread = threads.find(t => t.id === activeThreadId);
    if (activeThread) {
      const msg = activeThread.messages.find(m => m.id === messageId);
      if (msg && msg.status === 'read') {
        onShowToast("মেসেজটি অপর পক্ষ দেখে ফেলেছে, তাই আর ডিলিট করা সম্ভব নয়।", "error");
        return;
      }
    }
    onShowToast("Message unsent & deleted.", "success");
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        const updatedMessages = t.messages.filter(m => m.id !== messageId);
        const lastMsg = updatedMessages[updatedMessages.length - 1];
        return { ...t, messages: updatedMessages, lastMessage: lastMsg ? lastMsg.text : "No messages" };
      }
      return t;
    }));
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeThreadId) return;
    const activeThread = threads.find(t => t.id === activeThreadId);
    if (!activeThread) return;

    setActiveCall({
      id: `call_${Date.now()}`,
      type,
      status: 'ringing',
      isMuted: false,
      isCameraOff: false,
      isSpeakerOn: false,
      duration: 0
    });
    onShowToast(`${activeThread.name} কে কল করা হচ্ছে...`, "success");

    setTimeout(() => {
      setActiveCall(prev => {
        if (prev && prev.status === 'ringing') {
          onShowToast(`কল কানেক্ট হয়েছে!`, "success");
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 3000);
  };

  const handleEndCall = () => {
    if (!activeCall || !activeThreadId) return;
    const finalDuration = activeCall.duration;
    const callTypeStr = activeCall.type === 'video' ? 'ভিডিও কল' : 'অডিও কল';
    const durationStr = `${Math.floor(finalDuration / 60)}:${String(finalDuration % 60).padStart(2, '0')}`;

    const systemMessage: ChatMessage = {
      id: `msg_call_sys_${Date.now()}`,
      sender: 'me',
      senderName: currentUser.displayName || 'Me',
      senderAvatar: currentUser.avatar || '',
      text: `📞 ${callTypeStr} শেষ হয়েছে। সময়কাল: ${durationStr}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    };

    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return { ...t, lastMessage: `${callTypeStr} শেষ হয়েছে (${durationStr})`, lastMessageTime: 'এখন', messages: [...t.messages, systemMessage] };
      }
      return t;
    }));
    setActiveCall(null);
    onShowToast(`${callTypeStr} শেষ হয়েছে।`, "error");
  };

  const unfilteredFilteredThreads = threads.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return t.unreadCount > 0;
    if (selectedFilter === 'group') return t.isGroup === true || t.category === 'group';
    if (selectedFilter === 'page') return t.category === 'page';
    if (selectedFilter === 'community') return t.category === 'community';
    return true;
  });

  const filteredThreads = [...unfilteredFilteredThreads].sort((a, b) => {
    const pinA = a.isPinned ? 1 : 0;
    const pinB = b.isPinned ? 1 : 0;
    return pinB - pinA;
  });

  // HIGH-CONTRAST THEME MANAGEMENT MATRIX
  const mainBgClass = isLight ? 'bg-[#f0f2f5]' : 'bg-[#18191a]';
  const panelBgClass = isLight ? 'bg-white border-gray-200' : 'bg-[#242526] border-zinc-800/80';
  const textTitleClass = isLight ? 'text-gray-950 font-black' : 'text-white font-bold';
  const textBodyClass = isLight ? 'text-gray-900 font-bold' : 'text-zinc-200';
  const textMutedClass = isLight ? 'text-gray-600 font-semibold' : 'text-zinc-400';
  const borderSeparatorClass = isLight ? 'border-gray-200' : 'border-zinc-800/60';
  return (
    <div 
      className={`fixed inset-0 w-full h-full z-[55] flex flex-col font-sans select-none overflow-hidden transition-colors duration-300 ${mainBgClass}`} 
      id="messenger-app-interface"
    >
      <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] w-full h-full flex-grow overflow-hidden relative">
        
        {/* LEFTSIDE THREADS LIST PANEL */}
        <div 
          className={`flex flex-col h-full w-full shrink-0 min-h-0 overflow-hidden border-r transition-all duration-250 ${panelBgClass} ${
            activeThreadId ? 'hidden md:flex' : 'flex'
          }`}
          id="messenger-left-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] max-md:py-2.5 max-md:pt-2.5 max-md:border-t max-md:border-b-0 max-md:shadow-inner order-5 md:order-none shrink-0" id="messenger-left-header">
            {showThreadSearch ? (
              <div className="flex items-center gap-2 flex-1 animate-fade-in w-full">
                <Search className={`w-4 h-4 shrink-0 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`bg-transparent flex-1 text-xs focus:outline-none font-bold ${isLight ? 'text-gray-950 placeholder-gray-500 font-bold' : 'text-zinc-100 placeholder-zinc-500'}`}
                  id="search-threads-input-inside-header"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowThreadSearch(false);
                  }}
                  className={`text-xs px-2 py-1 rounded-lg font-bold ${isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-zinc-800 text-zinc-400'}`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {onGoToFeed && (
                  <button
                    onClick={onGoToFeed}
                    className={`md:hidden p-2 rounded-full transition active:scale-95 ${isLight ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-zinc-900 text-zinc-250 hover:bg-zinc-805'}`}
                    id="btn-back-to-feed-mob"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
                <h1 className={`text-2xl font-black tracking-tight ${textTitleClass}`}>Messages</h1>
              </div>
            )}

            {!showThreadSearch && (
              <div className="flex items-center gap-2">
                {onGoToFeed && (
                  <button
                    onClick={onGoToFeed}
                    className={`p-2 rounded-full transition active:scale-95 border cursor-pointer ${isLight ? 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800' : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-white'}`}
                    title="Home"
                    id="btn-internal-home"
                  >
                    <Home className="w-4 h-4" />
                  </button>
                )}
                {/* Search Toggle button adjacent to Home */}
                <button
                  onClick={() => setShowThreadSearch(true)}
                  className={`p-2 rounded-full transition active:scale-95 border cursor-pointer ${isLight ? 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800' : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-white'}`}
                  title="Search"
                  id="btn-threads-search-toggle"
                >
                  <Search className="w-4 h-4" />
                </button>
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className={`p-2 rounded-full transition active:scale-95 border cursor-pointer ${isLight ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-600' : 'bg-zinc-955 hover:bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-white'}`}
                    title={isLight ? "Dark Mode" : "Light Mode"}
                    id="btn-internal-theme"
                  >
                    {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="px-4 pb-3 shrink-0 hidden md:block" id="messenger-search">
            <div className={`rounded-full flex items-center px-4 py-2 border transition-all ${isLight ? 'bg-white border-gray-300 focus-within:border-gray-500' : 'bg-zinc-900 border-zinc-800 focus-within:border-zinc-700'}`}>
              <Search className={`w-4 h-4 mr-2.5 shrink-0 ${isLight ? 'text-gray-700' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent flex-1 text-xs focus:outline-none ${isLight ? 'text-gray-950 font-bold placeholder-gray-500' : 'text-zinc-100 placeholder-zinc-500'}`}
                id="search-threads-input"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] md:pt-0 shrink-0 order-1 md:order-none" id="messenger-filters-container">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" id="messenger-filters-list">
              {[
                { id: 'all', label: 'All', icon: Inbox },
                { id: 'unread', label: 'Unread', icon: MessageSquare, badge: threads.filter(t => t.unreadCount > 0).length },
                { id: 'group', label: 'Group', icon: Users },
                { id: 'page', label: 'Pages', icon: Flag },
                { id: 'community', label: 'Communities', icon: Globe }
              ].map(tab => {
                const isActive = selectedFilter === tab.id;
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedFilter(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                        : isLight ? 'bg-white hover:bg-gray-100 border-gray-300 text-gray-900 shadow-sm' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                    }`}
                    id={`filter-tab-${tab.id}`}
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.badge && tab.badge > 0 ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Friends Row */}
          <div className="px-4 py-1 shrink-0 order-2 md:order-none" id="messenger-active-friends">
            <div className="flex gap-3.5 overflow-x-auto py-1 scrollbar-none">
              {activeFriends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => handleSelectActiveFriend(friend)}
                  className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
                  id={`btn-active-friend-${friend.id}`}
                >
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 p-0.5" />
                    <span className="absolute bottom-0 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
                  </div>
                  <span className={`text-[10px] font-bold max-w-[62px] truncate ${isLight ? 'text-gray-950 font-black' : 'text-zinc-200'}`}>
                    {friend.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto px-2 py-1 order-3 md:order-none" id="threads-container">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 gap-2">
                <MessageSquare className="w-8 h-8 text-slate-400" />
                <span className="text-xs">No conversations found</span>
              </div>
            ) : (
              filteredThreads.map(thread => {
                const isSelected = activeThreadId === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={`p-3.5 flex items-center gap-3.5 transition duration-150 cursor-pointer rounded-xl my-1 border ${
                      isSelected 
                        ? isLight ? 'bg-blue-50 border-blue-200 text-blue-950 shadow-sm' : 'bg-zinc-900 border-zinc-800 text-white shadow-lg' 
                        : isLight ? 'bg-transparent border-transparent hover:bg-gray-100 text-gray-900' : 'bg-transparent border-transparent hover:bg-zinc-900/50 text-white'
                    }`}
                    id={`thread-row-${thread.id}`}
                  >
                    <div className="relative shrink-0">
                      <img src={thread.avatar} alt={thread.name} className={`w-14 h-14 rounded-full object-cover border ${isLight ? 'border-gray-200' : 'border-zinc-900'}`} />
                      {thread.isOnline && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-955" />}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className={`text-[13.5px] font-bold truncate flex items-center gap-1.5 ${isSelected ? (isLight ? 'text-blue-950 font-black' : 'text-white') : (isLight ? 'text-gray-950 font-extrabold' : 'text-slate-100')} ${thread.unreadCount > 0 ? 'font-black' : ''}`}>
                          <span className="truncate">{thread.name}</span>
                          {thread.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 rotate-45 shrink-0" />}
                          {thread.isBlocked && <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/15 text-rose-600 rounded">Blocked</span>}
                        </p>
                        <span className={`text-[10px] ${thread.unreadCount > 0 ? 'text-[#0084FF] font-black' : textMutedClass}`}>
                          {thread.lastMessageTime}
                        </span>
                      </div>
                      <p className={`text-[12px] truncate mt-0.5 ${thread.unreadCount > 0 ? 'text-black dark:text-zinc-100 font-bold' : textMutedClass}`}>
                        {drafts[thread.id] ? (
                          <span className="text-amber-600 font-bold dark:text-amber-400">[Draft] <span className="opacity-80 font-normal">{drafts[thread.id]}</span></span>
                        ) : (
                          thread.lastMessage
                        )}
                      </p>
                    </div>

                    {thread.unreadCount > 0 && <span className="w-5 h-5 bg-[#0084FF] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{thread.unreadCount}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHTSIDE CHAT CONTENT PANEL */}
        <div className={`flex flex-col h-full w-full min-w-0 min-h-0 overflow-hidden ${activeThreadId ? 'flex' : 'hidden md:flex'}`} id="messenger-right-panel">
          {activeThread ? (
            <div className={`flex flex-row flex-1 min-h-0 h-full select-none overflow-hidden ${mainBgClass}`} id="active-chat-row-container">
              {/* PRIMARY CHAT COLUMN */}
              <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden relative">
                {/* Header */}
                <div className={`p-4 md:py-3.5 md:pt-[calc(0.85rem+env(safe-area-inset-top,0px))] max-md:py-2.5 max-md:border-t max-md:border-b-0 border-b flex items-center justify-between shrink-0 order-3 md:order-none transition-all duration-300 ${panelBgClass}`} id="active-chat-header">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button 
                      onClick={() => handleSelectThread(null)} 
                      className={`md:hidden p-2 rounded-full transition-all duration-155 active:scale-90 shrink-0 ${
                        isLight ? 'bg-gray-100 hover:bg-gray-200 text-slate-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                      }`} 
                      id="btn-active-chat-back"
                    >
                      <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    
                    <div className="relative shrink-0 select-none">
                      <img 
                        src={activeThread.avatar} 
                        alt={activeThread.name} 
                        className={`w-[52px] h-[52px] md:w-14 md:h-14 rounded-full object-cover border-2 shadow-sm transition-all duration-350 cursor-pointer hover:scale-105 ${
                          isLight 
                            ? 'border-blue-500/25 p-0.5 bg-white' 
                            : 'border-blue-500/30 p-0.5 bg-zinc-950'
                        }`} 
                      />
                      {activeThread.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 shadow animate-pulse" />
                      )}
                    </div>

                    <div className="text-left flex flex-col justify-center min-w-0">
                      <h2 
                        className={`text-sm md:text-base font-extrabold truncate whitespace-nowrap leading-tight tracking-tight ${textTitleClass}`} 
                        title={activeThread.name}
                      >
                        {activeThread.name.length > 15 ? activeThread.name.substring(0, 13) + '...' : activeThread.name}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-1 shrink-0">
                        <span className={`w-2 h-2 rounded-full inline-block ${activeThread.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        <p className={`text-[11px] font-bold leading-none ${textMutedClass}`}>
                          {activeThread.isOnline ? 'Active now' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleStartCall('audio')} 
                      className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
                        isLight 
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                          : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                      }`}
                      title="Voice Call"
                    >
                      <Phone className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                    
                    <button 
                      onClick={() => handleStartCall('video')} 
                      className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 cursor-pointer ${
                        isLight 
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                      title="Video Call"
                    >
                      <Video className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                    
                    <button 
                      onClick={() => setShowInfoSidebar(!showInfoSidebar)} 
                      className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 border cursor-pointer ${
                        showInfoSidebar 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20 shadow-md' 
                          : isLight 
                              ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700' 
                              : 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400'
                      }`} 
                      id="btn-toggle-info-sidebar"
                      title="Conversation Info"
                    >
                      <Info className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                    
                    <div className="relative" ref={settingsRef}>
                      <button 
                        onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} 
                        className={`p-2.5 rounded-full transition-all duration-200 active:scale-90 border cursor-pointer ${
                          showSettingsDropdown 
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md' 
                            : isLight 
                                ? 'bg-amber-50 border-amber-100 hover:bg-amber-100 text-amber-700' 
                                : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-indigo-400'
                        }`} 
                        id="btn-chat-settings-toggle"
                        title="Settings"
                      >
                        <Settings className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                      </button>
                      <AnimatePresence>
                        {showSettingsDropdown && (
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 5 }} className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border z-[60] overflow-hidden py-1.5 text-left ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-zinc-950 border-zinc-900 text-zinc-200'}`} id="chat-settings-dropdown-menu">
                            <p className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider border-b mb-1 ${isLight ? 'text-gray-500 border-gray-200' : 'text-zinc-500 border-zinc-900'}`}>Chat Settings</p>
                            <button onClick={() => { setShowProfileModal(true); setShowSettingsDropdown(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 border-b ${isLight ? 'border-gray-100 hover:bg-gray-50 text-gray-950' : 'border-zinc-900/40 hover:bg-zinc-900'}`}><CircleUser className="w-4 h-4 text-blue-500" /><span>Profile</span></button>
                            <button onClick={() => { handleTogglePinThread(activeThread.id); setShowSettingsDropdown(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 border-b ${isLight ? 'border-gray-100 hover:bg-gray-50 text-gray-950' : 'border-zinc-900/40 hover:bg-zinc-900'}`}><Pin className={`w-4 h-4 ${activeThread.isPinned ? 'text-amber-500 fill-amber-500' : 'text-indigo-500'}`} /><span>{activeThread.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span></button>
                            <button onClick={() => { handleToggleBlock(activeThread.id); setShowSettingsDropdown(false); }} className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 ${isLight ? 'hover:bg-gray-50 text-gray-950' : 'hover:bg-zinc-900'}`}><Ban className={`w-4 h-4 ${activeThread.isBlocked ? 'text-emerald-500' : 'text-rose-500'}`} /><span>{activeThread.isBlocked ? 'Unblock User' : 'Block User'}</span></button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* In-chat Keyword Search Bar */}
                <div className={`px-4 py-2 border-b flex items-center justify-between shrink-0 order-1 md:order-none ${borderSeparatorClass}`} id="in-chat-search-panel">
                  <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input type="text" value={inChatSearchQuery} onChange={(e) => setInChatSearchQuery(e.target.value)} placeholder="Search in conversation..." className={`text-[12.5px] font-semibold w-full bg-transparent focus:outline-none ${isLight ? 'text-gray-950 font-bold placeholder-gray-500' : 'text-zinc-200 placeholder-zinc-500'}`} />
                  </div>
                  {inChatSearchQuery && <button onClick={() => setInChatSearchQuery('')} className="p-1 hover:bg-gray-500/10 rounded-full text-gray-500"><X className="w-3.5 h-3.5" /></button>}
                </div>

                {/* Message log list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none order-2 md:order-none" id="active-messages-container">
                  {activeThread.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-1.5 text-slate-400">
                      <MessageSquare className="w-7 h-7" />
                      <span className="text-xs font-semibold">Start of safe encrypted messaging channel</span>
                    </div>
                  ) : (() => {
                    const filteredMessages = activeThread.messages.filter(m => m.text.toLowerCase().includes(inChatSearchQuery.toLowerCase()));
                    if (filteredMessages.length === 0) return <div className="text-center text-xs text-gray-500 py-12">No messages match search.</div>;

                    return filteredMessages.map(msg => {
                      const isMe = msg.sender === 'me';
                      
                      const handleStartLongPress = (e: React.MouseEvent | React.TouchEvent) => {
                        if ('button' in e && e.button !== 0) return;
                        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
                        longPressTimerRef.current = setTimeout(() => {
                          if (navigator.vibrate) try { navigator.vibrate(50); } catch (err) {}
                          setActiveReactionMessageId(msg.id);
                        }, 800);
                      };
                      const handleCancelLongPress = () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };

                      return (
                        <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                          {!isMe && <img src={msg.senderAvatar} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover shrink-0 select-none align-bottom mb-0.5" />}
                          <div className="flex flex-col">
                            <div className="relative group">
                              <div 
                                onMouseDown={handleStartLongPress} onMouseUp={handleCancelLongPress} onMouseLeave={handleCancelLongPress}
                                onTouchStart={handleStartLongPress} onTouchEnd={handleCancelLongPress}
                                className={`px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed break-words shadow-sm text-left ${
                                  isMe 
                                    ? 'bg-[#0084FF] text-white rounded-br-none font-bold shadow-md' 
                                    : isLight ? 'bg-white border border-gray-300 text-gray-950 font-bold rounded-bl-none' : 'bg-[#242526] text-zinc-100 rounded-bl-none font-medium'
                                }`}
                              >
                                {msg.attachment && (
                                  <div className="mb-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-left">
                                    {msg.attachment.type === 'image' && <div className="rounded-lg overflow-hidden border border-black/5 mb-1 max-h-48"><img src={msg.attachment.url} className="w-full h-auto object-cover max-h-48" /></div>}
                                    {msg.attachment.type === 'file' && <div className="flex items-center gap-2 text-xs font-bold py-1"><FileText className="w-4.5 h-4.5 text-sky-500 shrink-0" /><span className="truncate max-w-[155px] text-[11px] text-gray-950 dark:text-white">{msg.attachment.name}</span></div>}
                                    {msg.attachment.type === 'location' && <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-black text-sky-500 hover:underline"><MapPin className="w-4 h-4 text-emerald-500" /><span>{msg.attachment.name}</span></a>}
                                    {msg.attachment.type === 'voice' && (
                                      <div className="flex items-center gap-3 py-1.5 px-1 min-w-[210px]">
                                        <button type="button" onClick={() => handleTogglePlayVoice(msg.id, msg.attachment?.duration || 5)} className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow ${isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                                          {playingVoiceId === msg.id ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                                        </button>
                                        <div className="flex-1 flex flex-col gap-1">
                                          <div className="flex items-end gap-[2px] h-4 min-w-[120px]">
                                            {Array.from({ length: 20 }).map((_, waveIdx) => {
                                              const activeValue = playbackProgress[msg.id] || 0;
                                              const isPast = (waveIdx / 20) * 100 <= activeValue;
                                              return <div key={waveIdx} className={`w-[3px] rounded-full h-[60%] ${playingVoiceId === msg.id && isPast ? 'bg-amber-500' : isMe ? 'bg-white/40' : 'bg-gray-400 dark:bg-zinc-650'}`} />;
                                            })}
                                          </div>
                                          <span className="text-[9px] text-left opacity-80">Voice Message</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <span>{msg.text}</span>
                              </div>

                              {/* Tool action triggers float panel option click context menu */}
                              {activeReactionMessageId === msg.id && (
                                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-20 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                  <button onClick={() => handleToggleStarMessage(msg.id)} className={`p-1.5 rounded-full border cursor-pointer shadow-sm ${msg.isStarred ? 'bg-amber-500 text-white' : isLight ? 'bg-white border-gray-300 text-amber-500' : 'bg-zinc-900 border-zinc-800 text-amber-500'}`}><Star className={`w-3.5 h-3.5 ${msg.isStarred ? 'fill-current' : ''}`} /></button>
                                  {msg.status !== 'read' && <button onClick={() => handleDeleteMessage(msg.id)} className={`p-1.5 rounded-full border cursor-pointer shadow-sm ${isLight ? 'bg-white border-gray-300 text-rose-500 hover:bg-rose-50' : 'bg-zinc-900 border-zinc-800 text-rose-500'}`}><Trash2 className="w-3.5 h-3.5" /></button>}
                                </div>
                              )}

                              {/* Reaction Emoji Palette Drawer Overlay */}
                              {activeReactionMessageId === msg.id && (
                                <div className={`absolute z-30 bottom-full mb-1 flex gap-1.5 p-1.5 rounded-full border shadow-2xl ${isLight ? 'bg-white border-gray-300' : 'bg-zinc-950 border-zinc-800'} ${isMe ? 'right-0' : 'left-0'}`}>
                                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(em => <button key={em} onClick={() => handleToggleReaction(msg.id, em)} className="text-sm p-1 hover:scale-125 transition cursor-pointer">{em}</button>)}
                                </div>
                              )}
                            </div>

                            {/* Rendered Reactions labels lists under rows bubble text panels */}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {msg.reactions.map(r => (
                                  <button key={r.emoji} onClick={() => handleToggleReaction(msg.id, r.emoji)} className={`px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1 border ${isLight ? 'bg-gray-50 border-gray-300 text-gray-900 font-bold' : 'bg-zinc-900 border-zinc-800 text-zinc-200'}`}>
                                    <span>{r.emoji}</span>{r.count > 1 && <span className="text-[9px] font-black">{r.count}</span>}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Timestamp information text metadata details wrapper lines rows */}
                            <div className={`text-[10px] mt-0.5 flex items-center gap-1 font-mono font-bold tracking-wide ${isMe ? 'justify-end text-right' : 'justify-start'} ${isLight ? 'text-gray-600' : 'text-zinc-500'}`}>
                              <span>{msg.time}</span>
                              {isMe && (msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500 stroke-[2.5]" /> : <Check className="w-3 h-3 text-gray-400" />)}
                              {msg.isStarred && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 ml-1" />}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Bot Animated Typing Indicator element */}
                  {isTyping && (
                    <div className="flex gap-2.5 max-w-[85%] mr-auto items-end select-none animate-pulse">
                      <img src={activeThread.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" alt="Bot loader typing indicators layout placeholder tracking widget" />
                      <div className="flex flex-col text-left">
                        <div className={`px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 rounded-bl-none ${isLight ? 'bg-gray-200 border border-gray-300' : 'bg-[#242526]'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0.1s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0.3s]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Footer Send Message Layout Segment Interface Box Form Controls */}
                {activeThread.isBlocked ? (
                  <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 order-4 md:order-none ${isLight ? 'bg-red-50 border-red-200 text-gray-900' : 'bg-red-950/20 border-red-900/40 text-zinc-100'}`}>
                    <div className="flex items-center gap-2"><Ban className="w-4 h-4 text-rose-500" /><p className="text-xs font-bold text-left">You have blocked this conversation. Unblock to resume messaging channels updates tracks.</p></div>
                    <button onClick={() => handleToggleBlock(activeThread.id)} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-black rounded-xl shadow cursor-pointer">Unblock user</button>
                  </div>
                ) : isRecording ? (
                  <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 select-none order-4 md:order-none ${panelBgClass}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-xs font-black tracking-wide uppercase text-red-500 animate-pulse">• REC</span>
                      <span className={`text-xs font-mono font-bold tracking-wider ${isLight ? 'text-gray-950 font-black' : 'text-zinc-200'}`}>0:{String(recordingSeconds).padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleCancelVoiceRecording} className="p-2 rounded-xl bg-rose-100 text-rose-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={handleSendVoiceRecording} className="py-2 px-4 rounded-xl bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"><Send className="w-3.5 h-3.5" /><span>Send Voice</span></button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className={`p-4 border-t flex items-center gap-2 shrink-0 order-4 md:order-none ${panelBgClass}`}>
                    <div className="relative">
                      <button type="button" onClick={() => setShowAttachmentMenu(!showAttachmentMenu)} className={`p-2.5 rounded-xl transition duration-150 cursor-pointer ${showAttachmentMenu ? 'bg-blue-600 text-white' : isLight ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-zinc-900 text-zinc-400'}`}><Paperclip className="w-4 h-4" /></button>
                      {showAttachmentMenu && (
                        <div className={`absolute bottom-full left-0 mb-3 w-44 border rounded-2xl shadow-2xl p-1.5 z-40 text-left ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-zinc-950 border-zinc-900 text-zinc-200'}`}>
                          <p className="px-2 py-0.5 text-[8px] font-mono font-bold text-gray-400 uppercase tracking-wider">Attach Mock</p>
                          <button type="button" onClick={() => handleSendAttachment('image')} className="w-full px-2.5 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-500/10 transition"><ImageIcon className="w-4 h-4 text-sky-500" /><span>Image asset</span></button>
                          <button type="button" onClick={() => handleSendAttachment('file')} className="w-full px-2.5 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-500/10 transition"><FileText className="w-4 h-4 text-violet-500" /><span>Document pdf</span></button>
                          <button type="button" onClick={() => handleSendAttachment('location')} className="w-full px-2.5 py-2 text-left text-xs font-bold rounded-xl flex items-center gap-2 hover:bg-gray-500/10 transition"><MapPin className="w-4 h-4 text-emerald-500" /><span>Coordinates</span></button>
                        </div>
                      )}
                    </div>

                    <input type="text" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} className={`flex-1 rounded-xl px-4 py-2.5 text-xs outline-none focus:outline-none border transition ${isLight ? 'bg-gray-100 border-gray-300 text-gray-950 focus:bg-white focus:border-zinc-400 font-semibold' : 'bg-zinc-900 border-transparent text-white focus:border-zinc-800'}`} />
                    {inputText.trim() ? (
                      <button type="submit" className="p-2.5 rounded-xl bg-blue-600 text-white cursor-pointer"><Send className="w-4 h-4" /></button>
                    ) : (
                      <button type="button" onClick={handleStartVoiceRecording} className="p-2.5 rounded-xl bg-emerald-600 text-white cursor-pointer"><Mic className="w-4 h-4 animate-pulse" /></button>
                    )}
                  </form>
                )}
              </div>

              {/* COLLAPSIBLE SIDEBAR INFO COLUMN */}
              {showInfoSidebar && (
                <>
                  <div className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-xs" onClick={() => setShowInfoSidebar(false)} />
                  <div className={`fixed lg:static top-0 right-0 bottom-0 z-50 w-72 border-l h-full flex flex-col shrink-0 select-none overflow-y-auto ${panelBgClass}`} id="chat-info-sidebar">
                    <div className="p-4 border-b flex items-center justify-between shrink-0">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isLight ? 'text-gray-950 font-black' : 'text-zinc-400'}`}>Profile Details</span>
                      <button onClick={() => setShowInfoSidebar(false)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="p-4 flex flex-col items-center text-center gap-4">
                      <div className="relative">
                        <img src={activeThread.avatar} alt={activeThread.name} className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
                        {activeThread.isOnline && <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white dark:border-zinc-950" />}
                      </div>
                      <div className="text-center">
                        <h3 className={`text-xs font-black ${isLight ? 'text-gray-950 font-black' : 'text-zinc-100'}`}>{activeThread.name}</h3>
                        <p className="text-[10px] text-gray-400">Offline</p>
                      </div>

                      <div className={`w-full border-t border-dashed ${borderSeparatorClass}`} />

                      {/* Starred section inside sidebar details */}
                      <div className="w-full text-left">
                        <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 ${isLight ? 'text-gray-950 font-black' : 'text-zinc-400'}`}><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Starred Messages</h4>
                        {activeThread.messages.filter(m => m.isStarred).length === 0 ? (
                          <p className="text-[11px] text-gray-500 italic leading-tight">No message saved yet. Long press a chat bubble to star it.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {activeThread.messages.filter(m => m.isStarred).map(s => (
                              <div key={s.id} className={`p-2 rounded-xl border text-[11px] leading-snug ${isLight ? 'bg-gray-50 border-gray-300 text-gray-950 font-medium' : 'bg-zinc-900/60 border-zinc-800 text-zinc-350'}`}>
                                <div className="flex justify-between items-center mb-0.5 text-blue-500 font-bold"><span>{s.senderName}</span><span className="text-[9px] font-normal text-gray-400">{s.time}</span></div>
                                <p className="truncate">{s.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* EMPTY VIEW on Desktop placeholder deck template window link */
            <div className={`flex-grow flex flex-col items-center justify-center text-center p-8 h-full ${mainBgClass}`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 text-[#0084FF] border ${isLight ? 'bg-white border-gray-300' : 'bg-zinc-900/40 border-zinc-800'}`}><MessageSquare className="w-6 h-6" /></div>
              <h3 className={`font-black text-base mb-1 tracking-tight ${isLight ? 'text-gray-950' : 'text-white'}`}>Rebuild Messenger</h3>
              <p className={`text-xs max-w-[280px] leading-relaxed ${isLight ? 'text-gray-600 font-semibold' : 'text-zinc-500'}`}>Fresh simplified, clean, responsive direct-messaging interface slots starter template layout views system parameters tracks nodes analytics blocks setup.</p>
            </div>
          )}
        </div>

      </div>

      {/* Profile Detail popup slider frame view block module */}
      <AnimatePresence>
        {showProfileModal && activeThread && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="messages-profile-modal-root">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProfileModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" id="messages-profile-modal-backdrop" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border z-[60] text-center transition ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-zinc-950 border-zinc-900 text-zinc-100'}`} id="messages-profile-modal-card">
              <button onClick={() => setShowProfileModal(false)} className={`absolute top-4 right-4 p-2 rounded-full transition ${isLight ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-zinc-900 text-zinc-500'}`}><X className="w-5 h-5" /></button>
              <div className="relative inline-block mx-auto mt-4 mb-4">
                <img src={activeThread.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-xl" alt="profile node avatar visual details panel card slider wrapper asset" />
                {activeThread.isOnline && <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-zinc-950" />}
              </div>
              <h3 className={`font-sans font-black text-xl mb-1 tracking-tight ${isLight ? 'text-gray-950' : 'text-white'}`}>{activeThread.name}</h3>
              <p className={`text-xs font-mono mb-4 px-2.5 py-1 inline-block rounded-full ${activeThread.isOnline ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-gray-100 dark:bg-zinc-900 text-gray-500'}`}>{activeThread.isOnline ? '● Online' : 'Offline'}</p>
              
              <div className={`text-left p-4 rounded-2xl mb-5 space-y-3 border text-xs ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-zinc-900/40 border-zinc-900'}`}>
                <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-zinc-900/60"><span className="text-gray-500 dark:text-zinc-400">Status:</span><span className="font-bold">{activeThread.isBlocked ? 'Blocked' : 'Active'}</span></div>
                <div className="flex justify-between items-center py-1"><span className="text-gray-500 dark:text-zinc-400">Messages:</span><span className="font-mono font-black">{activeThread.messages.length}</span></div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="w-full py-3 bg-gray-950 dark:bg-white text-white dark:text-black text-xs font-black rounded-xl">Close profile</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Outgoing Call screen window simulator portal box frame container stack slot */}
      <AnimatePresence>
        {activeCall && activeThread && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="messages-call-modal-root">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" id="messages-call-modal-backdrop" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="relative w-full max-w-sm rounded-[2.5rem] bg-zinc-950 border border-zinc-900 text-white p-8 shadow-2xl z-[60] flex flex-col items-center justify-between min-h-[500px]" id="messages-call-screen-container">
              <div className="text-center w-full mt-4"><span className="text-[10px] font-black tracking-[0.2em] text-[#0084FF] uppercase bg-[#0084FF]/10 px-3 py-1 rounded-full">{activeCall.type === 'video' ? '📹 Video Call' : '📞 Audio Call'}</span>{activeCall.status === 'ringing' ? <p className="text-zinc-500 text-xs mt-2 font-bold animate-pulse">outgoing ringing...</p> : <p className="text-emerald-400 text-xs mt-2 font-bold">Connected / Live</p>}</div>
              <div className="flex flex-col items-center gap-4 my-auto relative">
                {activeCall.status === 'ringing' && <><div className="absolute inset-0 rounded-full bg-blue-500/15 animate-ping [animation-duration:2s]" /><div className="absolute inset-x-[-12px] inset-y-[-12px] rounded-full bg-blue-500/10 animate-ping [animation-duration:3s]" /></>}
                <img src={activeThread.avatar} className="w-28 h-28 rounded-full object-cover border-4 border-zinc-900 shadow-2xl" alt="call node profile visuals trackers" />
                <h3 className="font-sans font-black text-xl text-white">{activeThread.name}</h3>
                <p className="text-xs text-zinc-400">{activeCall.status === 'ringing' ? 'ringing...' : `connected • ${Math.floor(activeCall.duration / 60)}:${(activeCall.duration % 60).toString().padStart(2, '0')}`}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 w-full px-2 mb-4">
                <button type="button" onClick={() => setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : null)} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition cursor-pointer ${activeCall.isMuted ? 'bg-rose-500 text-white' : 'bg-zinc-900 text-zinc-300'}`}>{activeCall.isMuted ? <MicOff className="w-5 h-5 mb-1" /> : <Mic className="w-5 h-5 mb-1" />}<span className="text-[9px] font-bold">Mute</span></button>
                <button type="button" onClick={() => setActiveCall(p => p ? { ...p, isCameraOff: !p.isCameraOff } : null)} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition cursor-pointer ${activeCall.isCameraOff ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-zinc-300'}`}>{activeCall.isCameraOff ? <VideoOff className="w-5 h-5 mb-1" /> : <Video className="w-5 h-5 mb-1" />}<span className="text-[9px] font-bold">Cam</span></button>
                <button type="button" onClick={() => setActiveCall(p => p ? { ...p, isSpeakerOn: !p.isSpeakerOn } : null)} className={`flex flex-col items-center justify-center p-3 rounded-2xl transition cursor-pointer ${activeCall.isSpeakerOn ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}>{activeCall.isSpeakerOn ? <Volume2 className="w-5 h-5 mb-1" /> : <VolumeX className="w-5 h-5 mb-1" />}<span className="text-[9px] font-bold">Speaker</span></button>
                <button type="button" onClick={handleEndCall} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-600 text-white transition cursor-pointer"><PhoneOff className="w-5 h-5 mb-1" /><span className="text-[9px] font-bold">End</span></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}