import { User, UserPermissions, DEFAULT_USER_PERMISSIONS, AppSettings } from '../types';

/**
 * Global function to check if a user has permission to perform a specific action,
 * applying system-wide settings, user roles, and fine-grained overrides.
 * 
 * Rules checked in priority order:
 * 1. Admin users bypass all restrictions and always have full permissions.
 * 2. Disabled/Banned users have absolutely no permissions.
 * 3. System-wide global lock overrides (configured in AppSettings by administrators).
 * 4. User-specific custom overrides (bypasses default permissions if set).
 * 5. Default user permission constraints (fallback).
 */
export function hasPermission(
  user: User | null,
  permissionKey: keyof Omit<UserPermissions, 'customRole'>,
  globalSettings?: AppSettings | null
): { allowed: boolean; reason?: string } {
  // If no user is logged in, block permission
  if (!user) {
    return { allowed: false, reason: 'ব্যবহারকারী লগইন করা নেই।' };
  }

  // Check custom role
  const isUserAdmin = user.role === 'admin' || (user.permissions && user.permissions.customRole === 'admin');

  // 1. Admin bypass: Admins can do everything
  if (isUserAdmin) {
    return { allowed: true };
  }

  // 2. Banned user check
  if (user.is_banned) {
    return { allowed: false, reason: 'আপনার প্রোফাইলটি ব্যান করা হয়েছে।' };
  }

  // 3. System-wide (Global settings) locks check.
  // Admins are already bypassed above.
  if (globalSettings) {
    const isLockedGlobally = (globalSettings as any)[`lock_global_${permissionKey}`] === true;
    if (isLockedGlobally) {
      return { 
        allowed: false, 
        reason: `প্রশাসক দ্বারা এই ফিচারটি সাময়িকভাবে প্ল্যাটফর্মে সর্বজনীনভাবে বন্ধ রয়েছে।` 
      };
    }
  }

  // 4. Fine-grained custom user permissions
  const userPerms = user.permissions;
  if (userPerms && userPerms[permissionKey] === false) {
    return { 
      allowed: false, 
      reason: getPermissionDenialMessage(permissionKey) 
    };
  }

  // 5. Default permissions fallback
  const defaultVal = DEFAULT_USER_PERMISSIONS[permissionKey];
  if (defaultVal === false) {
    return { 
      allowed: false, 
      reason: getPermissionDenialMessage(permissionKey) 
    };
  }

  return { allowed: true };
}

/**
 * Returns dynamic localized warning messages for Bengali language users.
 */
function getPermissionDenialMessage(key: keyof Omit<UserPermissions, 'customRole'>): string {
  switch (key) {
    case 'canPost':
      return "আপনার নতুন পোস্ট তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canComment':
      return "আপনার কমেন্ট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canLike':
      return "আপনার রিকশন বা লাইক দেওয়ার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canChat':
      return "আপনার মেসেজ বা চ্যাট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canCreateGoals':
      return "আপনার গোল বা লার্নিং পথ তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canEditProfile':
      return "আপনার প্রোফাইল পরিবর্তন করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canManageOwnPosts':
      return "আপনার নিজের পোস্ট পরিবর্তন বা ডিলিট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canPostStories':
      return "আপনার রিল বা স্টোরি তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canUseGroups':
      return "আপনার গ্রুপ অপশন ব্যবহার করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canReportContent':
      return "আপনার কন্টেন্ট রিপোর্ট করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    case 'canFollowOthers':
      return "আপনার ফলো করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।";
    default:
      return "এই কাজটি করার অনুমতি আপনার অ্যাকাউন্টে সীমাবদ্ধ করা হয়েছে।";
  }
}
