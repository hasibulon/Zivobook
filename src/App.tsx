import React, { useState, useEffect } from 'react';
import { SidebarTab, User, Post, Notification, AppSettings } from './types';
import { currentUserMock, verifiedUsersMock, initialPostsMock, initialNotificationsMock } from './data';
import { subscribeToAppSettings, getDefaultSettings } from './lib/appSettingsService';
import Sidebar from './components/Sidebar';
import RightBar from './components/RightBar';
import AuthPage from './components/AuthPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import CreatePost from './components/CreatePost';
import PostCard from './components/PostCard';
import VirtualPostWrapper from './components/VirtualPostWrapper';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
import MemberSearch from './components/MemberSearch';
import Toast from './components/Toast';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldCheck, Sparkles, Menu, X, Info, LogIn, LogOut, CheckCircle, CheckCircle2, Database, Tv, Play, Users as UsersIcon, Heart, Users, Calendar, ArrowRight, BookOpen, LineChart, Landmark, Activity, Newspaper, History, Megaphone, UserPlus, PlaySquare, ShoppingBag, Briefcase, MoreHorizontal, AlertTriangle } from 'lucide-react';
import TopNavbar from './components/TopNavbar';
import StoriesSection from './components/StoriesSection';
import BottomNavbar from './components/BottomNavbar';
import MessagesView from './components/MessagesView';
import DirectoryView from './components/DirectoryView';
import GlobalCreatePostModal from './components/GlobalCreatePostModal';
import NotificationsView from './components/NotificationsView';
import UserGoalsView from './components/UserGoalsView';
import { hasPermission } from './lib/permissions';
import { dataRepository } from './lib/dataRepository';
import { inspectContentForSpam, inspectRateLimit } from './lib/securityService';

import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  loginWithGoogle, 
  signUpWithEmail,
  loginWithEmail,
  logoutUser, 
  getOrCreateProfile, 
  updateProfileInFirestore, 
  seedDatabaseIfEmpty, 
  subscribeToPosts, 
  createPostInFirestore, 
  updatePostInteractions, 
  addCommentInFirestore,
  toggleLikeInFirestore,
  fetchVerificationRequestsForUser,
  subscribeToNotifications,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  clearAllNotificationsInFirestore,
  updatePostInFirestore,
  deletePostInFirestore,
  cleanAllNonAdminUsersFromDatabase
} from './lib/firebaseService';

export default function App() {
  // Firebase authenticated states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);
  const isSimulated = false;
  const setIsSimulated = (val: boolean) => {};
  const [firestoreQuotaExceeded, setFirestoreQuotaExceeded] = useState(false);

  // Listen for firestore quota events to toggle the fallback sandbox mode automatically
  useEffect(() => {
    const handleQuotaExceeded = () => {
      console.warn("Firestore Quota limit exceeded. Engaging automatic offline storage fallback mode safely.");
      setFirestoreQuotaExceeded(true);
      setIsSimulated(true); // Switch user session to high-trust offline sandbox mode
    };
    window.addEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Navigation active state
  const [activeTab, setActiveTab] = useState<SidebarTab | 'admin'>(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'home';
  });
  const [groupsAndPagesSegment, setGroupsAndPagesSegment] = useState<'groups' | 'pages' | 'my-groups' | 'my-pages'>('groups');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [chatPreselectedUser, setChatPreselectedUser] = useState<User | null>(null);
  
  // Real-time viewed profile from database
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);

  // Database persistent states
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('vt_current_user');
    return saved ? JSON.parse(saved) : currentUserMock;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('vt_posts');
    return saved ? JSON.parse(saved) : initialPostsMock;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('vt_notifications');
    const list: Notification[] = saved ? JSON.parse(saved) : initialNotificationsMock;
    return Array.from(new Map(list.map(n => [n.id, n])).values());
  });

  const [strictFilterSetting, setStrictFilterSetting] = useState<boolean>(() => {
    const saved = localStorage.getItem('vt_strict_filter');
    return saved ? saved === 'true' : false;
  });

  // Real-time cache mapping user IDs to their up-to-date profile documents
  const [dbProfiles, setDbProfiles] = useState<Record<string, User>>({});

  // Feed Tab Filter: 'all' | 'verified'
  const [feedFilter, setFeedFilter] = useState<'all' | 'verified'>(strictFilterSetting ? 'verified' : 'all');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  
  // Modal toggle state
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Real-time pending verification requests count for admin badges/notifications
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);

  // Global Dark / Light Theme System management
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const userPref = localStorage.getItem('vt_user_theme_preference');
    if (userPref === 'dark' || userPref === 'light') return userPref;
    return (localStorage.getItem('vt_theme') as 'dark' | 'light') || 'light';
  });

  const isDark = theme === 'dark';

  // Consolidated theme style effect synced below standard declarations

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('vt_user_theme_preference', next);
      if (firebaseUser && !isSimulated) {
        updateProfileInFirestore(firebaseUser.uid, { theme_preference: next })
          .catch(err => console.warn("Failed to update theme preference in Firestore profile:", err));
      } else {
        setCurrentUser(p => ({ ...p, theme_preference: next }));
      }
      return next;
    });
  };

  // Global Dynamic Theme & Typography Customizer
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getDefaultSettings());

  useEffect(() => {
    localStorage.setItem('vt_visited_before', 'true');
  }, []);

  useEffect(() => {
    const unsub = subscribeToAppSettings((settings) => {
      setAppSettings(settings);
      
      const userPref = localStorage.getItem('vt_user_theme_preference');
      const collectionPref = currentUser?.theme_preference;
      
      // If no explicit local or account-wide preference exists, follow admin's global theme!
      if (!userPref && !collectionPref && settings.global_theme) {
        setTheme(settings.global_theme);
      }
    });
    return () => unsub();
  }, [currentUser?.theme_preference]);

  // Integrated effect for browser bar theme color matching & HTML container system class toggles
  useEffect(() => {
    const root = window.document.documentElement;
    const isLight = theme === 'light';
    if (isLight) {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('vt_theme', theme);

    // Synchronize the browser address bar / notch / status bar color directly with current theme background
    const metaColor = isLight 
      ? (appSettings?.light_bg_color || '#F0F2F5') 
      : (appSettings?.dark_bg_color || '#18191A');
    
    let themeMetaTag = document.querySelector('meta[name="theme-color"]');
    if (!themeMetaTag) {
      themeMetaTag = document.createElement('meta');
      themeMetaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMetaTag);
    }
    themeMetaTag.setAttribute('content', metaColor);
  }, [theme, appSettings]);

  const getHexToRgb = (hex: string): string => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '16, 185, 129';
  };

  const getBaseFontSizePixels = (sizeOption: string): string => {
    if (sizeOption.includes('14px')) return '14px';
    if (sizeOption.includes('18px')) return '18px';
    if (sizeOption.includes('20px')) return '20px';
    return '16px'; // Medium/16px default
  };

  // Unified root success and error toast alerts state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Administrative evaluation check
  const userIsAdmin = (
    (firebaseUser && (firebaseUser.email || '').toLowerCase() === 'hasibulon@gmail.com') ||
    (currentUser && (currentUser.username || '').toLowerCase() === 'hasibulon') ||
    (currentUser && currentUser.role === 'admin')
  );

  // URL path synchronization for Admin Panel (/admin) and User Profiles (/profile/user_id)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/admin') {
        setActiveTab('admin');
        setSelectedUser(null);
      } else if (path.startsWith('/profile/')) {
        const id = path.replace('/profile/', '');
        if (id) {
          setActiveTab('profile');
        }
      } else {
        setActiveTab((prev) => (prev === 'admin' || prev === 'profile' ? 'home' : prev));
        setSelectedUser(null);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange();
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Update URL history to match activeTab and selectedUser navigation
  useEffect(() => {
    const path = window.location.pathname;
    if (activeTab === 'admin') {
      if (path !== '/admin') {
        window.history.pushState(null, '', '/admin');
      }
    } else if (activeTab === 'profile' && selectedUser) {
      if (path !== `/profile/${selectedUser.id}`) {
        window.history.pushState(null, '', `/profile/${selectedUser.id}`);
      }
    } else if (activeTab === 'profile' && !selectedUser) {
      if (path !== `/profile/${currentUser.id}`) {
        window.history.pushState(null, '', `/profile/${currentUser.id}`);
      }
    } else {
      if (path === '/admin' || path.startsWith('/profile/')) {
        window.history.pushState(null, '', '/');
      }
    }
  }, [activeTab, selectedUser, currentUser.id]);

  // Dynamically resolve and select matching user when loaded from profile/ URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/profile/')) {
      const pid = path.replace('/profile/', '');
      if (pid) {
        const matched = dbProfiles[pid] || 
                        verifiedUsersMock.find(u => u.id === pid) || 
                        (currentUser.id === pid ? currentUser : null);
        if (matched && (!selectedUser || selectedUser.id !== pid)) {
          setSelectedUser(matched);
          setActiveTab('profile');
        }
      }
    }
  }, [window.location.pathname, dbProfiles, verifiedUsersMock, currentUser, selectedUser]);

  // 1. Sync local-storage falls back
  useEffect(() => {
    if (!firebaseUser || isSimulated) {
      localStorage.setItem('vt_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser, firebaseUser, isSimulated]);

  useEffect(() => {
    if (!firebaseUser || isSimulated) {
      localStorage.setItem('vt_posts', JSON.stringify(posts));
    }
  }, [posts, firebaseUser, isSimulated]);

  useEffect(() => {
    localStorage.setItem('vt_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('vt_strict_filter', String(strictFilterSetting));
  }, [strictFilterSetting]);

  useEffect(() => {
    if (strictFilterSetting) {
      setFeedFilter('verified');
    }
  }, [strictFilterSetting]);

  // 2. Initialize Firebase Auth and real-time subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      setFirebaseUser(user);
      if (user) {
        try {
          setIsFirebaseLoading(true);
          // Zero-Trust db checking & seeding
          await seedDatabaseIfEmpty();
          
          // Get profile document
          const profile = await getOrCreateProfile(user);
          setCurrentUser(profile);
        } catch (err: any) {
          const errStr = err instanceof Error ? err.message : String(err);
          const isQuota = errStr.toLowerCase().includes('quota') || 
                          errStr.includes('Quota exceeded') || 
                          errStr.includes('RESOURCE_EXHAUSTED') ||
                          errStr.includes('Free daily read units per project');
          const isOffline = errStr.toLowerCase().includes('unavailable') ||
                            errStr.toLowerCase().includes('could not reach') ||
                            errStr.toLowerCase().includes('offline') ||
                            errStr.toLowerCase().includes('failed-precondition');
          
          if (isQuota || isOffline) {
            console.warn("Auth context pipeline engaged automatic high-trust local sandbox fallback due to offline / quota state:", errStr);
            if (isQuota) {
              setFirestoreQuotaExceeded(true);
            }
            setIsSimulated(true);
          } else {
            console.error("Auth context pipeline loading failed with non-quota/non-offline error: ", err);
          }

          // Build or gracefully load active user profile corresponding to the successfully logged-in user
          const saved = localStorage.getItem('vt_current_user');
          let loadedProfile = false;
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && parsed.id === user.uid) {
                setCurrentUser(parsed);
                loadedProfile = true;
              }
            } catch (e) {
              console.warn("Failed to parse vt_current_user local storage:", e);
            }
          }

          if (!loadedProfile) {
            const fallbackProfile: User = {
              id: user.uid,
              username: user.email ? user.email.split('@')[0] : 'user_' + user.uid.substring(0, 4),
              displayName: user.displayName || 'Citizen ' + user.uid.substring(0, 4),
              avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
              bio: 'Welcome to my secure profile on Zivobook!',
              isVerified: false,
              profession: 'Member',
              followersCount: 0,
              followingCount: 0,
              badgeLevel: 'blue',
              role: (user.email || '').toLowerCase() === 'hasibulon@gmail.com' ? 'admin' : 'user',
              isOnboarded: false,
              livesIn: '',
              from: '',
              school: '',
              joinedDate: 'Joined June 2026'
            };
            setCurrentUser(fallbackProfile);
            localStorage.setItem('vt_current_user', JSON.stringify(fallbackProfile));
          }
        } finally {
          setIsFirebaseLoading(false);
        }
      } else {
        const saved = localStorage.getItem('vt_current_user');
        setCurrentUser(saved ? JSON.parse(saved) : currentUserMock);
        setIsFirebaseLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Keep Firestore posts collection synchronized in real-time
  useEffect(() => {
    let unsubscribePosts = () => {};

    if (firebaseUser && !isSimulated) {
      unsubscribePosts = subscribeToPosts((firestorePosts) => {
        setPosts(firestorePosts);
      }, firebaseUser.uid);
    } else {
      const saved = localStorage.getItem('vt_posts');
      setPosts(saved ? JSON.parse(saved) : initialPostsMock);
    }

    return () => unsubscribePosts();
  }, [firebaseUser, isSimulated]);



  // 4b. Fetch user notifications in real-time from Firestore
  useEffect(() => {
    let unsubscribeNotifs = () => {};

    if (firebaseUser && !isSimulated) {
      unsubscribeNotifs = subscribeToNotifications(firebaseUser.uid, (notifs) => {
        const unique = Array.from(new Map(notifs.map(n => [n.id, n])).values());
        setNotifications(unique);
      });
    } else {
      const saved = localStorage.getItem('vt_notifications');
      const list = saved ? JSON.parse(saved) : initialNotificationsMock;
      const unique = Array.from(new Map(list.map((n: any) => [n.id, n])).values());
      setNotifications(unique);
    }

    return () => unsubscribeNotifs();
  }, [firebaseUser, isSimulated]);

  // 4a. Listen to currentUser profile from Firestore if signed in
  useEffect(() => {
    if (!firebaseUser || isSimulated) return;
    const docRef = doc(db, 'profiles', firebaseUser.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as User;
        if (profileData.is_banned) {
          logoutUser().then(() => {
            alert("Your account has been suspended by an administrator for policy violations. You have been disconnected.");
          });
          return;
        }
        if (profileData.isDeleted) {
          logoutUser().then(() => {
            alert("আপনার অ্যাকাউন্টটি ডিলিট বা নিষ্ক্রিয় করা হয়েছে।");
          });
          return;
        }
        setCurrentUser(profileData);
        
        // If the database has a preferred theme saved under their profile, sync it to active client state
        if (profileData.theme_preference) {
          setTheme(profileData.theme_preference);
          localStorage.setItem('vt_user_theme_preference', profileData.theme_preference);
        }
      } else {
        // Document has been deleted (real-time sync of account termination)
        logoutUser().then(() => {
          alert("আপনার অ্যাকাউন্টটি সম্পন্নভাবে ডিলিট বা নিষ্ক্রিয় করা হয়েছে।");
        });
      }
    }, (error) => {
      console.warn("Could not subscribe to currentUser profile: ", error);
    });
    return () => unsubscribe();
  }, [firebaseUser, isSimulated]);

  // 4b. Listen to whichever profile is currently active in ProfileView
  useEffect(() => {
    if (!firebaseUser || isSimulated) {
      setViewedProfile(selectedUser || currentUser);
      return;
    }

    const viewedUserId = selectedUser ? selectedUser.id : firebaseUser.uid;
    const docRef = doc(db, 'profiles', viewedUserId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const pData = docSnap.data() as User;
        if (pData.isDeleted) {
          if (selectedUser) {
            setSelectedUser(null);
          }
          setViewedProfile(currentUser);
        } else {
          setViewedProfile(pData);
        }
      } else {
        // If profile doesn't exist on server/deleted permanently, deselect
        if (selectedUser) {
          setSelectedUser(null);
        }
        setViewedProfile(currentUser);
      }
    }, (error) => {
      console.warn("Could not subscribe to viewed profile: ", error);
      setViewedProfile(selectedUser || currentUser);
    });

    return () => unsubscribe();
  }, [firebaseUser, isSimulated, selectedUser?.id, currentUser?.id, activeTab]);

  // Real-time verification requests subscription for admin badges and notification counts
  useEffect(() => {
    let unsubscribe = () => {};
    if (userIsAdmin && firebaseUser && !isSimulated) {
      try {
        unsubscribe = dataRepository.subscribeToVerificationRequests((requests) => {
          const pendingCount = requests.filter(r => r.status === 'pending').length;
          setPendingVerificationCount(pendingCount);
        });
      } catch (error) {
        console.warn("Could not subscribe to verification requests: ", error);
      }
    } else {
      setPendingVerificationCount(0);
    }
    return () => unsubscribe();
  }, [userIsAdmin, firebaseUser, isSimulated]);

  // 4c. Listen to all profile streams to ensure dynamic up-to-date mappings for posts
  useEffect(() => {
    if (!firebaseUser || isSimulated) {
      setDbProfiles({});
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const prMap: Record<string, User> = {};
      snapshot.forEach((docSnap) => {
        const u = docSnap.data() as User;
        if (!u.isDeleted) {
          prMap[docSnap.id] = u;
        }
      });
      setDbProfiles(prMap);
    }, (error) => {
      console.warn("Could not subscribe to all profiles: ", error);
    });
    return () => unsubscribe();
  }, [firebaseUser, isSimulated]);

  // 4f. One-time clean of legacy mock data keys in localStorage to purge remnants
  useEffect(() => {
    const cleanedFlag = localStorage.getItem('vt_legacy_mock_cleaned_v2');
    if (!cleanedFlag) {
      console.log("Cleaning up legacy local storage mock/demo keys...");
      localStorage.removeItem('vt_posts');
      localStorage.removeItem('vt_notifications');
      localStorage.removeItem('vt_mock_users');
      localStorage.removeItem('vt_simulated_user');
      localStorage.setItem('vt_legacy_mock_cleaned_v2', 'true');
      
      // Force reset local state to clean templates
      setPosts(initialPostsMock);
      setNotifications(initialNotificationsMock);
    }
  }, []);

  // 4d. Automatically keep the simulated user list ('vt_mock_users') in sync with the current active user
  useEffect(() => {
    if (isSimulated && currentUser && currentUser.id) {
      const stored = localStorage.getItem('vt_mock_users');
      let list: User[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing vt_mock_users in sync hook:", e);
        }
      }

      if (list.length === 0) {
        list = [
          { id: 'current_user', username: 'hasibulon', displayName: 'Hasibul Hasan', isVerified: true, role: 'admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', bio: 'Chief Security Administrator of Zivobook.', followersCount: 1230, followingCount: 412, profession: 'Administrator' }
        ];
      }

      const index = list.findIndex(u => u.id === currentUser.id);
      if (index === -1) {
        list.push(currentUser);
        localStorage.setItem('vt_mock_users', JSON.stringify(list));
      } else {
        if (!list[index].isDeleted) {
          list[index] = { ...list[index], ...currentUser };
          localStorage.setItem('vt_mock_users', JSON.stringify(list));
        }
      }
    }
  }, [currentUser, isSimulated]);

  // Resolve post author profile with the most up-to-date data
  const getPostAuthor = (postAuthor: User) => {
    if (dbProfiles[postAuthor.id]) {
      return dbProfiles[postAuthor.id];
    }
    if (postAuthor.id === currentUser.id) {
      return currentUser;
    }
    return postAuthor;
  };

  // Feed Filter list compute with dynamic author joining support
  const filteredPosts = posts.map((post) => {
    const updatedAuthor = getPostAuthor(post.author);
    const updatedComments = post.comments ? post.comments.map(comment => ({
      ...comment,
      author: comment.author ? getPostAuthor(comment.author) : comment.author
    })).filter(comment => !comment.author || !comment.author.isDeleted) : [];

    return {
      ...post,
      author: updatedAuthor,
      comments: updatedComments
    };
  }).filter((post) => {
    // Hide posts if author has been deleted
    if (post.author && post.author.isDeleted) {
      return false;
    }
    if (post.author && post.author.id !== currentUser.id && !dbProfiles[post.author.id] && !isSimulated) {
      return false; // Author has been deleted and is no longer in dbProfiles
    }

    // 1. Privacy filtering rules
    const postPrivacy = post.privacy || 'public';
    if (postPrivacy === 'private') {
      // Must be author
      if (post.author.id !== currentUser.id) {
        return false;
      }
    } else if (postPrivacy === 'friends') {
      // Must be author or friends (connected via following relationship)
      if (post.author.id !== currentUser.id) {
        const currentUserFollows = currentUser.followingIds?.includes(post.author.id);
        const authorProfile = dbProfiles[post.author.id];
        const authorFollows = authorProfile?.followingIds?.includes(currentUser.id) || post.author?.followingIds?.includes(currentUser.id);
        
        if (!currentUserFollows && !authorFollows) {
          return false;
        }
      }
    }

    // 2. Hashtag & verified filters
    if (selectedHashtag) {
      const contentText = (post.content || '').toLowerCase();
      if (!contentText.includes(selectedHashtag.toLowerCase())) {
        return false;
      }
    }
    if (feedFilter === 'verified') {
      return post.author && post.author.isVerified;
    }
    return true;
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Global operations
  const handleLike = async (id: string) => {
    const perm = hasPermission(currentUser, 'canLike', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার লাইক করার অনুমতি সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }
    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === id) {
          const isLiked = !post.isLikedByMe;
          const inc = isLiked ? 1 : -1;
          const nextLikes = Math.max(0, post.likes + inc);
          
          // Push to Firebase instantly
          if (firebaseUser && !isSimulated) {
            toggleLikeInFirestore(id, firebaseUser.uid, isLiked);
          }

          // Trigger local mock notification
          if (isLiked && post.author.id !== currentUser.id) {
            const newNotif: Notification = {
              id: `notif_like_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
              type: 'like',
              title: `${currentUser.displayName} liked your post`,
              message: `Liked your post: "${post.content.slice(0, 45)}..."`,
              createdAt: new Date().toISOString(),
              read: false,
              sender: currentUser
            };
            setNotifications(prev => {
              const list = [newNotif, ...prev];
              return Array.from(new Map(list.map(n => [n.id, n])).values());
            });
          }

          return {
            ...post,
            likes: nextLikes,
            isLikedByMe: isLiked
          };
        }
        return post;
      })
    );
  };

  const handleRepost = async (id: string) => {
    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === id) {
          const isReposted = !post.isRepostedByMe;
          const inc = isReposted ? 1 : -1;
          const nextReposts = Math.max(0, post.reposts + inc);

          if (firebaseUser && !isSimulated) {
            updatePostInteractions(id, { reposts: nextReposts });
          }

          return {
            ...post,
            reposts: nextReposts,
            isRepostedByMe: isReposted
          };
        }
        return post;
      })
    );
  };

  const handleEditPost = async (postId: string, newContent: string, newImageUrl?: string, newPrivacy: 'public' | 'friends' | 'private' = 'public') => {
    const perm = hasPermission(currentUser, 'canManageOwnPosts', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার নিজের পোস্ট পরিবর্তন বা ডিলিট করার অনুমতি সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }
    // 1. Update local UI state optimistically
    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            content: newContent,
            imageUrl: newImageUrl,
            privacy: newPrivacy
          };
        }
        return post;
      })
    );

    // 2. Persist to Firestore if logged in & not simulated
    if (firebaseUser && !isSimulated) {
      try {
        await updatePostInFirestore(postId, {
          content: newContent,
          imageUrl: newImageUrl || null,
          privacy: newPrivacy
        });
        showToast("Discourse updated inside secure ledger successfully.", "success");
      } catch (error) {
        console.error("Error editing post in Firestore:", error);
        showToast("Failed to edit discourse on secure ledger.", "error");
      }
    } else {
      showToast("Post updated locally.", "success");
    }
  };

  const handleDeletePost = async (postId: string) => {
    const perm = hasPermission(currentUser, 'canManageOwnPosts', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার পোস্ট পরিবর্তন বা ডিলিট করার অনুমতি সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }
    // 1. Update local UI state optimistically
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

    // 2. Persist to Firestore if logged in & not simulated
    if (firebaseUser && !isSimulated) {
      try {
        await deletePostInFirestore(postId);
        showToast("পোস্টটি সফলভাবে ডিলিট করা হয়েছে।", "success");
      } catch (error) {
        console.error("Error deleting post in Firestore:", error);
        showToast("পোস্ট ডিলিট করতে ব্যর্থ হয়েছে।", "error");
      }
    } else {
      showToast("পোস্টটি সফলভাবে ডিলিট করা হয়েছে।", "success");
    }
  };

  const handleCreatePost = async (content: string, imageUrl?: string, verificationRecord?: boolean, privacy: 'public' | 'friends' | 'private' = 'public', bgStyle?: string) => {
    const perm = hasPermission(currentUser, 'canPost', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার নতুন পোস্ট তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }

    // 1. Digital Defense: Rate-limiting verification
    const rateCheck = inspectRateLimit('post');
    if (!rateCheck.allowed) {
      showToast(`পোস্টিং ফ্রিকোয়েন্সি অতিক্রম! অনুগ্রহ করে আরও ${rateCheck.waitSecondsLeft} সেকেন্ড অপেক্ষা করুন।`, "error");
      return;
    }

    // 2. Digital Defense: Spam, SQL Injection & script payload filtering
    const spamCheck = inspectContentForSpam(content, 'posts/create');
    if (spamCheck.isSpam) {
      showToast(spamCheck.reason, "error");
      return;
    }

    const postId = `post_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const newPost: Post = {
      id: postId,
      author: currentUser,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      likes: 0,
      reposts: 0,
      commentsCount: 0,
      comments: [],
      privacy,
      bgStyle,
      hasVerificationRecord: currentUser.isVerified || verificationRecord,
      verificationMethod: currentUser.isVerified 
        ? (currentUser.verificationType === 'government_id' ? 'Government Passport OCR ID validation' : 'Biometric mesh iris scans')
        : (verificationRecord ? 'Identity proof matching document process' : undefined),
      verifiedLocation: currentUser.isVerified ? 'Synchronized Session Access' : (verificationRecord ? 'Munich, Germany' : undefined)
    };

    // Optimistically insert the new post into the timeline for instantaneous response
    setPosts(prev => [newPost, ...prev]);

    if (firebaseUser && !isSimulated) {
      await createPostInFirestore({
        id: postId,
        authorId: firebaseUser.uid,
        author: currentUser,
        content,
        imageUrl: imageUrl || '',
        createdAt: newPost.createdAt,
        privacy,
        bgStyle: bgStyle || '',
        hasVerificationRecord: newPost.hasVerificationRecord || false,
        verificationMethod: newPost.verificationMethod || '',
        verifiedLocation: newPost.verifiedLocation || ''
      });
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    const perm = hasPermission(currentUser, 'canComment', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার কমেন্ট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }

    // 1. Digital Defense: Rate limiting
    const rateCheck = inspectRateLimit('comment');
    if (!rateCheck.allowed) {
      showToast(`কমেন্ট করার ফ্রিকোয়েন্সি অতিক্রম! অনুগ্রহ করে আরও ${rateCheck.waitSecondsLeft} সেকেন্ড অপেক্ষা করুন।`, "error");
      return;
    }

    // 2. Digital Defense: Content filtering (Anti-Spam & Payload inspection)
    const spamCheck = inspectContentForSpam(commentText, 'comments/post');
    if (spamCheck.isSpam) {
      showToast(spamCheck.reason, "error");
      return;
    }

    const commentId = `comment_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const newComment = {
      id: commentId,
      author: currentUser,
      content: commentText,
      createdAt: new Date().toISOString(),
      likes: 0
    };

    // Optimistically update comment locally for zero-latency UX
    setPosts(prevPosts =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      })
    );

    if (firebaseUser && !isSimulated) {
      await addCommentInFirestore(postId, newComment);
    }
  };



  // Profile Edit
  const handleUpdateProfile = async (updates: Partial<User>) => {
    const perm = hasPermission(currentUser, 'canEditProfile', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার প্রোফাইল পরিবর্তন করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }
    const updatedUser = {
      ...currentUser,
      ...updates
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('vt_current_user', JSON.stringify(updatedUser));
    if (viewedProfile && viewedProfile.id === currentUser.id) {
      setViewedProfile(updatedUser);
    }

    if (firebaseUser && !isSimulated) {
      await updateProfileInFirestore(firebaseUser.uid, updatedUser);
      
      const authorPosts = posts.filter(p => p.author && p.author.id === firebaseUser.uid);
      for (const authPost of authorPosts) {
        await updatePostInteractions(authPost.id, { author: updatedUser } as any);
      }
    } else {
      setPosts(prevPosts =>
        prevPosts.map((post) => {
          if (post.author && post.author.id === currentUser.id) {
            return {
              ...post,
              author: updatedUser
            };
          }
          return post;
        })
      );
    }
  };

  // Profile Following Toggle Operations
  const handleFollowToggle = async (targetUser: User) => {
    const perm = hasPermission(currentUser, 'canFollowOthers', appSettings);
    if (!perm.allowed) {
      showToast(perm.reason || "আপনার ফলো করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।", "error");
      return;
    }
    const currentFollowingIds = currentUser.followingIds || [];
    const isFollowing = currentFollowingIds.includes(targetUser.id);

    let nextFollowingIds: string[];
    let nextFollowingCount: number;
    let nextTargetFollowersCount: number;

    if (isFollowing) {
      nextFollowingIds = currentFollowingIds.filter(id => id !== targetUser.id);
      nextFollowingCount = Math.max((currentUser.followingCount || 0) - 1, 0);
      nextTargetFollowersCount = Math.max((targetUser.followersCount || 0) - 1, 0);
    } else {
      nextFollowingIds = [...currentFollowingIds, targetUser.id];
      nextFollowingCount = (currentUser.followingCount || 0) + 1;
      nextTargetFollowersCount = (targetUser.followersCount || 0) + 1;
    }

    const currentUserUpdates: Partial<User> = {
      followingIds: nextFollowingIds,
      followingCount: nextFollowingCount,
    };

    const targetUserUpdates: Partial<User> = {
      followersCount: nextTargetFollowersCount,
    };

    if (firebaseUser && !isSimulated) {
      try {
        await updateProfileInFirestore(firebaseUser.uid, currentUserUpdates);
        await updateProfileInFirestore(targetUser.id, targetUserUpdates);
        showToast(isFollowing ? `Unfollowed @${targetUser.username}` : `Following @${targetUser.username}`, 'success');
      } catch (err) {
        console.error("Follow action failed error: ", err);
        showToast("Unable to record follow state on server.", 'error');
      }
    } else {
      const updatedCurrentUser = {
        ...currentUser,
        ...currentUserUpdates,
      };
      setCurrentUser(updatedCurrentUser);

      const updatedTargetUser = {
        ...targetUser,
        ...targetUserUpdates,
      };

      if (selectedUser && selectedUser.id === targetUser.id) {
        setSelectedUser(updatedTargetUser);
      }
      if (viewedProfile && viewedProfile.id === targetUser.id) {
        setViewedProfile(updatedTargetUser);
      }

      setDbProfiles(prev => ({
        ...prev,
        [currentUser.id]: updatedCurrentUser,
        [targetUser.id]: updatedTargetUser,
      }));

      showToast(isFollowing ? `Unfollowed @${targetUser.username}` : `Following @${targetUser.username}`, 'success');
    }
  };

  // Notification Operations
  const handleMarkAllRead = async () => {
    if (firebaseUser && !isSimulated) {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await markAllNotificationsAsReadInFirestore(unreadIds);
      }
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleClearNotifications = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm("Are you sure you want to clear all notifications?")) {
      return;
    }
    if (firebaseUser && !isSimulated) {
      const allIds = notifications.map(n => n.id);
      if (allIds.length > 0) {
        await clearAllNotificationsInFirestore(allIds);
      }
    } else {
      setNotifications([]);
    }
  };

  const handleMarkSingleRead = async (notificationId: string) => {
    if (firebaseUser && !isSimulated) {
      await markNotificationAsReadInFirestore(notificationId);
    } else {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    }
  };



  // Secure user session logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem('vt_current_user');
      localStorage.removeItem('vt_posts');
      localStorage.removeItem('vt_simulated_user');
      setIsSimulated(false);
      try {
        await logoutUser();
      } catch (authErr) {
        console.warn("Non-blocking context warning: logoutUser failed (this is completely safe in sandbox/simulated mode):", authErr);
      }
      setFirebaseUser(null);
      setCurrentUser(currentUserMock);
      setActiveTab('home');
      setIsMobileMenuOpen(false);
    } catch (err) {
      console.error("Session termination failed:", err);
    }
  };

  const handleDeleteAccount = async () => {
    const userId = firebaseUser?.uid || currentUser?.id;
    if (!userId) {
      showToast("অ্যাকাউন্ট ডিলিট করতে ব্যর্থ হয়েছে। কোন অ্যাক্টিভ ইউজার আইডি পাওয়া যায়নি।", "error");
      return;
    }
    try {
      if (isSimulated) {
        // Update simulated user in vt_mock_users if in simulated mode
        const stored = localStorage.getItem('vt_mock_users');
        let list: any[] = [];
        if (stored) {
          try {
            list = JSON.parse(stored);
          } catch (e) {
            console.error("Error parsing vt_mock_users:", e);
          }
        }

        if (list.length === 0) {
          list = [
            { id: 'current_user', username: 'hasibulon', displayName: 'Hasibul Hasan', isVerified: true, role: 'admin' }
          ];
        }

        const index = list.findIndex((u: any) => u.id === userId);
        if (index > -1) {
          list[index] = { 
            ...list[index], 
            isDeleted: true, 
            deletedAt: new Date().toISOString() 
          };
        } else {
          list.push({
            ...currentUser,
            id: userId,
            isDeleted: true,
            deletedAt: new Date().toISOString()
          });
        }
        localStorage.setItem('vt_mock_users', JSON.stringify(list));

        showToast("আপনার অ্যাকাউন্টটি সফলভাবে ডিলিট করা হয়েছে!", "success");
        setTimeout(() => {
          handleLogout();
        }, 1200);
      } else {
        await updateProfileInFirestore(userId, {
          isDeleted: true,
          deletedAt: new Date().toISOString()
        });
        showToast("আপনার অ্যাকাউন্টটি সফলভাবে ডিলিট করা হয়েছে।", "success");
        setTimeout(() => {
          handleLogout();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      showToast("অ্যাকাউন্ট ডিলিট করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    }
  };

  // Nav item click coordination
  const handleNavigate = (tab: SidebarTab | 'admin' | 'my-groups' | 'my-pages') => {
    if (tab === 'my-groups') {
      setGroupsAndPagesSegment('my-groups');
      setActiveTab('groups');
    } else if (tab === 'my-pages') {
      setGroupsAndPagesSegment('my-pages');
      setActiveTab('groups');
    } else {
      setActiveTab(tab as SidebarTab | 'admin');
    }
    setSelectedUser(null);
    setIsMobileMenuOpen(false);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setActiveTab('profile');
    setIsMobileMenuOpen(false);
  };

  if (isFirebaseLoading) {
    const loaderAccentColor = appSettings?.accent_color || '#10B981';
    const isDarkTheme = theme === 'dark';
    const loadingBg = isDarkTheme 
      ? (appSettings?.dark_bg_color || '#090a0f') 
      : (appSettings?.light_bg_color || '#f8fafc');
    const loadingText = isDarkTheme ? 'text-zinc-100' : 'text-slate-900';
    const loadingSubText = isDarkTheme ? 'text-zinc-400' : 'text-slate-500';

    // First time or returning visit detection
    const isFirstVisit = !localStorage.getItem('vt_visited_before');
    
    // Attempt to resolve personalized user details from localStorage for returning visits
    let savedUserName = '';
    const storedUser = localStorage.getItem('vt_current_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        savedUserName = parsed?.displayName || parsed?.username || '';
      } catch (e) {
        console.warn("Could not parse vt_current_user:", e);
      }
    }

    return (
      <div 
        style={{ backgroundColor: loadingBg }}
        className="min-h-dvh h-dvh flex flex-col items-center justify-center font-sans gap-6 select-none antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] relative overflow-hidden transition-all duration-500"
      >
        {/* Dynamic ambient background glow meshes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            style={{ 
              background: `radial-gradient(circle, ${loaderAccentColor}15 0%, transparent 65%)`,
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full blur-3xl opacity-80 animate-pulse duration-[4000ms]"
          />
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-6 animate-fade-in relative z-10 max-w-[90%] text-center">
          {/* Glowing Animated Outer Ring */}
          <div className="relative p-1.5 rounded-3xl">
            {/* Spinning background track */}
            <div 
              style={{ borderColor: `${loaderAccentColor}20` }}
              className="absolute inset-0 rounded-[28px] border-2 border-dashed animate-spin duration-[15000ms]" 
            />
            
            {/* Dynamic visual launcher container */}
            {appSettings?.logo_image_url ? (
              <div className="relative flex items-center justify-center p-3.5 rounded-[22px] bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/80 shadow-2xl transition duration-300">
                <img 
                  src={appSettings.logo_image_url} 
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-contain hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div 
                style={{ backgroundColor: loaderAccentColor }}
                className="relative flex items-center justify-center w-16 h-16 rounded-[22px] text-white font-black text-4xl transition-all shadow-2xl hover:scale-105 duration-300"
              >
                {appSettings?.logo_icon || 'Z'}
              </div>
            )}

            {/* Micro active notification-dot mimicking trusted server status */}
            <span 
              style={{ backgroundColor: loaderAccentColor }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-ping opacity-75"
            />
            <span 
              style={{ backgroundColor: loaderAccentColor }}
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-950"
            />
          </div>
          
          <div className="text-center space-y-3.5 max-w-sm">
            <div className="space-y-1">
              <h2 className={`text-xl font-extrabold tracking-tight uppercase sm:text-2xl ${loadingText}`}>
                {appSettings?.logo_text || 'Zivobook'}
              </h2>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                <p className="text-[10px] font-mono font-black tracking-[0.25em] text-emerald-500 uppercase">
                  LEID SECURE PROTOCOL
                </p>
              </div>
            </div>

            {/* Session personalization info greeting section above the progress bar */}
            <div className="py-2.5 px-4 rounded-2xl bg-zinc-500/5 dark:bg-zinc-900/40 border border-zinc-500/10 backdrop-blur-md max-w-[280px] mx-auto space-y-1 shadow-sm">
              <div className="flex items-center justify-center">
                {isFirstVisit ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/10 dark:border-emerald-500/15 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                    ✨ New Session
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/15 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider">
                    👋 Returning Visit
                  </span>
                )}
              </div>
              
              <h3 className={`text-[12.5px] font-bold font-sans tracking-tight transition-all duration-300 ${isDarkTheme ? 'text-zinc-100' : 'text-slate-800'}`}>
                {isFirstVisit ? (
                  <span>Establishing secure session...</span>
                ) : (
                  <span>
                    Welcome back, <strong className="font-extrabold" style={{ color: loaderAccentColor }}>{savedUserName || 'Explorer'}</strong>!
                  </span>
                )}
              </h3>
              
              <p className={`text-[10px] leading-relaxed font-sans ${loadingSubText}`}>
                {isFirstVisit ? (
                  "Generating secure device access token"
                ) : (
                  "Previous account session successfully restored"
                )}
              </p>
            </div>

            {/* Custom High fidelity loading progress bar indicator */}
            <div className="w-48 sm:w-56 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mx-auto shadow-inner relative">
              <div 
                style={{ backgroundColor: loaderAccentColor }}
                className="absolute top-0 bottom-0 left-0 w-3/4 rounded-full animate-loading-bar-slide"
              />
            </div>

            <RotatingLoadingTips 
              isDark={isDarkTheme} 
              accentColor={loaderAccentColor} 
            />
          </div>
        </div>

        {/* Global branding footprint signifier */}
        <div className="absolute bottom-5 left-0 right-0 text-center pointer-events-none">
          <p className="text-[9px] font-mono tracking-widest text-zinc-500 dark:text-zinc-650 uppercase">
            Powered by Zivoland Trust Network
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthPage 
        theme={theme}
        appSettings={appSettings}
        onSimulatedLogin={(user) => {
          setFirebaseUser(user);
          const isSim = !!(user && user.uid && user.uid.startsWith('sim_'));
          setIsSimulated(isSim);

          // Synchronize profile instantly to prevent showing outdated or default guest users (e.g. Hasibul Hasan Redoy)
          const saved = localStorage.getItem('vt_current_user');
          let profileLoaded = false;
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && user && parsed.id === user.uid) {
                setCurrentUser(parsed);
                profileLoaded = true;
              }
            } catch (e) {
              console.warn("Error parsing or verifying vt_current_user state:", e);
            }
          }

          if (!profileLoaded && user) {
            const fallbackProfile: User = {
              id: user.uid,
              username: user.email ? user.email.split('@')[0] : 'user_' + user.uid.substring(0, 4),
              displayName: user.displayName || 'Citizen ' + user.uid.substring(0, 4),
              avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
              bio: 'Welcome to my secure profile on Zivobook!',
              isVerified: false,
              profession: 'Member',
              followersCount: 0,
              followingCount: 0,
              badgeLevel: 'blue',
              role: (user.email || '').toLowerCase() === 'hasibulon@gmail.com' ? 'admin' : 'user',
              isOnboarded: false
            };
            setCurrentUser(fallbackProfile);
            localStorage.setItem('vt_current_user', JSON.stringify(fallbackProfile));
          }
        }} 
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  if (currentUser && currentUser.isOnboarded === false) {
    return (
      <OnboardingWizard
        isDark={theme === 'dark'}
        currentUser={currentUser}
        onComplete={async (onboardedData) => {
          try {
            const updatedUser = {
              ...currentUser,
              ...onboardedData,
              isOnboarded: true
            };
            
            // 1. Update state & localStorage
            setCurrentUser(updatedUser);
            localStorage.setItem('vt_current_user', JSON.stringify(updatedUser));
            
            // 2. Persist in database
            if (firebaseUser && !isSimulated) {
              await updateProfileInFirestore(firebaseUser.uid, {
                firstName: onboardedData.firstName,
                lastName: onboardedData.lastName,
                birthday: onboardedData.birthday,
                gender: onboardedData.gender,
                phoneNumber: onboardedData.phoneNumber,
                displayName: onboardedData.displayName,
                isOnboarded: true
              });
            }
            showToast(theme === 'dark' ? "Account setup complete!" : "অ্যাকাউন্ট সেটআপ সম্পন্ন হয়েছে!", "success");
          } catch (err) {
            console.error("Failed to commit onboarded updates to cloud storage:", err);
            const updatedUser = {
              ...currentUser,
              ...onboardedData,
              isOnboarded: true
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('vt_current_user', JSON.stringify(updatedUser));
            showToast("Complete (local model fallback)!", "success");
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  if (activeTab === 'admin') {
    return (
      <AdminDashboard
        userIsAdmin={userIsAdmin}
        onNavigateHome={() => handleNavigate('home')}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onUserSelect={handleUserSelect}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-slate-955 text-slate-100 flex flex-col font-sans select-none antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:pb-6">
      
      {/* Dynamic Branding and Typography Global Style Override */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

          :root {
            --bg-color: ${appSettings.dark_bg_color || '#18191A'};
            --card-color: ${appSettings.dark_card_color || '#242526'};
            --accent-color: ${appSettings.accent_color || '#10B981'};
            --accent-color-rgb: ${getHexToRgb(appSettings.accent_color || '#10B981')};
            --base-text-size: ${getBaseFontSizePixels(appSettings.base_font_size || 'Medium/16px')};
            --font-family-global: "${appSettings.font_family || 'Inter'}", sans-serif;

            --slate-955: var(--bg-color) !important;
            --slate-950: var(--card-color) !important;
            --slate-500: var(--accent-color) !important;

            /* Feed dynamic styles - Dark Mode */
            --feed-post-bg: ${appSettings.feed_post_bg_dark || '#1e293b'};
            --feed-main-txt: ${appSettings.feed_main_text_color_dark || '#e4e6eb'};
            --feed-sub-txt: ${appSettings.feed_sub_text_color_dark || '#94a3b8'};
            --feed-btn-bg: ${appSettings.feed_btn_bg_color || '#3b82f6'};
            --feed-btn-hover-bg: ${appSettings.feed_btn_hover_bg || '#2563eb'};
            --feed-btn-txt: ${appSettings.feed_btn_text_color || '#ffffff'};
            
            --feed-ad-bg: ${appSettings.feed_ad_bg_dark || '#451a03'};
            --feed-ad-txt: ${appSettings.feed_ad_text_color_dark || '#fef3c7'};
            --feed-ad-btn: ${appSettings.feed_ad_btn_bg || '#b45309'};

            --feed-prd-bg: ${appSettings.feed_product_bg_dark || '#14532d'};
            --feed-prd-txt: ${appSettings.feed_product_text_color || '#15803d'};
            --feed-prd-price: ${appSettings.feed_product_price_color || '#22c55e'};
            --feed-prd-btn: ${appSettings.feed_product_btn_bg || '#16a34a'};

            --feed-border-radius: ${appSettings.feed_border_radius === 'none' ? '0px' : appSettings.feed_border_radius === 'md' ? '8px' : appSettings.feed_border_radius === 'xl' ? '12px' : appSettings.feed_border_radius === '2xl' ? '16px' : '12px'};
          }

           html.light {
            --bg-color: ${appSettings.light_bg_color || '#F0F2F5'};
            --card-color: ${appSettings.light_card_color || '#FFFFFF'};
            --accent-color: ${appSettings.accent_color && appSettings.accent_color !== '#2563eb' && appSettings.accent_color !== '#3b82f6' ? appSettings.accent_color : '#2d6ae5'} !important;

            --slate-955: var(--bg-color) !important;
            --slate-950: var(--card-color) !important;
            --slate-500: var(--accent-color) !important;

            /* Feed dynamic styles - Light Mode */
            --feed-post-bg: ${appSettings.feed_post_bg_light || '#ffffff'};
            --feed-main-txt: ${appSettings.feed_main_text_color_light || '#1c1e21'};
            --feed-sub-txt: ${appSettings.feed_sub_text_color_light || '#65676b'};

            --feed-btn-bg: ${appSettings.feed_btn_bg_color && appSettings.feed_btn_bg_color !== '#2563eb' && appSettings.feed_btn_bg_color !== '#3b82f6' ? appSettings.feed_btn_bg_color : '#2d6ae5'} !important;
            --feed-btn-hover-bg: #1d51bd !important;

            --feed-ad-bg: ${appSettings.feed_ad_bg_light || '#fef3c7'};
            --feed-ad-txt: ${appSettings.feed_ad_text_color_light || '#78350f'};

            --feed-prd-bg: ${appSettings.feed_product_bg_light || '#f0fdf4'};
          }

          /* Soften blue accents inside Day / Light Mode for reduced eye strain */
          html.light .bg-blue-600, 
          html.light .bg-blue-500, 
          html.light .bg-\[\#2374E1\], 
          html.light .bg-\[\#1877F2\],
          html.light .feed-post-action-btn {
            background-color: var(--accent-color, #2d6ae5) !important;
          }

          html.light .hover\:bg-blue-700:hover, 
          html.light .hover\:bg-blue-600:hover,
          html.light .hover\:bg-\[\#2374E1\]:hover, 
          html.light .feed-post-action-btn:hover {
            background-color: #1d51bd !important;
          }

          html.light .text-blue-600, 
          html.light .text-blue-500, 
          html.light .text-\[\#2374E1\], 
          html.light .text-\[\#1877F2\] {
            color: var(--accent-color, #2d6ae5) !important;
          }

          html.light .border-blue-600, 
          html.light .border-blue-500, 
          html.light .border-blue-500\/30 {
            border-color: rgba(45, 106, 229, 0.3) !important;
          }

          html.light .bg-blue-600\/10, 
          html.light .bg-blue-500\/10, 
          html.light .bg-blue-500\/15 {
            background-color: rgba(45, 106, 229, 0.08) !important;
          }

          /* Soften dark mode main font contrast mapping to comfort off-white */
          .dark, .dark body, .dark #root {
            color: ${appSettings.global_text_color_dark || '#e4e6eb'} !important;
          }
          .dark .text-white, 
          .dark .text-zinc-50, 
          .dark .text-zinc-100, 
          .dark .text-gray-50, 
          .dark .text-gray-100,
          .dark .text-slate-50,
          .dark .text-slate-100 {
            color: ${appSettings.global_text_color_dark || '#e4e6eb'} !important;
          }

          /* Setup typography scale multipliers (Body, Headings, Mono) */
          :root {
            --sans-font-scale: ${appSettings.desktop_sans_scale !== undefined ? appSettings.desktop_sans_scale : 1.0};
            --display-font-scale: ${appSettings.desktop_display_scale !== undefined ? appSettings.desktop_display_scale : 1.0};
            --mono-font-scale: ${appSettings.desktop_mono_scale !== undefined ? appSettings.desktop_mono_scale : 1.0};
          }

          @media (max-width: 767px) {
            :root {
              --sans-font-scale: ${appSettings.mobile_sans_scale !== undefined ? appSettings.mobile_sans_scale : 1.0};
              --display-font-scale: ${appSettings.mobile_display_scale !== undefined ? appSettings.mobile_display_scale : 1.0};
              --mono-font-scale: ${appSettings.mobile_mono_scale !== undefined ? appSettings.mobile_mono_scale : 1.0};
            }
          }

          body, html, #root, [class*="font-sans"], .font-sans {
            font-family: var(--font-family-global) !important;
            font-size: calc(${getBaseFontSizePixels(appSettings.base_font_size || 'Medium/16px')} * var(--sans-font-scale)) !important;
          }

          /* Display / Heading responsive class scaling */
          .font-display.text-xs, [class*="font-display"].text-xs { font-size: calc(0.75rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-sm, [class*="font-display"].text-sm { font-size: calc(0.875rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-base, [class*="font-display"].text-base { font-size: calc(1rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-lg, [class*="font-display"].text-lg { font-size: calc(1.125rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-xl, [class*="font-display"].text-xl, h4 { font-size: calc(1.25rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-2xl, [class*="font-display"].text-2xl, h3 { font-size: calc(1.5rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-3xl, [class*="font-display"].text-3xl, h2 { font-size: calc(1.875rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-4xl, [class*="font-display"].text-4xl, h1 { font-size: calc(2.25rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }
          .font-display.text-5xl, [class*="font-display"].text-5xl { font-size: calc(3rem * var(--sans-font-scale) * var(--display-font-scale)) !important; }

          /* Monospace / Code font responsive class scaling */
          .font-mono.text-xs, [class*="font-mono"].text-xs, code.text-xs, .registry-badge { font-size: calc(0.75rem * var(--sans-font-scale) * var(--mono-font-scale)) !important; }
          .font-mono.text-sm, [class*="font-mono"].text-sm, code.text-sm { font-size: calc(0.875rem * var(--sans-font-scale) * var(--mono-font-scale)) !important; }
          .font-mono.text-base, [class*="font-mono"].text-base, code.text-base { font-size: calc(1rem * var(--sans-font-scale) * var(--mono-font-scale)) !important; }
          .font-mono.text-lg, [class*="font-mono"].text-lg, code.text-lg { font-size: calc(1.125rem * var(--sans-font-scale) * var(--mono-font-scale)) !important; }

          /* General Text Global Customizer */
          .dark .global-main-text, .dark h1, .dark h2, .dark h3, .dark h4 {
            color: ${appSettings.global_text_color_dark || '#e4e6eb'} !important;
          }
          .light .global-main-text, .light h1, .light h2, .light h3, .light h4 {
            color: ${appSettings.global_text_color_light || '#1c1e21'} !important;
          }
          .dark .global-sub-text, .dark p {
            color: ${appSettings.global_sub_text_color_dark || '#94a3b8'} !important;
          }
          .light .global-sub-text, .light p {
            color: ${appSettings.global_sub_text_color_light || '#65676b'} !important;
          }

          /* Dynamic Feed Posts Style Bindings */
          .feed-post-custom-card {
            background-color: var(--feed-post-bg) !important;
            color: var(--feed-main-txt) !important;
            border-radius: var(--feed-border-radius) !important;
          }
          .feed-post-main-text {
            color: var(--feed-main-txt) !important;
          }
          .feed-post-sub-text {
            color: var(--feed-sub-txt) !important;
          }
          .feed-post-action-btn {
            background-color: var(--feed-btn-bg) !important;
            color: var(--feed-btn-txt) !important;
            border-radius: 9999px !important;
          }
          .feed-post-action-btn:hover {
            background-color: var(--feed-btn-hover-bg) !important;
            opacity: 0.95;
          }

          /* Sponsored Ad specific classes */
          .feed-sponsored-custom-card {
            background-color: var(--feed-ad-bg) !important;
            color: var(--feed-ad-txt) !important;
            border-radius: var(--feed-border-radius) !important;
          }
          .feed-sponsored-custom-card p, .feed-sponsored-custom-card h4, .feed-sponsored-custom-card span {
            color: var(--feed-ad-txt) !important;
          }
          .feed-ad-action-btn {
            background-color: var(--feed-ad-btn) !important;
            color: #ffffff !important;
          }

          /* Feed Product specific classes */
          .feed-product-custom-card {
            background-color: var(--feed-prd-bg) !important;
            color: var(--feed-prd-txt) !important;
            border-radius: var(--feed-border-radius) !important;
          }
          .feed-product-price {
            color: var(--feed-prd-price) !important;
          }
          .feed-product-btn {
            background-color: var(--feed-prd-btn) !important;
            color: #ffffff !important;
          }

          /* Match specific classes using #10B981 or emerald details */
          [class*="bg-[#10B981]"], [class*="bg-emerald-"], [class*="bg-teal-"] {
            background-color: var(--accent-color) !important;
          }
          [class*="text-[#10B981]"], [class*="text-emerald-"], [class*="text-teal-"] {
            color: var(--accent-color) !important;
          }
          [class*="border-[#10B981]"], [class*="border-emerald-"], [class*="border-teal-"] {
            border-color: var(--accent-color) !important;
          }
          [class*="focus:border-[#10B981]"]:focus {
            border-color: var(--accent-color) !important;
          }

          /* Overwrite button gradients that used brand color */
          [class*="from-[#10B981]"], [class*="to-[#059669]"], [class*="from-emerald-"], [class*="to-emerald-"] {
            background-image: none !important;
            background-color: var(--accent-color) !important;
          }

          /* Custom utility maps to bind accent dynamic context classes */
          .dynamic-accent-bg {
            background-color: var(--accent-color) !important;
          }
          .dynamic-accent-text {
            color: var(--accent-color) !important;
          }
          .dynamic-accent-border {
            border-color: var(--accent-color) !important;
          }
          
          /* Semi-transparent overlays match the accent rgb */
          .bg-emerald-500\\/10 {
            background-color: rgba(var(--accent-color-rgb), 0.1) !important;
          }
          .border-emerald-500\\/20 {
            border-color: rgba(var(--accent-color-rgb), 0.2) !important;
          }
          .shadow-emerald-500\\/10 {
            --tw-shadow-color: rgba(var(--accent-color-rgb), 0.1) !important;
          }
          .border-emerald-500\\/30 {
            border-color: rgba(var(--accent-color-rgb), 0.3) !important;
          }
          .bg-emerald-950 {
            background-color: rgba(var(--accent-color-rgb), 0.1) !important;
          }
          .border-emerald-500\\/15 {
            border-color: rgba(var(--accent-color-rgb), 0.15) !important;
          }
          .emerald-glow-effects {
            box-shadow: 0 0 12px rgba(var(--accent-color-rgb), 0.45);
          }
          .profile-active-btn {
            color: var(--accent-color) !important;
            background-color: rgba(var(--accent-color-rgb), 0.15) !important;
            border-color: rgba(var(--accent-color-rgb), 0.35) !important;
          }
        `}
      </style>
      
      {/* 1. Facebook-style Top Navigation Bar, sticky to the viewport */}
      <TopNavbar
        currentTab={activeTab}
        onTabChange={(tab) => {
          handleNavigate(tab);
          if (tab === 'home' || tab === 'groups' || tab === 'watch') {
            setIsMobileMenuOpen(false);
          }
        }}
        currentUser={currentUser}
        dbProfiles={dbProfiles}
        verifiedUsersMock={verifiedUsersMock}
        onSelectUser={handleUserSelect}
        onOpenCreatePost={() => setIsCreatePostModalOpen(true)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
        onClearNotifications={handleClearNotifications}
        onMarkSingleRead={handleMarkSingleRead}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onLogout={handleLogout}
        userIsAdmin={userIsAdmin}
        onSelectHashtag={setSelectedHashtag}
        appSettings={appSettings}
        pendingVerificationCount={pendingVerificationCount}
        firestoreQuotaExceeded={firestoreQuotaExceeded}
      />

      {firestoreQuotaExceeded && (
        <div className="mx-auto w-full max-w-[1250px] px-2 sm:px-4 mt-2">
          <div className="p-4 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none animate-fade-in shadow-lg">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-left leading-tight">
                <p className="text-xs font-bold uppercase tracking-wide">Database Quota limit reached</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  The application's Firebase Firestore read/write limit of daily free units has been reached. We have gracefully switched your session to client-side high-trust local storage fallback mode so you can continue testing all features without disruption.
                </p>
              </div>
            </div>
            <a
              href="https://console.firebase.google.com/project/charged-array-n6tp2/firestore/databases/ai-studio-581b1619-e095-44f8-868c-2c15f01d52dc/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 text-slate-950 font-bold px-4 py-2 font-mono text-[10px] rounded-xl transition shrink-0 inline-flex items-center gap-1.5 leading-none uppercase"
            >
              UPGRADE PLAN <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* 2. Responsive Main Three-Column Flexbox Layout Container */}
      <div className={`mx-auto w-full px-0 sm:px-4 flex justify-center gap-6 mt-1 flex-grow
        ${activeTab === 'profile' ? 'max-w-[1050px]' : 'max-w-[1250px]'}`}>
        
        {/* LEFT COLUMN: FIXED SIDEBAR (collapsible on mobile menu) (Hidden on profile) */}
        {activeTab !== 'profile' && (
          <div className={`shadow-xl md:shadow-none ease-in-out duration-330 transition-all md:block w-[280px] shrink-0
            ${isMobileMenuOpen 
              ? 'fixed inset-x-0 bottom-0 top-[120px] z-30 bg-slate-955 overflow-y-auto px-4 divide-y divide-slate-900' 
              : 'hidden md:sticky md:top-4 md:h-[calc(100vh-80px)] overflow-y-auto scrollbar-none'}`}>
            <Sidebar
              currentTab={activeTab}
              onTabChange={(tab) => {
                handleNavigate(tab);
                setIsMobileMenuOpen(false);
              }}
              currentUser={currentUser}
              unreadCount={unreadCount}
              userIsAdmin={userIsAdmin}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              appSettings={appSettings}
              pendingVerificationCount={pendingVerificationCount}
            />
          </div>
        )}

        {/* CENTER COLUMN: STORIES, INPUT CARD, FEEDS, OR TAB COMPONENT */}
        <main className={`flex-1 min-w-0 space-y-5 pb-[85px]
          ${activeTab === 'admin' || activeTab === 'profile' || activeTab === 'messages' ? 'max-w-none w-full' : 'max-w-[600px]'}`} id="central-scrolling-content-frame">
          


          {/* Tab Route Switching */}
          {activeTab === 'home' && (
            <div className="flex flex-col animate-fade-in">
              {/* Account verification warning banner notice as requested by user */}
              {!currentUser.isVerified && (
                <div className={`p-4 mb-4 rounded-2xl border text-xs relative overflow-hidden transition-all duration-300 ${
                  isDark ? 'bg-amber-955/20 border-amber-800/40 text-amber-100' : 'bg-amber-50 border-amber-250 text-amber-900 shadow-sm'
                }`}>
                  <div className="flex gap-3">
                    <div className="p-2 h-fit rounded-full bg-amber-500/15 text-amber-500 shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1.5 flex-grow pr-4">
                      <h4 className="font-extrabold tracking-tight text-[12px] flex items-center gap-1.5 text-left">
                        {theme === 'dark' ? "Pending Account Verification" : "অ্যাকাউন্ট ভেরিফিকেশন সতর্কতা"}
                        <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded text-white uppercase bg-red-650 animate-pulse">
                          Unverified
                        </span>
                      </h4>
                      <p className={`text-[10.5px] leading-relaxed font-semibold text-left ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                        {theme === 'dark' 
                          ? "Your account verification is incomplete! Complete verification now to receive a blue trust badge on your profile and get full secure access to all features." 
                          : "আপনার অ্যাকাউন্টটি সম্পূর্ণ ভেরিফাই করা হয়নি! ট্রাস্ট ব্যাজ পেতে এবং আপনার সকল কার্যক্রম সচল করতে এখনই আপনার তথ্য ভেরিফাই করুন।"}
                      </p>
                      
                      <div className="pt-2 flex flex-wrap gap-2 text-left">
                        <button
                          onClick={async () => {
                            try {
                              const updatedUser = {
                                ...currentUser,
                                isVerified: true,
                                badgeLevel: 'blue' as const
                              };
                              setCurrentUser(updatedUser);
                              localStorage.setItem('vt_current_user', JSON.stringify(updatedUser));
                              
                              if (firebaseUser && !isSimulated) {
                                await updateProfileInFirestore(firebaseUser.uid, {
                                  isVerified: true,
                                  badgeLevel: 'blue'
                                });
                              }
                              showToast(theme === 'dark' ? "Profile verified successfully! Received blue trust badge." : "অভিনন্দন! আপনার অ্যাকাউন্টটি সফলভাবে ভেরিফাই হয়ে গেছে।", "success");
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                            isDark ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-amber-600 text-white hover:bg-amber-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{theme === 'dark' ? "Verify Profile Now" : "এখনই ভেরিফাই করুন"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Facebook-style What's on your mind row */}
              <div className={`p-3.5 mb-2 rounded-2xl border flex items-center gap-3 select-none transition-colors duration-300 ${isDark ? 'bg-[#242526] border-zinc-800' : 'bg-white border-gray-200 shadow-xs'}`}>
                <div onClick={() => handleNavigate('profile')} className="cursor-pointer shrink-0">
                  <img src={currentUser.avatar} alt="Me" className="w-[40px] h-[40px] rounded-full object-cover border border-black/5" />
                </div>
                <div 
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className={`flex-grow h-10 rounded-full flex items-center px-4 cursor-pointer text-left border transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-[#b0b3b8] hover:bg-zinc-800' : 'bg-[#f0f2f5] border-[#f0f2f5] text-[#65676b] hover:bg-[#e4e6eb]'
                  }`}
                >
                  <span className="text-[13.5px] font-medium font-sans">What's on your mind, {currentUser.displayName.replace(/^(Dr\.|Mr\.|Mrs\.)\s*/i, '').split(' ')[0]}?</span>
                </div>
                <button 
                  onClick={() => setIsCreatePostModalOpen(true)} 
                  className={`p-2 rounded-full cursor-pointer transition ${isDark ? 'hover:bg-zinc-800 text-emerald-400' : 'hover:bg-gray-100 text-emerald-500'}`}
                  title="Photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.9 2.9m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </button>
              </div>

              {/* Stories & Reels component */}
              <div className="mb-[3px]">
                <StoriesSection
                  currentUser={currentUser}
                  onSelectUser={handleUserSelect}
                  verifiedUsers={verifiedUsersMock}
                  theme={theme}
                  onShowToast={showToast}
                  appSettings={appSettings}
                />
              </div>
              {/* Active Hashtag Filter Clearable Banner */}
              {selectedHashtag && (
                <div className="flex items-center justify-between bg-[#2374E1]/10 border border-[#2374E1]/15 rounded-2xl p-3 pb-2.5 px-4 text-xs select-none animate-fade-in mb-[3px]" id="active-hashtag-filter-banner">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2374E1] animate-pulse" />
                    <span className="text-slate-300 font-medium">Filtering posts with:</span>
                    <span className="bg-[#2374E1]/20 font-bold font-mono text-[#2374E1] px-2 py-0.5 rounded-lg text-[11px]">{selectedHashtag}</span>
                  </div>
                  <button
                    onClick={() => setSelectedHashtag(null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-xl transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* Feed Card Stack */}
              <div className="space-y-[6px]">
                {filteredPosts.length === 0 ? (
                  <div className="p-10 text-center bg-slate-900/10 border border-slate-900 rounded-2xl border-dashed">
                    <p className="text-slate-400 text-xs font-sans">No matching verified discourse topics discovered.</p>
                  </div>
                ) : (
                  filteredPosts.map((post, idx) => {
                    const postNum = idx + 1;
                    const showAd = appSettings.global_feed_show_ad && (postNum % (appSettings.global_feed_ad_interval || 3) === 0);
                    const showFriends = appSettings.global_feed_show_friends && (postNum % (appSettings.global_feed_friends_interval || 4) === 0);
                    const showReels = appSettings.global_feed_show_reels && (postNum % (appSettings.global_feed_reels_interval || 5) === 0);
                    const showProducts = appSettings.global_feed_show_products && (postNum % (appSettings.global_feed_products_interval || 6) === 0);
                    const showGroups = appSettings.global_feed_show_groups && (postNum % (appSettings.global_feed_groups_interval || 7) === 0);
                    const showJobs = appSettings.global_feed_show_jobs && (postNum % (appSettings.global_feed_jobs_interval || 8) === 0);

                    return (
                      <React.Fragment key={post.id}>
                        <VirtualPostWrapper postId={post.id}>
                          <PostCard
                            post={post}
                            currentUser={currentUser}
                            onLike={handleLike}
                            onRepost={handleRepost}
                            onAddComment={handleAddComment}
                            onSelectUser={handleUserSelect}
                            onShowToast={showToast}
                            onSelectHashtag={setSelectedHashtag}
                            onEditPost={handleEditPost}
                            onDeletePost={handleDeletePost}
                            theme={theme}
                            appSettings={appSettings}
                          />
                        </VirtualPostWrapper>

                        {/* 1. Dynamic Ad Injection */}
                        {showAd && (
                          <div className="p-5 rounded-3xl border feed-sponsored-custom-card space-y-3.5 transition duration-240 relative overflow-hidden" id={`feed-ad-${post.id}`}>
                            <div className="absolute top-0 right-0 px-3 py-1 bg-red-650 text-white font-mono text-[9px] font-black uppercase rounded-bl-xl tracking-wider">SPONSORED AD</div>
                            <div className="flex gap-3 text-left">
                              <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-550 shrink-0 self-start">
                                <Megaphone className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-extrabold uppercase tracking-wide">BSB আইটি ও লার্নিং স্কলারশিপ প্রোগ্রাম</h4>
                                <p className="text-[11.5px] leading-relaxed">আপনার সফটওয়্যার ইঞ্জিনিয়ারিং ক্যারিয়ারের দ্রুত সুচনার জন্য ঢাকা একাডেমিতে ৩০% বিশেষ স্কলারশিপ অফার!</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-zinc-800 text-[11px]">
                              <span className="font-mono text-[10px]">Promo Code: <span className="font-extrabold text-red-500">LEARNER30</span></span>
                              <button 
                                onClick={() => showToast("বিজ্ঞাপন লিংকে সফলভাবে প্রবেশ করেছেন!", "success")}
                                className="px-4 py-1.5 rounded-full font-extrabold font-sans text-[10px] text-white transition cursor-pointer shadow-xs feed-ad-action-btn"
                              >
                                এখনই জয়েন করুন
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Dynamic Friends Recommendation */}
                        {showFriends && (
                          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#18191a] border-[#242526] text-gray-200' : 'bg-white border-gray-300 text-gray-900 shadow-sm'} space-y-3 shadow-xs`} id={`feed-friends-${post.id}`}>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
                                <UserPlus className="w-4 h-4" /> আপনার জন্য বন্ধু সাজেশন্স
                              </span>
                              <span className={`text-[9px] uppercase font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Suggested</span>
                            </div>
                            <div className="space-y-2">
                              {[
                                { name: "সাকিব আল হাসান (Python Pro)", handle: "@shakib_learner", followers: "৬.৫k Follows" },
                                { name: "হাসান চৌধুরী (UX Lead)", handle: "@hasan_ux_bd", followers: "১.২k Follows" }
                              ].map((f, fIdx) => (
                                <div key={fIdx} className={`p-3 rounded-2xl flex items-center justify-between border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700' : 'bg-gray-50/70 border-gray-200/80 hover:border-gray-300'} transition`}>
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 font-black flex items-center justify-center text-xs">
                                      {f.name.charAt(0)}
                                    </div>
                                    <div className="text-left leading-tight">
                                      <p className={`text-[11px] font-extrabold ${theme === 'dark' ? 'text-zinc-200' : 'text-gray-950'}`}>{f.name}</p>
                                      <p className={`text-[9px] font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600 font-medium'}`}>{f.handle} • {f.followers}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => showToast(`${f.name} কে ফলো করা শুরু হয়েছে!`, "success")}
                                    className="px-3.5 py-1.5 rounded-full bg-amber-550 hover:bg-amber-600 text-[10px] text-white font-extrabold uppercase transition scale-95 hover:scale-100 cursor-pointer"
                                  >
                                    Follow
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Embedded 'Reels' Horizontal Carousel */}
                        {showReels && (
                          <div className={`max-w-xl mx-auto rounded-xl border mb-1.5 transition-all duration-300 relative overflow-hidden shadow-sm ${
                            theme === 'dark' ? 'bg-[#18191a] border-zinc-800' : 'bg-white border-gray-200'
                          }`} id={`feed-reels-carousel-${post.id}`}>
                            {/* Header row with 'Reels' list title and more icon */}
                            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-150/10" id="reels-header">
                              <span className={`text-[15px] font-bold tracking-tight flex items-center gap-2 ${
                                theme === 'dark' ? 'text-zinc-100' : 'text-[#1c1e21]'
                              }`}>
                                <PlaySquare className="w-4 h-4 text-[#1877F2]" />
                                Reels
                              </span>
                              <button
                                onClick={() => showToast("রীলস সেটিংস লোড করা হয়েছে", "success")}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                  theme === 'dark' ? 'hover:bg-zinc-800 text-slate-400' : 'hover:bg-gray-100 text-[#65676b]'
                                }`}
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Horizontal scrollable snaps-container */}
                            <div className="flex overflow-x-auto space-x-3 px-4 py-3.5 scrollbar-hide snap-x pointer-events-auto" id="reels-container">
                              {[
                                { title: "Coding in 2026 🧑‍💻", views: "1.2M views", bg: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&auto=format&fit=crop" },
                                { title: "New UI Release ✨", views: "450K views", bg: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop" },
                                { title: "Zivobook Protocol 🔒", views: "85K views", bg: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&auto=format&fit=crop" },
                                { title: "AI Dev Lifecycle 🚀", views: "2.1M views", bg: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=300&auto=format&fit=crop" }
                              ].map((r, rIdx) => (
                                <div
                                  key={rIdx}
                                  onClick={() => showToast(`"${r.title}" রিলস লোড করা হচ্ছে...`, "success")}
                                  className="w-36 aspect-[9/16] bg-gray-900 rounded-xl overflow-hidden relative flex-shrink-0 snap-start shadow-sm active:scale-95 transition-transform duration-200 cursor-pointer group"
                                >
                                  {/* Thumbnail Background */}
                                  <img 
                                    src={r.bg} 
                                    alt={r.title} 
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                                  />
                                  {/* Dark overlay at the bottom & top gradient for depth */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10" />
                                  <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/45 to-transparent z-10" />
                                  
                                  {/* Floating Live badge / Play icon */}
                                  <div className="absolute top-2.5 left-2.5 bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded-full z-20 flex items-center gap-1">
                                    <PlaySquare className="w-3 h-3 text-[#1877F2] fill-current" />
                                    <span className="text-[9px] text-white font-bold uppercase tracking-wider">REEL</span>
                                  </div>

                                  {/* Reel Title and View stats */}
                                  <div className="absolute bottom-3 left-2.5 right-2.5 z-25 text-white flex flex-col justify-end">
                                    <p className="text-[11px] font-bold leading-snug tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-2">
                                      {r.title}
                                    </p>
                                    <p className="text-[9.5px] text-zinc-300 font-medium tracking-wide mt-1 font-mono drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.8)]">
                                      {r.views}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Products Shop recommendation line */}
                        {showProducts && (
                          <div className="p-4 rounded-3xl border feed-product-custom-card space-y-3" id={`feed-products-${post.id}`}>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-emerald-500">
                                <ShoppingBag className="w-4 h-4" /> লার্নারস মার্কেটপ্লেস পণ্য
                              </span>
                              <span className="text-[9px] uppercase font-mono">Offers</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {[
                                { title: "সি ল্যাঙ্গুয়েজ হ্যান্ডবুক (২য় সংস্করণ)", price: "BDT ২৫০", seller: "অন বুক শপ" },
                                { title: "আইটি ইন্টারভিউ ক্র্যাকিং চিটশিট", price: "BDT ১০০", seller: "ডিজিটাল প্রেস" }
                              ].map((p, pIdx) => (
                                <div key={pIdx} className="p-3 rounded-2xl border flex flex-col justify-between border-gray-200/50 dark:border-zinc-850 space-y-2 bg-black/10 dark:bg-black/20">
                                  <div className="text-left space-y-0.5">
                                    <p className="text-[11px] font-extrabold line-clamp-1">{p.title}</p>
                                    <p className="text-[9px] font-mono opacity-80">বিক্রেতা: {p.seller}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold font-mono feed-product-price">{p.price}</span>
                                    <button 
                                      onClick={() => showToast(`"${p.title}" কার্টে যোগ করা হয়েছে!`, "success")}
                                      className="px-3 py-1.5 rounded-lg text-[9px] text-white font-extrabold uppercase transition cursor-pointer feed-product-btn"
                                    >
                                      Buy Now
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Groups Recommendation Row */}
                        {showGroups && (
                          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#18191a] border-[#242526] text-gray-200' : 'bg-white border-gray-300 text-gray-900 shadow-sm'} space-y-3`} id={`feed-groups-${post.id}`}>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-indigo-500">
                                <Users className="w-4 h-4" /> রিকোমেন্ডেড স্টাডি গ্রুপ
                              </span>
                              <span className={`text-[9px] uppercase font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>Groups</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                              {[
                                { title: "JavaScript BD PRO", members: "৩.৫k একটিভ লার্নারস" },
                                { title: "AI Learners Group", members: "১.৮k একটিভ লার্নারস" }
                              ].map((g, gIdx) => (
                                <div key={gIdx} className={`p-3 rounded-2xl border text-left flex flex-col justify-between ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gray-50/70 border-gray-200/80'} space-y-3`}>
                                  <div className="space-y-0.5">
                                    <p className={`text-[11px] font-extrabold line-clamp-1 text-[#2374E1] dark:text-blue-450`}>{g.title}</p>
                                    <p className={`text-[9px] ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600 font-medium'}`}>{g.members}</p>
                                  </div>
                                  <button
                                    onClick={() => showToast(`স্টাডি গ্রুপ "${g.title}" এ জয়েন করার রিকোয়েস্ট পাঠানো হয়েছে!`, "success")}
                                    className="w-full text-center py-1.5 rounded-lg bg-[#2374E1] hover:bg-blue-600 text-[9px] font-extrabold text-white uppercase transition cursor-pointer"
                                  >
                                    Join Group
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 6. Jobs Opportunities Suggestion */}
                        {showJobs && (
                          <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#18191a] border-[#242526] text-gray-200' : 'bg-white border-gray-300 text-gray-900 shadow-sm'} space-y-3`} id={`feed-jobs-${post.id}`}>
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[#2374E1]">
                                <Briefcase className="w-4 h-4" /> আপনার জন্য চাকরির চূড়ান্ত অফার
                              </span>
                              <span className="bg-[#2374E1]/10 text-[#2374E1] dark:text-blue-400 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Verified Job</span>
                            </div>
                            <div className={`p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-gray-50/70 border-gray-200/80'} space-y-2 text-left`}>
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <h5 className={`font-extrabold text-[12px] ${theme === 'dark' ? 'text-zinc-100' : 'text-gray-950'}`}>জুনিয়র রিয়্যাক্ট ফ্রন্টেন্ড ডেভেলপারস</h5>
                                  <p className={`text-[10px] ${theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'}`}>BSB Soft Academy • ঢাকা, উত্তরা ক্যাম্পাস</p>
                                </div>
                                <span className="text-[10px] font-extrabold font-mono text-emerald-500">BDT ৩০,০০০ - ৩৫,০০০/মাস</span>
                              </div>
                              <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-750 font-medium'}`}>দক্ষতা: React, Tailwind CSS, Firebase Integration, clean code architectural pattern.</p>
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => showToast("আপনার লার্নিং প্রোফাইলের সিভি সফলভাবে পাঠানো হয়েছে!", "success")}
                                  className="px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-[10px] text-white font-extrabold uppercase tracking-wider transition cursor-pointer"
                                >
                                  Apply Now
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={viewedProfile || selectedUser || currentUser}
              posts={posts}
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onLike={handleLike}
              onRepost={handleRepost}
              onAddComment={handleAddComment}
              onShowToast={showToast}
              onAddPost={handleCreatePost}
              onFollowToggle={handleFollowToggle}
              onNavigateToMessages={(chatUser) => {
                setChatPreselectedUser(chatUser);
                setActiveTab('messages');
              }}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              theme={theme}
              onSelectUser={handleUserSelect}
              appSettings={appSettings}
              onNavigate={handleNavigate}
            />
          )}





          {activeTab === 'settings' && (
            <SettingsView
              theme={theme}
              onToggleTheme={handleToggleTheme}
              userIsAdmin={userIsAdmin}
              onNavigate={handleNavigate}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard
              userIsAdmin={userIsAdmin}
              onNavigateHome={() => handleNavigate('home')}
              currentUser={currentUser}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onUserSelect={handleUserSelect}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView
              currentUser={currentUser}
              onShowToast={showToast}
              onSelectUser={handleUserSelect}
              onGoToFeed={() => handleNavigate('home')}
              initialChatUser={chatPreselectedUser}
              onClearInitialUser={() => setChatPreselectedUser(null)}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              appSettings={appSettings}
            />
          )}



          {activeTab === 'directory' && (
            <DirectoryView
              dbProfiles={dbProfiles}
              verifiedUsersMock={verifiedUsersMock}
              currentUser={currentUser}
              onSelectUser={handleUserSelect}
              onNavigateToMessages={(chatUser) => {
                setChatPreselectedUser(chatUser);
                setActiveTab('messages');
              }}
              theme={theme}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllRead}
              onClearNotifications={handleClearNotifications}
              onMarkSingleRead={handleMarkSingleRead}
              onSelectUser={handleUserSelect}
              onGoBack={() => handleNavigate('home')}
              theme={theme}
            />
          )}

          {activeTab === 'goals' && (
            <UserGoalsView
              currentUser={currentUser}
              theme={theme}
              onShowToast={(msg) => showToast(msg, 'success')}
              appSettings={appSettings}
            />
          )}

        </main>

        {/* RIGHT COLUMN: SPETACULAR RIGHTBAR (Sponsored ads, Birthdays list, active contacts List) */}
        {activeTab !== 'admin' && activeTab !== 'profile' && activeTab !== 'messages' && (
          <div className="hidden lg:block w-[280px] shrink-0 lg:sticky lg:top-4 lg:h-[calc(100vh-80px)] overflow-y-auto scrollbar-none flex-col">
            <RightBar
              currentUser={currentUser}
              recentlyVerified={verifiedUsersMock}
              onSelectUser={handleUserSelect}
              posts={posts}
              dbProfiles={dbProfiles}
              onSelectHashtag={setSelectedHashtag}
              activeHashtagFilter={selectedHashtag}
              theme={theme}
              appSettings={appSettings}
            />
          </div>
        )}

      </div>



      {/* Global Stepped Create Post Modal */}
      <GlobalCreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        currentUser={currentUser}
        onAddPost={handleCreatePost}
        theme={theme}
      />

      {/* Global Security Toast Alerts Overlay */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* 4. Fixed Bottom Navigation Bar for Mobile views (<768px ONLY) */}
      <BottomNavbar
        activeTab={activeTab}
        onTabChange={(tab) => handleNavigate(tab)}
        currentUser={currentUser}
        theme={theme}
        onOpenCreatePost={() => setIsCreatePostModalOpen(true)}
        onToggleTheme={handleToggleTheme}
      />

    </div>
  );
}

interface RotatingLoadingTipsProps {
  isDark: boolean;
  accentColor: string;
}

function RotatingLoadingTips({ isDark, accentColor }: RotatingLoadingTipsProps) {
  const tips = [
    { title: "জানতেন কি?", text: "আমাদের প্ল্যাটফর্মের ফন্ট সাইজ এবং টাইপোগ্রাফি এডমিন প্যানেল থেকে কোনো কোড ছাড়াই সম্পূর্ণ পরিবর্তনযোগ্য।" },
    { title: "নিরাপদ ডেটাবেস", text: "Zivobook সিকিউর ফায়ারবেস প্রোটোকল ব্যবহার করে রিয়েল-টাইম ডাটা সিঙ্ক্রোনাইজেশন নিশ্চিত করে।" },
    { title: "কাস্টম ব্রান্ডিং", text: "আপনি এডমিন প্যানেল থেকে লোগোর ব্যাকগ্রাউন্ড কালার, আইকন এবং কাস্টম Z-SVG ইউআরএল সহজে সেট করতে পারেন।" },
    { title: "প্রোফাইল কাস্টমাইজেশন", text: "যেকোনো ইউজার তাদের প্রোফাইল ব্যানার, ডিসপ্লে ছবি এবং বায়ো যেকোনো সময় আপডেট করতে পারেন।" },
    { title: "ডার্ক ও লাইট থিম", text: "পুরো অ্যাপ জুড়ে অত্যন্ত চমৎকার ডার্ক এবং লাইট মোড ইন্টারফেস সাপোর্ট রয়েছে।" },
    { title: "রিয়েল-টাইম নোটিফিকেশন", text: "লাইক, কমেন্ট ও নতুন ফলোয়ার আসার তাৎক্ষণিক নোটিফিকেশন রিয়েল-টাইমে আপডেট হয়।" }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const currentTip = tips[currentIndex];

  return (
    <div className="h-16 flex flex-col items-center justify-center text-center px-4 max-w-[320px] mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="space-y-1"
        >
          <div className="flex items-center justify-center gap-1">
            <span 
              style={{ color: accentColor }}
              className="text-[9.5px] font-black uppercase tracking-[0.2em] font-mono shrink-0 flex items-center gap-1 justify-center"
            >
              <span className="animate-bounce inline-block">💡</span> {currentTip.title}
            </span>
          </div>
          <p className={`text-[10.5px] leading-relaxed font-sans font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {currentTip.text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}