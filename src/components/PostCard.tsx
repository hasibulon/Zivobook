import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  Globe, 
  MoreVertical, 
  Flag, 
  AlertTriangle, 
  Loader, 
  X,
  ThumbsUp,
  MapPin,
  Heart,
  Camera,
  Cpu,
  Fingerprint,
  Clock,
  Send,
  Users,
  Lock,
  Pencil,
  Trash2,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, User, Comment, AppSettings } from '../types';
import { createReportInFirestore } from '../lib/firebaseService';
import { hasPermission } from '../lib/permissions';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';

interface PostCardProps {
  key?: any;
  post: Post;
  currentUser: User;
  onLike: (id: string) => any;
  onRepost: (id: string) => any;
  onAddComment: (postId: string, content: string) => any;
  onSelectUser?: (user: User) => any;
  onShowToast?: (message: string, type: 'success' | 'error') => any;
  onSelectHashtag?: (hashtag: string | null) => any;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string, newPrivacy?: 'public' | 'friends' | 'private') => any;
  onDeletePost?: (postId: string) => any;
  theme: 'dark' | 'light'; // থিম সিঙ্ক করার জন্য প্রপ যুক্ত করা হলো
  appSettings?: AppSettings;
}

const REACTION_TYPES = [
  { id: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500 font-extrabold' },
  { id: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-500 font-extrabold' },
  { id: 'care', emoji: '🥰', label: 'Care', color: 'text-amber-500 font-extrabold' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: 'text-amber-450 font-extrabold' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: 'text-yellow-500 font-extrabold' },
  { id: 'surprise', emoji: '😲', label: 'Surprise', color: 'text-purple-500 font-extrabold' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'text-sky-500 font-extrabold' },
  { id: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-600 font-extrabold animate-[bounce_1s_infinite]' },
];

export const bgStylesMap: Record<string, string> = {
  sunset: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white font-extrabold text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center shadow-inner font-sans',
  purple: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center shadow-inner font-sans',
  cyber: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center shadow-inner font-sans',
  midnight: 'bg-[#141517] dark:bg-zinc-950 text-zinc-100 font-bold text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center border border-zinc-805 shadow-inner font-sans',
  rose: 'bg-rose-100 text-rose-950 border border-rose-200 font-extrabold text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center shadow-inner font-sans',
  oceanic: 'bg-gradient-to-r from-blue-400 to-emerald-400 text-white font-bold text-[15px] sm:text-base leading-snug min-h-[160px] flex items-center justify-center p-6 rounded-2xl text-center shadow-inner font-sans',
};

const QUICK_COMMENT_SUGGESTIONS = [
  "উমেজিং! 🔥",
  "অসাধারণ! 👏",
  "একমত! 💯",
  "দারুণ লাগলো 😊",
  "প্রিয় পোস্ট ❤️"
];

const extractFirstUrl = (content: string): string | null => {
  if (!content) return null;
  const match = content.match(/(https?:\/\/[^\s]+)/i);
  return match ? match[0] : null;
};

const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(?:shorts\/|youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }
  const shortsReg = /\/shorts\/([a-zA-Z0-9_-]{11})/;
  const shortsMatch = url.match(shortsReg);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  return null;
};

const getLinkDetails = (urlStr: string) => {
  try {
    const url = new URL(urlStr);
    const domain = url.hostname.replace('www.', '');
    
    let title = domain.charAt(0).toUpperCase() + domain.slice(1);
    let description = `Visit ${domain} to explore updates, resources, and community posts.`;
    let siteName = domain;
    let iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

    if (domain.includes('github.com')) {
      title = 'GitHub: Let’s build from here · GitHub';
      description = 'GitHub is where over 100 million developers shape the future of software, collaborate, and host their projects.';
      siteName = 'GitHub';
    } else if (domain.includes('google.com')) {
      title = 'Google Search';
      description = 'Search the world\'s information, including webpages, images, videos and more.';
      siteName = 'Google';
    } else if (domain.includes('wikipedia.org')) {
      title = 'Wikipedia, the free encyclopedia';
      description = 'Wikipedia is a free online encyclopedia, created and edited by volunteers around the world.';
      siteName = 'Wikipedia';
    } else if (domain.includes('facebook.com')) {
      title = 'Facebook - Log In or Sign Up';
      description = 'Connect with friends, family and other people you know. Share photos and videos.';
      siteName = 'Facebook';
    } else if (domain.includes('linkedin.com')) {
      title = 'LinkedIn: Log In or Sign Up';
      description = 'Manage your professional identity. Build and engage with your professional network.';
      siteName = 'LinkedIn';
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      title = 'X. It’s what’s happening / Twitter';
      description = 'From breaking news and entertainment to sports and politics, get the full story with all the live commentary.';
      siteName = 'X';
    } else if (domain.includes('medium.com')) {
      title = 'Medium – Where good ideas find you.';
      description = 'Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices share their writing.';
      siteName = 'Medium';
    } else if (domain.includes('stackoverflow.com')) {
      title = 'Stack Overflow - Where Developers Learn, Share, & Build Careers';
      description = 'Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge, and build their careers.';
      siteName = 'Stack Overflow';
    } else {
      const pathParts = url.pathname.split('/').filter(p => p.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        title = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.[a-z0-9]+$/i, '')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + ` - ${domain}`;
      }
    }

    return { title, description, siteName, domain, iconUrl };
  } catch (error) {
    return {
      title: urlStr,
      description: 'Explore this shared external link.',
      siteName: 'External Link',
      domain: 'Link',
      iconUrl: ''
    };
  }
};

export default function PostCard({ 
  post, 
  currentUser, 
  onLike, 
  onRepost, 
  onAddComment, 
  onSelectUser, 
  onShowToast,
  onSelectHashtag,
  onEditPost,
  onDeletePost,
  theme,
  appSettings
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Real-time comments and likes optimized states helper
  const [localComments, setLocalComments] = useState<Comment[]>(post.comments || []);
  const [isLikedByMe, setIsLikedByMe] = useState<boolean>(post.isLikedByMe || false);

  const comments = localComments && localComments.length > 0 ? localComments : (post.comments || []);

  // Custom reaction system state
  const [activeReaction, setActiveReaction] = useState<string | null>(isLikedByMe ? 'like' : null);
  const [likesOffset, setLikesOffset] = useState(0);
  const [showReactionsPalette, setShowReactionsPalette] = useState(false);
  const reactionsTimeoutRef = useRef<any>(null);

  // Comment local states
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [showCommentImageInput, setShowCommentImageInput] = useState(false);

  // Menu and reporting modal controls
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [customReason, setCustomReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Edit post state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [editedImageUrl, setEditedImageUrl] = useState(post.imageUrl || '');
  const [editedPrivacy, setEditedPrivacy] = useState<'public' | 'friends' | 'private'>(post.privacy || 'public');
  const [showEditPrivacyDropdown, setShowEditPrivacyDropdown] = useState(false);

  // Edit upload states & refs
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingUpload, setIsEditingUpload] = useState(false);
  const [editUploadError, setEditUploadError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const firstUrl = extractFirstUrl(post.content);
  const displayContent = firstUrl ? post.content.replace(firstUrl, '').trim() : post.content;
  const youtubeId = firstUrl ? getYoutubeId(firstUrl) : null;
  const urlDetails = firstUrl ? getLinkDetails(firstUrl) : null;

  const isPostVideo = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('.mp4') || 
           lower.includes('.mov') || 
           lower.includes('.webm') || 
           lower.includes('.ogg') ||
           lower.startsWith('data:video/') ||
           lower.includes('mixkit.co/videos/');
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 800;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEditingUpload(true);
    setEditUploadError(null);

    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setEditedImageUrl(compressed);
      } else if (file.type.startsWith('video/')) {
        if (file.size > 2 * 1024 * 1024) {
          setEditUploadError('ভিডিও ফাইলটি ২ মেগাবাইটের চেয়ে বড়।');
          setIsEditingUpload(false);
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          setEditedImageUrl(evt.target?.result as string);
          setIsEditingUpload(false);
        };
        reader.readAsDataURL(file);
        return;
      } else {
        setEditUploadError('শুধুমাত্র ছবি বা ভিডিও ফাইল নির্বাচন করুন।');
      }
    } catch (err) {
      console.error(err);
      setEditUploadError('ফাইলটি প্রসেস করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsEditingUpload(false);
      if (editFileInputRef.current) {
        editFileInputRef.current.value = '';
      }
    }
  };

  // Sync editing fields with prop changes
  useEffect(() => {
    setEditedContent(post.content);
    setEditedImageUrl(post.imageUrl || '');
    setEditedPrivacy(post.privacy || 'public');
  }, [post.content, post.imageUrl, post.privacy]);

  // Sync like status from props
  useEffect(() => {
    setIsLikedByMe(post.isLikedByMe || false);
  }, [post.isLikedByMe]);

  // Real-time fields listener
  useEffect(() => {
    if (!post.id) return;
    
    const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const arr: Comment[] = [];
      snapshot.forEach((docItem) => {
        arr.push(docItem.data() as Comment);
      });
      setLocalComments(arr);
    }, (err) => {
      console.warn("Bypassed dynamic comments subscription:", err);
    });

    let unsubscribeLike = () => {};
    if (currentUser?.id) {
      const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.id);
      unsubscribeLike = onSnapshot(likeRef, (docSnap) => {
        setIsLikedByMe(docSnap.exists());
      }, (err) => {
        console.warn("Bypassed dynamic like status subscription:", err);
      });
    }

    return () => {
      unsubscribeComments();
      unsubscribeLike();
    };
  }, [post.id, currentUser?.id]);

  useEffect(() => {
    setActiveReaction(isLikedByMe ? 'like' : null);
    setLikesOffset(0);
  }, [isLikedByMe]);

  if (isDismissed) {
    return null;
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImageUrl.trim()) return;

    let finalComment = commentText.trim();
    if (commentImageUrl.trim()) {
      finalComment += ` [img:${commentImageUrl.trim()}]`;
    }

    onAddComment(post.id, finalComment);
    setCommentText('');
    setCommentImageUrl('');
    setShowCommentImageInput(false);
  };

  const handleSelectReaction = (id: string) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(30); } catch (err) {}
    }

    if (activeReaction === id) {
      setActiveReaction(null);
      setLikesOffset(post.isLikedByMe ? -1 : 0);
      if (post.isLikedByMe) {
        onLike(post.id);
      }
    } else {
      const wasReactionActive = activeReaction !== null;
      setActiveReaction(id);

      if (post.isLikedByMe) {
        setLikesOffset(0);
      } else {
        setLikesOffset(1);
        if (!wasReactionActive) {
          onLike(post.id);
        }
      }
    }
    setShowReactionsPalette(false);
  };

  const handleLikeClick = () => {
    if (activeReaction) {
      handleSelectReaction(activeReaction);
    } else {
      handleSelectReaction('like');
    }
  };

  const handleSubmitReport = async () => {
    const perm = hasPermission(currentUser, 'canReportContent', appSettings);
    if (!perm.allowed) {
      if (onShowToast) {
        onShowToast(perm.reason || "রিপোর্ট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      }
      setShowReportModal(false);
      return;
    }
    setIsReporting(true);
    try {
      const finalReason = reportReason === 'Other' ? customReason.trim() : reportReason;
      await createReportInFirestore({
        postId: post.id,
        postContent: post.content,
        postAuthorName: post.author.displayName,
        reason: finalReason || 'Unspecified Reason',
        reporterId: currentUser.id,
        reporterName: currentUser.displayName || currentUser.username,
      });
      if (onShowToast) {
        onShowToast(`পোস্টটি রিপোর্ট করা হয়েছে: "${finalReason}"`, "success");
      }
      setShowReportModal(false);
      setCustomReason('');
    } catch (error) {
      console.error("Failed to submit report:", error);
      if (onShowToast) {
        onShowToast("রিপোর্ট করা সম্ভব হয়নি। আবার চেষ্টা করুন।", "error");
      }
    } finally {
      setIsReporting(false);
    }
  };

  const handleShare = () => {
    const pathUrl = `${window.location.origin}/posts/${post.id}`;
    navigator.clipboard.writeText(pathUrl)
      .then(() => {
        if (onShowToast) {
          onShowToast("লিংক কিবোর্ডে সফলভাবে কপি করা হয়েছে!", "success");
        }
      })
      .catch((err) => {
        console.error("Clipboard copy failed: ", err);
      });
  };

  const getFriendlyDateShort = (dateStr: string) => {
    try {
      const created = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSeconds < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      
      return created.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return '8h';
    }
  };

  const renderContentWithHashtags = (contentText: string) => {
    if (!contentText) return '';
    const words = contentText.split(/(\s+)/);
    return words.map((word, idx) => {
      if (word.startsWith('#') && word.length > 1) {
        return (
          <span
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectHashtag) {
                onSelectHashtag(word);
              } else if (onShowToast) {
                onShowToast(`টপিক ফিল্টার করা হচ্ছে: ${word}`, "success");
              }
            }}
            className="text-[#1877F2]/90 dark:text-blue-400 font-extrabold hover:underline cursor-pointer transition-colors"
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const renderParagraphs = (text: string, isTruncated: boolean) => {
    const textToRender = isTruncated ? text.slice(0, 150) : text;
    const paragraphs = textToRender.split('\n\n');
    return (
      <div className="h-auto pb-4 space-y-4 px-4" id={`paragraphs-container-${post.id}`}>
        {paragraphs.map((p, idx) => {
          if (p.trim().length === 0) return null;
          const isLast = idx === paragraphs.length - 1;
          return (
            <p 
              key={idx} 
              className={`text-[15px] leading-relaxed font-normal whitespace-pre-wrap select-text font-sans antialiased ${
                isDark ? 'text-zinc-100' : 'text-[#1c1e21]'
              }`}
            >
              {renderContentWithHashtags(p)}
              {isTruncated && isLast && (
                <>
                  <span>...</span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="text-[#1877F2] font-black ml-1.5 focus:outline-none hover:underline cursor-pointer inline-block"
                  >
                    See More
                  </button>
                </>
              )}
              {!isTruncated && isLast && displayContent.length > 150 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-slate-500 hover:text-slate-700 font-bold ml-1.5 focus:outline-none hover:underline cursor-pointer inline-block text-[13px]"
                >
                  See Less
                </button>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  // High Contrast Context Mappings
  const containerClass = isDark 
    ? 'bg-[#18191a] border-zinc-800 text-zinc-100 shadow-zinc-950/40' 
    : 'bg-white border-gray-200 text-[#1c1e21] shadow-sm';

  const textPrimaryClass = isDark ? 'text-slate-100 font-bold text-[15px]' : 'text-[#1c1e21] font-bold text-[15px]';
  const textSecondaryClass = isDark ? 'text-slate-400' : 'text-gray-600 font-medium';
  const commentCardClass = isDark ? 'bg-[#242526] border-zinc-800' : 'bg-gray-100 border-gray-200';

  return (
    <div 
      className={`max-w-xl mx-auto md:rounded-xl md:border border-x-0 md:border-x border-y transition-all duration-300 text-left select-none relative h-auto pb-5 antialiased overflow-hidden ${containerClass}`} 
      id={`post-card-${post.id}`}
    >
      
      {/* 1. Post Header */}
      <div className="flex items-center justify-between p-4" id="post-header-container">
        <div className="flex items-center gap-3" id="post-author-info">
          <img
            src={post.author.avatar}
            alt={post.author.displayName}
            onClick={() => onSelectUser && onSelectUser(post.author)}
            className="w-10 h-10 rounded-full object-cover border border-slate-500/10 hover:border-[#1877F2] cursor-pointer transition-all shrink-0"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span 
                onClick={() => onSelectUser && onSelectUser(post.author)}
                className={`hover:text-[#1877F2] cursor-pointer transition-colors ${textPrimaryClass}`}
              >
                {post.author.displayName}
              </span>
              {post.author.isVerified && (
                <svg
                  className="w-4 h-4 text-[#1877F2] fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-label="Verified"
                  role="img"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
              <button 
                onClick={() => {
                  setIsFollowing(!isFollowing);
                  if (onShowToast) {
                    onShowToast(isFollowing ? `${post.author.displayName}-কে আনফলো করা হয়েছে` : `${post.author.displayName}-কে ফলো করা হচ্ছে`, "success");
                  }
                }}
                className="text-[13px] font-bold text-[#1877F2] hover:underline cursor-pointer select-none ml-1 shrink-0"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            <div className={`flex items-center gap-1.5 text-[12px] mt-0.5 select-none opacity-85 ${isDark ? 'text-slate-400' : 'text-gray-500 font-semibold'}`}>
              <span className="font-mono">{getFriendlyDateShort(post.createdAt)}</span>
              <span>•</span>
              {post.privacy === 'private' ? (
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Only Me" />
              ) : post.privacy === 'friends' ? (
                <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Verified Friends Only" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-[#1877F2] shrink-0" title="Public feed content" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 relative" id="post-header-actions">
          <button
            onClick={() => setShowMenu(!showMenu)}
            type="button"
            className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-slate-400 hover:text-slate-100' : 'hover:bg-gray-100 text-[#65676b] hover:text-[#1c1e21]'}`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              setIsDismissed(true);
              if (onShowToast) {
                onShowToast("পোস্টটি নিউজ ফিড থেকে হাইড করা হয়েছে।", "success");
              }
            }}
            type="button"
            className={`p-2 rounded-full transition-colors shrink-0 cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-slate-400 hover:text-rose-500' : 'hover:bg-gray-100 text-[#65676b] hover:text-rose-500'}`}
            title="Dismiss post"
          >
            <X className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className={`absolute right-0 mt-8 w-40 border rounded-xl shadow-2xl z-20 py-1 overflow-hidden ${isDark ? 'bg-[#18191a] border-slate-800' : 'bg-white border-gray-200'}`}>
                {post.author.id === currentUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-500/10 flex items-center gap-1.5 transition cursor-pointer font-bold border-b ${isDark ? 'text-slate-200 border-zinc-800' : 'text-gray-800 border-gray-100'}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#2374E1]" />
                    <span>Edit Post</span>
                  </button>
                )}

                {(post.author.id === currentUser.id || currentUser.role === 'admin') && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition cursor-pointer font-bold border-b border-gray-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                    <span>Delete Post</span>
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition cursor-pointer font-bold border-0"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Post</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Post Body */}
      <div className="mt-2.5 space-y-2.5">
        {isEditing ? (
          <div className={`p-4 rounded-2xl space-y-3.5 text-left animate-fade-in relative z-10 shadow-inner border ${isDark ? 'bg-zinc-950 border-zinc-900' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">Edit Discourse Content</label>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className={`w-full min-h-[110px] p-2.5 border rounded-xl text-xs font-sans focus:outline-none focus:border-[#2374E1] focus:ring-1 focus:ring-[#2374E1]/30 resize-y leading-relaxed ${isDark ? 'bg-zinc-900 border-zinc-800 text-slate-100' : 'bg-white border-gray-300 text-gray-950'}`}
                placeholder="Submit your updated verification updates..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                ref={editFileInputRef}
                onChange={handleEditFileChange}
                accept="image/*,video/*"
                className="hidden"
              />

              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold font-semibold">Media Asset (Optional)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="text-[10px] text-emerald-500 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Upload from device
                  </button>
                  {editedImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditedImageUrl('')}
                      className="text-[10px] text-rose-500 hover:underline font-bold cursor-pointer"
                    >
                      Clear media
                    </button>
                  )}
                </div>
              </div>

              <input
                type="text"
                value={editedImageUrl}
                onChange={(e) => setEditedImageUrl(e.target.value)}
                className={`w-full p-2 border rounded-xl text-xs font-mono focus:outline-none focus:border-[#2374E1] focus:ring-1 focus:ring-[#2374E1]/30 ${isDark ? 'bg-zinc-900 border-zinc-800 text-slate-100' : 'bg-white border-gray-300 text-gray-950'}`}
                placeholder="Paste media link or upload above (e.g. Unsplash URL, .mp4)"
              />

              {isEditingUpload && (
                <span className="text-[9px] font-mono text-emerald-500 dark:text-emerald-400 animate-pulse flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                  Optimizing media file for ledger update...
                </span>
              )}
              {editUploadError && (
                <span className="text-[9px] font-mono text-rose-500 dark:text-rose-400">
                  ⚠️ {editUploadError}
                </span>
              )}
            </div>

            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 pt-3 border-t border-slate-500/10">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEditPrivacyDropdown(!showEditPrivacyDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono select-none cursor-pointer duration-150 transition ${isDark ? 'bg-zinc-900 border-zinc-800 text-slate-200 hover:border-zinc-700' : 'bg-white border-gray-300 text-gray-800 shadow-sm hover:bg-gray-50'}`}
                  id={`edit-privacy-dropdown-trigger-${post.id}`}
                >
                  {editedPrivacy === 'public' && <Globe className="w-3.5 h-3.5 text-[#2374E1]" />}
                  {editedPrivacy === 'friends' && <Users className="w-3.5 h-3.5 text-emerald-500" />}
                  {editedPrivacy === 'private' && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="capitalize font-bold">
                    {editedPrivacy === 'public' ? 'Public Feed' : editedPrivacy === 'friends' ? 'Verified Friends' : 'Private'}
                  </span>
                  <span className="text-[8px] text-slate-500 ml-0.5">▼</span>
                </button>

                {showEditPrivacyDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowEditPrivacyDropdown(false)} />
                    <div className={`absolute left-0 mt-1 w-44 border rounded-xl shadow-2xl z-40 p-1 space-y-0.5 animate-fade-in text-left ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-white border-gray-200'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedPrivacy('public');
                          setShowEditPrivacyDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono hover:bg-gray-500/10 cursor-pointer transition ${
                          editedPrivacy === 'public' ? 'text-white font-bold bg-gray-500/20' : 'text-slate-400'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5 text-[#2374E1]" />
                        <div className="flex flex-col">
                          <span>Public Feed</span>
                          <span className="text-[8px] text-slate-500 font-sans">Everyone can see</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditedPrivacy('friends');
                          setShowEditPrivacyDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono hover:bg-gray-500/10 cursor-pointer transition ${
                          editedPrivacy === 'friends' ? 'text-white font-bold bg-gray-500/20' : 'text-slate-400'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                        <div className="flex flex-col">
                          <span>Verified Friends</span>
                          <span className="text-[8px] text-slate-500 font-sans">Friends & followers</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditedPrivacy('private');
                          setShowEditPrivacyDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono hover:bg-gray-500/10 cursor-pointer transition ${
                          editedPrivacy === 'private' ? 'text-white font-bold bg-gray-500/20' : 'text-slate-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <div className="flex flex-col">
                          <span>Only Me</span>
                          <span className="text-[8px] text-slate-500 font-sans">Private to you only</span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 self-end xs:self-center font-sans text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(post.content);
                    setEditedImageUrl(post.imageUrl || '');
                    setEditedPrivacy(post.privacy || 'public');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold hover:bg-gray-500/10 cursor-pointer transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!editedContent.trim()}
                  onClick={() => {
                    if (onEditPost) {
                      onEditPost(
                        post.id, 
                        editedContent.trim(), 
                        editedImageUrl.trim() ? editedImageUrl.trim() : undefined, 
                        editedPrivacy
                      );
                    }
                    setIsEditing(false);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-white text-[11px] font-bold cursor-pointer transition duration-150 shadow-md ${
                    editedContent.trim() ? 'bg-[#2374E1] hover:bg-blue-600' : 'bg-slate-300 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {displayContent.trim().length > 0 && (
              post.bgStyle && bgStylesMap[post.bgStyle] && !post.imageUrl && !firstUrl ? (
                <div className={`${bgStylesMap[post.bgStyle]} select-text rounded-2xl w-full`}>
                  <span>{renderContentWithHashtags(displayContent)}</span>
                </div>
              ) : (
                renderParagraphs(displayContent, displayContent.length > 150 && !isExpanded)
              )
            )}

            {/* Link Preview Section */}
            {firstUrl && (
              <div className="mt-3 select-none">
                {youtubeId ? (
                  <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-black shadow-sm relative aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full rounded-xl"
                    ></iframe>
                  </div>
                ) : urlDetails ? (
                  <a
                    href={firstUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col sm:flex-row rounded-xl border overflow-hidden transition-all duration-200 group/link ${
                      isDark 
                        ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100/65'
                    }`}
                  >
                    <div className={`p-4 sm:w-28 flex items-center justify-center shrink-0 border-b sm:border-b-0 sm:border-r ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-gray-200 bg-white'}`}>
                      {urlDetails.iconUrl ? (
                        <img 
                          src={urlDetails.iconUrl} 
                          alt={urlDetails.siteName} 
                          className="w-10 h-10 object-contain rounded-xl shadow-sm"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <LinkIcon className={`w-6 h-6 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="p-3.5 flex-1 text-left space-y-1">
                      <p className="text-[9.5px] font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 font-extrabold flex items-center gap-1.5">
                        <ExternalLink className="w-3 h-3 text-[#1877F2]" />
                        {urlDetails.domain}
                      </p>
                      <h4 className={`text-xs sm:text-[12.5px] font-bold leading-tight group-hover/link:text-[#1877F2] transition-colors ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {urlDetails.title}
                      </h4>
                      <p className="text-[10.5px] leading-relaxed line-clamp-2 text-zinc-500 dark:text-zinc-400">
                        {urlDetails.description}
                      </p>
                    </div>
                  </a>
                ) : null}
              </div>
            )}

            {post.imageUrl && (
              <>
                <div className={`mt-3 w-full border-y bg-black/5 overflow-hidden select-none group/image ${
                  isDark ? 'border-zinc-800/80 bg-zinc-950/20' : 'border-gray-150 bg-gray-50/50'
                }`}>
                  {isPostVideo(post.imageUrl) ? (
                    <video
                      src={post.imageUrl}
                      controls
                      playsInline
                      className="w-full h-auto max-h-[440px] object-cover mx-auto bg-black"
                    />
                  ) : (
                    <div onClick={() => setLightboxImage(post.imageUrl)} className="cursor-pointer">
                      <img
                        src={post.imageUrl}
                        alt="Post media asset"
                        className="w-full h-auto max-h-[440px] object-cover mx-auto group-hover:scale-[1.015] transition duration-250 group-hover:opacity-95"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>

                {/* Sleek Horizontal CTA Banner directly underneath media */}
                <div className={`flex items-center justify-between p-3 border-t border-b ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`} id={`post-cta-banner-${post.id}`}>
                  <span className="text-[13px] font-medium leading-tight truncate pr-2">
                    {isPostVideo(post.imageUrl) 
                      ? 'ভিডিওটি পছন্দ হয়েছে? এখনই সম্পূর্ণ ট্রেইলার দেখুন।' 
                      : `${appSettings?.logo_text || 'Zivobook'} Business Suite • স্পন্সরড অফার`}
                  </span>
                  <button
                    onClick={() => {
                      if (onShowToast) {
                        onShowToast(isPostVideo(post.imageUrl) ? "সম্পূর্ণ ভিডিও লোড করা হচ্ছে..." : "অফার পেজ ওপেন করা হচ্ছে...", "success");
                      }
                    }}
                    className="bg-gray-200 hover:bg-gray-300 dark:bg-zinc-805 dark:hover:bg-zinc-700 text-black dark:text-white font-semibold text-[14px] px-4 py-1.5 rounded-md transition transform active:scale-95 shrink-0"
                  >
                    {isPostVideo(post.imageUrl) ? 'Learn More' : 'Order now'}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Cryptographic Registry Certificates */}
        <AnimatePresence>
          {showDetails && post.author.isVerified && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`mt-3 p-4 border rounded-2xl overflow-hidden font-mono text-[10px] space-y-3 shadow-inner ${isDark ? 'bg-gradient-to-br from-slate-900/60 to-slate-950 border-slate-800 text-zinc-300' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
              id={`biometric-registry-${post.id}`}
            >
              <div className={`flex justify-between items-center p-2 px-3 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-850' : 'bg-white border-gray-300'}`}>
                <span className="text-[#10B981] font-bold flex items-center gap-1.5 leading-none">
                  <Fingerprint className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-[pulse_1s_infinite]" />
                  MUTUAL LEDGER PASS
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[8.5px] font-bold">
                  SECURE ACTIVE
                </span>
              </div>
              
              <div className={`grid grid-cols-2 gap-2 text-left p-2.5 rounded-xl border ${isDark ? 'bg-slate-105/5 border-slate-900' : 'bg-white border-gray-200'}`}>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-zinc-400 text-[8.5px] uppercase font-bold tracking-wider">RESIDENT HASH</p>
                  <p className={`font-bold truncate ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>RES-{(post.author.username || 'user').toUpperCase()}#99F2</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-zinc-400 text-[8.5px] uppercase font-bold tracking-wider">VERIFICATION METHOD</p>
                  <p className={`font-bold flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>
                    <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Biometrics Sync
                  </p>
                </div>
                <div className="space-y-1 mt-1.5">
                  <p className="text-gray-500 dark:text-zinc-400 text-[8.5px] uppercase font-bold tracking-wider">REGISTRY TIMESTAMP</p>
                  <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>
                    {post.author.verifiedAt ? new Date(post.author.verifiedAt).toLocaleDateString() : 'Secure Verified Status'}
                  </p>
                </div>
                <div className="space-y-1 mt-1.5">
                  <p className="text-gray-500 dark:text-zinc-400 text-[8.5px] uppercase font-bold tracking-wider">REGISTRY GATE</p>
                  <p className={`font-bold flex items-center gap-1 truncate ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {post.author.from || 'Dhaka, Bangladesh'}
                  </p>
                </div>
              </div>
              
              <div className="w-full h-[2px] bg-gray-200 dark:bg-slate-900 rounded overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-transparent via-[#10B981] to-transparent animate-[shimmer_1.5s_infinite] [animation-duration:2.5s]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Interactive control row */}
      <div className="grid grid-cols-3 text-center py-1 select-none relative mt-1 border-t border-gray-200 dark:border-slate-900/40" id="post-actions-buttons-row">
        <AnimatePresence>
          {showReactionsPalette && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
              className={`absolute bottom-full mb-1 left-2 border rounded-full px-3 py-1.5 flex gap-2.5 shadow-2xl z-40 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-300'}`}
              onMouseEnter={() => {
                if (reactionsTimeoutRef.current) clearTimeout(reactionsTimeoutRef.current);
              }}
              onMouseLeave={() => setShowReactionsPalette(false)}
              id={`reactions-panel-${post.id}`}
            >
              {REACTION_TYPES.map((react) => (
                <button
                  key={react.id}
                  type="button"
                  onClick={() => handleSelectReaction(react.id)}
                  className="hover:scale-130 active:scale-95 transition-transform duration-150 text-xl py-0.5 px-1 cursor-pointer select-none flex flex-col items-center group relative border-0 bg-transparent"
                  title={react.label}
                >
                  <span>{react.emoji}</span>
                  <span className="absolute -top-7 bg-slate-950 text-[8px] font-bold text-slate-200 px-1 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none">
                    {react.label}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
 
        <div
          className="relative col-span-1"
          onMouseEnter={() => {
            if (reactionsTimeoutRef.current) clearTimeout(reactionsTimeoutRef.current);
            setShowReactionsPalette(true);
          }}
          onMouseLeave={() => {
            reactionsTimeoutRef.current = setTimeout(() => {
              setShowReactionsPalette(false);
            }, 800);
          }}
        >
          <button
            onClick={handleLikeClick}
            type="button"
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 hover:bg-gray-500/10 rounded-xl font-bold text-xs cursor-pointer transition active:scale-95 border-0 bg-transparent
              ${activeReaction 
                ? REACTION_TYPES.find(r => r.id === activeReaction)?.color || 'text-[#1877F2]' 
                : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
          >
            <ThumbsUp className={`w-4 h-4 shrink-0 transition-colors ${activeReaction ? 'fill-current' : ''}`} />
            <span className="hidden xs:inline">{activeReaction ? REACTION_TYPES.find(r => r.id === activeReaction)?.label : 'Like'}</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md min-w-[14px] ${isDark ? 'bg-zinc-900 text-slate-350' : 'bg-gray-200 text-gray-800'}`}>
              {post.likes + likesOffset}
            </span>
          </button>
        </div>
 
        <button
          onClick={() => setShowComments(!showComments)}
          type="button"
          className={`col-span-1 flex items-center justify-center gap-1.5 py-1.5 hover:bg-gray-500/10 rounded-xl font-bold text-xs cursor-pointer transition border-0 bg-transparent
            ${showComments ? 'text-[#1877F2]' : 'text-slate-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100'}`}
        >
          <MessageSquare className="w-4 h-4 col-span-1 shrink-0" />
          <span className="hidden xs:inline">Comment</span>
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md min-w-[14px] ${isDark ? 'bg-zinc-900 text-slate-350' : 'bg-gray-200 text-gray-800'}`}>
            {comments.length}
          </span>
        </button>

        <button
          onClick={handleShare}
          type="button"
          className="col-span-1 flex items-center justify-center gap-1.5 py-1.5 hover:bg-gray-500/10 rounded-xl font-bold text-xs text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 cursor-pointer transition border-0 bg-transparent"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* 4.5. Inline Comment & Quick Reply Component */}
      {!showComments && (
        <div 
          className="mt-3 pt-3 border-t border-gray-150 dark:border-zinc-800/80 text-left px-4 pb-1 space-y-3"
          id={`inline-comments-section-${post.id}`}
        >
          {/* Top Comment Bubble */}
          {(() => {
            const topComment = comments.length > 0 ? comments[0] : {
              id: `sim-${post.id}`,
              content: "চমৎকার ডিজাইন! জিবোবুক এর মোবাইল ইন্টারফেসটি বেশ দারুণ লাগছে। 🔥",
              author: {
                displayName: 'Marcus Aurelius',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop',
                isVerified: true
              }
            };
            return (
              <div className="flex gap-2.5 items-start">
                <img
                  src={topComment.author.avatar}
                  alt={topComment.author.displayName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <div className={`rounded-2xl px-3 py-1.5 text-[14px] leading-relaxed transition ${
                    isDark 
                      ? 'bg-zinc-850 text-zinc-100' 
                      : 'bg-gray-100 text-[#1c1e21]'
                  }`}>
                    <div className="flex items-center gap-1.5 leading-none mb-0.5">
                      <span className="font-bold cursor-pointer hover:underline block truncate">
                        {topComment.author.displayName}
                      </span>
                      {topComment.author.isVerified && (
                        <svg
                          className="w-3.5 h-3.5 text-[#1877F2] fill-current shrink-0"
                          viewBox="0 0 24 24"
                          aria-label="Verified"
                          role="img"
                        >
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                      )}
                    </div>
                    <p className="font-sans antialiased text-[14px] whitespace-pre-wrap select-text leading-snug">
                      {topComment.content}
                    </p>
                  </div>
                  {/* Action row (Like, Reply, View All Comments toggle) */}
                  <div className="flex items-center gap-3 mt-1.5 px-2.5 text-[11px] text-gray-500 dark:text-zinc-400">
                    <button 
                      onClick={() => {
                        if (onShowToast) onShowToast("লাইক রিসিভ করা হয়েছে!", "success");
                      }} 
                      className="hover:underline font-bold cursor-pointer transition text-[#1877F2]"
                    >
                      Like
                    </button>
                    <span>•</span>
                    <button 
                      onClick={() => {
                        setShowComments(true);
                      }} 
                      className="hover:underline font-bold cursor-pointer transition"
                    >
                      Reply
                    </button>
                    <span>•</span>
                    <button 
                      onClick={() => setShowComments(true)}
                      className="hover:underline font-extrabold text-[#1877F2]/90 cursor-pointer transition"
                    >
                      View all {comments.length || 1} comments
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Reply Form input wrapper */}
          <form 
            onSubmit={handleCommentSubmit} 
            className="flex items-center gap-2 pt-2.5"
            id={`quick-reply-form-${post.id}`}
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-zinc-800"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`w-full rounded-full px-4 py-2 pr-10 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all font-medium ${
                  isDark 
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500' 
                    : 'bg-gray-100 text-[#1c1e21] border border-transparent focus:bg-white focus:border-gray-300'
                }`}
              />
              {/* Emoji icon aligned to the right inside the input */}
              <button
                type="button"
                onClick={() => {
                  setCommentText(prev => prev + " 😍");
                  if (onShowToast) onShowToast("হৃদয় রিঅ্যাকশন সংযুক্ত!", "success");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-500 transition-colors p-1 cursor-pointer bg-transparent border-0 flex items-center justify-center"
                title="Insert sweet reaction"
              >
                <span className="text-base select-none leading-none">😍</span>
              </button>
            </div>
            {commentText.trim() && (
              <button
                type="submit"
                className="bg-[#1877F2] text-white p-2 rounded-full shadow hover:bg-blue-600 transition transform active:scale-95 shrink-0 flex items-center justify-center cursor-pointer border-0"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* 5. Expanded comments container */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-900 flex flex-col gap-3 overflow-hidden"
            id={`comments-drawer-${post.id}`}
          >
            {comments.length > 0 && (
              <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto scrollbar-none pr-1">
                {comments.map((comment) => {
                  const isCommentLiked = likedCommentIds.includes(comment.id);
                  const imageMatch = comment.content.match(/\[img:(https?:\/\/[^\s\]]+)\]/);
                  const parsedContent = comment.content.replace(/\[img:(https?:\/\/[^\s\]]+)\]/, '').trim();

                  return (
                    <div key={comment.id} className="flex gap-2.5 items-start mt-0.5" id={`post-comment-item-${comment.id}`}>
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.displayName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-500/10 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`p-2.5 rounded-2xl max-w-full leading-normal text-xs relative border ${commentCardClass}`}>
                          <div className={`font-bold hover:underline cursor-pointer flex items-center gap-1 truncate ${isDark ? 'text-slate-100' : 'text-gray-950 font-black'}`}>
                            {comment.author.displayName}
                            {comment.author.isVerified && (
                              <svg
                                className="w-3.5 h-3.5 text-[#1877F2] fill-current shrink-0"
                                viewBox="0 0 24 24"
                                aria-label="Verified"
                                role="img"
                              >
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            )}
                          </div>
                          <p className={`mt-1 select-text leading-relaxed whitespace-pre-wrap font-sans ${isDark ? 'text-slate-200' : 'text-[#1c1e21] font-medium'}`}>
                            {parsedContent || comment.content}
                          </p>

                          {imageMatch && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-800 bg-black/5 inline-block">
                              <img 
                                src={imageMatch[1]} 
                                alt="Comment Attachment" 
                                className="max-h-[140px] max-w-full object-cover rounded hover:opacity-85 hover:scale-[1.02] transition cursor-pointer"
                                onClick={() => setLightboxImage(imageMatch[1])}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 px-2.5 text-[10px] text-gray-500 dark:text-slate-500">
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator.vibrate) {
                                try { navigator.vibrate(20); } catch (e) {}
                              }
                              setLikedCommentIds(prev => 
                                prev.includes(comment.id) 
                                  ? prev.filter(cid => cid !== comment.id) 
                                  : [...prev, comment.id]
                              );
                            }}
                            className={`font-bold transition cursor-pointer select-none flex items-center gap-1 border-0 bg-transparent text-[10px] ${
                              isCommentLiked ? 'text-rose-500' : 'hover:text-gray-700 dark:hover:text-slate-300'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${isCommentLiked ? 'fill-rose-500' : ''}`} />
                            <span>{comment.likes + (isCommentLiked ? 1 : 0)} • Like</span>
                          </button>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Just now
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1 pt-1.5 px-0.5">
              {QUICK_COMMENT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCommentText(sug);
                    if (navigator.vibrate) {
                      try { navigator.vibrate(20); } catch (e) {}
                    }
                  }}
                  className={`px-3 py-1.5 text-[10.5px] font-black rounded-full border shadow-sm transition active:scale-95 shrink-0 whitespace-nowrap cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:text-white hover:bg-zinc-800' : 'bg-white border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                >
                  {sug}
                </button>
              ))}
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-2 mt-1">
              <AnimatePresence>
                {showCommentImageInput && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`flex items-center gap-2 p-2 border rounded-xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-50 border-gray-300'}`}
                  >
                    <input
                      type="url"
                      placeholder="পিকচার এর URL যুক্ত করুন..."
                      value={commentImageUrl}
                      onChange={(e) => setCommentImageUrl(e.target.value)}
                      className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 ${isDark ? 'bg-zinc-950 border-zinc-800 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCommentImageUrl('');
                        setShowCommentImageInput(false);
                      }}
                      className="p-1 hover:bg-gray-500/10 text-slate-400 hover:text-gray-600 dark:hover:text-white rounded transition cursor-pointer border-0 bg-transparent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCommentImageInput(!showCommentImageInput)}
                  className={`p-2.5 rounded-full transition duration-150 cursor-pointer active:scale-95 shrink-0 border-0 ${
                    showCommentImageInput 
                      ? 'bg-[#1877F2]/15 text-[#1877F2]' 
                      : isDark ? 'bg-zinc-900 text-slate-400 hover:bg-zinc-800 hover:text-slate-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'
                  }`}
                  title="Attach comment photo URL"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder="মন্তব্য লিখুন..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className={`flex-1 border rounded-full px-4 py-2 text-xs focus:outline-none focus:border-[#1877F2] transition ${isDark ? 'bg-zinc-900 border-zinc-850 text-slate-100' : 'bg-white border-gray-300 text-gray-950 shadow-sm'}`}
                />

                <button
                  type="submit"
                  disabled={!commentText.trim() && !commentImageUrl.trim()}
                  className={`text-xs p-2.5 rounded-full font-bold transition cursor-pointer select-none shrink-0 flex items-center justify-center border-0
                    ${(commentText.trim() || commentImageUrl.trim())
                      ? 'bg-[#1877F2] text-white hover:bg-blue-600' 
                      : isDark ? 'bg-zinc-900 text-slate-500 border border-zinc-800 cursor-not-allowed' : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Post Option Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full border rounded-3xl p-6 space-y-4 shadow-2xl relative text-left ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-300'}`}>
            <button
              onClick={() => setShowReportModal(false)}
              type="button"
              className={`absolute right-4 top-4 border p-1.5 rounded-lg cursor-pointer transition ${isDark ? 'text-slate-500 hover:text-white bg-slate-900 border-slate-800' : 'text-gray-400 hover:text-gray-700 bg-gray-50 border-gray-200'}`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-950'}`}>Report Content Check</h3>
            </div>

            <p className={`text-[11px] leading-relaxed font-sans mt-1 ${isDark ? 'text-slate-400' : 'text-gray-700 font-medium'}`}>
              You are flagging the content by <span className={isDark ? 'text-white font-bold' : 'text-gray-950 font-black'}>@{post.author.username}</span> for containing content in violation of community guidelines.
            </p>

            <div className="space-y-2 mt-4 text-left">
              <label className="text-[10px] uppercase font-mono tracking-wide font-bold text-gray-500">Reason for Report</label>
              <div className="grid grid-cols-2 gap-2">
                {['Spam', 'Harassment', 'Fake News', 'Other'].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportReason(reason)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition cursor-pointer select-none border ${
                      reportReason === reason 
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' 
                        : isDark ? 'bg-zinc-900/60 border-zinc-800 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {reportReason === 'Other' && (
              <div className="space-y-1 text-left mt-2 animate-slide-up">
                <label className="text-[10px] uppercase font-mono tracking-wide font-bold text-gray-500">Specify reason</label>
                <textarea
                  placeholder="Tell us what's wrong with this post..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className={`w-full border px-3.5 py-2.5 rounded-xl text-xs placeholder-gray-400 outline-none h-20 resize-none transition ${isDark ? 'bg-zinc-900 border-zinc-800 focus:border-red-500/40 text-white' : 'bg-white border-gray-300 focus:border-red-500 text-gray-950 shadow-sm'}`}
                />
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className={`w-1/2 border font-bold py-2.5 rounded-xl text-xs cursor-pointer text-center select-none ${isDark ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 shadow-sm'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReporting || (reportReason === 'Other' && !customReason.trim())}
                onClick={handleSubmitReport}
                className="w-1/2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition select-none cursor-pointer border-0"
              >
                {isReporting ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Flag className="w-3.5 h-3.5" />
                )}
                <span>Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setLightboxImage(null)}
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImage(null);
              }}
              type="button"
              className="absolute top-5 right-5 text-white/70 hover:text-white hover:scale-105 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/50 p-2.5 rounded-full cursor-pointer transition-all z-10 shadow-lg"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800/30 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Enlarged visualization"
                className="max-w-full max-h-[80vh] object-contain rounded-xl select-text"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1 }}
              className="mt-4 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur text-[11px] text-slate-400 font-sans tracking-wide shadow-md"
            >
              Tap anywhere outside the image to close
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Post Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 ${isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-gray-300'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-rose-500 text-left">
                <AlertTriangle className="w-8 h-8 animate-pulse shrink-0" />
                <h3 className={`text-base sm:text-lg font-black font-sans tracking-tight ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>কনফার্ম পোস্ট ডিলিট (Confirm Deletion)</h3>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed font-sans text-left ${isDark ? 'text-slate-300' : 'text-gray-700 font-medium'}`}>
                আপনি কি নিশ্চিতভাবে এই পোস্টটি ডিলিট করতে চান? এই কাজটি অপরিবর্তনযোগ্য এবং ডাটাবেজ লেজার থেকে স্থায়ীভাবে মুছে যাবে।
              </p>

              <div className="flex justify-end gap-3 font-sans text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className={`px-4 py-2 rounded-xl border font-bold transition duration-150 cursor-pointer ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-100' : 'border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                >
                  বাতিল করুন (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeletePost) {
                      onDeletePost(post.id);
                    }
                    setShowDeleteModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold cursor-pointer transition duration-150 shadow-md border-0"
                >
                  হ্যাঁ, ডিলিট করুন (Yes, Delete)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}