export interface UserPermissions {
  canPost: boolean;
  canComment: boolean;
  canLike: boolean;
  canChat: boolean;
  canCreateGoals: boolean;
  canEditProfile: boolean;
  canManageOwnPosts: boolean;
  canPostStories: boolean;
  canUseGroups: boolean;
  canReportContent: boolean;
  canFollowOthers: boolean;
  customRole: 'user' | 'moderator' | 'partner' | 'admin';
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canPost: true,
  canComment: true,
  canLike: true,
  canChat: true,
  canCreateGoals: true,
  canEditProfile: true,
  canManageOwnPosts: true,
  canPostStories: true,
  canUseGroups: true,
  canReportContent: true,
  canFollowOthers: true,
  customRole: 'user'
};

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar: string;
  bio: string;
  isVerified: boolean;
  verificationType?: 'government_id' | 'biometric' | 'professional' | 'community';
  verifiedAt?: string;
  profession: string;
  followersCount: number;
  followingCount: number;
  badgeLevel?: 'gold' | 'emerald' | 'blue';
  is_banned?: boolean;
  role?: 'admin' | 'user';
  coverPhoto?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  livesIn?: string;
  from?: string;
  school?: string;
  joinedDate?: string;
  followingIds?: string[];
  theme_preference?: 'dark' | 'light';
  permissions?: UserPermissions;
  isOnboarded?: boolean;
  firstName?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  phoneNumber?: string;
  termsAgreed?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  isLikedByMe?: boolean;
}

export interface Post {
  id: string;
  author: User;
  authorId?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likes: number;
  reposts: number;
  commentsCount: number;
  comments: Comment[];
  isLikedByMe?: boolean;
  isRepostedByMe?: boolean;
  hasVerificationRecord?: boolean;
  verificationMethod?: string;
  verifiedLocation?: string;
  privacy?: 'public' | 'friends' | 'private';
  bgStyle?: string;
}

export interface Notification {
  id: string;
  type: 'verification_approved' | 'like' | 'comment' | 'repost' | 'system';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  sender?: User;
}

export type SidebarTab = 'home' | 'profile' | 'settings' | 'messages' | 'directory' | 'notifications' | 'goals';

export interface Report {
  id: string;
  postId: string;
  postContent?: string;
  postAuthorName?: string;
  reason: string;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  status: 'pending' | 'dismissed' | 'resolved';
}

export interface AppSettings {
  id: string;
  dark_bg_color: string;
  dark_card_color: string;
  light_bg_color: string;
  light_card_color: string;
  accent_color: string;
  base_font_size: 'Small/14px' | 'Medium/16px' | 'Large/18px' | 'Extra Large/20px' | string;
  global_theme?: 'dark' | 'light';
  lock_global_canPost?: boolean;
  lock_global_canComment?: boolean;
  lock_global_canLike?: boolean;
  lock_global_canChat?: boolean;
  lock_global_canCreateGoals?: boolean;
  lock_global_canEditProfile?: boolean;
  lock_global_canManageOwnPosts?: boolean;
  lock_global_canPostStories?: boolean;
  lock_global_canUseGroups?: boolean;
  lock_global_canReportContent?: boolean;
  lock_global_canFollowOthers?: boolean;
  global_feed_show_ad?: boolean;
  global_feed_ad_interval?: number;
  global_feed_show_friends?: boolean;
  global_feed_friends_interval?: number;
  global_feed_show_reels?: boolean;
  global_feed_reels_interval?: number;
  global_feed_show_products?: boolean;
  global_feed_products_interval?: number;
  global_feed_show_groups?: boolean;
  global_feed_groups_interval?: number;
  global_feed_show_jobs?: boolean;
  global_feed_jobs_interval?: number;
  sidebar_left_widget?: 'default' | 'groups' | 'pages' | 'shortcuts' | 'weather' | 'clock';
  sidebar_right_widget?: 'contacts' | 'friends' | 'jobs' | 'products' | 'weather' | 'clock';
  // Dynamic Design Customization Properties
  logo_text?: string;
  logo_icon?: string;
  logo_bg_color?: string;
  logo_image_url?: string;
  font_family?: 'Inter' | 'Space Grotesk' | 'JetBrains Mono' | 'Playfair Display' | 'Outfit' | string;
  global_text_color_light?: string;
  global_text_color_dark?: string;
  global_sub_text_color_light?: string;
  global_sub_text_color_dark?: string;
  feed_post_bg_light?: string;
  feed_post_bg_dark?: string;
  feed_main_text_color_light?: string;
  feed_main_text_color_dark?: string;
  feed_sub_text_color_light?: string;
  feed_sub_text_color_dark?: string;
  feed_btn_bg_color?: string;
  feed_btn_text_color?: string;
  feed_btn_hover_bg?: string;
  feed_border_radius?: string;
  feed_ad_bg_light?: string;
  feed_ad_bg_dark?: string;
  feed_ad_text_color_light?: string;
  feed_ad_text_color_dark?: string;
  feed_ad_btn_bg?: string;
  feed_product_bg_light?: string;
  feed_product_bg_dark?: string;
  feed_product_text_color?: string;
  feed_product_price_color?: string;
  feed_product_btn_bg?: string;
  // Typography Sizing and Scales (Mobile & Desktop)
  mobile_sans_scale?: number;
  mobile_display_scale?: number;
  mobile_mono_scale?: number;
  desktop_sans_scale?: number;
  desktop_display_scale?: number;
  desktop_mono_scale?: number;
  trash_retention_days?: number;
}

export interface UserGoal {
  id: string;
  userId: string;
  title: string;
  category: 'Career' | 'Academic' | 'Skill' | 'Personal' | string;
  targetDate: string;
  progressPercent: number;
  status: 'active' | 'completed' | 'on_hold';
  milestones: {
    id: string;
    title: string;
    isCompleted: boolean;
    order: number;
  }[];
  aiRecommendations?: string[];
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  documentType: 'government_id' | 'biometric' | 'professional' | 'community';
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface OnboardingStatus {
  id: string;
  userId: string;
  isCompleted: boolean;
  currentStep: number;
  completedSteps: number[];
  updatedAt: string;
}

export interface CustomPage {
  id: string;
  titleEn: string;
  titleBn: string;
  contentEn: string;
  contentBn: string;
  slug: string;
  order: number;
}



