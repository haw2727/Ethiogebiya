# Requirements Document

## Introduction

The Company Actor feature introduces a new `company` role to the EthioDelala marketplace platform. Unlike the existing `broker` role (individual agents posting personal listings), a Company represents a verified legal entity — such as a bank, construction firm, car dealership, software company, or employer — that needs to publish listings and content under a corporate brand. Companies require business registration verification, can manage multiple team members, post at scale across categories that don't fit the broker model (e.g., jobs, mortgage products, bulk real-estate inventory, fleet vehicles), and communicate via official company contact channels rather than personal phone numbers.

---

## Glossary

- **Company**: A verified legal entity registered on EthioDelala with the `company` role, identified by a business registration number.
- **Company_Profile**: The public-facing brand page of a Company, displaying its name, logo, description, contact channels, and published listings.
- **Company_Admin**: A User who owns and administers a Company account; has full control over the Company_Profile and its members.
- **Company_Member**: A User who has been invited to and accepted membership in a Company, able to create and manage listings on behalf of the Company.
- **Company_Listing**: A Listing whose `ownerType` is `company` and whose `companyOwner` references a Company document.
- **Business_Registration_Doc**: An official government-issued document proving the legal existence of a Company (e.g., trade license, commercial registration certificate).
- **Verification_System**: The admin-operated subsystem that reviews and approves or rejects Company registration applications.
- **Auth_System**: The existing JWT-based authentication and authorization subsystem.
- **Listing_System**: The existing subsystem for creating, managing, and displaying listings.
- **Notification_System**: The existing subsystem for delivering in-app and push notifications.
- **Search_System**: The existing subsystem for searching and filtering listings.
- **Dashboard**: The role-specific UI panel providing management tools to a logged-in actor.

---

## Requirements

### Requirement 1: Company Registration

**User Story:** As a business owner, I want to register my company on EthioDelala, so that I can publish listings and content under my company's brand.

#### Acceptance Criteria

1. WHEN a User submits a company registration request with `companyName`, `businessRegistrationNumber`, `businessRegistrationDoc` (file), `contactEmail`, `contactPhone`, and `industry`, THE Auth_System SHALL create a Company document with `verificationStatus` set to `pending` and return HTTP 201.
2. IF a company registration request is submitted with a `businessRegistrationNumber` that already exists in the system, THEN THE Auth_System SHALL return HTTP 409 with the message "A company with this registration number already exists."
3. IF a company registration request is missing any required field (`companyName`, `businessRegistrationNumber`, `businessRegistrationDoc`, `contactEmail`, `contactPhone`, `industry`), THEN THE Auth_System SHALL return HTTP 422 with a descriptive validation error for each missing field.
4. WHEN a company registration request is submitted, THE Auth_System SHALL associate the submitting User as the Company_Admin of the new Company.
5. THE Auth_System SHALL accept `businessRegistrationDoc` uploads in JPEG, PNG, or PDF format with a maximum file size of 10 MB.
6. WHEN a company registration request is submitted, THE Notification_System SHALL send an in-app notification to all admin users indicating a new company verification is pending.

---

### Requirement 2: Company Verification by Admin

**User Story:** As an admin, I want to review and approve or reject company registration applications, so that only legitimate businesses operate on the platform.

#### Acceptance Criteria

1. WHEN an admin approves a Company with `verificationStatus` of `pending`, THE Verification_System SHALL update the Company's `verificationStatus` to `verified` and update the Company_Admin's `role` to `company`.
2. WHEN an admin rejects a Company with `verificationStatus` of `pending`, THE Verification_System SHALL update the Company's `verificationStatus` to `rejected` and SHALL store the provided `rejectionReason`.
3. WHEN a Company's `verificationStatus` changes to `verified`, THE Notification_System SHALL send an in-app notification to the Company_Admin informing them that their company has been approved.
4. WHEN a Company's `verificationStatus` changes to `rejected`, THE Notification_System SHALL send an in-app notification to the Company_Admin including the `rejectionReason`.
5. THE Verification_System SHALL allow admins to list all Companies filtered by `verificationStatus` (`pending`, `verified`, `rejected`), with pagination of 20 items per page.
6. IF an admin attempts to approve or reject a Company whose `verificationStatus` is not `pending`, THEN THE Verification_System SHALL return HTTP 409 with the message "Company is not in a pending state."

---

### Requirement 3: Company Profile Management

**User Story:** As a Company_Admin, I want to manage my company's public profile, so that users can discover and trust my brand.

#### Acceptance Criteria

1. WHEN a Company_Admin updates the Company_Profile with valid fields (`companyName`, `description`, `logo`, `coverPhoto`, `website`, `contactEmail`, `contactPhone`, `address`, `socialLinks`), THE Company_Profile SHALL be updated and the response SHALL include the updated Company document.
2. IF a Company_Admin submits a profile update with an invalid `website` URL format, THEN THE Company_Profile SHALL return HTTP 422 with the message "Website must be a valid URL."
3. THE Company_Profile SHALL accept `logo` and `coverPhoto` uploads in JPEG or PNG format with a maximum file size of 5 MB each.
4. WHEN a Company_Admin uploads a new `logo` or `coverPhoto`, THE Company_Profile SHALL store the Cloudinary URL and discard the previous file reference.
5. WHILE a Company's `verificationStatus` is not `verified`, THE Company_Profile SHALL be visible only to the Company_Admin and admin users; it SHALL NOT appear in public search results.
6. THE Company_Profile SHALL display a verified badge WHEN the Company's `verificationStatus` is `verified`.

---

### Requirement 4: Company Team Management

**User Story:** As a Company_Admin, I want to invite and manage team members, so that multiple employees can create and manage listings on behalf of the company.

#### Acceptance Criteria

1. WHEN a Company_Admin sends an invitation to a registered User's phone number, THE Company_Profile SHALL create a pending membership record and THE Notification_System SHALL send an in-app notification to the invited User.
2. WHEN an invited User accepts a company membership invitation, THE Company_Profile SHALL set the membership status to `active` and grant the User `Company_Member` permissions.
3. WHEN an invited User declines a company membership invitation, THE Company_Profile SHALL set the membership status to `declined`.
4. THE Company_Profile SHALL enforce a maximum of 20 active Company_Members per Company.
5. IF a Company_Admin attempts to add a 21st active member, THEN THE Company_Profile SHALL return HTTP 422 with the message "Company has reached the maximum number of members (20)."
6. WHEN a Company_Admin removes a Company_Member, THE Company_Profile SHALL set the membership status to `removed` and THE Notification_System SHALL notify the removed member.
7. THE Company_Profile SHALL allow a Company_Admin to assign one of two roles to a Company_Member: `editor` (can create and edit listings) or `viewer` (read-only access to the company dashboard).

---

### Requirement 5: Company Listings

**User Story:** As a Company_Admin or Company_Member with editor role, I want to create and manage listings under the company brand, so that our inventory is published at scale.

#### Acceptance Criteria

1. WHEN a Company_Admin or a Company_Member with `editor` role submits a valid listing creation request, THE Listing_System SHALL create a Company_Listing with `ownerType` set to `company` and `companyOwner` referencing the Company.
2. THE Listing_System SHALL allow Company_Listings in all existing categories, including `jobs`, `real-estate`, `automotive`, `business-industrial`, and `services`.
3. WHEN a Company_Listing is displayed publicly, THE Listing_System SHALL show the Company name, logo, and verified badge instead of the individual poster's personal name and photo.
4. THE Listing_System SHALL allow a Company to have up to 500 active listings simultaneously.
5. IF a Company attempts to create a listing when it already has 500 active listings, THEN THE Listing_System SHALL return HTTP 422 with the message "Company has reached the maximum number of active listings (500)."
6. WHEN a Company_Member with `viewer` role attempts to create or edit a listing, THE Listing_System SHALL return HTTP 403 with the message "Insufficient permissions to manage listings."
7. WHILE a Company's `verificationStatus` is not `verified`, THE Listing_System SHALL reject listing creation requests with HTTP 403 and the message "Company must be verified before creating listings."
8. THE Listing_System SHALL allow bulk listing creation by accepting an array of up to 50 listing objects in a single request, processing each independently and returning a summary of successes and failures.

---

### Requirement 6: Company-Specific Categories and Fields

**User Story:** As a Company_Admin, I want to post jobs, financial products, and bulk inventory with company-specific fields, so that my listings contain all relevant corporate information.

#### Acceptance Criteria

1. WHEN a Company_Listing is created in the `jobs` category, THE Listing_System SHALL require `jobTitle`, `jobType` (full-time, part-time, contract, internship), `industry`, `experienceLevel`, and `applicationDeadline` fields.
2. WHEN a Company_Listing is created in the `real-estate` category by a Company in the `bank` or `financial-services` industry, THE Listing_System SHALL accept an optional `mortgageDetails` object containing `interestRate`, `loanTermYears`, and `downPaymentPercent`.
3. WHEN a Company_Listing is created in the `automotive` category with `quantity` greater than 1, THE Listing_System SHALL treat it as a fleet listing and SHALL require a `fleetDiscount` percentage field.
4. THE Listing_System SHALL allow Company_Listings to include an `applicationUrl` field for job listings, accepting a valid HTTPS URL up to 2048 characters.
5. IF a Company_Listing in the `jobs` category is submitted without `applicationDeadline`, THEN THE Listing_System SHALL return HTTP 422 with the message "Application deadline is required for job listings."

---

### Requirement 7: Company Dashboard

**User Story:** As a Company_Admin or Company_Member, I want a dedicated dashboard, so that I can manage all company activity in one place.

#### Acceptance Criteria

1. WHEN a Company_Admin accesses the company dashboard, THE Dashboard SHALL display total active listings count, total listing views (last 30 days), total inquiries received (last 30 days), and team member count.
2. WHEN a Company_Member with `editor` role accesses the company dashboard, THE Dashboard SHALL display the listings created by that member and the company's total active listing count.
3. WHEN a Company_Member with `viewer` role accesses the company dashboard, THE Dashboard SHALL display read-only analytics for all company listings.
4. THE Dashboard SHALL provide a listings management table with columns for title, category, status, views, and creation date, sortable by each column.
5. THE Dashboard SHALL provide a team management panel accessible only to the Company_Admin, listing all members with their role and membership status.
6. WHEN a Company_Admin navigates to `/dashboard`, THE Dashboard SHALL redirect to `/company-dashboard`.

---

### Requirement 8: Company Contact Channels

**User Story:** As a user browsing listings, I want to contact a company through official channels, so that I reach the right department rather than an individual.

#### Acceptance Criteria

1. WHEN a Company_Listing detail page is displayed, THE Listing_System SHALL show the Company's `contactPhone`, `contactEmail`, and `website` as contact options instead of the individual poster's personal phone number.
2. WHEN a user initiates a chat from a Company_Listing, THE Notification_System SHALL route the message to the Company_Admin's inbox and SHALL send an in-app notification to all Company_Members with `editor` role.
3. THE Listing_System SHALL display a "Contact Company" button on Company_Listing detail pages that opens a contact form with fields for the user's name, phone, and message.
4. WHEN a user submits the contact form on a Company_Listing, THE Notification_System SHALL deliver the inquiry to the Company_Admin as an in-app notification containing the user's name, phone, and message.
5. IF a user submits the contact form with a message exceeding 1000 characters, THEN THE Listing_System SHALL return HTTP 422 with the message "Message must not exceed 1000 characters."

---

### Requirement 9: Company Discovery and Search

**User Story:** As a user, I want to search for and browse verified companies, so that I can find trusted businesses offering products or services I need.

#### Acceptance Criteria

1. THE Search_System SHALL provide a `/companies` endpoint that returns a paginated list of verified companies, filterable by `industry` and `city`.
2. WHEN a user searches for listings, THE Search_System SHALL include Company_Listings in results and SHALL display the company name and verified badge alongside each result.
3. THE Search_System SHALL support filtering listings by `ownerType` (`company` or `individual`) so users can browse only company-posted listings.
4. WHEN a user visits a Company_Profile page, THE Listing_System SHALL display all active Company_Listings for that company, paginated at 20 per page.
5. THE Search_System SHALL index Company_Profile `companyName`, `description`, and `industry` fields for full-text search.

---

### Requirement 10: Company Subscription and Billing

**User Story:** As a Company_Admin, I want a company-tier subscription plan, so that I can access premium features appropriate for corporate use.

#### Acceptance Criteria

1. THE Auth_System SHALL support a `company` subscription plan with a monthly fee defined in the platform configuration, distinct from the broker `premium` plan.
2. WHEN a Company's subscription is active, THE Listing_System SHALL allow the Company to feature up to 10 listings simultaneously as featured listings.
3. WHEN a Company's subscription expires, THE Listing_System SHALL automatically remove the `isFeatured` flag from all Company_Listings that exceed the free tier's featured listing limit of 0.
4. THE Dashboard SHALL display the current subscription status, renewal date, and a button to manage the subscription.
5. WHEN a Company's subscription payment fails, THE Notification_System SHALL send an in-app notification to the Company_Admin with the message "Your company subscription payment failed. Please update your payment method."

---

### Requirement 11: Admin Company Management

**User Story:** As an admin, I want to manage company accounts, so that I can enforce platform policies and handle disputes.

#### Acceptance Criteria

1. WHEN an admin suspends a Company, THE Verification_System SHALL set the Company's `isActive` to `false` and THE Listing_System SHALL set all active Company_Listings to `inactive` status.
2. WHEN an admin reactivates a suspended Company, THE Verification_System SHALL set the Company's `isActive` to `true`; Company_Listings SHALL remain `inactive` until the Company_Admin manually reactivates them.
3. THE Verification_System SHALL allow admins to view a full audit log of all actions taken on a Company account, including registration, verification decisions, suspensions, and listing approvals.
4. WHEN an admin permanently deletes a Company, THE Verification_System SHALL soft-delete the Company document and SHALL set all associated Company_Listings to `removed` status.
5. THE Verification_System SHALL allow admins to transfer Company_Admin ownership to another Company_Member.
