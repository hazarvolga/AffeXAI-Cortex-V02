# Plan: Fix Tenant Admin Security Vulnerability

## 🚨 Security Issue
**Severity:** CRITICAL  
**Impact:** Tenant Admin can view and potentially modify Super Admin user

**Current Behavior:**
- `admin@affexai.com` (Tenant Admin, tenantId = specific-tenant-id)
- Can see `superuser@affexai.com` (Super Admin, tenantId = NULL) in user list
- Can potentially activate/deactivate or delete Super Admin

**Expected Behavior:**
- Tenant Admin should ONLY see users within their own tenant
- Super Admin should be completely hidden from tenant-scoped views
- Only Super Admin can see and manage other Super Admins

## Root Cause Analysis

### 1. Backend API Issue
**File:** `apps/backend/src/modules/users/users.controller.ts` or `users.service.ts`

**Problem:** User list query likely does NOT filter by tenantId or exclude Super Admins

**Current Query (Hypothesis):**
```typescript
// ❌ WRONG: Returns ALL users regardless of tenant
const users = await this.userRepository.find();
```

**Expected Query:**
```typescript
// ✅ CORRECT: Filter by tenant and exclude Super Admins for tenant admins
const users = await this.userRepository.find({
  where: {
    tenantId: currentUser.tenantId, // Only same tenant
    roleId: Not(SUPER_ADMIN_ROLE_ID) // Exclude Super Admins
  }
});
```

### 2. Frontend Issue (Secondary)
**File:** `apps/frontend/src/app/admin/users/page.tsx`

**Problem:** Frontend may not have client-side protection (though backend is primary)

## Proposed Changes

### Phase 1: Backend Security Fix (CRITICAL)

**Agent:** `backend-specialist`

1. **Locate User List Endpoint:**
   - Find `GET /users` or similar endpoint in `users.controller.ts`
   - Identify the service method that fetches users

2. **Implement Tenant Isolation:**
   ```typescript
   // In users.service.ts
   async findAll(currentUser: CurrentUser) {
     const query: any = {};
     
     // If user is NOT Super Admin, filter by tenant
     if (currentUser.roleNames?.includes('SuperAdmin')) {
       // Super Admin sees everyone
       return this.userRepository.find();
     } else {
       // Tenant Admin sees only their tenant (excluding Super Admins)
       query.tenantId = currentUser.tenantId;
       query.roleId = Not(SUPER_ADMIN_ROLE_ID);
       
       return this.userRepository.find({ where: query });
     }
   }
   ```

3. **Add Guard/Middleware:**
   - Ensure `currentUser` is properly injected
   - Add logging for security audit

### Phase 2: Frontend Validation (Defense in Depth)

**Agent:** `frontend-specialist`

1. **Add Client-Side Check:**
   ```typescript
   // In users page
   const filteredUsers = users.filter(user => {
     // Hide Super Admins from non-Super Admins
     if (!isSuperAdmin && user.roleNames?.includes('SuperAdmin')) {
       return false;
     }
     return true;
   });
   ```

2. **Disable Actions on Super Admin:**
   - Even if somehow visible, disable edit/delete buttons

### Phase 3: Testing & Verification

**Agent:** `test-engineer`

1. **Manual Test:**
   - Login as `admin@affexai.com` (Tenant Admin)
   - Verify `superuser@affexai.com` is NOT visible in user list
   - Login as `superuser@affexai.com` (Super Admin)
   - Verify ALL users are visible

2. **API Test:**
   ```bash
   # As Tenant Admin
   curl -H "Authorization: Bearer ${TENANT_ADMIN_TOKEN}" http://localhost:9006/api/users
   # Should NOT return Super Admin
   
   # As Super Admin
   curl -H "Authorization: Bearer ${SUPER_ADMIN_TOKEN}" http://localhost:9006/api/users
   # Should return ALL users
   ```

## Security Checklist

- [ ] Backend filters users by tenantId for Tenant Admins
- [ ] Backend excludes Super Admins from Tenant Admin view
- [ ] Frontend has defense-in-depth filtering
- [ ] Edit/Delete actions disabled for Super Admin (from Tenant Admin view)
- [ ] Audit logging added for user list access
- [ ] Manual testing completed
- [ ] API testing completed

## Rollout

1. **Immediate:** Backend fix (blocks Tenant Admin from seeing Super Admin)
2. **Same PR:** Frontend defense-in-depth
3. **Verification:** Manual + API tests
