import { 
  User, 
  Post, 
  Comment, 
  Notification, 
  Report, 
  UserGoal, 
  VerificationRequest,
  OnboardingStatus,
  UserPermissions
} from '../types';
import * as firebaseService from './firebaseService';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

/**
 * ============================================================================
 * DATABASE-AGNOSTIC DATA REPOSITORY INTERFACE (IDataRepository)
 * ============================================================================
 * This contract establishes a direct barrier between the client UI and the
 * physical storage engine (i.e. Firebase Firestore vs. Supabase / PostgreSQL).
 * 
 * To migrate to Supabase/PostgreSQL:
 * 1. Implement this IDataRepository interface using Supabase JS SDK client.
 * 2. Set `const dataRepository: IDataRepository = new SupabaseDataRepository();`
 * 3. The entire front-end application remains completely unaffected.
 */
export interface IDataRepository {
  // --- Profiles & Accounts ---
  getOrCreateProfile(firebaseUser: any): Promise<User>;
  updateProfile(userId: string, updates: Partial<User>): Promise<void>;
  subscribeToAllProfiles(callback: (profiles: User[]) => void): () => void;
  banUser(userId: string, isBanned: boolean): Promise<void>;
  toggleUserVerification(userId: string, isVerified: boolean): Promise<void>;
  updateUserPermissions(userId: string, permissions: UserPermissions): Promise<void>;

  // --- Central Social Feed ---
  subscribeToPosts(callback: (posts: Post[]) => void, currentUserId: string | null): () => void;
  createPost(post: Omit<Post, 'comments' | 'likes' | 'reposts' | 'commentsCount'>): Promise<void>;
  updatePost(postId: string, content: string, imageUrl?: string): Promise<void>;
  deletePost(postId: string): Promise<void>;
  toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void>;
  addComment(postId: string, comment: Comment): Promise<void>;

  // --- Goal-Tracking System (Interest-Based Learning Paths) ---
  getUserGoals(userId: string): Promise<UserGoal[]>;
  getAllUserGoals(): Promise<UserGoal[]>;
  createUserGoal(goal: Omit<UserGoal, 'id' | 'createdAt'>): Promise<UserGoal>;
  saveUserGoal(userId: string, goalData: Omit<UserGoal, 'id' | 'createdAt' | 'userId'>): Promise<UserGoal>;
  updateGoalProgress(goalId: string, progress: number, milestones: any[]): Promise<void>;
  deleteUserGoal(goalId: string): Promise<void>;
  generateAiPathway(goalTitle: string, category: string): Promise<string[]>;
  getOnboardingProgress(userId: string): Promise<OnboardingStatus | null>;
  saveOnboardingProgress(userId: string, status: Partial<OnboardingStatus>): Promise<void>;

  // --- Verification Lifecycle ---
  submitVerificationRequest(request: Omit<VerificationRequest, 'id' | 'status' | 'submittedAt'>): Promise<void>;
  subscribeToVerificationRequests(callback: (requests: VerificationRequest[]) => void): () => void;
  approveVerificationRequest(requestId: string, userId: string, type: string, realName?: string, residency?: string): Promise<void>;
  rejectVerificationRequest(requestId: string, userId: string, reason?: string): Promise<void>;

  // --- Security Reports & Moderation ---
  submitReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<void>;
  subscribeToAllReports(callback: (reports: Report[]) => void): () => void;
  dismissReport(reportId: string): Promise<void>;

  // --- Secure Notifications ---
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(notificationIds: string[]): Promise<void>;
  clearAllNotifications(notificationIds: string[]): Promise<void>;

  // --- Followers, Following, and Friendship Systems ---
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  checkFriendshipStatus(userId: string, targetUserId: string): Promise<'none' | 'pending' | 'friends'>;
  subscribeToFollowersCount(userId: string, callback: (count: number) => void): () => void;
  subscribeToFollowingCount(userId: string, callback: (count: number) => void): () => void;
  subscribeToFriendshipStatus(userId: string, targetUserId: string, callback: (status: 'none' | 'pending' | 'friends') => void): () => void;
  subscribeToIsFollowing(followerId: string, followingId: string, callback: (isFollowing: boolean) => void): () => void;
  followUser(userId: string, targetUserId: string): Promise<void>;
  unfollowUser(userId: string, targetUserId: string): Promise<void>;
  sendFriendRequest(userId: string, targetUserId: string): Promise<void>;
  acceptFriendRequest(userId: string, targetUserId: string): Promise<void>;
}

/**
 * ============================================================================
 * CONCRETE IMPLEMENTATION 1: FIREBASE DATA REPOSITORY
 * ============================================================================
 */
export class FirebaseDataRepository implements IDataRepository {
  
  async getOrCreateProfile(firebaseUser: any): Promise<User> {
    return firebaseService.getOrCreateProfile(firebaseUser);
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    return firebaseService.updateProfileInFirestore(userId, updates);
  }

  subscribeToAllProfiles(callback: (profiles: User[]) => void): () => void {
    return firebaseService.subscribeToAllProfiles(callback);
  }

  async banUser(userId: string, isBanned: boolean): Promise<void> {
    return firebaseService.banUserInFirestore(userId, isBanned);
  }

  async toggleUserVerification(userId: string, isVerified: boolean): Promise<void> {
    return firebaseService.toggleUserVerificationInFirestore(userId, isVerified);
  }

  async updateUserPermissions(userId: string, permissions: UserPermissions): Promise<void> {
    const docRef = doc(db, 'profiles', userId);
    await updateDoc(docRef, {
      permissions
    });
  }

  subscribeToPosts(callback: (posts: Post[]) => void, currentUserId: string | null = null): () => void {
    return firebaseService.subscribeToPosts(callback, currentUserId);
  }

  async createPost(post: Omit<Post, 'comments' | 'likes' | 'reposts' | 'commentsCount'>): Promise<void> {
    return firebaseService.createPostInFirestore(post);
  }

  async updatePost(postId: string, content: string, imageUrl?: string): Promise<void> {
    return firebaseService.updatePostInFirestore(postId, { content, imageUrl });
  }

  async deletePost(postId: string): Promise<void> {
    return firebaseService.deletePostInFirestore(postId);
  }

  async toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void> {
    return firebaseService.toggleLikeInFirestore(postId, userId, isLiked);
  }

  async addComment(postId: string, comment: Comment): Promise<void> {
    return firebaseService.addCommentInFirestore(postId, comment);
  }

  // --- Real-Time Goals System (with Sub-collection storage) ---
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    try {
      const q = query(collection(db, 'user_goals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserGoal[];
    } catch (e) {
      console.warn("Goals empty or loading error, fallback to empty goals array.", e);
      return [];
    }
  }

  async getAllUserGoals(): Promise<UserGoal[]> {
    try {
      const q = query(collection(db, 'user_goals'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserGoal[];
    } catch (e) {
      console.warn("Goals error on dynamic ledger query:", e);
      return [];
    }
  }

  async createUserGoal(goal: Omit<UserGoal, 'id' | 'createdAt'>): Promise<UserGoal> {
    const goalRef = doc(collection(db, 'user_goals'));
    const newGoal: UserGoal = {
      id: goalRef.id,
      ...goal,
      createdAt: new Date().toISOString()
    };
    await setDoc(goalRef, newGoal);
    return newGoal;
  }

  async saveUserGoal(userId: string, goalData: Omit<UserGoal, 'id' | 'createdAt' | 'userId'>): Promise<UserGoal> {
    const goalRef = doc(collection(db, 'user_goals'));
    const newGoal: UserGoal = {
      id: goalRef.id,
      userId,
      ...goalData,
      createdAt: new Date().toISOString()
    };
    await setDoc(goalRef, newGoal);
    return newGoal;
  }

  async getOnboardingProgress(userId: string): Promise<OnboardingStatus | null> {
    try {
      const docRef = doc(db, 'onboarding_status', userId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return {
          id: snapshot.id,
          ...snapshot.data()
        } as OnboardingStatus;
      }
      return null;
    } catch (e) {
      console.warn("Error getting onboarding progress:", e);
      return null;
    }
  }

  async saveOnboardingProgress(userId: string, status: Partial<OnboardingStatus>): Promise<void> {
    try {
      const docRef = doc(db, 'onboarding_status', userId);
      await setDoc(docRef, {
        userId,
        ...status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Error saving onboarding progress:", e);
    }
  }

  async updateGoalProgress(goalId: string, progress: number, milestones: any[]): Promise<void> {
    const goalRef = doc(db, 'user_goals', goalId);
    await updateDoc(goalRef, {
      progressPercent: progress,
      milestones,
      status: progress >= 100 ? 'completed' : 'active'
    });
  }

  async deleteUserGoal(goalId: string): Promise<void> {
    await deleteDoc(doc(db, 'user_goals', goalId));
  }

  async generateAiPathway(goalTitle: string, category: string): Promise<string[]> {
    try {
      // Simulate/Generate high-conviction expert milestones dynamically via intelligent synthesis
      const cleanTitle = goalTitle.toLowerCase().trim();
      if (cleanTitle.includes('doctor') || cleanTitle.includes('medical') || cleanTitle.includes('mbbs')) {
        return [
          "Pre-med Biology & Chemistry foundational mastery",
          "Score 515+ on MCAT / Medical Entrance exams",
          "Complete Clinical Rotations in Core specialties (Cardiology, Surgery)",
          "Pass USMLE Step 1 & Step 2 CK Boards with distinction",
          "Match into high-performing Medical Residency Residency program"
        ];
      }
      if (cleanTitle.includes('software') || cleanTitle.includes('engineer') || cleanTitle.includes('developer') || cleanTitle.includes('code')) {
        return [
          "Data Structures & Core Algorithms mastery (Familiarize with Trees, Graphs, DP)",
          "Build 3 full-stack high-concurrency cloud native projects with telemetry analytics",
          "Deep dive into system architectures, Database Indexing, and Sharding patterns",
          "Contribute to key open-source libraries or complete 100+ high-level algorithmic challenges",
          "Mock System Design interview loop and continuous performance optimization"
        ];
      }
      if (cleanTitle.includes('business') || cleanTitle.includes('startup') || cleanTitle.includes('founder') || cleanTitle.includes('entrepreneur')) {
        return [
          "Complete Lean Canvas blueprint identifying absolute target audience",
          "Build Minimum Viable Product (MVP) prioritizing fast user feedback loops",
          "Acquire first 100 active premium paying customers (PMF Validation)",
          "Optimize unit economics, customer acquisition cost (CAC), and lifetime value (LTV)",
          "Formulate seed pitch deck and secure professional strategic investor capital"
        ];
      }
      
      // Dynamic fallback pathways for custom interest-based goals
      return [
        `Identify professional standards and baseline skill requirements for: ${goalTitle}`,
        "Complete targeted certificate blueprints and structured reading roadmap",
        "Construct a real-world portfolio demonstrating active output and hands-on case studies",
        "Engage with verified mentors and join specialized professional networks",
        "Conduct peer-reviewed knowledge transfers and practice advanced scenario exercises"
      ];
    } catch (e) {
      return ["Establish baseline milestones", "Track active progress", "Verify skill outcomes"];
    }
  }

  // --- Real-Time Verification System ---
  async submitVerificationRequest(request: Omit<VerificationRequest, 'id' | 'status' | 'submittedAt'>): Promise<void> {
    const docRef = doc(collection(db, 'verification_requests'));
    const data: VerificationRequest = {
      id: docRef.id,
      ...request,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    await setDoc(docRef, data);
  }

  subscribeToVerificationRequests(callback: (requests: VerificationRequest[]) => void): () => void {
    const q = query(collection(db, 'verification_requests'), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VerificationRequest[];
      callback(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'verification_requests');
    });
  }

  async approveVerificationRequest(requestId: string, userId: string, type: string, realName?: string, residency?: string): Promise<void> {
    const details = {
      verificationType: type as 'government_id' | 'biometric' | 'professional' | 'community',
      residency: residency || 'Munich, Germany',
      realName: realName || ''
    };
    await firebaseService.approveVerificationRequest(requestId, userId, details);
    const docRef = doc(db, 'verification_requests', requestId);
    await updateDoc(docRef, {
      status: 'approved',
      reviewedAt: new Date().toISOString()
    });
  }

  async rejectVerificationRequest(requestId: string, userId: string, reason?: string): Promise<void> {
    await firebaseService.rejectVerificationRequest(requestId, userId, reason);
    const docRef = doc(db, 'verification_requests', requestId);
    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: reason || 'Information does not match criteria.',
      reviewedAt: new Date().toISOString()
    });
  }

  // --- Reports & Moderation ---
  async submitReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<void> {
    await firebaseService.createReportInFirestore(report);
  }

  subscribeToAllReports(callback: (reports: Report[]) => void): () => void {
    return firebaseService.subscribeToAllReports(callback);
  }

  async dismissReport(reportId: string): Promise<void> {
    return firebaseService.dismissReportInFirestore(reportId);
  }

  // --- Notifications ---
  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    return firebaseService.subscribeToNotifications(userId, callback);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return firebaseService.markNotificationAsReadInFirestore(notificationId);
  }

  async markAllNotificationsAsRead(notificationIds: string[]): Promise<void> {
    return firebaseService.markAllNotificationsAsReadInFirestore(notificationIds);
  }

  async clearAllNotifications(notificationIds: string[]): Promise<void> {
    return firebaseService.clearAllNotificationsInFirestore(notificationIds);
  }

  // --- Followers, Following, and Friendship Systems ---
  async getFollowersCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, 'followers'), where('followingId', '==', userId));
      const s = await getDocs(q);
      return s.size;
    } catch {
      return 0;
    }
  }

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, 'followers'), where('followerId', '==', userId));
      const s = await getDocs(q);
      return s.size;
    } catch {
      return 0;
    }
  }

  async checkFriendshipStatus(userId: string, targetUserId: string): Promise<'none' | 'pending' | 'friends'> {
    try {
      const docId = [userId, targetUserId].sort().join('_');
      const docRef = doc(db, 'friendships', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.status as 'none' | 'pending' | 'friends';
      }
      return 'none';
    } catch {
      return 'none';
    }
  }

  subscribeToFollowersCount(userId: string, callback: (count: number) => void): () => void {
    const q = query(collection(db, 'followers'), where('followingId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    }, (err) => {
      console.warn("Followers count listener error:", err);
      callback(0);
    });
  }

  subscribeToFollowingCount(userId: string, callback: (count: number) => void): () => void {
    const q = query(collection(db, 'followers'), where('followerId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    }, (err) => {
      console.warn("Following count listener error:", err);
      callback(0);
    });
  }

  subscribeToFriendshipStatus(userId: string, targetUserId: string, callback: (status: 'none' | 'pending' | 'friends') => void): () => void {
    const docId = [userId, targetUserId].sort().join('_');
    const docRef = doc(db, 'friendships', docId);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.status as 'none' | 'pending' | 'friends');
      } else {
        callback('none');
      }
    }, (err) => {
      console.warn("Friendship listener error:", err);
      callback('none');
    });
  }

  subscribeToIsFollowing(followerId: string, followingId: string, callback: (isFollowing: boolean) => void): () => void {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'followers', followId);
    return onSnapshot(followRef, (snapshot) => {
      callback(snapshot.exists());
    }, (err) => {
      console.warn("IsFollowing listener error:", err);
      callback(false);
    });
  }

  async followUser(userId: string, targetUserId: string): Promise<void> {
    const followId = `${userId}_${targetUserId}`;
    await setDoc(doc(db, 'followers', followId), {
      id: followId,
      followerId: userId,
      followingId: targetUserId,
      createdAt: new Date().toISOString()
    });
  }

  async unfollowUser(userId: string, targetUserId: string): Promise<void> {
    const followId = `${userId}_${targetUserId}`;
    await deleteDoc(doc(db, 'followers', followId));
  }

  async sendFriendRequest(userId: string, targetUserId: string): Promise<void> {
    const docId = [userId, targetUserId].sort().join('_');
    await setDoc(doc(db, 'friendships', docId), {
      id: docId,
      userOne: [userId, targetUserId].sort()[0],
      userTwo: [userId, targetUserId].sort()[1],
      status: 'pending',
      requesterId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  async acceptFriendRequest(userId: string, targetUserId: string): Promise<void> {
    const docId = [userId, targetUserId].sort().join('_');
    await updateDoc(doc(db, 'friendships', docId), {
      status: 'friends',
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * ============================================================================
 * CONCRETE IMPLEMENTATION 2: SUPABASE / POSTGRES DATA REPOSITORY BLUEPRINT
 * ============================================================================
 * This serves as our direct conceptual template illustrating how to execute
 * the exact same client actions with the Supabase JavaScript Client.
 * Notice how our repository design has abstracts this cleanly.
 */
export class SupabaseDataRepository implements IDataRepository {
  /**
   * Note on postgres design:
   * To query rows inside postgres, we would use Supabase's query engine:
   * 
   * static async initSupabase() {
   *   return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
   * }
   */
  
  async getOrCreateProfile(firebaseUser: any): Promise<User> {
    // const { data, error } = await supabase.from('profiles').select('*').eq('id', firebaseUser.uid).single();
    // if (!data) { create profile row... }
    throw new Error("Supabase integration not initialized. Switch to FirebaseDataRepository to start.");
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    // await supabase.from('profiles').update(updates).eq('id', userId);
  }

  subscribeToAllProfiles(callback: (profiles: User[]) => void): () => void {
    // Listen to realtime channels:
    // const channel = supabase.channel('profiles-all').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => { ... })
    return () => {};
  }

  async banUser(userId: string, isBanned: boolean): Promise<void> {
    // await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', userId);
  }

  async toggleUserVerification(userId: string, isVerified: boolean): Promise<void> {
    // await supabase.from('profiles').update({ isVerified }).eq('id', userId);
  }

  async updateUserPermissions(userId: string, permissions: UserPermissions): Promise<void> {
    // await supabase.from('user_permissions').upsert({ user_id: userId, ...permissions }).eq('user_id', userId);
  }

  subscribeToPosts(callback: (posts: Post[]) => void, currentUserId: string | null): () => void {
    return () => {};
  }

  async createPost(post: any): Promise<void> {}
  async updatePost(postId: string, content: string, imageUrl?: string): Promise<void> {}
  async deletePost(postId: string): Promise<void> {}
  async toggleLike(postId: string, userId: string, isLiked: boolean): Promise<void> {}
  async addComment(postId: string, comment: Comment): Promise<void> {}

  async getUserGoals(userId: string): Promise<UserGoal[]> { return []; }
  async getAllUserGoals(): Promise<UserGoal[]> { return []; }
  async createUserGoal(goal: any): Promise<UserGoal> { throw new Error("Method not implemented."); }
  async saveUserGoal(userId: string, goalData: any): Promise<UserGoal> { throw new Error("Method not implemented."); }
  async updateGoalProgress(goalId: string, progress: number, milestones: any[]): Promise<void> {}
  async deleteUserGoal(goalId: string): Promise<void> {}
  async generateAiPathway(goalTitle: string, category: string): Promise<string[]> { return []; }
  async getOnboardingProgress(userId: string): Promise<OnboardingStatus | null> { return null; }
  async saveOnboardingProgress(userId: string, status: Partial<OnboardingStatus>): Promise<void> {}

  async submitVerificationRequest(request: any): Promise<void> {}
  subscribeToVerificationRequests(callback: any): () => void { return () => {}; }
  async approveVerificationRequest(requestId: string, userId: string, type: string, realName?: string, residency?: string): Promise<void> {}
  async rejectVerificationRequest(requestId: string, userId: string, reason?: string): Promise<void> {}

  async submitReport(report: any): Promise<void> {}
  subscribeToAllReports(callback: any): () => void { return () => {}; }
  async dismissReport(reportId: string): Promise<void> {}

  subscribeToNotifications(userId: string, callback: any): () => void { return () => {}; }
  async markNotificationAsRead(notificationId: string): Promise<void> {}
  async markAllNotificationsAsRead(notificationIds: string[]): Promise<void> {}
  async clearAllNotifications(notificationIds: string[]): Promise<void> {}

  // --- Followers, Following, and Friendship Systems ---
  async getFollowersCount(userId: string): Promise<number> { return 0; }
  async getFollowingCount(userId: string): Promise<number> { return 0; }
  async checkFriendshipStatus(userId: string, targetUserId: string): Promise<'none' | 'pending' | 'friends'> { return 'none'; }
  subscribeToFollowersCount(userId: string, callback: (count: number) => void): () => void { return () => {}; }
  subscribeToFollowingCount(userId: string, callback: (count: number) => void): () => void { return () => {}; }
  subscribeToFriendshipStatus(userId: string, targetUserId: string, callback: (status: 'none' | 'pending' | 'friends') => void): () => void { return () => {}; }
  subscribeToIsFollowing(followerId: string, followingId: string, callback: (isFollowing: boolean) => void): () => void { return () => {}; }
  async followUser(userId: string, targetUserId: string): Promise<void> {}
  async unfollowUser(userId: string, targetUserId: string): Promise<void> {}
  async sendFriendRequest(userId: string, targetUserId: string): Promise<void> {}
  async acceptFriendRequest(userId: string, targetUserId: string): Promise<void> {}
}

/**
 * ============================================================================
 * SERVICE INSTANCE SELECTOR
 * ============================================================================
 * Swap the instance right here to change the persistent storage provider!
 * Absolute zero impact on UI components. Fully database-agnostic.
 */
export const dataRepository: IDataRepository = new FirebaseDataRepository();
