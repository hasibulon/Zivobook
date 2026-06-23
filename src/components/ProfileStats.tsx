import React from 'react';
import { 
  Calendar, 
  Award, 
  ShieldCheck, 
  ShieldAlert, 
  Fingerprint, 
  Eye, 
  CheckCircle2, 
  Building, 
  Users, 
  Sparkles,
  Lock,
  Cpu 
} from 'lucide-react';
import { User, Post } from '../types';

interface ProfileStatsProps {
  user: User;
  posts: Post[];
  theme: 'dark' | 'light'; // Context layout multi theme token prop synchronization setup
}

export default function ProfileStats({ user, posts, theme }: ProfileStatsProps) {
  // Compute some derived metrics
  const totalPosts = posts.filter(p => (p.authorId === user.id || p.author?.id === user.id)).length;
  const isVerified = user.isVerified;
  const badgeLevel = user.badgeLevel || 'blue';
  const isDark = theme === 'dark';
  
  // Define helper for nice formatted verification labels
  const getVerificationTypeLabel = (type?: string) => {
    switch (type) {
      case 'government_id':
        return 'Passport / Gov ID OCR Verified';
      case 'biometric':
        return 'Biometric Iris Signature Match';
      case 'professional':
        return 'Professional Domain Handshake';
      case 'community':
        return 'Community Vouched Ledger Proof';
      default:
        return 'Basic Electronic Account Credentials';
    }
  };

  const getBadgeStyling = (level?: 'gold' | 'emerald' | 'blue') => {
    switch (level) {
      case 'gold':
        return {
          textColor: 'text-amber-500 dark:text-amber-400 font-extrabold',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30 dark:border-amber-500/20',
          label: 'Tier 1 Alpha (Gold Rank)',
          description: 'Maximum security rating based on hardware enclave authentication.'
        };
      case 'emerald':
        return {
          textColor: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30 dark:border-emerald-500/20',
          label: 'Tier 2 Prime (Emerald Rank)',
          description: 'Verified professional citizen matching state identification.'
        };
      case 'blue':
      default:
        return {
          textColor: 'text-blue-600 dark:text-blue-400 font-extrabold',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30 dark:border-blue-500/20',
          label: 'Standard Cadet (Blue Rank)',
          description: 'Registered citizen utilizing cryptographic email/social credentials.'
        };
    }
  };

  const badgeStyle = getBadgeStyling(badgeLevel);

  // Math calculated integrity index
  const baseIntegrity = isVerified ? 85 : 45;
  const badgeBonus = badgeLevel === 'gold' ? 15 : badgeLevel === 'emerald' ? 10 : 0;
  const activityBonus = Math.min(totalPosts * 2, 10);
  const integrityScore = Math.min(baseIntegrity + badgeBonus + activityBonus, 100);

  // High Contrast Context Standards Color Palette Mappings
  const containerClass = isDark
    ? 'bg-[#18191a] border-[#242526] text-gray-200'
    : 'bg-white border-gray-300 text-gray-900 shadow-md';

  const innerBentoCardClass = isDark
    ? 'bg-[#242526] border border-zinc-800/60'
    : 'bg-gray-100 border border-gray-300';

  const textPrimary = isDark ? 'text-white' : 'text-gray-950 font-black';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-700 font-semibold';

  return (
    <div 
      className={`rounded-3xl border p-5 md:p-6 w-full space-y-5 shadow-xl backdrop-blur-sm relative overflow-hidden transition-colors duration-300 ${containerClass}`}
      id={`profile-stats-card-${user.id}`}
    >
      {/* Decorative top gradient glow */}
      {isDark && (
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500/35 to-transparent pointer-none" />
      )}

      {/* Header section with identity index summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4.5 border-b border-gray-500/10">
        <div>
          <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#1877F2] uppercase flex items-center gap-1.5 leading-none">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Decentralized Credential Audit
          </h4>
          <p className={`text-sm font-bold font-sans mt-1 ${isDark ? 'text-white' : 'text-gray-950 font-black'}`}>Verified Trust Profile Matrix</p>
        </div>

        {/* Dynamic Trust Integrity Gauge Container */}
        <div className={`flex items-center gap-3 border rounded-2xl px-3.5 py-2.5 ${isDark ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-gray-50 border-gray-300 shadow-sm'}`}>
          <div className="relative flex items-center justify-center w-9 h-9">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15"
                stroke={isDark ? "#1e293b" : "#cbd5e1"}
                strokeWidth="2.5"
                fill="transparent"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                stroke={isVerified ? "#10b981" : "#3b82f6"}
                strokeWidth="2.5"
                fill="transparent"
                strokeDasharray={94.2}
                strokeDashoffset={94.2 - (94.2 * integrityScore) / 100}
              />
            </svg>
            <span className={`absolute text-[10px] font-mono font-black ${isDark ? 'text-slate-100' : 'text-gray-950'}`}>{integrityScore}%</span>
          </div>
          <div className="text-left leading-none">
            <span className="block text-[8px] font-mono uppercase tracking-wider text-gray-500 font-bold leading-none">Trust Quotient</span>
            <span className="block text-[10px] font-mono text-emerald-500 font-bold mt-1.5 leading-none">
              {integrityScore >= 90 ? 'EXCEPTIONAL INTEGRITY' : integrityScore >= 70 ? 'STABLE LEDGER RATIO' : 'STANDARD PROFILE STATUS'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid containing primary stats details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Verification Status */}
        <div className={`rounded-2xl p-4 space-y-2.5 transition-colors duration-300 ${innerBentoCardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 font-bold">Verification Index</span>
            {isVerified ? (
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                <ShieldAlert className="w-3 h-3" />
                REGISTERED
              </span>
            )}
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isVerified ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-200 border-gray-300 dark:bg-zinc-950 dark:border-zinc-800 text-gray-500 dark:text-gray-400'}`}>
              {user.verificationType === 'biometric' ? (
                <Eye className="w-4.5 h-4.5" />
              ) : user.verificationType === 'government_id' ? (
                <Cpu className="w-4.5 h-4.5" />
              ) : (
                <Lock className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <span className={`block text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-950 font-extrabold'}`}>
                {isVerified ? 'Ledger Proof Established' : 'Unsigned Profile Session'}
              </span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 truncate mt-1 font-mono">
                {getVerificationTypeLabel(user.verificationType)}
              </span>
            </div>
          </div>
        </div>

        {/* Badge Rank Summary */}
        <div className={`rounded-2xl p-4 space-y-2.5 transition-colors duration-300 ${innerBentoCardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 font-bold">Account Badge Class</span>
            <span className={`font-mono text-[9px] font-bold ${badgeStyle.textColor}`}>
              {badgeLevel.toUpperCase()} RATING
            </span>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badgeStyle.bgColor} ${badgeStyle.borderColor} ${badgeStyle.textColor}`}>
              <Award className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className={`block text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-950 font-extrabold'}`}>
                {badgeStyle.label}
              </span>
              <span className="block text-[10.5px] text-gray-500 dark:text-gray-400 mt-1 leading-none font-medium">
                {badgeLevel === 'gold' ? 'Biometric Signature Key' : badgeLevel === 'emerald' ? 'ID Verified Protocol' : 'Standard Web Credentials'}
              </span>
            </div>
          </div>
        </div>

        {/* Citizen Ledger Membership */}
        <div className={`rounded-2xl p-4 space-y-2.5 transition-colors duration-300 ${innerBentoCardClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 font-bold">Registry Timeline</span>
            <span className="text-[9.5px] font-mono text-blue-600 dark:text-blue-400 font-bold">NODE ACCREDITED</span>
          </div>

          <div className="flex items-start gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 leading-tight">
              <span className={`block text-xs font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-950 font-extrabold'}`}>
                Member Since
              </span>
              <span className="block text-[10.5px] text-gray-500 dark:text-gray-300 mt-1 font-mono">
                {user.verifiedAt || 'June 2026'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Meta footnote */}
      <div className="flex flex-wrap items-center justify-between text-[8px] font-mono tracking-widest text-gray-400/80 pt-2 border-t border-gray-500/10">
        <span>SECURITY NODE ID: #{user.id.substring(0, 16).toUpperCase()}</span>
        <span>VERITRUST DIGITAL LEDGER PROTOCOL V2.4</span>
      </div>
    </div>
  );
}