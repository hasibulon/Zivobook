# Firebase Security Specification (Zero-Trust Portfolio)

This document specifies the data invariants, threat model, "Dirty Dozen" exploits, and the corresponding ruleset constraints for VeriTrust's Firestore database.

## 1. Data Invariants

### Profiles
- **Invariant 1 (Identity Ownership)**: A Profile document at `/profiles/{userId}` can only be created or modified by the user whose UID matches `{userId}`.
- **Invariant 2 (VeriTrust Seal Protection)**: Only a certified verification flow may alter a user's `isVerified` and `badgeLevel` status. Self-assignment without submitting a corresponding and correct validation session is forbidden.
- **Invariant 3 (Counter Integrity)**: Core telemetry fields such as `followersCount` and `followingCount` must be non-negative integers.

### Posts
- **Invariant 1 (Author Authenticity)**: A post's `authorId` must match the UID of the writing request.
- **Invariant 2 (Strict Timestamps)**: Creation date must align with `request.time`.
- **Invariant 3 (Bounded Content)**: Content text must not exceed 2000 characters to prevent visual and database flooding.
- **Invariant 4 (State Control)**: Interaction counters (`likes`, `reposts`, `commentsCount`) must be updated piece-by-piece, with users forbidden from modifying content alongside a like increment.

### Verification Requests
- **Invariant 1 (Authentic Submissions)**: User ID must map to the active authenticated session.
- **Invariant 2 (Initial State Locking)**: Newly filed verification requests must have `status` set to `'pending'`.
- **Invariant 3 (ID and Selfie Association)**: Any request must contain both `idDocumentUrl` and `selfieUrl` formatted as strings.

---

## 2. The "Dirty Dozen" Threat Payloads

Here are twelve specific JSON payloads attempting to violate security laws:

1. **Self-Verification Attack (Profiles)**
   - *Attempt*: Create or update `/profiles/user_123` setting `isVerified: true` and `badgeLevel: "emerald"` directly.
   - *Result*: `PERMISSION_DENIED` - Only a valid verification process flow is permitted, and critical security fields are safeguarded.

2. **Identity Takeover (Profiles)**
   - *Attempt*: Write to `/profiles/user_456` from a session authenticated as `user_123`.
   - *Result*: `PERMISSION_DENIED` - Document id must equal request UID.

3. **Spoofed Author Post (Posts)**
   - *Attempt*: Create `/posts/post_1` with `authorId: "user_victim"` while authenticated as `user_attacker`.
   - *Result*: `PERMISSION_DENIED` - Post authorId must match auth UID.

4. **Malicious Counter Exploding (Posts)**
   - *Attempt*: Update a post resetting `likes` from `12` to `99999` with content changes mixed in.
   - *Result*: `PERMISSION_DENIED` - Modified keys must be isolated, type-safe, and only target counter fields during non-author interactions.

5. **Future Posted Invariant Breach (Posts)**
   - *Attempt*: Post with `createdAt` set to year `2050-01-01T00:00:00Z` instead of `request.time`.
   - *Result*: `PERMISSION_DENIED` - Strict server timestamp matching required.

6. **Over-sized Document Flooding (Posts)**
   - *Attempt*: Creating a post with a `content` block containing 1MB of garbage text.
   - *Result*: `PERMISSION_DENIED` - Content string length must be bounded ($\le 2000$ characters).

7. **Arbitrary Status Elevating (Verification Requests)**
   - *Attempt*: Post `/verification_requests/req_abc` with state `status: "approved"` directly.
   - *Result*: `PERMISSION_DENIED` - Submissions must default to `pending` state.

8. **ID Poisoning Attack (Posts)**
   - *Attempt*: Write to `/posts/@@@_MALICIOUS_CHARACTER_ID_$$$` to fatigue indexing/system operations.
   - *Result*: `PERMISSION_DENIED` - String ID check forbids complex punctuation/unbounded length.

9. **Foreign Comment Editing (Comments)**
   - *Attempt*: Editing a comment's `content` created by `user_victim` while authenticated as `user_attacker`.
   - *Result*: `PERMISSION_DENIED` - Author ID validation checks apply to comment modifications.

10. **Immortality Field Overwriting (Posts)**
    - *Attempt*: Send update payload modifying `authorId` or `createdAt` fields on existing post.
    - *Result*: `PERMISSION_DENIED` - Immutable field checking on update.

11. **Anonymously Writing Posts (Posts)**
    - *Attempt*: Creating a post with a session where the user has no authenticated UID or `email_verified == false`.
    - *Result*: `PERMISSION_DENIED` - Writes strictly mandate verified secure auth token sessions.

12. **PII Query Scraping (Verification Requests)**
    - *Attempt*: List query against `/verification_requests` seeking to dump other users' files and real names.
    - *Result*: `PERMISSION_DENIED` - Lists must enforce that returned records belong exclusively to the querying user.
