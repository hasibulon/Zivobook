import { User, Post, Notification } from './types';

export const currentUserMock: User = {
  id: 'current_user',
  username: 'hasibulon',
  displayName: 'Hasibul Hasan Redoy',
  email: 'hasibulon@gmail.com',
  avatar: '/assets/image_0.png',
  coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
  bio: 'Entrepreneur & Digital creator. Passionate about innovation, leadership, and building impactful products.',
  isVerified: true,
  profession: 'Entrepreneur',
  followersCount: 1500,
  followingCount: 260,
  livesIn: 'Dhaka, Bangladesh',
  from: 'Dhaka, Bangladesh',
  school: 'Canadian University of Bangladesh',
  joinedDate: 'Joined April 2012',
  website: 'https://redoy.com',
  role: 'admin',
};

// All other verified users removed from frontend config
export const verifiedUsersMock: User[] = [];

// Initial welcome post by the Admin only
export const initialPostsMock: Post[] = [
  {
    id: 'post_welcome',
    author: currentUserMock,
    content: `জিভোবুক - ডিসেন্ট্রালাইজড ট্রাস্ট লেজারে স্বাগতম। আমরা একটি নিরাপদ, পরিচয়-ভেরিফাইড এবং স্বচ্ছ সামাজিক রেজিস্ট্রি ও ডেটাবেজ প্ল্যাটফর্ম গড়ে তুলেছি। সকল ধরনের লাইভ সিমুলেশন ও ফেক ডাটা রিমুভ করা হয়েছে। এখন প্ল্যাটফর্মটি সম্পূর্ণরূপে রিয়েল-টাইম ডাটার উপর ভিত্তি করে পরিচালিত হচ্ছে।`,
    createdAt: new Date().toISOString(),
    likes: 1,
    reposts: 0,
    commentsCount: 0,
    hasVerificationRecord: true,
    verificationMethod: 'NIST Level 3 Gov Document Verification + Match-to-Face Liveness Demo',
    verifiedLocation: 'Dhaka, Bangladesh',
    comments: [],
  }
];

export const initialNotificationsMock: Notification[] = [
  {
    id: 'notif_welcome',
    type: 'system',
    title: 'স্বাগতম জিভোবুক এডমিন প্যানেলে',
    message: 'আপনার এডমিন অ্যাকাউন্টটি সফলভাবে সক্রিয় ও সুরক্ষিত করা হয়েছে। সকল ডেমো ইউজার রিমুভ করা হয়েছে।',
    createdAt: new Date().toISOString(),
    read: false,
  }
];
