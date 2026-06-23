import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Edit2, 
  Check, 
  UserCheck, 
  Briefcase, 
  CheckCircle2, 
  Globe, 
  Twitter, 
  Linkedin, 
  Camera, 
  X, 
  Link as LinkIcon,
  ExternalLink,
  MessageSquare,
  UserPlus,
  UserCheck2,
  AlertTriangle,
  Award,
  Calendar,
  Sparkles,
  BookOpen,
  Send,
  Plus,
  Play,
  MapPin,
  Home,
  Users,
  MoreHorizontal,
  Folder,
  Sliders,
  Tv,
  Heart,
  Share2,
  ThumbsUp,
  Settings,
  Pencil,
  Trash2,
  Video,
  Clock,
  Film,
  Palette
} from 'lucide-react';
import { User, Post, AppSettings } from '../types';
import PostCard from './PostCard';
import VirtualPostWrapper from './VirtualPostWrapper';
import CreatePost from './CreatePost';
import { verifiedUsersMock } from '../data';
import { dataRepository } from '../lib/dataRepository';
import ProfileDashboard from './ProfileDashboard';

const COVER_PRESETS = [
  { name: 'Teal Waves', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Aurora Dusk', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Space Nebula', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Cyber Grid', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200' },
  { name: 'Sunset Mountain', url: 'https://images.unsplash.com/photo-1483347756191-4a240f523196?auto=format&fit=crop&q=80&w=1200' }
];

interface ProfileViewProps {
  user: User;
  posts: Post[];
  currentUser: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onAddPost?: (content: string, imageUrl?: string, verificationRecord?: boolean) => void;
  onNavigateToMessages?: (chatUser: User) => void;
  onFollowToggle?: (targetUser: User) => void;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string, newPrivacy?: 'public' | 'friends' | 'private') => void;
  onDeletePost?: (postId: string) => void;
  theme: 'dark' | 'light';
  onSelectUser?: (user: User) => void;
  appSettings?: AppSettings;
  onNavigate?: (tab: string) => void;
}

export default function ProfileView({ 
  user, 
  posts, 
  currentUser, 
  onUpdateProfile, 
  onLike, 
  onRepost, 
  onAddComment,
  onShowToast,
  onAddPost,
  onNavigateToMessages,
  onFollowToggle,
  onEditPost,
  onDeletePost,
  theme,
  onSelectUser,
  appSettings,
  onNavigate
}: ProfileViewProps) {
  // Modal states
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isThoughtModalOpen, setIsThoughtModalOpen] = useState(false);
  const [isCoverMenuOpen, setIsCoverMenuOpen] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  // Profile view sub-tab navigation state
  const [profileActiveTab, setProfileActiveTab] = useState<string>('All');
  const [isInlineEditing, setIsInlineEditing] = useState(false);

  // Editable fields with exact mock fallbacks
  const [livesIn, setLivesIn] = useState(user.livesIn ?? '');
  const [fromLocation, setFromLocation] = useState(user.from ?? '');
  const [school, setSchool] = useState(user.school ?? '');
  const [joinedDate, setJoinedDate] = useState(user.joinedDate ?? 'Joined recently');
  const [displayNameVal, setDisplayNameVal] = useState(user.displayName ?? '');
  const [professionVal, setProfessionVal] = useState(user.profession ?? '');
  const [bioVal, setBioVal] = useState(user.bio ?? '');
  const [customThought, setCustomThought] = useState(localStorage.getItem(`vt_thought_${user.id}`) || 'Share a thought...');

  useEffect(() => {
    setLivesIn(user.livesIn ?? '');
    setFromLocation(user.from ?? '');
    setSchool(user.school ?? '');
    setJoinedDate(user.joinedDate ?? 'Joined recently');
    setDisplayNameVal(user.displayName ?? '');
    setProfessionVal(user.profession ?? '');
    setBioVal(user.bio ?? '');
  }, [user]);

  // --- Dynamic Real-time Social metrics state nodes ---
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [profilesList, setProfilesList] = useState<User[]>([]);
  const [socialLoading, setSocialLoading] = useState<boolean>(false);

  useEffect(() => {
    // 1. Subscribe to followers count
    const unsubFollowers = dataRepository.subscribeToFollowersCount(user.id, (count) => {
      setFollowersCount(count);
    });

    // 2. Subscribe to following count
    const unsubFollowing = dataRepository.subscribeToFollowingCount(user.id, (count) => {
      setFollowingCount(count);
    });

    // 3. Subscribe to friendship status with current authed user
    const unsubFriendship = dataRepository.subscribeToFriendshipStatus(currentUser.id, user.id, (status) => {
      setFriendshipStatus(status);
    });

    // 4. Subscribe to checking if currentUser is following this target user
    const unsubIsFollowing = dataRepository.subscribeToIsFollowing(currentUser.id, user.id, (isFollowingUser) => {
      setIsFollowing(isFollowingUser);
    });

    // 5. Subscribe to all platform profiles to show actual real contacts dynamically
    const unsubProfiles = dataRepository.subscribeToAllProfiles((allProfiles) => {
      setProfilesList(allProfiles);
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
      unsubFriendship();
      unsubIsFollowing();
      unsubProfiles();
    };
  }, [user.id, currentUser.id]);

  const handleFollowAction = async () => {
    if (isOwnProfile || socialLoading) return;
    try {
      setSocialLoading(true);
      if (isFollowing) {
        await dataRepository.unfollowUser(currentUser.id, user.id);
        if (onShowToast) onShowToast(`Unfollowed ${user.displayName}`, 'success');
      } else {
        await dataRepository.followUser(currentUser.id, user.id);
        if (onShowToast) onShowToast(`Successfully followed ${user.displayName}!`, 'success');
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast('Failed to change follow status', 'error');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleFriendAction = async () => {
    if (isOwnProfile || socialLoading) return;
    try {
      setSocialLoading(true);
      if (friendshipStatus === 'none') {
        await dataRepository.sendFriendRequest(currentUser.id, user.id);
        if (onShowToast) onShowToast(`Friend request sent to ${user.displayName}!`, 'success');
      } else if (friendshipStatus === 'pending') {
        await dataRepository.acceptFriendRequest(currentUser.id, user.id);
        if (onShowToast) onShowToast(`Approved connection request from ${user.displayName}!`, 'success');
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast('Failed to execute relationship activity', 'error');
    } finally {
      setSocialLoading(false);
    }
  };

  const activeContactsList = useMemo(() => {
    const filtered = profilesList.filter(p => p.id !== user.id);
    if (filtered.length > 0) {
      return filtered.slice(0, 4);
    }
    return verifiedUsersMock.slice(0, 4);
  }, [profilesList, user.id]);

  const isOwnProfile = user.id === currentUser.id;
  const isDark = theme === 'dark';

  // Creation modal states
  const [isCreateReelOpen, setIsCreateReelOpen] = useState(false);
  const [isCreatePhotoOpen, setIsCreatePhotoOpen] = useState(false);
  const [isCreateMemoryOpen, setIsCreateMemoryOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  // Form input streams state nodes
  const [newReelCaption, setNewReelCaption] = useState('');
  const [newReelVideoUrl, setNewReelVideoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newMemoryTitle, setNewMemoryTitle] = useState('');
  const [newMemoryYear, setNewMemoryYear] = useState('2026');
  const [newMemoryCaption, setNewMemoryCaption] = useState('');
  const [newMemoryImageUrl, setNewMemoryImageUrl] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventImageUrl, setNewEventImageUrl] = useState('');

  const [rsvpedEventIds, setRsvpedEventIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`vt_rsvps_${currentUser.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const handleToggleRSVP = (eventId: string, eventName: string) => {
    let nextRSVPs;
    if (rsvpedEventIds.includes(eventId)) {
      nextRSVPs = rsvpedEventIds.filter(id => id !== eventId);
      if (onShowToast) onShowToast(`Cancelled registration for "${eventName}"`, "success");
    } else {
      nextRSVPs = [...rsvpedEventIds, eventId];
      if (onShowToast) onShowToast(`Successfully registered! Your ticket for "${eventName}" is secured.`, "success");
    }
    setRsvpedEventIds(nextRSVPs);
    localStorage.setItem(`vt_rsvps_${currentUser.id}`, JSON.stringify(nextRSVPs));
  };

  const handleCreateReelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelVideoUrl.trim()) return;
    if (onAddPost) onAddPost(newReelCaption, newReelVideoUrl, false);
    if (onShowToast) onShowToast("Reel published successfully to your stream ledger!", "success");
    setNewReelCaption(''); setNewReelVideoUrl(''); setIsCreateReelOpen(false);
  };

  const handleCreatePhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    if (onAddPost) onAddPost(newPhotoCaption, newPhotoUrl, false);
    if (onShowToast) onShowToast("Image successfully recorded to your identity photo vault!", "success");
    setNewPhotoCaption(''); setNewPhotoUrl(''); setIsCreatePhotoOpen(false);
  };

  const handleCreateMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryCaption.trim()) return;
    const formattedContent = `✨ [Memory Flashback • Year ${newMemoryYear}] - ${newMemoryTitle}\n\n${newMemoryCaption}\n#Memory`;
    if (onAddPost) onAddPost(formattedContent, newMemoryImageUrl || undefined, false);
    if (onShowToast) onShowToast("Beautiful reminisced flashback logged in your record book!", "success");
    setNewMemoryTitle(''); setNewMemoryYear('2026'); setNewMemoryCaption(''); setNewMemoryImageUrl(''); setIsCreateMemoryOpen(false);
  };

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    const formattedContent = `📅 [Event Hosted]\nName: ${newEventName}\n🕒 Time: ${newEventDate} ${newEventTime}\n📍 Location: ${newEventLocation}\n\n${newEventDescription}\n#Event`;
    if (onAddPost) onAddPost(formattedContent, newEventImageUrl || undefined, false);
    if (onShowToast) onShowToast(`Hosted event "${newEventName}" successfully registered!`, "success");
    setNewEventName(''); setNewEventDate(''); setNewEventTime(''); setNewEventLocation(''); setNewEventDescription(''); setNewEventImageUrl(''); setIsCreateEventOpen(false);
  };

  const userPosts = useMemo(() => {
    return posts.filter(post => (post.author && post.author.id === user.id) || post.authorId === user.id);
  }, [posts, user.id]);

  const dynamicEvents = useMemo(() => {
    return userPosts.filter(p => p.content.includes('#Event') || p.content.includes('[Event Hosted]')).map(post => {
      // Parse details
      const lines = post.content.split('\n');
      const nameLine = lines.find(l => l.startsWith('Name: ')) || '';
      const eventName = nameLine.replace('Name: ', '').trim() || 'Custom Assemblage';
      
      const timeLine = lines.find(l => l.startsWith('🕒 Time: ')) || '';
      const eventTime = timeLine.replace('🕒 Time: ', '').trim() || 'TBD';

      const locLine = lines.find(l => l.startsWith('📍 Location: ')) || '';
      const eventLocation = locLine.replace('📍 Location: ', '').trim() || 'Online';

      const descStartIndex = lines.findIndex(l => l.startsWith('📍 Location: '));
      let description = '';
      if (descStartIndex !== -1) {
        description = lines.slice(descStartIndex + 1).filter(l => !l.includes('#Event')).join('\n').trim();
      } else {
        description = post.content;
      }

      return {
        id: post.id,
        name: eventName,
        time: eventTime,
        location: eventLocation,
        description: description || 'No summary description provided.',
        imageUrl: post.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400',
        creator: user.displayName
      };
    });
  }, [userPosts, user.displayName]);

  const earnedBadges = useMemo(() => {
    const list = [
      {
        name: user.badgeLevel ? `${user.badgeLevel.toUpperCase()} LEVEL ID` : "SECURE IDENT GRADE",
        subtitle: "Identity Clear",
        description: "Successfully passed biometrics and scanned authentic Government Credentials.",
        icon: <ShieldCheck className="w-5 h-5 text-white" />,
        bgColor: isDark ? "bg-slate-950 border-slate-955/40" : "bg-white border-gray-300 shadow-sm",
      },
      {
        name: "SPOTLESS PROFILE",
        subtitle: "Zero Infractions",
        description: "Maintained a spotless system profile with no active reports or database warnings.",
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
        bgColor: isDark ? "bg-slate-950 border-slate-955/40" : "bg-white border-gray-300 shadow-sm",
      },
      {
        name: "PIONEER LEDGER",
        subtitle: "Early Adopter",
        description: "Registered during the inception phase of the Municipality Hub Ledger System.",
        icon: <Sparkles className="w-5 h-5 text-white" />,
        bgColor: isDark ? "bg-slate-950 border-slate-955/40" : "bg-white border-gray-300 shadow-sm",
      }
    ];

    if (user.followersCount >= 10 || user.isVerified) {
      list.push({
        name: "TRUST CO-SIGNER",
        subtitle: "Active Peer",
        description: "Vouched by multiple authenticated network citizens as a secure digital publisher.",
        icon: <Globe className="w-5 h-5 text-white" />,
        bgColor: isDark ? "bg-slate-950 border-slate-955/40" : "bg-white border-gray-300 shadow-sm",
      });
    } else {
      list.push({
        name: "CITIZEN GRADE",
        subtitle: "Community Tier",
        description: "Established active citizen profile and began building consensus relations.",
        icon: <UserCheck2 className="w-5 h-5 text-white" />,
        bgColor: isDark ? "bg-slate-950 border-slate-955/40" : "bg-white border-gray-300 shadow-sm",
      });
    }
    return list;
  }, [user, isDark]);

  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('bg-gradient-to-tr from-[#1877F2] to-emerald-500');
  const [typedMessage, setTypedMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { senderId: user.id, text: "Hello! Thank you for connecting with my professional profile feed.", time: "10:15 AM" }
  ]);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleStartInlineEdit = () => {
    setLivesIn(user.livesIn ?? '');
    setFromLocation(user.from ?? '');
    setSchool(user.school ?? '');
    setJoinedDate(user.joinedDate ?? 'Joined recently');
    setDisplayNameVal(user.displayName ?? '');
    setProfessionVal(user.profession ?? '');
    setBioVal(user.bio ?? '');
    setIsInlineEditing(true);
  };

  const handleCancelInlineEdit = () => setIsInlineEditing(false);

  const handleSaveInlineProfile = () => {
    onUpdateProfile({ 
      livesIn, 
      from: fromLocation, 
      school, 
      joinedDate,
      displayName: displayNameVal,
      profession: professionVal,
      bio: bioVal
    });
    setIsInlineEditing(false);
    if (onShowToast) onShowToast("Profile details updated successfully!", "success");
  };

  const handleUpdateThought = (newThought: string) => {
    setCustomThought(newThought);
    localStorage.setItem(`vt_thought_${user.id}`, newThought);
    setIsThoughtModalOpen(false);
    if (onShowToast) onShowToast("Status thought updated!", "success");
  };

  const compressAndUpload = (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        const maxDim = isCover ? 1200 : 256;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onUpdateProfile({ [isCover ? 'coverPhoto' : 'avatar']: dataUrl });
          if (onShowToast) onShowToast(`${isCover ? 'Cover photo' : 'Profile picture'} updated successfully!`, 'success');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStory = () => {
    if (!storyText.trim()) return;
    if (onShowToast) onShowToast("Story successfully shared with your followers!", "success");
    setStoryText(''); setIsStoryModalOpen(false);
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => { if (onShowToast) onShowToast("Profile link copied to clipboard!", "success"); });
  };

  // High Contrast Context Standard Classes - Fixed layout tracking rules
  const containerClass = isDark 
    ? 'bg-slate-955 border-slate-950 text-gray-200' 
    : 'bg-white border-gray-300 text-gray-900 shadow-sm';

  const innerBentoCardClass = isDark
    ? 'bg-slate-955 border border-slate-955/50'
    : 'bg-white border border-gray-200 shadow-sm';

  const textPrimary = isDark ? 'text-white' : 'text-gray-950 font-black';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-700 font-medium';
  
  // HIGH CONTRAST NIGHT MODE ADJUSTMENT: Fixed text white rendering for personal info blocks
  const detailsLabelColor = isDark ? 'text-white font-extrabold' : 'text-gray-950 font-extrabold';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 select-none" id="facebook-profile-page">
      
      {/* 1. COVER PHOTO & AVATAR BANNER BLOCK */}
      <div className={`rounded-b-3xl border overflow-hidden relative shadow-md ${isDark ? 'bg-slate-955 border-slate-950' : 'bg-white border-gray-200'}`} id="profile-banner-block">
        
        <div 
          className="h-48 sm:h-[260px] md:h-[310px] bg-slate-900 relative overflow-hidden group/cover-container"
          onDragOver={(e) => { e.preventDefault(); if (isOwnProfile) setIsDraggingCover(true); }}
          onDragLeave={() => { if (isOwnProfile) setIsDraggingCover(false); }}
          onDrop={(e) => {
            e.preventDefault(); if (!isOwnProfile) return; setIsDraggingCover(false);
            const file = e.dataTransfer.files?.[0];
            if (file) compressAndUpload({ target: { files: [file] } } as any, true);
          }}
        >
          <img 
            src={user.coverPhoto && user.coverPhoto !== '/assets/image_0.png' ? user.coverPhoto : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'} 
            alt="Profile Cover" 
            className="w-full h-full object-cover transition-all duration-300"
          />

          {isDraggingCover && (
            <div className="absolute inset-0 bg-emerald-950/70 border-4 border-dashed border-emerald-500 flex flex-col items-center justify-center text-emerald-300 font-sans z-30">
              <Camera className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <span className="font-bold text-lg">Drop file to update cover banner</span>
            </div>
          )}
          
          {isOwnProfile && (
            <div className="absolute top-4 right-4 z-40">
              <input type="file" ref={coverInputRef} accept="image/*" onChange={(e) => compressAndUpload(e, true)} className="hidden" />
              <button 
                onClick={() => setIsCoverMenuOpen(!isCoverMenuOpen)}
                className="flex items-center gap-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-100 text-[11px] font-black px-3 py-1.5 rounded-lg cursor-pointer border border-slate-800 shadow-xl"
              >
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                <span>Customize Banner</span>
              </button>

              {isCoverMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsCoverMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl z-50 text-left space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Modify Cover</span>
                      <button onClick={() => setIsCoverMenuOpen(false)} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>
                    </div>

                    <button 
                      onClick={() => { setIsCoverMenuOpen(false); coverInputRef.current?.click(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-lg text-xs font-bold border border-blue-500/20 transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload custom from device</span>
                    </button>

                    <div className="border-t border-zinc-800 my-1 pt-2 space-y-2">
                      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Choose a Preset</span>
                      <div className="grid grid-cols-2 gap-2">
                        {COVER_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => { onUpdateProfile({ coverPhoto: p.url }); setIsCoverMenuOpen(false); }}
                            className="group/preset relative h-12 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                          >
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-1">
                              <span className="text-[8px] text-white font-extrabold text-center leading-none truncate w-full">{p.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Profile Avatar & Metadata Header Block Container */}
        <div className={`px-6 pb-6 relative z-10 text-left border-t ${isDark ? 'bg-slate-955 border-slate-950/60' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 md:-mt-16">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left">
              <div className="relative shrink-0 select-none">
                
                {/* Floating Speech Thought box header elements */}
                <div 
                  onClick={() => isOwnProfile && setIsThoughtModalOpen(true)}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 border rounded-2xl px-3 py-1.5 shadow-md flex items-center justify-center gap-1.5 max-w-[140px] hover:scale-105 transition-all z-30 ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } ${isOwnProfile ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="text-[10px] font-bold truncate">{customThought}</span>
                  <div className={`absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 border-r border-b rotate-45 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-300'}`} />
                </div>

                <div className="relative group/avatar cursor-pointer" onClick={() => isOwnProfile && avatarInputRef.current?.click()}>
                  <img
                    src={user.avatar || "/assets/image_0.png"} alt={user.displayName}
                    className="w-28 h-28 md:w-32 md:h-36 rounded-full object-cover bg-[#18191a] border-4 border-blue-600 shadow-2xl relative z-10"
                  />
                  {isOwnProfile && (
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold z-20 transition">
                      <Camera className="w-5 h-5 text-blue-500 mb-0.5" />
                      <span>Upload</span>
                    </div>
                  )}
                </div>

                {isOwnProfile && (
                  <input type="file" ref={avatarInputRef} accept="image/*" onChange={(e) => compressAndUpload(e, false)} className="hidden" />
                )}
              </div>

              {/* Names and Credentials titles lines blocks */}
              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className={`text-xl sm:text-2xl font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-gray-950'}`}>
                    {user.displayName}
                  </h1>
                  <div className="flex items-center justify-center p-1 rounded-full bg-blue-600/10 border border-blue-500/25 shadow-[0_0_12px_rgba(35,116,225,0.3)] shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-current dark:fill-none" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 justify-center md:justify-start text-xs font-semibold">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-800'}>{user.profession || 'Entrepreneur'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{followersCount} followers • {followingCount} following</span>
                </div>
              </div>
            </div>

            {/* Profile functional buttons actions layout panel */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              {isOwnProfile ? (
                <>
                  <button 
                    onClick={() => setProfileActiveTab('Dashboard')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button 
                      onClick={() => onNavigate && onNavigate('admin')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Admin Design Customizer Settings"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Website Design</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsStoryModalOpen(true)}
                    className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Create</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsMessageModalOpen(true)} className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                  <button 
                    onClick={handleFollowAction}
                    disabled={socialLoading}
                    className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isFollowing 
                        ? (isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' : 'bg-gray-300 text-gray-900 hover:bg-gray-400')
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${socialLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                  <button 
                    onClick={handleFriendAction}
                    disabled={socialLoading}
                    className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      friendshipStatus === 'friends'
                        ? (isDark ? 'bg-zinc-800 text-teal-400 border border-teal-500/20' : 'bg-teal-50 text-teal-700 border border-teal-250')
                        : friendshipStatus === 'pending'
                        ? (isDark ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-yellow-50 text-yellow-700 border border-yellow-250')
                        : (isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-200 text-gray-900 hover:bg-gray-300')
                    } ${socialLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {friendshipStatus === 'friends' ? (
                      <>
                        <Check className="w-4 h-4 text-teal-500" />
                        <span>Connected Partner</span>
                      </>
                    ) : friendshipStatus === 'pending' ? (
                      <>
                        <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />
                        <span>Response Pending</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Partner</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Sub Navigation items slots rows tabs links */}
        <div className={`border-t px-4 flex items-center justify-between select-none ${isDark ? 'bg-slate-955 border-slate-950' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-2">
            {['All', 'Reels', 'Photos', 'Memories', 'Events', 'Dashboard'].map((tab) => {
              const isActive = profileActiveTab === tab;
              return (
                <button
                  key={tab} onClick={() => setProfileActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-tight transition cursor-pointer ${
                    isActive 
                      ? 'bg-blue-600 text-white font-semibold shadow' 
                      : 'text-gray-500 hover:bg-gray-500/10 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <button onClick={handleShareProfile} className="p-2 rounded-lg text-gray-400 hover:text-blue-500 transition cursor-pointer">
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

      </div>

      {/* 2. MAIN SPLIT GRID BODY MODULE CONTAINER */}
      {profileActiveTab === 'Dashboard' ? (
        <ProfileDashboard 
          user={user} 
          currentUser={currentUser} 
          theme={theme} 
          isDark={isDark} 
          posts={posts} 
          onNavigate={onNavigate}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* LEFT COLUMN SUB BENTO SHEET CARD BOX PANEL ELEMENT */}
        <div className="w-full lg:w-[35%] space-y-5 lg:sticky lg:top-[74px]">
          
          <div className={`rounded-2xl border p-4.5 text-left space-y-4 shadow-sm transition-colors duration-300 ${innerBentoCardClass}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs uppercase tracking-wider font-bold flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Personal details</span>
              </h3>
              {isOwnProfile && !isInlineEditing && (
                <button onClick={handleStartInlineEdit} className="p-1.5 rounded-lg bg-gray-500/10 text-blue-600 hover:bg-gray-500/20 transition cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
              )}
            </div>

            {isInlineEditing ? (
              <div className="space-y-3 pt-1">
                {[
                  { label: 'Full Name', val: displayNameVal, set: setDisplayNameVal },
                  { label: 'Profession / Title', val: professionVal, set: setProfessionVal },
                  { label: 'Biography', val: bioVal, set: setBioVal, isTextArea: true },
                  { label: 'Lives In', val: livesIn, set: setLivesIn },
                  { label: 'From Location', val: fromLocation, set: setFromLocation },
                  { label: 'Education', val: school, set: setSchool },
                  { label: 'Joined Date', val: joinedDate, set: setJoinedDate }
                ].map((field, fIdx) => (
                  <div key={fIdx} className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500 block">{field.label}</label>
                    {field.isTextArea ? (
                      <textarea value={field.val} onChange={(e) => field.set(e.target.value)} rows={3} className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    ) : (
                      <input type="text" value={field.val} onChange={(e) => field.set(e.target.value)} className={`w-full border rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelInlineEdit} className="flex-1 py-1.5 bg-gray-500/10 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-500/20 transition cursor-pointer">Cancel</button>
                  <button onClick={handleSaveInlineProfile} className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer">Save Changes</button>
                </div>
              </div>
            ) : (
              // FIXED HIGH-CONTRAST DYNAMIC READABLE INTRO LABELS FOR NIGHT MODE
              <div className="space-y-3 text-xs font-medium text-left">
                {user.bio && (
                  <div className={`p-3 rounded-xl border border-dashed font-sans italic leading-relaxed text-xs mb-2 ${isDark ? 'border-zinc-800 bg-zinc-950/20 text-gray-300' : 'border-gray-200 bg-gray-50/50 text-gray-700'}`}>
                    "{user.bio}"
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🎓</span>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                    Studied at <strong className={detailsLabelColor}>{school || (isOwnProfile ? 'Add school / university' : 'Not specified')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🏠</span>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                    Lives in <strong className={detailsLabelColor}>{livesIn || (isOwnProfile ? 'Add current city' : 'Not specified')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📍</span>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-800'}>
                    From <strong className={detailsLabelColor}>{fromLocation || (isOwnProfile ? 'Add hometown' : 'Not specified')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⏰</span>
                  <p className={isDark ? 'text-gray-300 font-bold' : 'text-gray-600 font-bold'}>{joinedDate}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base">💻</span>
                  <p className="font-extrabold text-blue-600">Digital creator</p>
                </div>
              </div>
            )}
          </div>

          {/* MILICENT CREDENTIAL TRACKERS BADGES DECK CARD MODULE SYSTEM GRID */}
          <div className={`rounded-2xl border p-4.5 text-left space-y-4 shadow-sm transition-colors duration-300 ${innerBentoCardClass}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10 leading-tight">
              <div>
                <h3 className={`text-xs font-bold flex items-center gap-2 font-mono uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Trust Ledger Badges</span>
                </h3>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {earnedBadges.map((badge, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex flex-col items-center text-center relative group overflow-hidden transition ${badge.bgColor}`}>
                  <div className="p-2 rounded-xl bg-blue-600 text-white mb-2 shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
                  <span className={`text-[10px] font-bold uppercase text-center h-6 flex items-center justify-center ${isDark ? 'text-white' : 'text-gray-950'}`}>{badge.name}</span>
                  <span className="text-[9px] text-gray-400 mt-1 uppercase font-mono">{badge.subtitle}</span>

                  <div className="absolute inset-0 bg-black/95 p-3 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition duration-200 text-center">
                    <span className="text-[10px] font-bold text-white mb-1 uppercase tracking-wider">{badge.name}</span>
                    <p className="text-[9px] text-gray-400 font-sans leading-tight mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONNECTIONS FRIEND CARD GRID ATTACHMENT WRAPPER */}
          <div className={`rounded-2xl border p-4 shadow-sm text-left transition-colors duration-300 ${innerBentoCardClass}`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-500/10 mb-3">
              <div className="leading-none">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>Friends</h3>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">{activeContactsList.length} active contacts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {activeContactsList.map((friend, fIdx) => (
                <div key={friend.id} onClick={() => onSelectUser && onSelectUser(friend)} className={`flex flex-col items-center p-2 rounded-xl border border-transparent transition cursor-pointer ${isDark ? 'bg-zinc-950/40 hover:bg-zinc-800' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <div className="relative">
                    <img src={friend.avatar || "/assets/image_0.png"} alt={friend.displayName} className="w-14 h-14 rounded-xl object-cover" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                  </div>
                  <span className={`text-[11px] font-semibold truncate w-full text-center mt-1.5 leading-none ${isDark ? 'text-gray-200' : 'text-gray-950'}`}>{friend.displayName.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN TIMELINE STREAM DISPLAY CHANNELS */}
        <div className="w-full lg:w-[65%] space-y-5">
          
          {profileActiveTab === 'All' && (
            <>
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Timeline Activities ({userPosts.length})</span>
                </h4>
              </div>

              <div className="space-y-[4px]">
                {userPosts.length === 0 ? (
                  <div className={`p-12 text-center border border-dashed rounded-2xl ${isDark ? 'bg-zinc-950/20 border-zinc-800' : 'bg-gray-50 border-gray-300'}`}>
                    <p className="text-sm font-medium text-gray-500">No activity logs recorded inside profile index stream.</p>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <VirtualPostWrapper key={post.id} postId={post.id}>
                      <PostCard
                        post={{ ...post, author: { ...post.author, isVerified: true } }}
                        currentUser={currentUser} onLike={onLike} onRepost={onRepost} onAddComment={onAddComment} onShowToast={onShowToast} onEditPost={onEditPost} onDeletePost={onDeletePost}
                        theme={theme}
                        appSettings={appSettings}
                      />
                    </VirtualPostWrapper>
                  ))
                )}
              </div>
            </>
          )}

          {/* SUB TABS SELECTION VIEWS */}
          {profileActiveTab === 'Reels' && (
            <div className="space-y-4 animate-fade-in">
              <div className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955' : 'bg-white border-gray-300'}`}>
                <div><h4 className="text-sm font-bold flex items-center gap-2 text-blue-600"><Film className="w-5 h-5" /><span>Video Reels Stream</span></h4></div>
                {isOwnProfile && (
                  <button onClick={() => setIsCreateReelOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"><Plus className="w-4 h-4" /><span>Upload Reel</span></button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPosts.filter(p => p.imageUrl && p.imageUrl.includes('.mp4')).map((post) => (
                  <div key={post.id} className="aspect-[9/16] bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer">
                    <video src={post.imageUrl} className="w-full h-full object-cover" muted loop playsInline />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 p-3 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition">
                      <span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow w-max">REEL</span>
                      <p className="text-xs text-white line-clamp-2 leading-tight">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileActiveTab === 'Photos' && (
            <div className="space-y-4 animate-fade-in">
              <div className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955' : 'bg-white border-gray-300'}`}>
                <div><h4 className="text-sm font-bold flex items-center gap-2 text-blue-600"><Camera className="w-5 h-5" /><span>Photo Vault Ledger</span></h4></div>
                {isOwnProfile && (
                  <button onClick={() => setIsCreatePhotoOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"><Plus className="w-4 h-4" /><span>Add Photo</span></button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userPosts.filter(p => p.imageUrl && !p.imageUrl.includes('.mp4')).map((post) => (
                  <div key={post.id} className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative group cursor-pointer hover:border-blue-500 transition">
                    <img src={post.imageUrl} className="w-full h-full object-cover" alt="Ledger media node track" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 text-white font-bold text-xs transition">
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-current text-red-500" /> {post.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileActiveTab === 'Memories' && (
            <div className="space-y-4 animate-fade-in">
              <div className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955' : 'bg-white border-gray-300'}`}>
                <div><h4 className="text-sm font-bold flex items-center gap-2 text-blue-600"><Sparkles className="w-5 h-5" /><span>Nostalgic Memories Logs</span></h4></div>
                {isOwnProfile && (
                  <button onClick={() => setIsCreateMemoryOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"><Plus className="w-4 h-4" /><span>Record Memory</span></button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userPosts.filter(p => p.content.includes('#Memory') || p.content.includes('Memory')).map((post) => (
                  <div key={post.id} className="bg-amber-50 text-gray-900 p-4 rounded-xl border border-amber-200 flex flex-col justify-between aspect-[4/5] transform hover:-rotate-1 transition relative shadow-md">
                    {post.imageUrl ? (
                      <div className="aspect-[4/3] rounded overflow-hidden border border-amber-200"><img src={post.imageUrl} className="w-full h-full object-cover sepia-[0.3]" alt="Retro record" /></div>
                    ) : (
                      <div className="aspect-[4/3] border border-dashed border-amber-300 rounded flex flex-col items-center justify-center text-amber-800/50"><Sparkles className="w-5 h-5 mb-1" /><span className="text-[10px] font-mono font-black">RETRO RECORD</span></div>
                    )}
                    <div className="flex-1 pt-2 flex flex-col justify-between">
                      <p className="text-xs font-serif italic text-left leading-relaxed line-clamp-4">"{post.content.replace(/✨|\[Memory.*?\]|#Memory/gi, '').trim()}"</p>
                      <div className="flex justify-between items-center border-t border-amber-300/40 pt-2 mt-1">
                        <span className="text-[8px] font-mono text-amber-900/60 uppercase">LEDGER IDENT PROFILE</span>
                        <button onClick={() => onLike(post.id)} className="text-red-500"><Heart className={`w-3.5 h-3.5 ${post.isLikedByMe ? 'fill-current' : ''}`} /></button>
                      </div>
                    </div>
                    <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-8 h-2 bg-red-500/20 rounded shadow-sm rotate-1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {profileActiveTab === 'Events' && (
            <div className="space-y-4 animate-fade-in">
              <div className={`flex items-center justify-between rounded-2xl p-4 shadow-sm border transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955' : 'bg-white border-gray-300'}`}>
                <div><h4 className="text-sm font-bold flex items-center gap-2 text-blue-600"><Calendar className="w-5 h-5" /><span>Hosted Assemblies & Events</span></h4></div>
                {isOwnProfile && (
                  <button onClick={() => setIsCreateEventOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"><Plus className="w-4 h-4" /><span>Host Event</span></button>
                )}
              </div>

              <div className="space-y-3">
                <div className={`p-4 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955/40' : 'bg-white border-gray-200'}`}>
                  <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=400" className="w-full sm:w-32 aspect-video rounded-xl object-cover border border-gray-500/10" alt="Event logo banner asset" />
                  <div className="flex-1 text-left space-y-1.5">
                    <div className="flex justify-between items-center"><span className="text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shadow">PEER ASSEMBLY</span><span className="text-[10px] text-gray-500 font-mono">2026 • 2:00 PM CET</span></div>
                    <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>Munich Tech Founders Keynote Portal</h5>
                    <p className="text-xs text-gray-500 leading-tight">Interactive discussion with global node operators about hardware safety, iris encryption standards and digital sovereignty.</p>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-500/10 mt-1">
                      <span className="text-[9px] text-gray-400 font-mono">Host: Munich Lab Coordinator</span>
                      <button onClick={() => handleToggleRSVP('static_ev', 'Munich Tech')} className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${rsvpedEventIds.includes('static_ev') ? 'bg-blue-600/10 text-blue-500 border-blue-500/30' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {rsvpedEventIds.includes('static_ev') ? 'GOING ✓' : 'RSVP ATTEND'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamically created/hosted events list */}
                {dynamicEvents.map((ev) => (
                  <div key={ev.id} className={`p-4 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-955/40' : 'bg-white border-gray-200'}`}>
                    <img src={ev.imageUrl} className="w-full sm:w-32 aspect-video rounded-xl object-cover border border-gray-500/10" alt="Event logo banner" />
                    <div className="flex-grow text-left space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow">PEER ASSEMBLY</span>
                        <span className="text-[10px] text-gray-500 font-mono">{ev.time}</span>
                      </div>
                      <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-950'}`}>{ev.name}</h5>
                      <p className="text-xs text-gray-500 leading-tight">{ev.description}</p>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-500/10 mt-1">
                        <span className="text-[9px] text-gray-400 font-mono">Host: {ev.creator} &bull; {ev.location}</span>
                        <button onClick={() => handleToggleRSVP(ev.id, ev.name)} className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition ${rsvpedEventIds.includes(ev.id) ? 'bg-blue-600/10 text-blue-500 border-blue-500/30 font-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                          {rsvpedEventIds.includes(ev.id) ? 'GOING ✓' : 'RSVP ATTEND'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      )}

      {/* ================= MODALS DRAWERS PORTALS POPUPS ================= */}

      {/* I. STORY GENERATION SUB SYSTEM BOX FRAME MODAL */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Create New Story</h3>
              <button onClick={() => setIsStoryModalOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className={`w-full h-32 rounded-xl p-3 flex flex-col justify-between text-white relative shadow-inner ${storyBg}`}>
                <span className="text-[8px] font-mono uppercase font-bold text-white/70">Story Preview canvas</span>
                <p className="text-xs font-black text-center text-white italic">"{storyText || "Type custom message..."}"</p>
                <span className="text-[7px] text-right font-mono text-white/40">24h EXPLICIT TIME LIFE</span>
              </div>
              <input type="text" placeholder="Type a story text label..." maxLength={70} value={storyText} onChange={(e) => setStoryText(e.target.value)} className={`w-full border rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} />
            </div>
            <div className="px-4 py-3 border-t border-gray-500/10 flex justify-end gap-2 bg-gray-500/5">
              <button onClick={() => setIsStoryModalOpen(false)} className="px-3 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold">Discard</button>
              <button onClick={handlePublishStory} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow">Publish Story</button>
            </div>
          </div>
        </div>
      )}

      {/* II. USER CONTEXT CHAT ENGINE PANEL SIMULATOR MODAL */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col h-[450px]">
            <div className="flex items-center justify-between px-4 py-3.5 bg-zinc-950 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="Avatar messaging" />
                <div className="text-left leading-none">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1">{user.displayName}<CheckCircle2 className="w-3 h-3 text-blue-500 fill-current" /></h3>
                  <span className="text-[8px] font-mono text-blue-500 uppercase font-black tracking-widest mt-0.5 block">SECURE DIRECT NODE</span>
                </div>
              </div>
              <button onClick={() => setIsMessageModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col justify-end">
              {chatLogs.map((msg, cIdx) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={cIdx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                    <div className={`px-3 py-2 rounded-xl text-xs max-w-[80%] leading-snug ${isMe ? 'bg-blue-600 text-white shadow-sm' : 'bg-zinc-950 border border-zinc-800 text-gray-200'}`}>{msg.text}</div>
                    <span className="text-[8px] text-gray-500 font-mono px-1">{msg.time}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
              <input type="text" value={typedMessage} onChange={(e) => setTypedMessage(e.target.value)} placeholder="Write secure node message..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500" />
              <button onClick={() => {
                if (!typedMessage.trim()) return;
                setChatLogs([...chatLogs, { senderId: currentUser.id, text: typedMessage, time: "Now" }]);
                setTypedMessage('');
                setTimeout(() => setChatLogs(p => [...p, { senderId: user.id, text: "Your session validation credential logic logs match perfectly.", time: "Now" }]), 1000);
              }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* III. QUICK SPEECH THOUGHT LABELS UPDATE PORTAL MODAL */}
      {isThoughtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Update Floating Thought</h3>
              <button onClick={() => setIsThoughtModalOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const d = new FormData(e.currentTarget); handleUpdateThought(d.get('thought') as string); }} className="p-4 space-y-4">
              <p className="text-[11px] text-gray-500 leading-tight text-left">This thought speech row element bubble sits float directly above your round circular profile logo canvas area slots.</p>
              <input type="text" name="thought" defaultValue={customThought === 'Share a thought...' ? '' : customThought} placeholder="Type floating avatar message..." maxLength={45} required className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-gray-300 text-gray-900 shadow-sm'}`} />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsThoughtModalOpen(false)} className="px-3 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow">Update thought</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IV. REEL UPLOAD MODAL */}
      {isCreateReelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Upload New Reel Video</h3>
              <button onClick={() => setIsCreateReelOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateReelSubmit} className="p-4 space-y-4 text-left font-sans">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Video URL or Preset</label>
                <input 
                  type="url" 
                  value={newReelVideoUrl}
                  onChange={(e) => setNewReelVideoUrl(e.target.value)}
                  placeholder="Paste direct MP4 video link..." 
                  required 
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
                <div className="flex gap-1.5 pt-1.5 flex-wrap">
                  <button type="button" onClick={() => setNewReelVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Stars</button>
                  <button type="button" onClick={() => setNewReelVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-leaves-on-a-blue-sky-background-4809-large.mp4")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Leaves</button>
                  <button type="button" onClick={() => setNewReelVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-a-cliff-43022-large.mp4")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Ocean</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reel Caption Text</label>
                <textarea 
                  value={newReelCaption}
                  onChange={(e) => setNewReelCaption(e.target.value)}
                  placeholder="Describe your short reel video element..." 
                  maxLength={150}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 h-20 resize-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreateReelOpen(false)} className="px-3.5 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer">Publish Reel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* V. PHOTO UPLOAD MODAL */}
      {isCreatePhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Add New Photo to Vault</h3>
              <button onClick={() => setIsCreatePhotoOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePhotoSubmit} className="p-4 space-y-4 text-left font-sans">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Photo URL Link</label>
                <input 
                  type="url" 
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste direct JPG/PNG photo link..." 
                  required 
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
                <div className="flex gap-1.5 pt-1.5 flex-wrap">
                  <button type="button" onClick={() => setNewPhotoUrl("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Beach</button>
                  <button type="button" onClick={() => setNewPhotoUrl("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Nature</button>
                  <button type="button" onClick={() => setNewPhotoUrl("https://images.unsplash.com/photo-1513829096999-4978602294fc?auto=format&fit=crop&q=80&w=600")} className="text-[9px] px-2.5 py-1 bg-blue-600/10 text-blue-500 rounded font-bold hover:bg-blue-600/20 transition cursor-pointer">Preset: Cybercity</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Photo Caption</label>
                <input 
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Caption for your image file ledger..." 
                  maxLength={100}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreatePhotoOpen(false)} className="px-3.5 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer">Save Photo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VI. RECORD MEMORY MODAL */}
      {isCreateMemoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Record a Nostalgic Memory</h3>
              <button onClick={() => setIsCreateMemoryOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateMemorySubmit} className="p-4 space-y-4 text-left font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Memory Title</label>
                  <input 
                    type="text" 
                    value={newMemoryTitle}
                    onChange={(e) => setNewMemoryTitle(e.target.value)}
                    placeholder="Graduation / Journey" 
                    required 
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Year Occurred</label>
                  <input 
                    type="number" 
                    value={newMemoryYear}
                    onChange={(e) => setNewMemoryYear(e.target.value)}
                    placeholder="2012" 
                    required 
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Memory Narrative Description</label>
                <textarea 
                  value={newMemoryCaption}
                  onChange={(e) => setNewMemoryCaption(e.target.value)}
                  placeholder="Relive and record your retro nostalgic memory narrative..." 
                  required
                  maxLength={300}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 h-24 resize-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Optional Memory Image URL</label>
                <input 
                  type="url" 
                  value={newMemoryImageUrl}
                  onChange={(e) => setNewMemoryImageUrl(e.target.value)}
                  placeholder="Optional background photo URL link..." 
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreateMemoryOpen(false)} className="px-3.5 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer">Record Memory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VII. HOST EVENT MODAL */}
      {isCreateEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-500/10">
              <h3 className={`text-xs font-black uppercase ${isDark ? 'text-white' : 'text-gray-950'}`}>Host Unified Event Assembly</h3>
              <button onClick={() => setIsCreateEventOpen(false)} className="text-gray-400 hover:text-blue-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateEventSubmit} className="p-4 space-y-3.5 text-left font-sans">
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assembly Event Name</label>
                <input 
                  type="text" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. Technology Core Keydiscussion" 
                  required 
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</label>
                  <input 
                    type="date" 
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required 
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                  />
                </div>
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Time</label>
                  <input 
                    type="time" 
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    required 
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location Info / Room</label>
                  <input 
                    type="text" 
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="e.g. Munich Node, Germany or Online" 
                    required 
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Assembly Description</label>
                <textarea 
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Outline the rules, agendas and expectations for the peer network assembly..." 
                  required
                  maxLength={400}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 h-20 resize-none ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Banner Image URL</label>
                <input 
                  type="url" 
                  value={newEventImageUrl}
                  onChange={(e) => setNewEventImageUrl(e.target.value)}
                  placeholder="Paste direct banner photo link (optional)..." 
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-sm'}`} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsCreateEventOpen(false)} className="px-3.5 py-1.5 bg-gray-500/10 text-gray-500 text-xs rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow cursor-pointer">Register Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}