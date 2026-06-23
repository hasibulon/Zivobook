import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { AppSettings } from '../types';

const SETTINGS_LOCAL_STORAGE_KEY = 'munich_app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  dark_bg_color: '#0b0c10',
  dark_card_color: '#18181b',
  light_bg_color: '#f8fafc',
  light_card_color: '#ffffff',
  accent_color: '#3b82f6',
  base_font_size: 'Medium/16px',
  global_theme: 'light',
  global_feed_show_ad: false,
  global_feed_ad_interval: 3,
  global_feed_show_friends: true,
  global_feed_friends_interval: 4,
  global_feed_show_reels: true,
  global_feed_reels_interval: 5,
  global_feed_show_products: false,
  global_feed_products_interval: 6,
  global_feed_show_groups: true,
  global_feed_groups_interval: 7,
  global_feed_show_jobs: false,
  global_feed_jobs_interval: 8,
  sidebar_left_widget: 'default',
  sidebar_right_widget: 'contacts',
  logo_text: 'Zivobook',
  logo_icon: 'Z',
  logo_bg_color: '#3b82f6',
  logo_image_url: '',
  font_family: 'Inter',
  global_text_color_light: '#0f172a',
  global_text_color_dark: '#e4e6eb',
  global_sub_text_color_light: '#475569',
  global_sub_text_color_dark: '#94a3b8',
  feed_post_bg_light: '#ffffff',
  feed_post_bg_dark: '#1e293b',
  feed_main_text_color_light: '#0f172a',
  feed_main_text_color_dark: '#e4e6eb',
  feed_sub_text_color_light: '#64748b',
  feed_sub_text_color_dark: '#94a3b8',
  feed_btn_bg_color: '#3b82f6',
  feed_btn_text_color: '#ffffff',
  feed_btn_hover_bg: '#2563eb',
  feed_border_radius: 'xl',
  feed_ad_bg_light: '#fef3c7',
  feed_ad_bg_dark: '#451a03',
  feed_ad_text_color_light: '#78350f',
  feed_ad_text_color_dark: '#fef3c7',
  feed_ad_btn_bg: '#b45309',
  feed_product_bg_light: '#f0fdf4',
  feed_product_bg_dark: '#14532d',
  feed_product_text_color: '#15803d',
  feed_product_price_color: '#22c55e',
  feed_product_btn_bg: '#16a34a',
  mobile_sans_scale: 1.0,
  mobile_display_scale: 1.0,
  mobile_mono_scale: 1.0,
  desktop_sans_scale: 1.0,
  desktop_display_scale: 1.0,
  desktop_mono_scale: 1.0,
  trash_retention_days: 30
};

/**
 * Returns default branding/UI configuration parameters.
 */
export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Syncs and saves the App Settings globally to both Firebase (Firestore) and Supabase.
 */
export async function saveAppSettings(settings: AppSettings): Promise<void> {
  // 1. Update Firestore
  const path = 'app_settings/global';
  try {
    await setDoc(doc(db, 'app_settings', 'global'), {
      id: settings.id,
      dark_bg_color: settings.dark_bg_color,
      dark_card_color: settings.dark_card_color,
      light_bg_color: settings.light_bg_color,
      light_card_color: settings.light_card_color,
      accent_color: settings.accent_color,
      base_font_size: settings.base_font_size,
      global_theme: settings.global_theme || 'light',
      lock_global_canPost: settings.lock_global_canPost || false,
      lock_global_canComment: settings.lock_global_canComment || false,
      lock_global_canLike: settings.lock_global_canLike || false,
      lock_global_canChat: settings.lock_global_canChat || false,
      lock_global_canCreateGoals: settings.lock_global_canCreateGoals || false,
      lock_global_canEditProfile: settings.lock_global_canEditProfile || false,
      lock_global_canManageOwnPosts: settings.lock_global_canManageOwnPosts || false,
      lock_global_canPostStories: settings.lock_global_canPostStories || false,
      lock_global_canUseGroups: settings.lock_global_canUseGroups || false,
      lock_global_canReportContent: settings.lock_global_canReportContent || false,
      lock_global_canFollowOthers: settings.lock_global_canFollowOthers || false,
      global_feed_show_ad: settings.global_feed_show_ad !== undefined ? settings.global_feed_show_ad : false,
      global_feed_ad_interval: settings.global_feed_ad_interval !== undefined ? settings.global_feed_ad_interval : 3,
      global_feed_show_friends: settings.global_feed_show_friends !== undefined ? settings.global_feed_show_friends : true,
      global_feed_friends_interval: settings.global_feed_friends_interval !== undefined ? settings.global_feed_friends_interval : 4,
      global_feed_show_reels: settings.global_feed_show_reels !== undefined ? settings.global_feed_show_reels : true,
      global_feed_reels_interval: settings.global_feed_reels_interval !== undefined ? settings.global_feed_reels_interval : 5,
      global_feed_show_products: settings.global_feed_show_products !== undefined ? settings.global_feed_show_products : false,
      global_feed_products_interval: settings.global_feed_products_interval !== undefined ? settings.global_feed_products_interval : 6,
      global_feed_show_groups: settings.global_feed_show_groups !== undefined ? settings.global_feed_show_groups : true,
      global_feed_groups_interval: settings.global_feed_groups_interval !== undefined ? settings.global_feed_groups_interval : 7,
      global_feed_show_jobs: settings.global_feed_show_jobs !== undefined ? settings.global_feed_show_jobs : false,
      global_feed_jobs_interval: settings.global_feed_jobs_interval !== undefined ? settings.global_feed_jobs_interval : 8,
      sidebar_left_widget: settings.sidebar_left_widget || 'default',
      sidebar_right_widget: settings.sidebar_right_widget || 'contacts',
      logo_text: settings.logo_text || 'Zivobook',
      logo_icon: settings.logo_icon || 'Z',
      logo_bg_color: settings.logo_bg_color || '#3b82f6',
      logo_image_url: settings.logo_image_url !== undefined ? settings.logo_image_url : '',
      font_family: settings.font_family || 'Inter',
      global_text_color_light: settings.global_text_color_light || '#0f172a',
      global_text_color_dark: settings.global_text_color_dark || '#e4e6eb',
      global_sub_text_color_light: settings.global_sub_text_color_light || '#475569',
      global_sub_text_color_dark: settings.global_sub_text_color_dark || '#94a3b8',
      feed_post_bg_light: settings.feed_post_bg_light || '#ffffff',
      feed_post_bg_dark: settings.feed_post_bg_dark || '#1e293b',
      feed_main_text_color_light: settings.feed_main_text_color_light || '#0f172a',
      feed_main_text_color_dark: settings.feed_main_text_color_dark || '#e4e6eb',
      feed_sub_text_color_light: settings.feed_sub_text_color_light || '#64748b',
      feed_sub_text_color_dark: settings.feed_sub_text_color_dark || '#94a3b8',
      feed_btn_bg_color: settings.feed_btn_bg_color || '#3b82f6',
      feed_btn_text_color: settings.feed_btn_text_color || '#ffffff',
      feed_btn_hover_bg: settings.feed_btn_hover_bg || '#2563eb',
      feed_border_radius: settings.feed_border_radius || 'xl',
      feed_ad_bg_light: settings.feed_ad_bg_light || '#fef3c7',
      feed_ad_bg_dark: settings.feed_ad_bg_dark || '#451a03',
      feed_ad_text_color_light: settings.feed_ad_text_color_light || '#78350f',
      feed_ad_text_color_dark: settings.feed_ad_text_color_dark || '#fef3c7',
      feed_ad_btn_bg: settings.feed_ad_btn_bg || '#b45309',
      feed_product_bg_light: settings.feed_product_bg_light || '#f0fdf4',
      feed_product_bg_dark: settings.feed_product_bg_dark || '#14532d',
      feed_product_text_color: settings.feed_product_text_color || '#15803d',
      feed_product_price_color: settings.feed_product_price_color || '#22c55e',
      feed_product_btn_bg: settings.feed_product_btn_bg || '#16a34a',
      mobile_sans_scale: settings.mobile_sans_scale !== undefined ? Number(settings.mobile_sans_scale) : 1.0,
      mobile_display_scale: settings.mobile_display_scale !== undefined ? Number(settings.mobile_display_scale) : 1.0,
      mobile_mono_scale: settings.mobile_mono_scale !== undefined ? Number(settings.mobile_mono_scale) : 1.0,
      desktop_sans_scale: settings.desktop_sans_scale !== undefined ? Number(settings.desktop_sans_scale) : 1.0,
      desktop_display_scale: settings.desktop_display_scale !== undefined ? Number(settings.desktop_display_scale) : 1.0,
      desktop_mono_scale: settings.desktop_mono_scale !== undefined ? Number(settings.desktop_mono_scale) : 1.0,
      trash_retention_days: settings.trash_retention_days !== undefined ? Number(settings.trash_retention_days) : 30
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // 2. Local cache backup
  localStorage.setItem(SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Sets up a hot real-time subscription for global app branding settings.
 * Pulls from local storage cache initially for near-zero startup flicker,
 * and updates live whenever new changes are made by the administrator.
 */
export function subscribeToAppSettings(onUpdate: (settings: AppSettings) => void): () => void {
  // Load initially from local storage for high response speed
  let initialSettings = DEFAULT_SETTINGS;
  const cachedSettingsStr = localStorage.getItem(SETTINGS_LOCAL_STORAGE_KEY);
  if (cachedSettingsStr) {
    try {
      initialSettings = JSON.parse(cachedSettingsStr);
      onUpdate(initialSettings);
    } catch (e) {
      console.warn("Corrupted local configuration cache, reverting to defaults:", e);
    }
  } else {
    onUpdate(DEFAULT_SETTINGS);
  }

  // Also query both Supabase and Firestore immediately to establish a fresh sync.
  // We'll prioritize Firestore for hot real-time snapshot broadcast events!
  const unsubFirestore = onSnapshot(doc(db, 'app_settings', 'global'), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const settingsObj: AppSettings = {
        id: data.id || 'global',
        dark_bg_color: data.dark_bg_color || DEFAULT_SETTINGS.dark_bg_color,
        dark_card_color: data.dark_card_color || DEFAULT_SETTINGS.dark_card_color,
        light_bg_color: data.light_bg_color || DEFAULT_SETTINGS.light_bg_color,
        light_card_color: data.light_card_color || DEFAULT_SETTINGS.light_card_color,
        accent_color: data.accent_color || DEFAULT_SETTINGS.accent_color,
        base_font_size: data.base_font_size || DEFAULT_SETTINGS.base_font_size,
        global_theme: data.global_theme || 'light',
        lock_global_canPost: data.lock_global_canPost || false,
        lock_global_canComment: data.lock_global_canComment || false,
        lock_global_canLike: data.lock_global_canLike || false,
        lock_global_canChat: data.lock_global_canChat || false,
        lock_global_canCreateGoals: data.lock_global_canCreateGoals || false,
        lock_global_canEditProfile: data.lock_global_canEditProfile || false,
        lock_global_canManageOwnPosts: data.lock_global_canManageOwnPosts || false,
        lock_global_canPostStories: data.lock_global_canPostStories || false,
        lock_global_canUseGroups: data.lock_global_canUseGroups || false,
        lock_global_canReportContent: data.lock_global_canReportContent || false,
        lock_global_canFollowOthers: data.lock_global_canFollowOthers || false,
        global_feed_show_ad: data.global_feed_show_ad !== undefined ? data.global_feed_show_ad : DEFAULT_SETTINGS.global_feed_show_ad,
        global_feed_ad_interval: data.global_feed_ad_interval !== undefined ? Number(data.global_feed_ad_interval) : DEFAULT_SETTINGS.global_feed_ad_interval,
        global_feed_show_friends: data.global_feed_show_friends !== undefined ? data.global_feed_show_friends : DEFAULT_SETTINGS.global_feed_show_friends,
        global_feed_friends_interval: data.global_feed_friends_interval !== undefined ? Number(data.global_feed_friends_interval) : DEFAULT_SETTINGS.global_feed_friends_interval,
        global_feed_show_reels: data.global_feed_show_reels !== undefined ? data.global_feed_show_reels : DEFAULT_SETTINGS.global_feed_show_reels,
        global_feed_reels_interval: data.global_feed_reels_interval !== undefined ? Number(data.global_feed_reels_interval) : DEFAULT_SETTINGS.global_feed_reels_interval,
        global_feed_show_products: data.global_feed_show_products !== undefined ? data.global_feed_show_products : DEFAULT_SETTINGS.global_feed_show_products,
        global_feed_products_interval: data.global_feed_products_interval !== undefined ? Number(data.global_feed_products_interval) : DEFAULT_SETTINGS.global_feed_products_interval,
        global_feed_show_groups: data.global_feed_show_groups !== undefined ? data.global_feed_show_groups : DEFAULT_SETTINGS.global_feed_show_groups,
        global_feed_groups_interval: data.global_feed_groups_interval !== undefined ? Number(data.global_feed_groups_interval) : DEFAULT_SETTINGS.global_feed_groups_interval,
        global_feed_show_jobs: data.global_feed_show_jobs !== undefined ? data.global_feed_show_jobs : DEFAULT_SETTINGS.global_feed_show_jobs,
        global_feed_jobs_interval: data.global_feed_jobs_interval !== undefined ? Number(data.global_feed_jobs_interval) : DEFAULT_SETTINGS.global_feed_jobs_interval,
        sidebar_left_widget: data.sidebar_left_widget || DEFAULT_SETTINGS.sidebar_left_widget,
        sidebar_right_widget: data.sidebar_right_widget || DEFAULT_SETTINGS.sidebar_right_widget,
        logo_text: data.logo_text || DEFAULT_SETTINGS.logo_text,
        logo_icon: data.logo_icon || DEFAULT_SETTINGS.logo_icon,
        logo_bg_color: data.logo_bg_color || DEFAULT_SETTINGS.logo_bg_color,
        logo_image_url: data.logo_image_url !== undefined ? data.logo_image_url : '',
        font_family: data.font_family || DEFAULT_SETTINGS.font_family,
        global_text_color_light: data.global_text_color_light || DEFAULT_SETTINGS.global_text_color_light,
        global_text_color_dark: data.global_text_color_dark || DEFAULT_SETTINGS.global_text_color_dark,
        global_sub_text_color_light: data.global_sub_text_color_light || DEFAULT_SETTINGS.global_sub_text_color_light,
        global_sub_text_color_dark: data.global_sub_text_color_dark || DEFAULT_SETTINGS.global_sub_text_color_dark,
        feed_post_bg_light: data.feed_post_bg_light || DEFAULT_SETTINGS.feed_post_bg_light,
        feed_post_bg_dark: data.feed_post_bg_dark || DEFAULT_SETTINGS.feed_post_bg_dark,
        feed_main_text_color_light: data.feed_main_text_color_light || DEFAULT_SETTINGS.feed_main_text_color_light,
        feed_main_text_color_dark: data.feed_main_text_color_dark || DEFAULT_SETTINGS.feed_main_text_color_dark,
        feed_sub_text_color_light: data.feed_sub_text_color_light || DEFAULT_SETTINGS.feed_sub_text_color_light,
        feed_sub_text_color_dark: data.feed_sub_text_color_dark || DEFAULT_SETTINGS.feed_sub_text_color_dark,
        feed_btn_bg_color: data.feed_btn_bg_color || DEFAULT_SETTINGS.feed_btn_bg_color,
        feed_btn_text_color: data.feed_btn_text_color || DEFAULT_SETTINGS.feed_btn_text_color,
        feed_btn_hover_bg: data.feed_btn_hover_bg || DEFAULT_SETTINGS.feed_btn_hover_bg,
        feed_border_radius: data.feed_border_radius || DEFAULT_SETTINGS.feed_border_radius,
        feed_ad_bg_light: data.feed_ad_bg_light || DEFAULT_SETTINGS.feed_ad_bg_light,
        feed_ad_bg_dark: data.feed_ad_bg_dark || DEFAULT_SETTINGS.feed_ad_bg_dark,
        feed_ad_text_color_light: data.feed_ad_text_color_light || DEFAULT_SETTINGS.feed_ad_text_color_light,
        feed_ad_text_color_dark: data.feed_ad_text_color_dark || DEFAULT_SETTINGS.feed_ad_text_color_dark,
        feed_ad_btn_bg: data.feed_ad_btn_bg || DEFAULT_SETTINGS.feed_ad_btn_bg,
        feed_product_bg_light: data.feed_product_bg_light || DEFAULT_SETTINGS.feed_product_bg_light,
        feed_product_bg_dark: data.feed_product_bg_dark || DEFAULT_SETTINGS.feed_product_bg_dark,
        feed_product_text_color: data.feed_product_text_color || DEFAULT_SETTINGS.feed_product_text_color,
        feed_product_price_color: data.feed_product_price_color || DEFAULT_SETTINGS.feed_product_price_color,
        feed_product_btn_bg: data.feed_product_btn_bg || DEFAULT_SETTINGS.feed_product_btn_bg,
        mobile_sans_scale: data.mobile_sans_scale !== undefined ? Number(data.mobile_sans_scale) : DEFAULT_SETTINGS.mobile_sans_scale,
        mobile_display_scale: data.mobile_display_scale !== undefined ? Number(data.mobile_display_scale) : DEFAULT_SETTINGS.mobile_display_scale,
        mobile_mono_scale: data.mobile_mono_scale !== undefined ? Number(data.mobile_mono_scale) : DEFAULT_SETTINGS.mobile_mono_scale,
        desktop_sans_scale: data.desktop_sans_scale !== undefined ? Number(data.desktop_sans_scale) : DEFAULT_SETTINGS.desktop_sans_scale,
        desktop_display_scale: data.desktop_display_scale !== undefined ? Number(data.desktop_display_scale) : DEFAULT_SETTINGS.desktop_display_scale,
        desktop_mono_scale: data.desktop_mono_scale !== undefined ? Number(data.desktop_mono_scale) : DEFAULT_SETTINGS.desktop_mono_scale
      };
      
      // Update cache
      localStorage.setItem(SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(settingsObj));
      // Notify listener
      onUpdate(settingsObj);
    } else {
      // First time fallback to default or cache without writing to DB, to prevent permission errors
      const userSettings = cachedSettingsStr ? JSON.parse(cachedSettingsStr) : DEFAULT_SETTINGS;
      onUpdate(userSettings);
    }
  }, (err) => {
    console.warn("Real-time setup of app configuration is blocked or missing admin permissions:", err);
  });

  return unsubFirestore;
}
