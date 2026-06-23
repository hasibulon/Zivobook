import React, { useState, useRef } from 'react';
import { 
  X, ArrowLeft, MoreHorizontal, Globe, Users, Lock, Smile, Image as ImageIcon, MapPin, 
  Phone, Sparkles, Check, ChevronLeft, ChevronRight, UserMinus, UserPlus, Film, Tag, Gift, Flag, Play,
  Link
} from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onAddPost: (content: string, imageUrl?: string, verificationRecord?: boolean, privacy?: 'public' | 'friends' | 'private', bgStyle?: string) => void;
  theme: 'dark' | 'light';
}

const BG_PRESETS = [
  { id: 'none', label: 'None', previewClass: 'border-2 border-dashed border-gray-300 dark:border-zinc-700 bg-transparent flex items-center justify-center text-xs' },
  { id: 'sunset', label: 'Sunset', class: 'bg-gradient-to-r from-orange-400 to-amber-500 text-white font-extrabold', iconClass: 'bg-gradient-to-r from-orange-400 to-amber-500' },
  { id: 'purple', label: 'Grape', class: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold', iconClass: 'bg-gradient-to-r from-purple-500 to-indigo-600' },
  { id: 'cyber', label: 'Sunset Pink', class: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-black', iconClass: 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500' },
  { id: 'midnight', label: 'Midnight Black', class: 'bg-[#141517] dark:bg-zinc-950 text-zinc-100 font-bold border border-zinc-805', iconClass: 'bg-[#141517] dark:bg-zinc-950 border border-zinc-750' },
  { id: 'rose', label: 'Sweet Rose', class: 'bg-rose-100 text-rose-950 border border-rose-200 font-extrabold', iconClass: 'bg-rose-100 border border-rose-200' },
  { id: 'oceanic', label: 'Oceanic Blue', class: 'bg-gradient-to-r from-blue-400 to-emerald-400 text-white font-bold', iconClass: 'bg-gradient-to-r from-blue-400 to-emerald-400' },
];

export default function GlobalCreatePostModal({
  isOpen, onClose, currentUser, onAddPost, theme
}: GlobalCreatePostModalProps) {
  const isDark = theme === 'dark';
  
  // Custom screens: 'main', 'audience', 'actions'
  const [activeScreen, setActiveScreen] = useState<'main' | 'audience' | 'actions'>('main');
  
  // Editor values
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [selectedBg, setSelectedBg] = useState<string>('none');
  const [showBgRow, setShowBgRow] = useState(false);
  
  // Feature states
  const [feeling, setFeeling] = useState<string>('');
  const [showFeelingSelector, setShowFeelingSelector] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [taggedPeople, setTaggedPeople] = useState<string>('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [hasGetCalls, setHasGetCalls] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States to allow pasting an image URL explicitly
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  // Helper function to extract any embedded image URL or [img:https://...] placeholder
  const getExtractedImageUrl = () => {
    // 1. Check for [img:URL] syntax
    const placeholderMatch = content.match(/\[img:(https?:\/\/[^\s\]]+)\]/);
    if (placeholderMatch && placeholderMatch[1]) {
      return placeholderMatch[1];
    }
    // 2. Check for raw web URLs ending in standard image file extensions
    const rawMatch = content.match(/(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp|svg|bmp)(?:\?[^\s]*)?)/i);
    if (rawMatch && rawMatch[1]) {
      return rawMatch[1];
    }
    return null;
  };

  const extractedImgUrl = getExtractedImageUrl();

  if (!isOpen) return null;

  // Dynamic Theme Styling matching exact screenshots
  const bgColor = isDark ? 'bg-[#242526]' : 'bg-white';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-200';
  const textColor = isDark ? 'text-[#e4e6eb]' : 'text-[#1c1e21]';
  const subTextColor = isDark ? 'text-[#b0b3b8]' : 'text-gray-500';
  const headerBg = isDark ? 'bg-[#242526]' : 'bg-white';

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 600;
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
            resolve(canvas.toDataURL('image/jpeg', 0.5));
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
        setSelectedBg('none'); // Clear background style if image/video is attached
      } else if (file.type.startsWith('video/')) {
        if (file.size > 5 * 1024 * 1024) {
          setUploadError('ভিডিও ফাইলটি ৫ মেগাবাইটের চেয়ে বড়।');
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          setImageUrl(evt.target?.result as string);
          setSelectedBg('none');
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError('শুধুমাত্র ছবি ও ভিডিও যুক্ত করুন।');
      }
    } catch (err) {
      setUploadError('ফাইল লোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsUploading(false);
    }
  };

  const clearInputs = () => {
    setContent('');
    setImageUrl('');
    setPrivacy('public');
    setSelectedBg('none');
    setFeeling('');
    setLocationName('');
    setTaggedPeople('');
    setHasGetCalls(false);
    setShowBgRow(false);
    setShowFeelingSelector(false);
    setShowLocationInput(false);
    setShowTagInput(false);
    setActiveScreen('main');
  };

  const handlePublish = () => {
    let finalContent = content;
    
    // Enrich text if locations, feelings, or tag elements are active
    if (feeling) {
      finalContent = `${feeling} • ${finalContent}`;
    }
    if (locationName) {
      finalContent = `${finalContent}\n\n📍 Checked in at ${locationName}`;
    }
    if (taggedPeople) {
      finalContent = `${finalContent}\n\n👥 with ${taggedPeople}`;
    }
    if (hasGetCalls) {
      finalContent = `${finalContent}\n\n📞 Call Me! Reach out to initiate contact.`;
    }

    onAddPost(
      finalContent, 
      imageUrl || extractedImgUrl || undefined, 
      currentUser.isVerified, 
      privacy, 
      selectedBg !== 'none' ? selectedBg : undefined
    );
    
    clearInputs();
    onClose();
  };

  const isPostEmpty = !content.trim() && !imageUrl && !extractedImgUrl && !locationName && !taggedPeople && !hasGetCalls;
  const userFirstName = currentUser.displayName.split(' ')[0] || 'your';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 select-none">
        
        {/* Hidden Device Upload Trigger */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,video/*" 
          className="hidden" 
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={`w-full max-w-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border ${borderColor} ${bgColor}`}
        >

          {/* ======================================= */}
          {/* SCREEN 1: CREATE POST MAIN (DEFAULT)    */}
          {/* ======================================= */}
          {activeScreen === 'main' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b relative">
                <div className="w-10"></div> {/* spacer */}
                <h3 className={`text-[17px] font-black font-sans leading-none text-center ${textColor}`}>
                  Create post
                </h3>
                <button 
                  onClick={onClose} 
                  className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}
                >
                  <X className="w-5 h-5 font-bold" />
                </button>
              </div>

              {/* Scrollable Composing Area */}
              <div className="p-4 overflow-y-auto flex-1 max-h-[64vh] space-y-4">
                
                {/* Profile Header */}
                <div className="flex items-start gap-3">
                  <img 
                    src={currentUser.avatar} 
                    className={`w-[40px] h-[40px] rounded-full object-cover border-2 ${isDark ? 'border-zinc-700' : 'border-gray-100'}`} 
                    referrerPolicy="no-referrer"
                    alt="avatar"
                  />
                  <div className="text-left space-y-1">
                    <h4 className={`text-[14px] font-bold leading-tight flex items-center gap-1 ${textColor}`}>
                      {currentUser.displayName}
                      {currentUser.isVerified && (
                        <span className="bg-blue-500/10 text-blue-500 text-[8px] font-black px-1 py-0.5 rounded font-mono">VERIFIED</span>
                      )}
                    </h4>
                    
                    {/* Privacy Selector Badge Trigger */}
                    <button 
                      type="button"
                      onClick={() => setActiveScreen('audience')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold dark:bg-[#3a3b3c] dark:text-[#e4e6eb] bg-gray-100 text-gray-700 transition cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-zinc-700`}
                    >
                      {privacy === 'public' && <Globe className="w-3.5 h-3.5" />}
                      {privacy === 'friends' && <Users className="w-3.5 h-3.5" />}
                      {privacy === 'private' && <Lock className="w-3.5 h-3.5" />}
                      <span className="capitalize text-[11.5px] font-bold">
                        {privacy === 'public' ? 'Public' : privacy === 'friends' ? 'Friends' : 'Only me'}
                      </span>
                      <span className="text-[10px]">▼</span>
                    </button>
                  </div>
                </div>

                {/* Composing Input Field Box */}
                <div className="relative">
                  {selectedBg !== 'none' ? (
                    /* Centered Post Background Mode matching Screen 4 */
                    <div 
                      className={`rounded-xl transition-all duration-300 shadow-inner flex flex-col justify-center items-center py-10 px-6 text-center ${
                        BG_PRESETS.find(b => b.id === selectedBg)?.class || 'bg-zinc-800'
                      }`}
                    >
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${userFirstName}?`}
                        className="w-full bg-transparent border-none text-center font-bold text-lg focus:outline-none focus:ring-0 placeholder-white/80 resize-none h-[110px] select-text select-all"
                        style={{ color: 'white' }}
                      />
                    </div>
                  ) : (
                    /* Default Composer Input styling */
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`What's on your mind, ${userFirstName}?`}
                      className={`w-full min-h-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-[15.5px] leading-relaxed resize-none p-1 placeholder-gray-400 dark:placeholder-zinc-500 font-sans select-text ${textColor}`}
                    />
                  )}
                  
                  {/* Digital Smiley floating over textarea */}
                  {selectedBg === 'none' && (
                    <button 
                      type="button" 
                      onClick={() => setShowFeelingSelector(!showFeelingSelector)}
                      className="absolute right-1 bottom-1 text-gray-400 hover:text-yellow-500 transition cursor-pointer"
                    >
                      <Smile className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Optional Status Indicators */}
                {feeling && (
                  <div className="flex items-center justify-between bg-purple-500/10 text-purple-400 border border-purple-500/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                    <span>Feeling: <b>{feeling}</b></span>
                    <button onClick={() => setFeeling('')} className="text-zinc-500 font-bold hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {locationName && (
                  <div className="flex items-center justify-between bg-red-500/10 text-red-500 border border-red-500/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Checked in at: <b>{locationName}</b>
                    </span>
                    <button onClick={() => setLocationName('')} className="text-zinc-500 font-bold hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {taggedPeople && (
                  <div className="flex items-center justify-between bg-blue-500/10 text-blue-500 border border-blue-500/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> with: <b>{taggedPeople}</b>
                    </span>
                    <button onClick={() => setTaggedPeople('')} className="text-zinc-500 font-bold hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {hasGetCalls && (
                  <div className="flex items-center justify-between bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Option Active: Call Contact Button
                    </span>
                    <button onClick={() => setHasGetCalls(false)} className="text-zinc-500 font-bold hover:text-white ml-2"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}

                {/* Interactive Feeling Selector Modal Inside */}
                {showFeelingSelector && (
                  <div className={`p-3 rounded-xl border space-y-2 select-all ${borderColor} ${isDark ? 'bg-zinc-900' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center pb-1">
                      <h5 className={`text-[11px] font-black font-sans uppercase tracking-widest ${textColor}`}>Select Feeling Mood</h5>
                      <button onClick={() => setShowFeelingSelector(false)} className="text-zinc-500 hover:text-gray-400 font-extrabold text-[10px]">Close</button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { emoji: '😊', label: 'Feeling Blessed' },
                        { emoji: '🚀', label: 'Feeling Motivated' },
                        { emoji: '🛡️', label: 'Feeling Secure' },
                        { emoji: '💡', label: 'Feeling Proud' },
                        { emoji: '⚡', label: 'Feeling Excited' },
                        { emoji: '🔥', label: 'Feeling On Fire' }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setFeeling(feeling === item.label ? '' : `${item.emoji} ${item.label}`);
                            setShowFeelingSelector(false);
                          }}
                          className={`px-2 py-1 rounded-md text-[10.5px] font-sans border transition cursor-pointer ${
                            feeling.includes(item.label)
                              ? 'bg-purple-600 text-white border-purple-600'
                              : isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.emoji} {item.label.replace('Feeling ', '')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uploaded Media Preview */}
                {imageUrl && (
                  <div className={`p-2.5 rounded-xl border relative bg-black/45 select-none ${borderColor}`}>
                    {imageUrl.startsWith('data:video/') || imageUrl.toLowerCase().includes('.mp4') ? (
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        <video src={imageUrl} className="max-h-56 object-contain" controls />
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden flex items-center justify-center bg-black">
                        <img src={imageUrl} className="max-h-56 object-contain" alt="post asset preview" />
                      </div>
                    )}
                    <button 
                      type="button"
                      onClick={() => setImageUrl('')} 
                      className="absolute top-4 right-4 p-1 bg-black/80 text-white border border-zinc-700 hover:bg-red-600 hover:border-red-600 rounded-full transition cursor-pointer"
                      title="Delete Uploaded Attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-xs font-mono animate-pulse">Compressing Asset File...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted URL / Image Placeholder Preview Area */}
                {!imageUrl && extractedImgUrl && (
                  <div className={`p-3 rounded-xl border relative bg-black/5 dark:bg-black/40 select-none overflow-hidden ${borderColor}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-blue-500 uppercase tracking-widest font-sans">
                        <Sparkles className="w-4 h-4" /> Image URL Preview
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          const placeholderRegex = new RegExp(`\\[img:${extractedImgUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]`, 'g');
                          let updatedContent = content.replace(placeholderRegex, '').trim();
                          if (updatedContent === content) {
                            updatedContent = content.replace(extractedImgUrl, '').trim();
                          }
                          setContent(updatedContent);
                        }}
                        className={`text-zinc-500 dark:text-zinc-400 hover:text-red-500 text-[11px] font-black transition flex items-center gap-1 cursor-pointer`}
                        title="Remove Image URL from Post Text"
                      >
                        <X className="w-3.5 h-3.5" /> Remove Link
                      </button>
                    </div>
                    
                    <div className="relative rounded-lg overflow-hidden flex flex-col justify-center bg-black/95 group min-h-[140px] border border-cyan-500/10">
                      <img 
                        src={extractedImgUrl} 
                        className="max-h-60 w-full object-contain mx-auto transition-transform duration-200 group-hover:scale-[1.01]" 
                        referrerPolicy="no-referrer"
                        alt="Dynamic Content URL preview"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const errDiv = document.getElementById('url-preview-error');
                          if (errDiv) errDiv.style.display = 'flex';
                        }}
                      />
                      
                      {/* Fallback Display if URL has broken image link or permissions issues */}
                      <div 
                        id="url-preview-error" 
                        style={{ display: 'none' }} 
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-zinc-900/95 space-y-2 select-text"
                      >
                        <Sparkles className="w-9 h-9 text-blue-400 animate-pulse mx-auto" />
                        <p className="text-zinc-300 text-xs font-bold leading-tight select-all max-w-[280px] break-all">{extractedImgUrl}</p>
                        <span className="text-[10px] text-zinc-500 font-mono">Image hot-link wrapper matches correctly! Verify address if image doesn't render.</span>
                      </div>
                    </div>
                    <div className="mt-2 text-left bg-blue-500/5 px-2 py-1.5 rounded-lg border border-blue-500/10">
                      <p className={`text-[10.5px] leading-tight select-all truncate ${textColor}`}>
                        <span className="font-bold text-blue-500">Source:</span> <span className="font-mono text-[9.5px]">{extractedImgUrl}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Image URL/Placeholder Input Box inside compose area */}
                {showUrlInput && (
                  <div className={`p-3 rounded-xl border space-y-2 select-all ${borderColor} ${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <h5 className={`text-[11px] font-black font-sans uppercase tracking-widest ${textColor}`}>Add Image URL or Placeholder</h5>
                      <button 
                        type="button"
                        onClick={() => setShowUrlInput(false)} 
                        className="text-zinc-500 hover:text-gray-400 font-extrabold text-[10px]"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Paste image URL (e.g. https://.../pic.jpg)"
                        className={`flex-1 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inputUrl.trim()) {
                            let formatted = inputUrl.trim();
                            if (!formatted.startsWith('[img:') && formatted.startsWith('http')) {
                              formatted = `[img:${formatted}]`;
                            }
                            setContent(prev => prev ? `${prev}\n${formatted}` : formatted);
                            setInputUrl('');
                            setShowUrlInput(false);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold leading-none transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Custom Image/Video Error messaging */}
                {uploadError && (
                  <p className="text-[10px] font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md p-2 text-left">
                    ⚠️ {uploadError}
                  </p>
                )}

                {/* Aa Gradient Presets Component matching Screenshot 4 */}
                <div className="pt-2 select-none">
                  {!showBgRow ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowBgRow(true);
                        setImageUrl(''); // Background card only supports text posts
                      }}
                      className="w-9 h-9 rounded-lg bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white text-[10px] font-extrabold flex items-center justify-center transition border border-gray-100 hover:rotate-12 cursor-pointer shadow-sm relative"
                      title="Background Templates"
                    >
                      Aa
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => setShowBgRow(false)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition shrink-0 cursor-pointer ${
                          isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4 font-bold" />
                      </button>

                      {BG_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedBg(preset.id)}
                          className={`w-7 h-7 rounded-lg transition-transform duration-150 shrink-0 cursor-pointer ${
                            preset.id === 'none'
                              ? 'border-2 border-dashed border-gray-400 flex items-center justify-center text-[10px]'
                              : preset.iconClass
                          } ${selectedBg === preset.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                          title={preset.label}
                        >
                          {preset.id === 'none' && '✖'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Add to Your Post Drawer Trigger styling matching Screenshot 1 */}
              <div className="p-4 border-t space-y-3">
                <div 
                  onClick={() => setActiveScreen('actions')}
                  className={`flex items-center justify-between border rounded-xl p-3 cursor-pointer shadow-sm transition-all duration-150 ${
                    isDark ? 'bg-[#242526] hover:bg-zinc-800 border-zinc-800' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-[13px] sm:text-[14px] font-black font-sans ${textColor}`}>
                    Add to your post
                  </span>
                  
                  {/* Action Icons row */}
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="p-1 px-1.5 text-emerald-500 hover:scale-110 transition cursor-pointer"
                      title="Photo/Video"
                    >
                      <ImageIcon className="w-5 h-5 font-bold" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowUrlInput(!showUrlInput); }}
                      className={`p-1 px-1.5 hover:scale-110 transition cursor-pointer ${showUrlInput ? 'text-blue-500 animate-pulse' : 'text-zinc-400 dark:text-zinc-500'}`}
                      title="Add Image URL or Placeholder"
                    >
                      <Link className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowTagInput(true); setActiveScreen('actions'); }}
                      className="p-1 px-1.5 text-blue-500 hover:scale-110 transition cursor-pointer"
                      title="Tag people"
                    >
                      <Tag className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowFeelingSelector(true); }}
                      className="p-1 px-1.5 text-amber-500 hover:scale-110 transition cursor-pointer"
                      title="Feeling"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowLocationInput(true); setActiveScreen('actions'); }}
                      className="p-1 px-1.5 text-red-500 hover:scale-110 transition cursor-pointer"
                      title="Check in"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setHasGetCalls(!hasGetCalls); }}
                      className="p-1 px-1.5 text-sky-500 hover:scale-110 transition cursor-pointer"
                      title="Get calls"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      type="button"
                      className="p-1 px-1.5 text-zinc-400 dark:text-zinc-500 font-bold"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Final Blue Post/Publish Button */}
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPostEmpty}
                  className={`w-full py-2.5 rounded-xl font-black font-sans text-sm tracking-wide transition duration-150 cursor-pointer ${
                    isPostEmpty
                      ? isDark ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gray-150 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-[0.98]'
                  }`}
                >
                  Post
                </button>
              </div>

            </div>
          )}

          {/* ======================================= */}
          {/* SCREEN 2: AUDIENCE SELECTOR SCREEN      */}
          {/* ======================================= */}
          {activeScreen === 'audience' && (
            <div className="flex flex-col flex-1 pb-4 overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b relative">
                <button 
                  onClick={() => setActiveScreen('main')}
                  className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer ${
                    isDark ? 'text-zinc-300' : 'text-gray-700'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5 font-bold" />
                </button>
                <h3 className={`text-[16px] sm:text-[17px] font-black font-sans leading-none text-center ${textColor}`}>
                  Post audience
                </h3>
                <button className="p-1.5 text-zinc-400 hover:text-zinc-200 cursor-default">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 select-none overflow-y-auto max-h-[64vh] text-left space-y-4">
                <div className="space-y-1">
                  <h4 className={`text-[15px] font-black tracking-tight ${textColor}`}>
                    Who can see your post?
                  </h4>
                  <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Your post will show up in Feed, on your profile and in search results.
                  </p>
                </div>

                <div className="space-y-1 mt-4">
                  
                  {/* Public Row Selection option */}
                  <div 
                    onClick={() => setPrivacy('public')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition ${
                      privacy === 'public' ? 'bg-blue-500/10 dark:bg-blue-600/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="bg-blue-500/10 text-blue-500 p-2.5 rounded-full mt-0.5">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="leading-tight">
                        <h4 className={`text-[13.5px] font-bold ${textColor}`}>Public</h4>
                        <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">Anyone on or off Facebook</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      privacy === 'public' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-zinc-640'
                    }`}>
                      {privacy === 'public' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Friends Row Selection option */}
                  <div 
                    onClick={() => setPrivacy('friends')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition ${
                      privacy === 'friends' ? 'bg-blue-500/10 dark:bg-blue-600/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="bg-emerald-500/10 text-emerald-500 p-2.5 rounded-full mt-0.5">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="leading-tight">
                        <h4 className={`text-[13.5px] font-bold ${textColor}`}>Friends</h4>
                        <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">Your friends on Facebook</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      privacy === 'friends' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-zinc-640'
                    }`}>
                      {privacy === 'friends' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Private Row Selection option */}
                  <div 
                    onClick={() => setPrivacy('private')}
                    className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition ${
                      privacy === 'private' ? 'bg-blue-500/10 dark:bg-blue-600/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-full mt-0.5">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="leading-tight">
                        <h4 className={`text-[13.5px] font-bold ${textColor}`}>Only me</h4>
                        <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">Only you can view this ledger update</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      privacy === 'private' ? 'border-blue-500 bg-blue-500' : 'border-gray-400 dark:border-zinc-640'
                    }`}>
                      {privacy === 'private' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                </div>

                {/* Additional simulated options */}
                <div className="pt-2 px-1 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <input type="checkbox" id="defaultAudience" className="rounded border-zinc-700/50" defaultChecked />
                  <label htmlFor="defaultAudience" className="cursor-pointer font-semibold">Set as default audience.</label>
                </div>

              </div>

              {/* Done button to return with choice */}
              <div className="px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('main')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black font-sans rounded-xl tracking-wider cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          )}

          {/* ======================================= */}
          {/* SCREEN 3: ADD TO YOUR POST EXTENDED     */}
          {/* ======================================= */}
          {activeScreen === 'actions' && (
            <div className="flex flex-col flex-1 pb-4 overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b relative">
                <button 
                  onClick={() => setActiveScreen('main')}
                  className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer ${
                    isDark ? 'text-zinc-300' : 'text-gray-700'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5 font-bold" />
                </button>
                <h3 className={`text-[16px] sm:text-[17px] font-black font-sans leading-none text-center ${textColor}`}>
                  Add to your post
                </h3>
                <div className="w-8"></div>
              </div>

              {/* Body */}
              <div className="p-4 overflow-y-auto max-h-[64vh] text-left space-y-4">
                
                {/* Dynamically shown tag/check-in inputs inside Actions Sub-screen */}
                {showTagInput && (
                  <div className={`p-3 rounded-2xl border space-y-1.5 select-all ${borderColor} ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                    <label className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>👥 Tag people</label>
                    <input 
                      type="text" 
                      value={taggedPeople}
                      onChange={(e) => setTaggedPeople(e.target.value)}
                      placeholder="Who are you with? (e.g. Shakib, Redoy)"
                      className={`w-full text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                )}

                {showLocationInput && (
                  <div className={`p-3 rounded-2xl border space-y-1.5 select-all ${borderColor} ${isDark ? 'bg-zinc-800' : 'bg-gray-50'}`}>
                    <label className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>📍 Add Location Pin</label>
                    <input 
                      type="text" 
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="Where are you? (e.g. Dhaka, Bangladesh)"
                      className={`w-full text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                )}

                {/* Sub-actions detailed grid list matching Screen 3 */}
                <div className="grid grid-cols-1 gap-1.5">
                  
                  {/* Photo row Item */}
                  <div 
                    onClick={() => {
                      fileInputRef.current?.click();
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-emerald-500/15 text-emerald-500 p-2.5 rounded-full">
                      <ImageIcon className="w-5 h-5 font-bold" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Photo/video</span>
                  </div>

                  {/* Tag Row Item */}
                  <div 
                    onClick={() => setShowTagInput(!showTagInput)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-blue-500/15 text-blue-500 p-2.5 rounded-full">
                      <Tag className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Tag people</span>
                  </div>

                  {/* Feeling Row Item */}
                  <div 
                    onClick={() => {
                      setShowFeelingSelector(true);
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-amber-500/15 text-amber-500 p-2.5 rounded-full">
                      <Smile className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Feeling/activity</span>
                  </div>

                  {/* Checkin Row Item */}
                  <div 
                    onClick={() => setShowLocationInput(!showLocationInput)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-red-500/15 text-red-500 p-2.5 rounded-full">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Check in</span>
                  </div>

                  {/* Add URL / Image Placeholder Row Item */}
                  <div 
                    onClick={() => {
                      setShowUrlInput(!showUrlInput);
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-blue-500/15 text-blue-500 p-2.5 rounded-full">
                      <Link className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Add Image URL / Placeholder</span>
                  </div>

                  {/* Get Calls Row Item */}
                  <div 
                    onClick={() => {
                      setHasGetCalls(!hasGetCalls);
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-sky-500/15 text-sky-500 p-2.5 rounded-full">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>{hasGetCalls ? "Remove call button option" : "Get calls"}</span>
                  </div>

                  {/* GIFs Selector Row Item */}
                  <div 
                    onClick={() => {
                      setContent(prev => prev + " [GIF: Happy dance 🎉] ");
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-teal-500/15 text-teal-400 p-2.5 rounded-full">
                      <Gift className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>GIF</span>
                  </div>

                  {/* Collaborator Selector Row Item */}
                  <div 
                    onClick={() => {
                      setTaggedPeople("Co-Creator Agent");
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-purple-500/15 text-purple-400 p-2.5 rounded-full">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Invite collaborator</span>
                  </div>

                  {/* Live video mock Row Item */}
                  <div 
                    onClick={() => {
                      setContent(prev => prev + " 📹 Inbound Live Stream Link Activated... ");
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-98`}
                  >
                    <div className="bg-rose-500/15 text-rose-500 p-2.5 rounded-full flex items-center justify-center">
                      <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse border border-white" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Live video</span>
                  </div>

                  {/* Life update Row Item */}
                  <div 
                    onClick={() => {
                      setFeeling("🎉 Celebrating Life Milestones");
                      setContent(prev => "Big news today! " + prev);
                      setActiveScreen('main');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition active:scale-[0.98]`}
                  >
                    <div className="bg-sky-500/15 text-sky-400 p-2.5 rounded-full">
                      <Flag className="w-5 h-5" />
                    </div>
                    <span className={`text-[14px] font-bold ${textColor}`}>Life update</span>
                  </div>

                </div>

              </div>

              {/* Done/Return back to main screen button footer */}
              <div className="px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveScreen('main')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black font-sans rounded-xl tracking-wider cursor-pointer"
                >
                  Done
                </button>
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
