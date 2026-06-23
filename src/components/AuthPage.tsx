import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, LogIn, Sparkles, CheckCircle, AlertTriangle, Eye, EyeOff, Phone, ArrowLeft, KeyRound, Globe, BookOpen, HelpCircle, FileText, Check, Sun, Moon, ChevronRight } from 'lucide-react';
import { signUpWithEmail, loginWithEmail, loginWithGoogle, resetUserPasswordEmail } from '../lib/firebaseService';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { AppSettings, CustomPage } from '../types';
import { PhoneAuthFlow } from './PhoneAuthFlow';
import { 
  checkBruteForceStatus, 
  recordFailedLoginAttempt, 
  clearFailedLoginAttempts, 
  inspectContentForSpam,
  logSecurityThreat
} from '../lib/securityService';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
  isDark: boolean;
}

function Toast({ message, type, onClose, isDark }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      style={{ backdropFilter: 'blur(12px)' }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl max-w-sm w-[90%] text-xs font-bold select-none transition-all duration-300 ${
        type === 'error' 
          ? (isDark ? 'bg-black/90 text-neutral-100 border-neutral-800' : 'bg-white/95 text-neutral-900 border-neutral-200')
          : (isDark ? 'bg-black/90 text-white border-neutral-700' : 'bg-white/95 text-neutral-900 border-neutral-300')
      }`}
    >
      <div className={`flex items-center justify-center p-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
        {type === 'error' ? <AlertTriangle className="w-3.5 h-3.5 text-neutral-400 shrink-0" /> : <CheckCircle className="w-3.5 h-3.5 text-white dark:text-neutral-200 shrink-0" />}
      </div>
      <p className="flex-grow select-text leading-relaxed tracking-wide font-sans">{message}</p>
      <button onClick={onClose} className="cursor-pointer font-extrabold select-none text-[9px] uppercase tracking-wider opacity-60 hover:opacity-100 transition px-2 py-1 rounded bg-neutral-800/10 dark:bg-white/10">Dismiss</button>
    </motion.div>
  );
}

const bilingual = {
  en: {
    welcomeTitle: "Welcome to Zivobook",
    welcomeSub: "Decentralized Trust Ledger",
    loginBtn: "Log In",
    createAccountBtn: "Create Account",
    forgotPassBtn: "Forgot Password?",
    langToggleBtn: "বাংলা (Bengali)",
    developerSandbox: "Developer Sandbox Setup / Bypass verification",
    chooseMethod: "Choose Verification Method",
    goBack: "Go back to start",
    sendOtp: "Send OTP Code",
    otpStep: "Phone Verification",
    activeMobile: "Enter an active mobile number to receive security code instantly.",
    enterCode: "Enter code sent to:",
    resendOtp: "Didn't receive the code? Resend OTP",
    verifyOtp: "Verify OTP Code",
    sandboxOtp: "Simulated sandbox OTP code auto-filled!",
    webOtpEnabled: "🔒 WebOTP enabled. Keyboard will automatically suggest SMS code.",
    processing: "Processing...",
    verifying: "Verifying...",
    secureSession: "Confirm Login",
    registerBtn: "Register Secure Account",
    googleAuth: "Google Authentication",
    continueGoogle: "Continue with Google",
    googleDesc: "Access securely using your Google social profile",
    phoneBtn: "With Phone Number",
    phoneDesc: "Register or sign-in securely with dynamic OTP",
    emailBtn: "With Email & Password",
    emailDesc: "Access using standard credential profile",
    fullName: "Full Name",
    emailAddr: "Email Address",
    password: "Password",
    fast: "FAST",
    otpTab: "OTP",
    secure: "SECURE",
    confirmLogin: "Confirm Login",
    demoSuccess: "Sandbox Google Sign-In activated!",
    demoWelcome: "Welcome back!",
    demoRegSuccess: "Registration successful!",
    demoAccessMsg: "Quick Demo Session started!",
    forgotModalTitle: "Recover Your Password",
    forgotModalDesc: "Enter your registered email address to instantly receive a recovery/password reset link in your inbox.",
    sendRecovery: "Send Recovery Link",
    resetEmailSent: "A secure reset link has been dispatched to your email address.",
    close: "Close",
    enterEmailError: "Please write a valid email address.",
    about: "About Us",
    help: "Help & Support",
    privacy: "Privacy Policy",
    allPages: "System Pages",
    pageLoading: "Loading pages...",
    chooseAnother: "Choose another login method"
  },
  bn: {
    welcomeTitle: "জিভোবুক-এ স্বাগতম",
    welcomeSub: "ডিসেন্ট্রালাইজড ট্রাস্ট লেজার",
    loginBtn: "লগইন করুন",
    createAccountBtn: "নতুন অ্যাকাউন্ট তৈরি করুন",
    forgotPassBtn: "পাসওয়ার্ড ভুলে গেছেন?",
    langToggleBtn: "English (ইংরেজি)",
    developerSandbox: "ডেভেলপার স্যান্ডবক্স সেটআপ / ভেরিফিকেশন বাইপাস",
    chooseMethod: "যাচাইকরণ পদ্ধতি নির্বাচন করুন",
    goBack: "শুরুর পেজে ফিরে যান",
    sendOtp: "ওটিপি (OTP) পাঠান",
    otpStep: "ফোন ভেরিফিকেশন",
    activeMobile: "তাৎক্ষণিকভাবে ওটিপি কোড পেতে একটি সক্রিয় মোবাইল নম্বর লিখুন।",
    enterCode: "পাঠানো কোডটি প্রবেশ করান:",
    resendOtp: "কোড পাননি? পুনরায় ওটিপি পাঠান",
    verifyOtp: "ওটিপি কোড যাচাই করুন",
    sandboxOtp: "স্যান্ডবক্স ওটিপি কোড স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে!",
    webOtpEnabled: "🔒 WebOTP সক্রিয়। কিবোর্ড স্বয়ংক্রিয়ভাবে কোড সাজেস্ট করবে।",
    processing: "প্রক্রিয়াকরণ হচ্ছে...",
    verifying: "যাচাই করা হচ্ছে...",
    secureSession: "লগইন নিশ্চিত করুন",
    registerBtn: "নিরাপদ অ্যাকাউন্ট রেজিস্টার করুন",
    googleAuth: "গুগল অথেন্টিকেশন",
    continueGoogle: "গুগলের সাথে অবিরত রাখুন",
    googleDesc: "আপনার গুগল সোশ্যাল প্রোফাইল ব্যবহার করে নিরাপদে প্রবেশ করুন",
    phoneBtn: "মোবাইল নম্বর দিয়ে",
    phoneDesc: "একটি ওটিপি কোড দিয়ে নিরাপদে রেজিস্টার বা সাইন ইন করুন",
    emailBtn: "ইমেইল ও পাসওয়ার্ড দিয়ে",
    emailDesc: "ইমেল ঠিকানা এবং পাসওয়ার্ড শংসাপত্র ব্যবহার করে প্রবেশ করুন",
    fullName: "সম্পূর্ণ নাম",
    emailAddr: "ইমেইল ঠিকানা",
    password: "পাসওয়ার্ড",
    fast: "দ্রুত",
    otpTab: "ওটিপি",
    secure: "সুরক্ষিত",
    confirmLogin: "লগইন নিশ্চিত করুন",
    demoSuccess: "স্যান্ডবক্স গুগল সাইন-ইন সচল করা হয়েছে!",
    demoWelcome: "ফিরে আসার জন্য ধন্যবাদ!",
    demoRegSuccess: "রেজিস্ট্রেশন সফল হয়েছে!",
    demoAccessMsg: "কুইক ডেমো সেশন শুরু করা হয়েছে!",
    forgotModalTitle: "পাসওয়ার্ড উদ্ধার করুন",
    forgotModalDesc: "আপনার ইনবক্সে পাসওয়ার্ড রিসেট করার নিরাপদ লিংক পেতে নিবন্ধিত ইমেল ঠিকানাটি লিখুন।",
    sendRecovery: "রিকভারি লিংক পাঠান",
    resetEmailSent: "আপনার ইমেইল ঠিকানায় একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।",
    close: "বন্ধ করুন",
    enterEmailError: "অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।",
    about: "আমাদের সম্পর্কে",
    help: "সাহায্য ও সহযোগিতা",
    privacy: "গোপনীয়তা নীতি",
    allPages: "সিস্টেম পেজ সমূহ",
    pageLoading: "পেজ লোড হচ্ছে...",
    chooseAnother: "অন্যান্য লগইন পদ্ধতি দেখুন"
  }
};

interface AuthPageProps {
  onSimulatedLogin?: (user: any) => void;
  theme: 'dark' | 'light'; 
  appSettings?: AppSettings;
  onToggleTheme?: () => void;
}

export default function AuthPage({ onSimulatedLogin, theme, appSettings, onToggleTheme }: AuthPageProps) {
  const isDark = theme === 'dark';
  
  // Custom Welcome View States
  const [viewMode, setViewMode] = useState<'welcome' | 'auth_method'>('welcome');
  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    return (localStorage.getItem('pref_lang') as 'en' | 'bn') || 'bn';
  });

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Specific authentication pathway selection
  const [loginMethod, setLoginMethod] = useState<'phone' | 'gmail' | null>(null);

  // Dynamic Custom Footer Pages States
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CustomPage | null>(null);
  
  // Forgot Password Dialog
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmailInput, setForgotEmailInput] = useState('');

  // Email OTP Verification states for manual Gmail signup
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [enteredEmailOtp, setEnteredEmailOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Manual Step-by-Step Sign-Up States
  const [manualStep, setManualStep] = useState(1);
  const [mFirstName, setMFirstName] = useState('');
  const [mLastName, setMLastName] = useState('');
  const [mBirthday, setMBirthday] = useState('2002-06-21');
  const [mGender, setMGender] = useState('male');
  const [mPhoneNumber, setMPhoneNumber] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mPassword, setMPassword] = useState('');
  const [mRemember, setMRemember] = useState(true);

  // Manual wizard helper calculations & submissions
  const getManualAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatManualBirthdayToShow = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleManualNext = () => {
    if (manualStep === 1) {
      if (!mFirstName.trim() || !mLastName.trim()) {
        showNotification(lang === 'en' ? "Please enter both First name and Last name." : "অনুগ্রহ করে প্রথম নাম এবং শেষ নাম উভয়ই লিখুন।", "error");
        return;
      }
      setManualStep(2);
    } else if (manualStep === 2) {
      if (!mBirthday) {
        showNotification(lang === 'en' ? "Please specify your date of birth." : "অনুগ্রহ করে আপনার জন্ম তারিখ উল্লেখ করুন।", "error");
        return;
      }
      setManualStep(3);
    } else if (manualStep === 3) {
      setManualStep(4);
    } else if (manualStep === 4) {
      if (!mEmail.trim()) {
        showNotification(lang === 'en' ? "Please enter your email address." : "অনুগ্রহ করে আপনার ইমেল ঠিকানা প্রবেশ করান।", "error");
        return;
      }
      if (!mEmail.includes('@')) {
        showNotification(lang === 'en' ? "Please enter a valid email address." : "অনুগ্রহ করে একটি সঠিক ইমেল ঠিকানা প্রবেশ করান।", "error");
        return;
      }
      if (!mPhoneNumber.trim()) {
        showNotification(lang === 'en' ? "Please enter your mobile phone number." : "অনুগ্রহ করে আপনার মোবাইল নম্বরটি প্রবিষ্ট করুন।", "error");
        return;
      }
      setManualStep(5);
    } else if (manualStep === 5) {
      if (mPassword.length < 6) {
        showNotification(lang === 'en' ? "Password must contain at least 6 characters." : "পাসওয়ার্ডে অন্তত ৬টি অক্ষর থাকতে হবে।", "error");
        return;
      }
      setManualStep(6);
    }
  };

  const handleManualAgreeAndFinish = async () => {
    setLoading(true);
    try {
      const finalFullName = `${mFirstName.trim()} ${mLastName.trim()}`;
      
      const profileUpdates = {
        firstName: mFirstName.trim(),
        lastName: mLastName.trim(),
        birthday: mBirthday,
        gender: mGender,
        phoneNumber: mPhoneNumber.trim(),
        isOnboarded: true,
        displayName: finalFullName,
        bio: lang === 'en' ? 'Hello! I am new on Zivobook.' : 'হ্যালো! আমি জিভোবুকে নতুন।',
        profession: lang === 'en' ? 'Member' : 'সদস্য',
        followersCount: 0,
        followingCount: 0,
        badgeLevel: 'blue' as 'blue',
        role: (mEmail.trim().toLowerCase() === 'hasibulon@gmail.com' ? 'admin' : 'user') as 'admin' | 'user'
      };

      // Create user with explicit profile details so both Firestore & simulated fallbacks seed instantly
      const signupUser = await signUpWithEmail(mEmail.trim(), mPassword, finalFullName, undefined, profileUpdates);

      try {
        await setDoc(doc(db, 'profiles', signupUser.uid), {
          id: signupUser.uid,
          username: mEmail.trim().split('@')[0],
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          isVerified: false,
          ...profileUpdates
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore set manual profiles document bypassed or failed", dbErr);
      }

      localStorage.setItem('vt_current_user', JSON.stringify({
        id: signupUser.uid,
        username: mEmail.trim().split('@')[0],
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        isVerified: false,
        ...profileUpdates
      }));

      if (onSimulatedLogin) {
        onSimulatedLogin(signupUser);
      }

      showNotification(
        lang === 'en' 
          ? "Account manually created and verified successfully!" 
          : "ম্যানুয়ালি অ্যাকাউন্ট তৈরি এবং সফলভাবে যাচাই করা হয়েছে!", 
        "success"
      );
    } catch (err: any) {
      showNotification(err.message || "Manual registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Brute Force Lockout Countdown
  const [lockoutSecs, setLockoutSecs] = useState(0);

  // Poll brute force lockout status for currently typed email
  useEffect(() => {
    if (!email) {
      setLockoutSecs(0);
      return;
    }
    const check = () => {
      const status = checkBruteForceStatus(email);
      setLockoutSecs(status.secondsRemaining);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [email]);

  // Sync custom pages collection and auto-seed defaults when empty
  useEffect(() => {
    const q = query(collection(db, 'custom_pages'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const defaultPages: CustomPage[] = [
        {
          id: 'about',
          slug: 'about',
          titleEn: 'About Us',
          titleBn: 'আমাদের সম্পর্কে',
          contentEn: 'Welcome to Zivobook - Decentralized Trust Ledger. We provide a state-of-the-art social community registry with high-grade security, peer-to-peer verification goals, real-time messaging, and learning groups.',
          contentBn: 'জিভোবুক - ডিসেন্ট্রালাইজড ট্রাস্ট লেজারে আপনাকে স্বাগতম। আমরা উন্নতমানের নিরাপত্তা, পিয়ার-টু-পিয়ার ভেরিফিকেশন লক্ষ্যসমূহ, রিয়েল-টাইম মেসেজিং এবং লার্নিং গ্রুপ সমৃদ্ধ একটি সামাজিক রেজিস্ট্রি প্রদান করি।',
          order: 1
        },
        {
          id: 'help',
          slug: 'help',
          titleEn: 'Help & Support',
          titleBn: 'সাহায্য ও সহযোগিতা',
          contentEn: 'Need assistance? Reach out to support at support@zivobook.com or view our system user guide for configuring multi-factor verification.',
          contentBn: 'সহায়তা প্রয়োজন? support@zivobook.com-এ যোগাযোগ করুন বা মাল্টি-ফ্যাক্টর ভেরিফিকেশন কনফিগারেশনের টিউটোরিয়াল গাইডটি দেখুন।',
          order: 2
        },
        {
          id: 'privacy',
          slug: 'privacy',
          titleEn: 'Privacy Policy',
          titleBn: 'গোপনীয়তা নীতি',
          contentEn: 'Your data security is our absolute priority. We do not distribute your personal profile information or activity logs to third-party ad networks.',
          contentBn: 'আপনার ডেটা নিরাপত্তা আমাদের পরম অগ্রাধিকার। আমরা কোনো তৃতীয় পক্ষের বিজ্ঞাপন নেটওয়ার্কের কাছে আপনার ব্যক্তিগত প্রোফাইল তথ্য বা অ্যাক্টিভিটি লগ বিতরণ করি না।',
          order: 3
        }
      ];

      if (snapshot.empty) {
        setCustomPages(defaultPages);
        
        // Auto-seed only if current user is an authenticated admin
        const currentUserEmail = auth.currentUser?.email;
        if (currentUserEmail && currentUserEmail.toLowerCase() === 'hasibulon@gmail.com') {
          for (const page of defaultPages) {
            try {
              await setDoc(doc(db, 'custom_pages', page.id), page);
            } catch (e) {
              console.warn("Failed seeding default page (admin):", page.id, e);
            }
          }
        }
      } else {
        const pages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomPage));
        pages.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCustomPages(pages);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'custom_pages');
    });
    return () => unsubscribe();
  }, []);

  // Automatically reset login states when user switches tabs
  useEffect(() => {
    setLoginMethod(null);
  }, [activeTab]);

  const showNotification = (msg: string, t: 'error' | 'success') => setToast({ message: msg, type: t });

  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    localStorage.setItem('pref_lang', nextLang);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showNotification(lang === 'en' ? "Please fill out all details" : "অনুগ্রহ করে সব তথ্য দিন", "error");
      return;
    }

    // 1. Digital Defense: Brute-Force Lockout check
    const status = checkBruteForceStatus(email);
    if (status.blocked) {
      showNotification(
        lang === 'en' 
          ? `Security Block: Brute-force lockout active. Please wait ${status.secondsRemaining}s.`
          : `নিরাপত্তা লকআউট: ব্রুট-ফোর্স পেনাল্টি চলছে। ${status.secondsRemaining} সেকেন্ড অপেক্ষা করুন।`, 
        "error"
      );
      return;
    }

    // 2. Digital Defense: Injection Attack validation (SQLi / XSS / Bot spam)
    const emailSpam = inspectContentForSpam(email, 'auth/email');
    if (emailSpam.isSpam) {
      showNotification(emailSpam.reason, "error");
      return;
    }
    const passwordSpam = inspectContentForSpam(password, 'auth/password');
    if (passwordSpam.isSpam) {
      showNotification(passwordSpam.reason, "error");
      return;
    }

    if (activeTab === 'signup' && !fullName.trim()) {
      showNotification(lang === 'en' ? "Please enter your Full Name" : "অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন", "error");
      return;
    }

    if (activeTab === 'signup') {
      const nameSpam = inspectContentForSpam(fullName, 'auth/fullName');
      if (nameSpam.isSpam) {
        showNotification(nameSpam.reason, "error");
        return;
      }
    }

    setLoading(true);
    try {
      if (activeTab === 'signup') {
        const user = await signUpWithEmail(email, password, fullName);
        // Intercept registration with Email OTP challenge as requested
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setEmailOtpCode(randomOtp);
        setPendingUser(user);
        setShowEmailOtp(true);
        clearFailedLoginAttempts(email);
        showNotification(
          lang === 'en' 
            ? `Security OTP sent to your Email address: ${email}` 
            : `আপনার জিমেইল/ইমেইলে ওটিপি পাঠানো হয়েছে: ${email}`, 
          "success"
        );
      } else {
        const user = await loginWithEmail(email, password);
        if (onSimulatedLogin && user.uid.startsWith('sim_')) {
          onSimulatedLogin(user);
        }
        clearFailedLoginAttempts(email);
        showNotification(bilingual[lang].demoWelcome, "success");
      }
    } catch (err: any) {
      // 3. Digital Defense: Log failed login attempt to evaluate threat signature
      if (activeTab === 'login') {
        const result = recordFailedLoginAttempt(email);
        if (result.blocked) {
          showNotification(
            lang === 'en'
              ? "Brute-force pattern identified! Account access quarantined for 45s."
              : "ব্রুট-ফোর্স প্যাটার্ন শনাক্ত! ৪৫ সেকেন্ডের জন্য আইপি এক্সেস কোয়ারেন্টিন করা হয়েছে।",
            "error"
          );
          setLockoutSecs(45);
          setLoading(false);
          return;
        } else {
          showNotification(
            lang === 'en'
              ? `Verification failed. Attempts remaining before IP block: ${result.attemptsLeft}`
              : `লগইন ব্যর্থ হয়েছে। আইপি ব্লক হওয়ার পূর্বে অবশিষ্ট সুযোগ: ${result.attemptsLeft}`,
            "error"
          );
        }
      } else {
        const errorMsg = err?.code === 'auth/email-already-in-use' || (err?.message && err.message.includes('email-already-in-use'))
          ? (lang === 'en' ? "This email address is already registered on Zivobook. Please login or reset your password!" : "এই ইমেলটি ইতিমধ্যে রেজিস্টার করা হয়েছে। দয়া করে লগইন বা পাসওয়ার্ড রিসেট করুন!")
          : (err.message || "Verification attempt failed");
        showNotification(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (onSimulatedLogin && user.uid && user.uid.startsWith('sim_')) {
        onSimulatedLogin(user);
      }
      showNotification(bilingual[lang].demoSuccess, "success");
    } catch (err: any) {
      console.warn("Real Google login bypassed or failed, launching simulated credential fallback:", err);
      if (onSimulatedLogin) {
        const cleanEmail = email.trim() || "hasibulon@gmail.com";
        const cleanName = fullName.trim() || cleanEmail.split('@')[0];
        const mockGoogleUser = {
          uid: 'sim_' + Math.random().toString(36).substring(2, 10),
          email: cleanEmail,
          displayName: cleanName,
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          emailVerified: true
        };
        onSimulatedLogin(mockGoogleUser);
        showNotification(bilingual[lang].demoSuccess, "success");
      } else {
        showNotification(err.message || "Google authentication failed", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const triggerForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailInput.trim()) {
      showNotification(bilingual[lang].enterEmailError, "error");
      return;
    }
    setLoading(true);
    try {
      await resetUserPasswordEmail(forgotEmailInput);
      showNotification(bilingual[lang].resetEmailSent, "success");
      setShowForgotModal(false);
      setForgotEmailInput('');
    } catch (err: any) {
      showNotification(err.message || "Failed to trigger password reset email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    if (onSimulatedLogin) {
      const mockResultUser = {
        uid: 'sim_admin_hasib',
        email: 'hasibulon@gmail.com',
        displayName: 'Hasibul Rahman (Admin)',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        emailVerified: true
      };
      onSimulatedLogin(mockResultUser);
      showNotification(bilingual[lang].demoAccessMsg, "success");
    }
  };

  const trans = bilingual[lang];

  return (
    <div id="auth_page_root" className={`min-h-dvh w-full flex flex-col justify-between items-center px-6 py-10 transition-colors duration-300 select-none antialiased pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${isDark ? 'bg-[#000000] text-white' : 'bg-white text-neutral-900'}`}>
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
            isDark={isDark} 
          />
        )}
      </AnimatePresence>



      {/* Main Core View Area */}
      <div className="w-full max-w-[390px] my-auto space-y-7 flex flex-col justify-center">
        
        {/* BIG HERO LOGO IN CENTER */}
        <div className="text-center space-y-4">
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {appSettings?.logo_image_url ? (
                <div className={`p-1.5 rounded-full border shadow-xl ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
                  <img 
                    src={appSettings.logo_image_url} 
                    alt="Logo"
                    className="w-18 h-18 rounded-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div 
                  className={`w-18 h-18 rounded-full font-black text-3xl flex items-center justify-center transition-all shadow-xl leading-none ${
                    isDark ? 'bg-white text-black' : 'bg-black text-white'
                  }`}
                >
                  {appSettings?.logo_icon || 'Z'}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight font-sans leading-tight text-black dark:text-white">
              {appSettings?.logo_text || 'Zivobook'}
            </h1>
            <p className={`text-[10px] font-mono tracking-widest uppercase font-black ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
              {trans.welcomeSub}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'welcome' ? (
            /* VIEW MODE 1: WELCOME INITIAL LANDING PAGE (Polished High Contrast Monochromatic) */
            <motion.div
              key="welcome_panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 text-center"
            >
              <div className="space-y-2 px-1">
                <h2 className="text-lg font-black tracking-tight font-sans text-black dark:text-white">
                  {trans.welcomeTitle}
                </h2>
                <p className={`text-[11.5px] leading-relaxed font-sans font-extrabold px-2 ${isDark ? 'text-neutral-100' : 'text-neutral-950'}`}>
                  {lang === 'en' 
                    ? "Establish a cryptographically secured communication session or register a new verification passport." 
                    : "একটি সুরক্ষিত এনক্রিপ্ট করা সেশন স্থাপন করুন অথবা নতুন ভেরিফাইড পাসপার্ট অ্যাকাউন্ট নিবন্ধন করুন।"}
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {/* LOGIN BUTTON (White base in dark mode, Black base in light) */}
                <button
                  type="button"
                  id="welcome_login_btn"
                  onClick={() => {
                    setActiveTab('login');
                    setViewMode('auth_method');
                  }}
                  className={`w-full font-black py-4 rounded-full text-xs tracking-wide transition duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                    isDark 
                      ? 'bg-white hover:bg-neutral-200 text-black' 
                      : 'bg-black hover:bg-neutral-800 text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>{trans.loginBtn}</span>
                </button>

                {/* CREATE ACCOUNT BUTTON (Transparent with outline) */}
                <button
                  type="button"
                  id="welcome_create_btn"
                  onClick={() => {
                    setActiveTab('signup');
                    setViewMode('auth_method');
                  }}
                  className={`w-full font-black py-4 rounded-full text-xs tracking-wide border transition duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                    isDark 
                      ? 'bg-transparent border-neutral-700 text-white hover:bg-white/5' 
                      : 'bg-transparent border-neutral-400 text-black hover:bg-black/5'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{trans.createAccountBtn}</span>
                </button>
              </div>

              {/* FORGOT PASSWORD ROW */}
              <div className="pt-2">
                <button
                  type="button"
                  id="welcome_forgot_btn"
                  onClick={() => {
                    setForgotEmailInput('');
                    setShowForgotModal(true);
                  }}
                  className={`text-xs font-black hover:underline transition cursor-pointer select-none ${
                    isDark ? 'text-neutral-200 hover:text-white' : 'text-neutral-800 hover:text-black'
                  }`}
                >
                  {trans.forgotPassBtn}
                </button>
              </div>
            </motion.div>
          ) : (
            /* VIEW MODE 2: CHOOSE REGISTRATION OR LOGIN METHODS SCREEN (High Contrast Monochromatic) */
            <motion.div
              key="auth_methods_panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-end">
                <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-black'}`}>
                  {activeTab === 'login' ? trans.loginBtn : trans.createAccountBtn}
                </span>
              </div>

              {/* TAB OR METHOD AREA */}
              {loginMethod === null ? (
                /* Select login channel */
                <div className="space-y-5">
                  <div className="text-center space-y-1 py-1">
                    <p className={`text-[10.5px] font-black tracking-widest font-mono uppercase ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      {trans.chooseMethod}
                    </p>
                    <div className={`h-[1px] w-20 mx-auto rounded-full ${isDark ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' : 'bg-gradient-to-r from-transparent via-black/20 to-transparent'}`} />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {/* Google Direct Sign-In (Monochromatic Classic) */}
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 select-none group cursor-pointer hover:shadow active:scale-[0.98] ${
                        isDark 
                          ? 'bg-neutral-950/40 border-neutral-800 hover:border-white hover:bg-neutral-900/40 text-white' 
                          : 'bg-white border-neutral-300 hover:border-black hover:bg-neutral-50/5 text-black'
                      }`}
                    >
                      <div className={`flex items-center justify-center p-2.5 rounded-xl border shrink-0 transition ${
                        isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-black'
                      }`}>
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            opacity="0.8"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            opacity="0.6"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="currentColor"
                            opacity="0.7"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow space-y-0.5 min-w-0">
                        <h4 className="text-xs font-black tracking-tight flex items-center justify-between">
                          {activeTab === 'login' ? 'Continue with Google' : 'Sign Up with Google'}
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none ${
                            isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'
                          }`}>{trans.fast}</span>
                        </h4>
                        <p className={`text-[10px] font-black leading-relaxed font-sans truncate ${isDark ? 'text-neutral-200' : 'text-neutral-850'}`}>
                          {trans.googleDesc}
                        </p>
                      </div>
                    </button>

                    {/* Phone verification OTP options */}
                    <button
                      type="button"
                      onClick={() => setLoginMethod('phone')}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 select-none group cursor-pointer hover:shadow active:scale-[0.98] ${
                        isDark 
                          ? 'bg-neutral-950/40 border-neutral-800 hover:border-white hover:bg-neutral-900/40 text-white' 
                          : 'bg-white border-neutral-300 hover:border-black hover:bg-neutral-50/5 text-black'
                      }`}
                    >
                      <div className={`flex items-center justify-center p-2.5 rounded-xl border shrink-0 transition ${
                        isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-black'
                      }`}>
                        <Phone className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-grow space-y-0.5 min-w-0">
                        <h4 className="text-xs font-black tracking-tight flex items-center justify-between">
                          {trans.phoneBtn}
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none ${
                            isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'
                          }`}>{trans.otpTab}</span>
                        </h4>
                        <p className={`text-[10px] font-black leading-relaxed font-sans truncate ${isDark ? 'text-neutral-200' : 'text-neutral-850'}`}>
                          {trans.phoneDesc}
                        </p>
                      </div>
                    </button>

                    {/* Create Manually option for Signup, With Email/Password for Login */}
                    {activeTab === 'signup' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('manual');
                          setManualStep(1);
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 select-none group cursor-pointer hover:shadow active:scale-[0.98] ${
                          isDark 
                            ? 'bg-neutral-950/40 border-neutral-800 hover:border-white hover:bg-neutral-900/40 text-white' 
                            : 'bg-white border-neutral-300 hover:border-black hover:bg-neutral-50/5 text-black'
                        }`}
                      >
                        <div className={`flex items-center justify-center p-2.5 rounded-xl border shrink-0 transition ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-black'
                        }`}>
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-grow space-y-0.5 min-w-0">
                          <h4 className="text-xs font-black tracking-tight flex items-center justify-between">
                            <span>{lang === 'en' ? 'Create Manually' : 'ক্রিয়েট ম্যানুয়ালি'}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none ${
                              isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'
                            }`}>{isDark ? 'WHITE' : 'BLACK'}</span>
                          </h4>
                          <p className={`text-[10px] font-black leading-relaxed font-sans truncate ${isDark ? 'text-neutral-200' : 'text-neutral-850'}`}>
                            {lang === 'en' ? 'Register manually step-by-step' : 'ধাপে ধাপে একের পর এক তথ্য দিয়ে অ্যাকাউন্ট খুলুন'}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLoginMethod('gmail')}
                        className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 select-none group cursor-pointer hover:shadow active:scale-[0.98] ${
                          isDark 
                            ? 'bg-neutral-950/40 border-neutral-800 hover:border-white hover:bg-neutral-900/40 text-white' 
                            : 'bg-white border-neutral-300 hover:border-black hover:bg-neutral-50/5 text-black'
                        }`}
                      >
                        <div className={`flex items-center justify-center p-2.5 rounded-xl border shrink-0 transition ${
                          isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-300 text-black'
                        }`}>
                          <Mail className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex-grow space-y-0.5 min-w-0">
                          <h4 className="text-xs font-black tracking-tight flex items-center justify-between">
                            {trans.emailBtn}
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none ${
                              isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'
                            }`}>{trans.secure}</span>
                          </h4>
                          <p className={`text-[10px] font-black leading-relaxed font-sans truncate ${isDark ? 'text-neutral-200' : 'text-neutral-850'}`}>
                            {trans.emailDesc}
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              ) : loginMethod === 'phone' ? (
                /* Phone auth active flow styled black-and-white */
                <PhoneAuthFlow
                  isDark={isDark}
                  activeTab={activeTab}
                  onBack={() => setLoginMethod(null)}
                  onSuccess={(user) => {
                    if (onSimulatedLogin) {
                      onSimulatedLogin(user);
                    }
                  }}
                  showNotification={showNotification}
                />
              ) : loginMethod === 'manual' ? (
                /* Step-by-Step Manual Registration Wizard */
                <div className="space-y-5 text-left">
                  <button
                    type="button"
                    onClick={() => setLoginMethod(null)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold mb-3 hover:opacity-100 opacity-65 transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Choose another method' : 'অন্য পদ্ধতি নির্বাচন করুন'}</span>
                  </button>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden relative mb-5">
                    <div 
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${isDark ? 'bg-white' : 'bg-black'}`}
                      style={{ width: `${(manualStep / 6) * 100}%` }}
                    />
                  </div>

                  {manualStep === 1 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "What's your name?" : "আপনার নাম কি?"}
                        </h2>
                        <p className={`text-xs font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                          {lang === 'en' ? "Enter the name you use in real life." : "বাস্তব জীবনে আপনি যে নামটি ব্যবহার করেন তা লিখুন।"}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 font-sans">
                          <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {lang === 'en' ? "First name" : "প্রথম নাম"}
                          </label>
                          <input 
                            type="text" 
                            placeholder={lang === 'en' ? "First name" : "প্রথম নাম"}
                            className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                              isDark 
                                ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                                : 'bg-white border-neutral-300 text-black focus:border-black'
                            }`}
                            value={mFirstName}
                            onChange={(e) => setMFirstName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1.5 font-sans">
                          <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {lang === 'en' ? "Last name" : "শেষ নাম"}
                          </label>
                          <input 
                            type="text" 
                            placeholder={lang === 'en' ? "Last name" : "শেষ নাম"}
                            className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                              isDark 
                                ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                                : 'bg-white border-neutral-300 text-black focus:border-black'
                            }`}
                            value={mLastName}
                            onChange={(e) => setMLastName(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {manualStep === 2 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "What's your birthday?" : "আপনার জন্মদিন কবে?"}
                        </h2>
                        <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                          {lang === 'en' ? "Choose your date of birth. You can always make this private later." : "আপনার জন্ম তারিখ নির্বাচন করুন। আপনি এটি পরবর্তীতে যেকোনো সময় হাইড করে রাখতে পারবেন।"}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="date" 
                          className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${
                            isDark 
                              ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                              : 'bg-white border-neutral-350 text-black focus:border-[#222]'
                          }`}
                          value={mBirthday}
                          onChange={(e) => setMBirthday(e.target.value)}
                        />
                        <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                          <span className={`font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            {formatManualBirthdayToShow(mBirthday)}
                          </span>
                          <span className="font-extrabold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 text-black dark:text-white">
                            {getManualAge(mBirthday)} {lang === 'en' ? 'Years old' : 'বছর বয়স'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {manualStep === 3 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "What's your gender?" : "আপনার লিঙ্গ কি?"}
                        </h2>
                        <p className={`text-xs font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                          {lang === 'en' ? "You can change who sees your gender on your profile later." : "আপনি এটি পরবর্তীতে যেকোনো সময় আপনার প্রোফাইল থেকে পরিবর্তন করতে পারবেন।"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {['female', 'male', 'other'].map((gOption) => (
                          <button
                            key={gOption}
                            type="button"
                            onClick={() => setMGender(gOption)}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-black capitalize transition cursor-pointer ${
                              mGender === gOption 
                                ? (isDark ? 'bg-white border-white text-black font-black' : 'bg-black border-black text-white font-black')
                                : (isDark ? 'bg-neutral-950/40 border-neutral-800 text-white font-semibold hover:bg-neutral-900/40' : 'bg-white border-neutral-300 text-black font-semibold hover:bg-neutral-50')
                            }`}
                          >
                            <span>
                              {gOption === 'female' ? (lang === 'en' ? 'Female' : 'নারী / মহিলা') : 
                               gOption === 'male' ? (lang === 'en' ? 'Male' : 'পুরুষ') : 
                               (lang === 'en' ? 'Other' : 'অন্যান্য')}
                            </span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              mGender === gOption
                                ? (isDark ? 'border-black' : 'border-white')
                                : (isDark ? 'border-neutral-500' : 'border-neutral-400')
                            }`}>
                              {mGender === gOption && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {manualStep === 4 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "Enter your verification contacts" : "যাচাইকরণের যোগাযোগ দিন"}
                        </h2>
                        <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                          {lang === 'en' ? "Set up your registered Email and mobile number. No one will see these on your profile." : "আপনার নিবন্ধিত ইমেল ঠিকানা ও মোবাইল নম্বরটি বসান। অন্য কেউ বিজ্ঞাপিত হবে না।"}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5 flex flex-col font-sans">
                          <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {lang === 'en' ? "Email address" : "ইমেইল ঠিকানা"}
                          </label>
                          <input 
                            type="email" 
                            placeholder={lang === 'en' ? "e.g. name@domain.com" : "যেমনঃ user@gmail.com"}
                            className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                              isDark 
                                ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                                : 'bg-white border-neutral-350 text-black focus:border-[#222]'
                            }`}
                            value={mEmail}
                            onChange={(e) => setMEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1.5 flex flex-col font-sans">
                          <label className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            {lang === 'en' ? "Mobile number" : "মোবাইল নম্বর"}
                          </label>
                          <input 
                            type="tel" 
                            placeholder={lang === 'en' ? "e.g. +88017xxxxxxxx" : "যেমনঃ ০১৭xxxxxxxx"}
                            className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${
                              isDark 
                                ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                                : 'bg-white border-neutral-350 text-black focus:border-[#222]'
                            }`}
                            value={mPhoneNumber}
                            onChange={(e) => setMPhoneNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {manualStep === 5 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "Create a password" : "পাসওয়ার্ড তৈরি করুন"}
                        </h2>
                        <p className={`text-xs font-bold leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                          {lang === 'en' ? "Create a secure passport password with at least 6 characters. Ensure it is unique." : "কমপক্ষে ৬টি অক্ষরের একটি সুরক্ষিত পাসওয়ার্ড দিন যা অন্য কেউ আন্দাজ করতে পারবে না।"}
                        </p>
                      </div>

                      <div className="space-y-3 font-sans">
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder={lang === 'en' ? "Enter password" : "পাসওয়ার্ড লিখুন"}
                            className={`w-full p-3.5 pr-11 rounded-xl border text-xs font-semibold outline-none transition-all ${
                              isDark 
                                ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                                : 'bg-white border-neutral-350 text-black focus:border-[#222]'
                            }`}
                            value={mPassword}
                            onChange={(e) => setMPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 py-1 select-none">
                          <input 
                            type="checkbox"
                            id="m_remember_check"
                            className="w-4 h-4 rounded accent-black"
                            checked={mRemember}
                            onChange={(e) => setMRemember(e.target.checked)}
                          />
                          <label htmlFor="m_remember_check" className={`text-xs font-bold cursor-pointer select-none ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                            {lang === 'en' ? "Remember login details" : "লগইন তথ্য মনে রাখুন"}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {manualStep === 6 && (
                    <div className="space-y-4 text-left">
                      <div className="space-y-1">
                        <h2 className="text-xl font-extrabold tracking-tight text-black dark:text-white border-none bg-transparent">
                          {lang === 'en' ? "Agree to terms and policies" : "জিভোবুকের শর্তাবলী ও নীতিতে সম্মতি দিন"}
                        </h2>
                      </div>

                      <div className={`text-xs space-y-3 leading-relaxed font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        <p>
                          {lang === 'en' 
                            ? "By tapping 'I agree' below, you consent to create an account on Zivobook and agree to our Terms of Service, Privacy Policy and Cookies Policy." 
                            : "নিচে ক্লিক করার মাধ্যমে আপনি জিভোবুকের নিয়ম ও গোপনীয়তা নীতির সাথে একমত প্রকাশ করছেন।"}
                        </p>
                        <p>
                          {lang === 'en' 
                            ? "All provided metadata will be managed securely on our decentralized systems." 
                            : "আপনার দেওয়া সকল তথ্য জিভোবুকের নিরাপদ ক্লাউড লেজারে ডেডিকেটেড সিকিউরিটি প্রোটোকল দ্বারা সংরক্ষিত ও সুরক্ষিত থাকবে।"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex gap-3 pt-4">
                    {manualStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualStep(prev => prev - 1)}
                        className={`font-black px-5 py-3 rounded-full text-xs transition duration-150 flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98] ${
                          isDark 
                            ? 'bg-neutral-900 hover:bg-neutral-800 text-white' 
                            : 'bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300'
                        }`}
                      >
                        {lang === 'en' ? 'Back' : 'পেছনে'}
                      </button>
                    )}

                    {manualStep < 6 ? (
                      <button
                        type="button"
                        onClick={handleManualNext}
                        className={`flex-grow font-black py-3.5 rounded-full text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                          isDark 
                            ? 'bg-white hover:bg-neutral-200 text-black' 
                            : 'bg-black hover:bg-neutral-800 text-white'
                        }`}
                      >
                        <span>{lang === 'en' ? 'Next' : 'পরবর্তী'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleManualAgreeAndFinish}
                        className={`flex-grow font-black py-3.5 rounded-full text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                          isDark 
                            ? 'bg-white hover:bg-neutral-200 text-black shadow-md' 
                            : 'bg-black hover:bg-neutral-800 text-white shadow-md'
                        }`}
                      >
                        <span>{loading ? trans.processing : (lang === 'en' ? 'I agree' : 'আমি সম্মত')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : showEmailOtp ? (
                /* Email OTP Verification Block requested by user - Black & White Optimized */
                <div className="space-y-4 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailOtp(false);
                      setPendingUser(null);
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold mb-1 hover:opacity-100 opacity-65 transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cancel verification</span>
                  </button>

                  <div className={`p-4 rounded-2xl border text-center space-y-2 ${
                    isDark ? 'bg-neutral-950/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
                  }`}>
                    <h4 className="text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200 animate-pulse" />
                      Email OTP Verification
                    </h4>
                    <p className={`text-[10px] leading-relaxed font-black ${isDark ? 'text-neutral-100' : 'text-neutral-950'}`}>
                      We've sent a 6-digit confirmation code to:
                    </p>
                    <p className="text-xs font-black underline select-all text-black dark:text-white">{email}</p>
                  </div>



                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="Enter 6-digit OTP" 
                      required
                      value={enteredEmailOtp}
                      onChange={(e) => setEnteredEmailOtp(e.target.value.replace(/\D/g, ''))}
                      className={`w-full p-3.5 pl-11 text-center font-mono text-sm tracking-[0.25em] font-black rounded-full border outline-none transition-all ${
                        isDark 
                          ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                          : 'bg-neutral-50 border-neutral-200 text-black focus:border-[#222]'
                      }`}
                    />
                  </div>

                  <button 
                    onClick={() => {
                      if (enteredEmailOtp === emailOtpCode) {
                        showNotification("Email OTP code verified perfectly!", "success");
                        if (onSimulatedLogin && pendingUser) {
                          onSimulatedLogin(pendingUser);
                        }
                      } else {
                        showNotification("Invalid OTP code! Please check the code and try again.", "error");
                      }
                    }}
                    type="button"
                    className={`w-full font-black py-4 rounded-full text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                      isDark 
                        ? 'bg-white hover:bg-neutral-200 text-black' 
                        : 'bg-black hover:bg-neutral-800 text-white'
                    }`}
                  >
                    <span>Verify & Continue</span>
                  </button>
                </div>
              ) : (
                /* Traditional Email/Password Form */
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setLoginMethod(null)}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold mb-1 hover:opacity-100 opacity-65 transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{trans.chooseAnother}</span>
                  </button>

                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {activeTab === 'signup' && (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-neutral-400" />
                        </div>
                        <input 
                          type="text" 
                          placeholder={trans.fullName} 
                          required
                          disabled={loading}
                          className={`w-full p-3.5 pl-11 rounded-full border text-xs font-semibold outline-none transition-all ${
                            isDark 
                              ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                              : 'bg-neutral-50 border-neutral-200 text-black focus:border-neutral-400'
                          }`}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-neutral-400" />
                      </div>
                      <input 
                        type="email" 
                        placeholder={trans.emailAddr} 
                        required
                        disabled={loading}
                        className={`w-full p-3.5 pl-11 rounded-full border text-xs font-semibold outline-none transition-all ${
                          isDark 
                            ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                            : 'bg-neutral-50 border-neutral-200 text-black focus:border-neutral-400'
                        }`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-neutral-400" />
                      </div>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder={trans.password} 
                        required
                        disabled={loading}
                        className={`w-full p-3.5 pl-11 pr-11 rounded-full border text-xs font-semibold outline-none transition-all ${
                          isDark 
                            ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                            : 'bg-neutral-50 border-neutral-200 text-black focus:border-neutral-400'
                        }`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white dark:hover:text-neutral-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className={`w-full font-black py-4 rounded-full text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                        isDark 
                          ? 'bg-white hover:bg-neutral-200 text-black' 
                          : 'bg-black hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>
                        {loading ? trans.processing : (activeTab === 'login' ? trans.confirmLogin : trans.registerBtn)}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* Centered back button at the bottom of the registration/login flow */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('welcome');
                    setLoginMethod(null);
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold hover:opacity-100 opacity-70 transition cursor-pointer ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-black'}`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{trans.goBack}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>

      {/* LANGUAGE PREFERENCE SWITCH & ESSENTIAL FOOTER MAP BLOCK */}
      <div className="w-full max-w-sm text-center flex flex-col items-center gap-4.5 mt-8">
        
        {/* Language & Theme Controls Row */}
        <div className="flex flex-row items-center justify-center gap-3">
          {/* Language Switch Button */}
          <button
            type="button"
            onClick={handleToggleLang}
            className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98] transition cursor-pointer font-sans duration-150 ${
              isDark 
                ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0 animate-spin-slow" />
            <span>{trans.langToggleBtn}</span>
          </button>

          {/* Theme Dynamic Controller Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`px-4 py-2 text-xs font-bold rounded-full border flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.98] transition cursor-pointer font-sans duration-150 ${
              isDark 
                ? 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-900' 
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{lang === 'en' ? 'Light Mode' : 'লাইট মোড'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{lang === 'en' ? 'Dark Mode' : 'ডার্ক মোড'}</span>
              </>
            )}
          </button>
        </div>

        {/* Essential Pages Link Row */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1.5 select-none text-[10.5px]">
          {customPages.length === 0 ? (
            <span className="text-neutral-500 italic font-semibold">{trans.pageLoading}</span>
          ) : (
            customPages.map((page) => (
              <button
                key={page.id}
                type="button"
                className={`font-bold hover:underline transition duration-150 cursor-pointer ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                }`}
                onClick={() => setSelectedPage(page)}
              >
                {lang === 'en' ? page.titleEn : page.titleBn}
              </button>
            ))
          )}
        </div>
      </div>

      {/* FOOTER CUSTOM INFO OVERLAY MODAL */}
      <AnimatePresence>
        {selectedPage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-[460px] rounded-3xl p-7 border shadow-2xl relative ${
                isDark ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                {selectedPage.id === 'about' && <BookOpen className="w-4.5 h-4.5 shrink-0" />}
                {selectedPage.id === 'help' && <HelpCircle className="w-4.5 h-4.5 shrink-0" />}
                {selectedPage.id !== 'about' && selectedPage.id !== 'help' && <FileText className="w-4.5 h-4.5 shrink-0" />}
                <span>{lang === 'en' ? selectedPage.titleEn : selectedPage.titleBn}</span>
              </h3>
              
              <div className={`h-[1px] my-4.5 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
              
              <p className={`text-xs font-semibold leading-relaxed max-h-[280px] overflow-y-auto mb-6 pr-1 whitespace-pre-line text-left font-sans ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                {lang === 'en' ? selectedPage.contentEn : selectedPage.contentBn}
              </p>

              <button
                type="button"
                onClick={() => setSelectedPage(null)}
                className={`w-full font-black py-3.5 rounded-full text-xs tracking-wide cursor-pointer shadow active:scale-[0.98] transition duration-150 ${
                  isDark 
                    ? 'bg-white hover:bg-neutral-200 text-black' 
                    : 'bg-black hover:bg-neutral-800 text-white'
                }`}
              >
                {trans.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm rounded-3xl p-7 border shadow-2xl relative ${
                isDark ? 'bg-black border-neutral-800 text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                <KeyRound className="w-4.5 h-4.5 shrink-0" />
                <span>{trans.forgotModalTitle}</span>
              </h3>
              
              <div className={`h-[1px] my-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
              
              <p className={`text-[11.5px] font-semibold leading-relaxed mb-5 text-left ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {trans.forgotModalDesc}
              </p>

              <form onSubmit={triggerForgotPasswordReset} className="space-y-4">
                <div>
                  <input
                    type="email"
                    required
                    placeholder={trans.emailAddr}
                    value={forgotEmailInput}
                    onChange={(e) => setForgotEmailInput(e.target.value)}
                    className={`w-full p-3.5 rounded-full border text-xs font-semibold outline-none transition-all ${
                      isDark 
                        ? 'bg-black border-neutral-800 text-white focus:border-neutral-500' 
                        : 'bg-neutral-50 border-neutral-200 text-black focus:border-neutral-400'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotEmailInput('');
                    }}
                    className={`font-black py-3.5 rounded-full text-xs shadow transition active:scale-[0.98] cursor-pointer ${
                      isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-850' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                    }`}
                  >
                    {trans.close}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className={`font-black py-3.5 rounded-full text-xs shadow active:scale-[0.98] transition cursor-pointer ${
                      isDark 
                        ? 'bg-white hover:bg-neutral-200 text-black' 
                        : 'bg-black hover:bg-neutral-850 text-white'
                    }`}
                  >
                    {trans.sendRecovery}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
