# Implementation Plan: Company Actor

## Overview

Introduce the `company` role to EthioDelala by adding two new Mongoose models, extending existing models, wiring a new Express router, and building three new React pages with a Redux slice. Tasks are ordered so each step builds on the previous, with backend data layer first, then API layer, then frontend.

## Tasks

- [x] 1. Extend data models (backend)
  - [x] 1.1 Add `'company'` to the User `role` enum in `backend/src/models/User.js`
    - Change `enum: ['user', 'broker', 'admin']` → `['user', 'broker', 'admin', 'company']`
    - _Requirements: 2.1_

  - [x] 1.2 Create `backend/src/models/Company.js`
    - Implement the full `companySchema` as specified in the design (identity, contact, branding, ownership, verification lifecycle, operational state, subscription, stats sub-documents)
    - Add all indexes: `verificationStatus`, `industry`, `isActive+verificationStatus`, and compound text index on `companyName/description/industry`
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 3.1, 9.5_

  - [x] 1.3 Create `backend/src/models/CompanyMember.js`
    - Implement `companyMemberSchema` with `company`, `user`, `memberRole` (`editor`/`viewer`), `status` (`pending`/`active`/`declined`/`removed`), `invitedBy`, `invitedAt`, `respondedAt`
    - Add indexes: `{company,status}`, `{user,status}`, unique `{company,user}`
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 1.4 Extend `backend/src/models/Listing.js` with company fields
    - Add `ownerType` (`'individual'`/`'company'`, default `'individual'`), `companyOwner` (ObjectId ref `'Company'`), `postedBy` (ObjectId ref `'User'`)
    - Extend `jobs` sub-document: add `jobTitle`, `applicationDeadline` (Date), `applicationUrl` (String)
    - Extend `automotive` sub-document: add `quantity` (Number, default 1), `fleetDiscount` (Number)
    - Extend `realEstate` sub-document: add `mortgageDetails` object (`interestRate`, `loanTermYears`, `downPaymentPercent`)
    - Add new indexes: `{ownerType,status}` and `{companyOwner,status}`
    - _Requirements: 5.1, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.5 Write property tests for Company model creation (Properties 1 & 2)
    - **Property 1: Company registration creates a pending document owned by the submitter**
    - **Validates: Requirements 1.1, 1.4**
    - **Property 2: Duplicate registration number is rejected**
    - **Validates: Requirements 1.2**
    - Use `fast-check` to generate random valid registration payloads; assert `verificationStatus='pending'` and `adminUser` matches submitter; assert second insert with same `businessRegistrationNumber` throws a duplicate key error

- [x] 2. Implement `requireCompanyMember` middleware
  - [x] 2.1 Create `backend/src/middleware/requireCompanyMember.js`
    - Accept optional `minRole` parameter (`'editor'` or `'viewer'`); default = admin-only (no member record needed, just `req.user` must be `company.adminUser`)
    - Look up `CompanyMember` by `{company: req.params.companyId, user: req.user._id, status: 'active'}`
    - Role hierarchy: `admin > editor > viewer`; return HTTP 403 with `"Insufficient permissions to manage listings."` if role check fails
    - Attach `req.companyMember` for downstream handlers
    - _Requirements: 5.6, 7.2, 7.3_

  - [ ]* 2.2 Write property tests for `requireCompanyMember` middleware (Property 11)
    - **Property 11: Viewer members cannot create or edit listings**
    - **Validates: Requirements 5.6**
    - Generate random viewer member records; call middleware with `minRole='editor'`; assert HTTP 403 response

- [x] 3. Implement `companyController.js`
  - [x] 3.1 Create `backend/src/controllers/companyController.js` — registration and verification functions
    - `registerCompany`: validate required fields, check duplicate `businessRegistrationNumber` (409), upload `businessRegistrationDoc` to Cloudinary (`ethiodelala/companies/docs`), create Company with `verificationStatus='pending'`, notify all admin users via `notificationService`
    - `approveCompany`: check `verificationStatus='pending'` (else 409), set `verificationStatus='verified'`, update `adminUser.role='company'`, notify Company_Admin
    - `rejectCompany`: check `verificationStatus='pending'` (else 409), set `verificationStatus='rejected'`, store `rejectionReason`, notify Company_Admin
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 3.2 Write property tests for registration and verification (Properties 1–5)
    - **Property 1: Company registration creates a pending document owned by the submitter**
    - **Validates: Requirements 1.1, 1.4**
    - **Property 2: Duplicate registration number is rejected with HTTP 409**
    - **Validates: Requirements 1.2**
    - **Property 3: Approval transitions pending → verified and elevates admin role**
    - **Validates: Requirements 2.1**
    - **Property 4: Rejection transitions pending → rejected and stores reason**
    - **Validates: Requirements 2.2**
    - **Property 5: Company list filtering by verificationStatus is sound**
    - **Validates: Requirements 2.5**

  - [x] 3.3 Add profile management and public listing functions to `companyController.js`
    - `updateCompanyProfile`: validate URL format for `website` (422 if invalid), upload `logo`/`coverPhoto` to Cloudinary, update Company document, return updated document
    - `listCompanies`: public endpoint — filter by `verificationStatus='verified'`, support `industry` and `city` query params, paginate 20/page
    - `getCompanyById`: return Company if `verified` (or if requester is admin/company admin)
    - `getCompanyListings`: paginated active listings for a company profile (20/page)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.4_

  - [ ]* 3.4 Write property tests for profile and public visibility (Properties 6 & 7)
    - **Property 6: Profile update round-trip**
    - **Validates: Requirements 3.1**
    - **Property 7: Unverified companies are hidden from public search**
    - **Validates: Requirements 3.5, 9.1**

  - [x] 3.5 Add team management functions to `companyController.js`
    - `inviteMember`: look up user by phone, enforce 20-member cap (422), create `CompanyMember` with `status='pending'`, notify invited user
    - `acceptInvitation`: set `status='active'`, set `respondedAt`
    - `declineInvitation`: set `status='declined'`, set `respondedAt`
    - `removeMember`: set `status='removed'`, notify removed member
    - `updateMemberRole`: update `memberRole` field
    - `listMembers`: return all members for a company
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 3.6 Write property tests for team management (Properties 8 & 9)
    - **Property 8: Invitation creates a pending membership record**
    - **Validates: Requirements 4.1**
    - **Property 9: Invitation response transitions membership status correctly**
    - **Validates: Requirements 4.2, 4.3**

  - [x] 3.7 Add company listing functions to `companyController.js`
    - `createCompanyListing`: verify company `verificationStatus='verified'` (403 if not), enforce 500-listing cap (422), validate company-specific fields (job `applicationDeadline` required, fleet `fleetDiscount` required when `quantity>1`, `applicationUrl` HTTPS URL ≤2048 chars), set `ownerType='company'`, `companyOwner`, `postedBy`
    - `bulkCreateCompanyListings`: accept array of 1–50 objects, process each independently, return `{successes, failures, total}` summary
    - `getCompanyDashboard`: return aggregated stats from `company.stats`
    - `submitContactInquiry`: validate message ≤1000 chars (422), notify Company_Admin
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 8.3, 8.4, 8.5_

  - [ ]* 3.8 Write property tests for listing creation and bulk operations (Properties 10–16)
    - **Property 10: Company listing ownership is correctly attributed**
    - **Validates: Requirements 5.1**
    - **Property 11: Viewer members cannot create or edit listings**
    - **Validates: Requirements 5.6**
    - **Property 12: Unverified companies cannot create listings**
    - **Validates: Requirements 5.7**
    - **Property 13: Bulk listing creation processes each item independently**
    - **Validates: Requirements 5.8**
    - **Property 14: Company listing contact info shows company channels, not personal info**
    - **Validates: Requirements 8.1**
    - **Property 15: Company search filtering by ownerType is sound**
    - **Validates: Requirements 9.3**
    - **Property 16: Company profile listings pagination is correct**
    - **Validates: Requirements 9.4**

  - [x] 3.9 Add admin management functions to `companyController.js`
    - `suspendCompany`: set `isActive=false`, bulk-update all active Company_Listings to `status='inactive'`
    - `reactivateCompany`: set `isActive=true`; do NOT restore listings
    - `deleteCompany`: soft-delete Company (add `deletedAt` field), set all associated listings to `status='removed'`
    - `transferAdmin`: update `company.adminUser` to target `CompanyMember`
    - `listCompaniesAdmin`: admin-only list with `verificationStatus` filter and pagination
    - `getCompanyAuditLog`: return `ActivityLog` entries for the company
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 3.10 Write property tests for admin management (Properties 17–19)
    - **Property 17: Suspension cascades to all active listings**
    - **Validates: Requirements 11.1**
    - **Property 18: Reactivation does not auto-restore listings**
    - **Validates: Requirements 11.2**
    - **Property 19: Soft-delete cascades to listings**
    - **Validates: Requirements 11.4**

- [ ] 4. Checkpoint — Ensure all backend controller tests pass
  - Run the test suite; fix any failures before proceeding to routing.

- [x] 5. Create the companies Express router and mount it
  - [x] 5.1 Create `backend/src/routes/companies.js`
    - Mount all routes from the API endpoint table in the design document
    - Apply `authenticate`, `requireRole`, `requireCompanyMember` middleware per route
    - Use `companyDocUpload` (JPEG/PNG/PDF, 10 MB) for `POST /register` and `logoUpload` (JPEG/PNG, 5 MB) for `PUT /:id/profile` — add these upload presets to `backend/src/middleware/upload.js`
    - _Requirements: 1.1, 1.5, 3.3, 4.1, 5.1, 5.8, 7.6, 8.3, 9.1_

  - [x] 5.2 Mount the companies router in `backend/server.js`
    - Add `app.use('/api', companiesRouter)` alongside existing route mounts
    - _Requirements: 1.1_

  - [x] 5.3 Extend `backend/src/routes/admin.js` and `adminController.js` for company management
    - Add routes: `GET /admin/companies`, `PATCH /admin/companies/:id/approve`, `PATCH /admin/companies/:id/reject`, `PATCH /admin/companies/:id/suspend`, `PATCH /admin/companies/:id/reactivate`, `DELETE /admin/companies/:id`, `PATCH /admin/companies/:id/transfer-admin`, `GET /admin/companies/:id/audit-log`
    - Import and wire the corresponding functions from `companyController.js`
    - _Requirements: 2.1, 2.2, 2.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 5.4 Extend `backend/src/routes/auth.js` registration validation to allow `'company'` role only via the companies flow
    - The `/api/auth/register` route keeps `isIn(['user', 'broker'])` — the `company` role is assigned by the approval flow, not self-registration
    - No change needed to the register route; document this constraint with a comment
    - _Requirements: 2.1_

- [x] 6. Add subscription expiry handler for company featured listings
  - [x] 6.1 Extend `backend/src/jobs/expiryJob.js` (or create a new job) to handle company subscription expiry
    - When a Company's `subscription.renewalDate` passes and `subscription.isActive` becomes `false`, set `isFeatured=false` on all Company_Listings for that company
    - _Requirements: 10.3_

  - [ ]* 6.2 Write property test for subscription expiry (Property 20)
    - **Property 20: Subscription expiry removes featured flags**
    - **Validates: Requirements 10.3**

- [ ] 7. Checkpoint — Ensure all backend tests pass and server starts cleanly
  - Verify all routes respond correctly; fix any issues before starting frontend work.

- [x] 8. Add Redux slice and API wiring (frontend)
  - [x] 8.1 Create `frontend/src/store/companySlice.js`
    - Define initial state shape: `{ profile, members, dashboard, listings, pagination, loading, error }`
    - Implement all async thunks: `fetchCompanyProfile`, `fetchCompanyDashboard`, `fetchCompanyListings`, `fetchCompanyMembers`, `registerCompany`, `updateCompanyProfile`, `inviteMember`, `removeMember`, `updateMemberRole`, `createCompanyListing`, `submitContactInquiry`
    - Add `extraReducers` for pending/fulfilled/rejected states on each thunk
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 8.2 Register `companyReducer` in `frontend/src/store/index.js`
    - Import `companyReducer` from `./companySlice` and add `company: companyReducer` to the `reducer` map
    - _Requirements: 7.6_

- [x] 9. Update role utilities and navigation (frontend)
  - [x] 9.1 Update `frontend/src/utils/roleUtils.js`
    - Add `COMPANY: 'company'` to `USER_ROLES`
    - Add `company: '/company-dashboard'` to `getDashboardRoute`
    - Add `'company-dashboard': [USER_ROLES.COMPANY]` and `'create-company-listing': [USER_ROLES.COMPANY]` to `isAuthorized`
    - Add company menu items to `getMenuItems` for the `company` role
    - _Requirements: 7.6_

  - [x] 9.2 Update `frontend/src/utils/navigationUtils.js`
    - Add `/company-dashboard` to `getActiveSection` sectionMap
    - Add `company-dashboard` to `validateNavigation` restrictedPaths with `['company']`
    - Add `'company-dashboard': 'Company Dashboard'` to `getBreadcrumbs` segmentLabels
    - _Requirements: 7.6_

  - [x] 9.3 Update `frontend/src/components/DashboardRouter.jsx`
    - Add `company: '/company-dashboard'` to `roleDashboardMap`
    - _Requirements: 7.6_

- [x] 10. Build `RegisterCompany.jsx` (frontend)
  - [x] 10.1 Create `frontend/src/pages/RegisterCompany.jsx`
    - Implement a 3-step wizard using local state: Step 1 (company info: `companyName`, `industry`, `contactEmail`, `contactPhone`), Step 2 (registration doc: `businessRegistrationNumber`, file upload with client-side JPEG/PNG/PDF + 10 MB validation), Step 3 (review & submit)
    - Dispatch `registerCompany` thunk on submit; show "pending verification" confirmation screen on success
    - Display inline `alert-danger` for API errors from `company.error`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 10.2 Add link to company registration in `frontend/src/pages/Register.jsx`
    - Below the existing login link, add: "Are you a business? Register your company →" linking to `/register-company`
    - _Requirements: 1.1_

- [x] 11. Build `CompanyDashboard.jsx` (frontend)
  - [x] 11.1 Create `frontend/src/pages/CompanyDashboard.jsx`
    - Implement four tabs: Overview, Listings, Team, Subscription
    - Overview tab: stats cards for `activeListingsCount`, `totalViewsLast30`, `totalInquiriesLast30`, `membersCount` (dispatch `fetchCompanyDashboard`)
    - Listings tab: sortable table (title, category, status, views, created date); show create/edit/delete actions only for admin/editor roles (dispatch `fetchCompanyListings`)
    - Team tab: member list with invite/remove/role-change controls; visible only to Company_Admin (dispatch `fetchCompanyMembers`, `inviteMember`, `removeMember`, `updateMemberRole`)
    - Subscription tab: display `subscription.isActive`, `subscription.renewalDate`, manage button
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.4_

- [x] 12. Build `CompanyProfile.jsx` (frontend)
  - [x] 12.1 Create `frontend/src/pages/CompanyProfile.jsx`
    - Company header: logo, name, verified badge (shown when `verificationStatus='verified'`), description, contact channels (`contactPhone`, `contactEmail`, `website`)
    - Active listings grid paginated at 20/page (dispatch `fetchCompanyListings`)
    - "Contact Company" button opens inline contact form (name, phone, message); dispatch `submitContactInquiry` on submit; show client-side error if message >1000 chars
    - _Requirements: 3.6, 8.1, 8.3, 8.4, 8.5, 9.4_

- [x] 13. Wire new routes into `App.jsx` and update `AdminPanel.jsx`
  - [x] 13.1 Add new routes to `frontend/src/App.jsx`
    - Import `RegisterCompany`, `CompanyDashboard`, `CompanyProfile`
    - Add `<Route path="/companies/:id" element={<CompanyProfile />} />`
    - Add `<Route path="/register-company" element={<ProtectedRoute><RegisterCompany /></ProtectedRoute>} />`
    - Add `<Route path="/company-dashboard" element={<ProtectedRoute roles={['company']}><DashboardRouter><CompanyDashboard /></DashboardRouter></ProtectedRoute>} />`
    - _Requirements: 7.6_

  - [x] 13.2 Update `frontend/src/pages/AdminPanel.jsx` to show company verification queue
    - Add a "Companies" tab (or section) that fetches `GET /api/companies/admin?verificationStatus=pending`
    - Display company name, registration number, submitted date, and Approve/Reject action buttons
    - Wire approve/reject to `PATCH /api/companies/:id/approve` and `PATCH /api/companies/:id/reject`
    - _Requirements: 2.1, 2.2, 2.5_

- [x] 14. Add i18n keys for company features
  - [x] 14.1 Add company keys to `frontend/src/i18n/en.json`
    - Add a top-level `"company"` object with keys for: `register`, `dashboard`, `profile`, `verificationPending`, `verified`, `rejected`, `inviteMember`, `removeMember`, `createListing`, `contactCompany`, `teamManagement`, `subscription`, `overview`, `listings`, `team`, `pendingVerification`, `approveCompany`, `rejectCompany`, `memberRoles` (`editor`, `viewer`), `stats` (`activeListings`, `totalViews`, `totalInquiries`, `members`)
    - _Requirements: 1.1, 7.1_

  - [x] 14.2 Add matching keys to `frontend/src/i18n/am.json`
    - Mirror the same key structure added in 14.1 with Amharic translations (use placeholder strings if translations are not yet available, prefixed with `[AM]`)
    - _Requirements: 1.1_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Run the full test suite (`npm test --run` in both `backend` and `frontend`); fix any failures.
  - Verify the companies router is mounted and all endpoints return expected status codes.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use `fast-check` (already in the Node.js ecosystem); tag each test with `// Feature: company-actor, Property N: <text>`
- Each property test runs a minimum of 100 iterations
- The `company` role is never self-registered — it is assigned by the admin approval flow only
- Listing creation for companies reuses the existing Cloudinary upload infrastructure
- The `requireCompanyMember` middleware is always layered after `authenticate` + `requireRole('company')`
