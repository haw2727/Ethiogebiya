# Requirements Document

## Introduction

EthioDelala (Digital Delala) is a full-stack MERN marketplace and brokerage platform that digitizes the traditional Ethiopian "Delala" (broker/intermediary) system. The platform connects Buyers, Sellers, and professional Brokers across Ethiopia for real estate and automotive listings. It provides verified user accounts, real-time messaging, escrow-backed payments via Ethiopian payment gateways (Telebirr, M-Pesa, CBE Birr), premium broker subscriptions, and an administrative back-office — all accessible in Amharic and English.

Phase 1 scope: real estate and automotive listings, nationwide Ethiopia coverage, web application only.

---

## Glossary

- **System**: The EthioDelala platform as a whole (frontend + backend + database).
- **API**: The Node.js/Express REST API backend.
- **Auth_Service**: The component responsible for authentication and authorization.
- **OTP_Service**: The component that generates and delivers one-time passwords via SMS.
- **Listing_Service**: The component that manages listing creation, editing, and lifecycle.
- **Search_Engine**: The component that handles keyword search, filtering, and location-based discovery.
- **Messaging_Service**: The real-time Socket.io-based in-platform messaging component.
- **Payment_Service**: The component that integrates with Ethiopian payment gateways and manages escrow.
- **Notification_Service**: The component that delivers in-app and SMS notifications.
- **Admin_Panel**: The administrative dashboard used by Administrators.
- **Guest**: An unregistered visitor browsing the platform.
- **Buyer**: A registered user who searches for and purchases products or services.
- **Seller**: A registered user who creates and manages listings.
- **Broker**: A registered, verified professional intermediary with premium features.
- **Administrator**: A platform staff member with full system access.
- **Listing**: A real estate or automotive item posted for sale or brokerage.
- **Escrow**: A payment-holding mechanism where funds are held by the System until a transaction is confirmed complete.
- **OTP**: One-time password sent via SMS for phone verification.
- **JWT**: JSON Web Token used for stateless authentication.
- **Premium_Subscription**: A paid plan that unlocks advanced features for Brokers.
- **Featured_Listing**: A Listing promoted to appear at the top of search results.
- **National_ID**: A government-issued Ethiopian identification document.
- **Telebirr**: Ethiopian mobile money service operated by Ethio Telecom.
- **M-Pesa**: Mobile money service available in Ethiopia.
- **CBE_Birr**: Commercial Bank of Ethiopia mobile banking service.
- **USSD**: Unstructured Supplementary Service Data, a feature-phone access channel.
- **Dispute**: A formal complaint raised by a Buyer or Seller regarding a transaction.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a Guest, I want to register an account as a Buyer, Seller, or Broker, so that I can access platform features appropriate to my role.

#### Acceptance Criteria

1. WHEN a Guest submits a registration form with a unique Ethiopian phone number, full name, password, and selected role (Buyer, Seller, or Broker), THE Auth_Service SHALL create a new user account and send an OTP to the provided phone number.
2. IF a Guest submits a phone number that is already associated with an existing account, THEN THE Auth_Service SHALL reject the registration and return a descriptive error message.
3. IF a Guest submits a registration form with a missing required field, THEN THE Auth_Service SHALL reject the request and identify each missing field in the error response.
4. IF a Guest submits an age that corresponds to a person under 18 years old, THEN THE Auth_Service SHALL reject the registration and return an eligibility error.
5. THE Auth_Service SHALL store passwords using bcrypt hashing with a minimum cost factor of 12 before persisting to the database.
6. WHEN a Broker submits a registration form, THE Auth_Service SHALL require upload of a business license document in addition to standard registration fields.

---

### Requirement 2: Phone Verification via OTP

**User Story:** As a newly registered user, I want to verify my phone number via OTP, so that my account is activated and trusted by the platform.

#### Acceptance Criteria

1. WHEN a user submits a valid OTP within 24 hours of registration, THE OTP_Service SHALL mark the user's phone number as verified and activate the account.
2. IF a user submits an OTP that does not match the issued code, THEN THE OTP_Service SHALL reject the verification and return an invalid-code error.
3. IF a user submits an OTP after the 24-hour expiry window, THEN THE OTP_Service SHALL reject the verification and prompt the user to request a new OTP.
4. WHEN a user requests OTP resend, THE OTP_Service SHALL invalidate the previous OTP and issue a new one, delivering it via SMS within 60 seconds.
5. WHILE a user's phone number is unverified, THE System SHALL restrict the user from creating listings, sending messages, or initiating payments.

---

### Requirement 3: National ID Verification

**User Story:** As a registered user, I want to upload my National ID, so that my identity is verified and other users can trust my account.

#### Acceptance Criteria

1. WHEN a user uploads a National ID document image (JPEG or PNG, maximum 5 MB), THE Auth_Service SHALL store the document and set the account verification status to "pending".
2. WHEN an Administrator reviews and approves a National ID submission, THE Admin_Panel SHALL update the user's verification status to "verified".
3. IF an Administrator rejects a National ID submission, THEN THE Admin_Panel SHALL update the status to "rejected" and notify the user with a reason.
4. WHILE a user's verification status is "pending" or "rejected", THE System SHALL display an unverified badge on the user's public profile.
5. THE Auth_Service SHALL accept National ID uploads only in JPEG or PNG format and SHALL reject files exceeding 5 MB with a descriptive error.

---

### Requirement 4: Authentication and Session Management

**User Story:** As a registered user, I want to log in securely and maintain my session, so that I can use the platform without re-authenticating on every request.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (phone number and password), THE Auth_Service SHALL return a signed JWT access token (expiry: 15 minutes) and a signed JWT refresh token (expiry: 7 days).
2. IF a user submits incorrect credentials, THEN THE Auth_Service SHALL return an authentication error without revealing which field is incorrect.
3. WHEN a valid refresh token is presented to the token-refresh endpoint, THE Auth_Service SHALL issue a new access token and rotate the refresh token.
4. IF a refresh token has expired or been revoked, THEN THE Auth_Service SHALL return an unauthorized error and require the user to log in again.
5. WHEN a user logs out, THE Auth_Service SHALL revoke the active refresh token so it cannot be reused.
6. THE Auth_Service SHALL enforce role-based access control (RBAC) so that each API endpoint is accessible only to users with the required role (Guest, Buyer, Seller, Broker, Administrator).

---

### Requirement 5: Profile Management

**User Story:** As a registered user, I want to manage my profile information, so that my contact details and preferences are current.

#### Acceptance Criteria

1. WHEN a user submits updated profile fields (display name, profile photo, location, bio), THE API SHALL persist the changes and return the updated profile.
2. WHEN a user uploads a profile photo (JPEG or PNG, maximum 2 MB), THE API SHALL store the image via the configured cloud storage provider and update the profile photo URL.
3. IF a user submits a profile photo exceeding 2 MB or in an unsupported format, THEN THE API SHALL reject the upload and return a descriptive error.
4. WHEN a user requests a password change by providing the current password and a new password, THE Auth_Service SHALL verify the current password before persisting the new bcrypt-hashed password.
5. IF a user provides an incorrect current password during a password change request, THEN THE Auth_Service SHALL reject the request and return an authentication error.
6. THE API SHALL maintain an activity log recording login events, listing actions, and payment events for each user, retaining entries for a minimum of 90 days.

---

### Requirement 6: Password Recovery

**User Story:** As a user who has forgotten their password, I want to recover access via my verified phone number, so that I am not permanently locked out.

#### Acceptance Criteria

1. WHEN a user submits their registered phone number to the password-recovery endpoint, THE OTP_Service SHALL send a password-reset OTP via SMS within 60 seconds.
2. WHEN a user submits a valid password-reset OTP and a new password, THE Auth_Service SHALL update the password and invalidate the OTP.
3. IF a user submits a password-reset OTP that has expired (after 15 minutes) or is invalid, THEN THE Auth_Service SHALL reject the request and return a descriptive error.
4. IF a user submits a phone number that is not registered, THEN THE Auth_Service SHALL return a generic response that does not confirm or deny account existence.

---

### Requirement 7: Listing Creation

**User Story:** As a Seller or Broker, I want to create a listing with category-specific details and media, so that potential Buyers can discover and evaluate my offering.

#### Acceptance Criteria

1. WHEN a verified Seller or Broker submits a listing with a title, description, category (real estate or automotive), price, location, and at least one image, THE Listing_Service SHALL persist the listing with status "active" and return the created listing object.
2. WHEN a Seller or Broker selects the "real estate" category, THE Listing_Service SHALL require additional fields: property type, size (square meters), number of bedrooms, number of bathrooms, and furnishing status.
3. WHEN a Seller or Broker selects the "automotive" category, THE Listing_Service SHALL require additional fields: make, model, year, mileage, fuel type, and transmission type.
4. WHEN a Seller or Broker uploads listing images (JPEG or PNG, maximum 10 MB each, up to 10 images), THE Listing_Service SHALL store each image via the configured cloud storage provider and associate the URLs with the listing.
5. IF a Seller or Broker uploads a listing image exceeding 10 MB or in an unsupported format, THEN THE Listing_Service SHALL reject that image and return a descriptive error without discarding already-uploaded images.
6. WHEN a Seller or Broker uploads a listing video (MP4, maximum 100 MB), THE Listing_Service SHALL store the video and associate the URL with the listing.
7. IF a Seller or Broker attempts to create a listing with a title and price identical to an existing active listing owned by the same user, THEN THE Listing_Service SHALL warn the user of a potential duplicate before persisting.
8. WHILE a user's account is unverified, THE Listing_Service SHALL reject listing creation requests and return an authorization error.

---

### Requirement 8: Listing Management

**User Story:** As a Seller or Broker, I want to edit, deactivate, and renew my listings, so that the information stays accurate and my listings remain visible.

#### Acceptance Criteria

1. WHEN a Seller or Broker submits updated fields for a listing they own, THE Listing_Service SHALL persist the changes and return the updated listing.
2. WHEN a Seller or Broker requests deletion of a listing they own, THE Listing_Service SHALL permanently remove the listing and all associated images from storage.
3. WHEN a Seller or Broker deactivates a listing, THE Listing_Service SHALL set the listing status to "inactive" so it no longer appears in search results.
4. WHEN a Seller or Broker reactivates a previously inactive listing, THE Listing_Service SHALL set the listing status to "active".
5. IF a Seller or Broker attempts to edit or delete a listing they do not own, THEN THE Listing_Service SHALL reject the request and return an authorization error.
6. WHEN a listing has been active for 30 days without renewal, THE Listing_Service SHALL automatically set the listing status to "expired" and notify the owner.
7. WHEN a Seller or Broker renews an expired listing, THE Listing_Service SHALL reset the listing's expiry timer and set the status back to "active".

---

### Requirement 9: Search and Discovery

**User Story:** As a Buyer or Guest, I want to search and filter listings by keyword, category, price, and location, so that I can find relevant offerings efficiently.

#### Acceptance Criteria

1. WHEN a user submits a search query with a keyword, THE Search_Engine SHALL return all active listings whose title or description contains the keyword, within 2 seconds for result sets up to 10,000 listings.
2. WHEN a user applies filters (category, minimum price, maximum price, location, listing status), THE Search_Engine SHALL return only active listings matching all applied filters.
3. WHEN a user provides a geographic coordinate and a radius in kilometers, THE Search_Engine SHALL return active listings located within that radius, sorted by ascending distance.
4. WHEN a user saves a search query, THE Search_Engine SHALL persist the query parameters to the user's saved searches and re-run the query on demand.
5. WHEN the Search_Engine returns results, THE Search_Engine SHALL include related listings from the same category as a secondary result set.
6. THE Search_Engine SHALL support filtering by Ethiopian region (e.g., Addis Ababa, Oromia, Amhara, Tigray, SNNPR, Somali, Afar, Benishangul-Gumuz, Gambela, Harari, Dire Dawa, Sidama).
7. WHEN a user views a listing detail page, THE Listing_Service SHALL increment the listing's view count by 1.

---

### Requirement 10: Real-Time Messaging

**User Story:** As a Buyer or Broker, I want to send and receive messages within the platform, so that I can communicate about listings without exposing my personal contact details.

#### Acceptance Criteria

1. WHEN a Buyer initiates a conversation about a specific listing, THE Messaging_Service SHALL create a conversation thread linked to that listing and deliver the first message to the Seller or Broker in real time via Socket.io.
2. WHEN a user sends a message in an existing conversation, THE Messaging_Service SHALL deliver the message to the recipient in real time and persist the message to the database.
3. WHILE a recipient is offline, THE Messaging_Service SHALL queue undelivered messages and deliver them upon the recipient's next connection.
4. WHEN a user sends a message attachment (image or document, maximum 10 MB), THE Messaging_Service SHALL store the file via the configured cloud storage provider and include the URL in the message payload.
5. THE Messaging_Service SHALL not expose a user's phone number or email address within message content until the user explicitly chooses to share it.
6. WHEN a user blocks another user, THE Messaging_Service SHALL prevent the blocked user from sending further messages to the blocking user.
7. IF a user attempts to send a message to a user who has blocked them, THEN THE Messaging_Service SHALL silently discard the message and return a success response to the sender.
8. THE Messaging_Service SHALL retain full message history for a minimum of 12 months.

---

### Requirement 11: Notifications

**User Story:** As a registered user, I want to receive timely notifications about activity relevant to me, so that I can respond promptly.

#### Acceptance Criteria

1. WHEN a new message is received, THE Notification_Service SHALL deliver an in-app notification to the recipient within 5 seconds.
2. WHEN a listing owned by a user receives a new offer, THE Notification_Service SHALL deliver an in-app notification to the listing owner within 5 seconds.
3. WHEN a payment event occurs (initiated, completed, failed, or disputed), THE Notification_Service SHALL deliver an in-app notification and an SMS notification to the affected user within 60 seconds.
4. WHEN a listing is about to expire (3 days before expiry), THE Notification_Service SHALL deliver an in-app notification to the listing owner.
5. WHEN a user's account verification status changes, THE Notification_Service SHALL deliver an in-app notification and an SMS notification to the user within 60 seconds.

---

### Requirement 12: Payment Processing

**User Story:** As a Buyer, I want to pay for a listing using Ethiopian mobile money services, so that I can complete transactions securely without cash.

#### Acceptance Criteria

1. WHEN a Buyer initiates a payment for a listing, THE Payment_Service SHALL present payment options for Telebirr, M-Pesa, and CBE Birr.
2. WHEN a Buyer selects a payment method and confirms the amount, THE Payment_Service SHALL initiate a payment request to the corresponding gateway API and return a pending transaction record.
3. WHEN the payment gateway confirms a successful payment, THE Payment_Service SHALL update the transaction status to "completed", deduct the platform commission, and notify both Buyer and Seller.
4. IF the payment gateway returns a failure response, THEN THE Payment_Service SHALL update the transaction status to "failed" and notify the Buyer with the gateway's error reason.
5. THE Payment_Service SHALL automatically calculate and deduct the platform commission from each completed transaction before crediting the Seller.
6. WHEN a completed payment is requested, THE Payment_Service SHALL generate a receipt containing transaction ID, amount, commission, net amount, timestamp, and parties involved.
7. THE Payment_Service SHALL maintain a full transaction history for each user, retaining records for a minimum of 5 years.
8. WHERE manual payment verification is enabled by an Administrator, THE Payment_Service SHALL allow an Administrator to manually mark a transaction as "completed" or "failed".

---

### Requirement 13: Escrow Service

**User Story:** As a Buyer or Seller, I want to use an escrow service for high-value transactions, so that funds are protected until both parties confirm the transaction is complete.

#### Acceptance Criteria

1. WHEN a Buyer initiates an escrow payment, THE Payment_Service SHALL hold the full payment amount in escrow and notify the Seller that funds are secured.
2. WHEN both the Buyer and the Seller confirm transaction completion, THE Payment_Service SHALL release the escrowed funds to the Seller minus the platform commission.
3. IF only the Buyer confirms completion within 7 days of the Seller's delivery confirmation, THEN THE Payment_Service SHALL automatically release the escrowed funds to the Seller.
4. WHEN a Buyer raises a dispute on an escrowed transaction, THE Payment_Service SHALL freeze the escrowed funds and notify an Administrator for resolution.
5. WHEN an Administrator resolves a dispute, THE Admin_Panel SHALL direct the Payment_Service to release funds to the appropriate party as determined by the resolution.

---

### Requirement 14: Dispute Resolution

**User Story:** As a Buyer or Seller, I want to raise a dispute about a transaction, so that I have recourse if the other party does not fulfill their obligations.

#### Acceptance Criteria

1. WHEN a Buyer or Seller raises a dispute within 14 days of transaction completion, THE System SHALL create a dispute record linked to the transaction and notify an Administrator.
2. IF a user attempts to raise a dispute more than 14 days after transaction completion, THEN THE System SHALL reject the request and return an eligibility error.
3. WHEN an Administrator resolves a dispute, THE Admin_Panel SHALL record the resolution outcome, notify both parties, and trigger the appropriate payment action.
4. THE System SHALL allow both parties to submit evidence (text and file attachments up to 10 MB each) to support their dispute claim.

---

### Requirement 15: Premium Subscriptions for Brokers

**User Story:** As a Broker, I want to subscribe to a premium plan, so that I can access advanced analytics, featured listings, and increased listing quotas.

#### Acceptance Criteria

1. WHEN a Broker selects a premium subscription plan and completes payment, THE Payment_Service SHALL activate the subscription and grant the Broker access to premium features immediately.
2. WHILE a Broker holds an active Premium_Subscription, THE System SHALL allow the Broker to feature up to 5 listings simultaneously and access listing analytics.
3. WHEN a Premium_Subscription is within 24 hours of its renewal date and the Broker has not canceled, THE Payment_Service SHALL automatically renew the subscription and charge the Broker's registered payment method.
4. WHEN a Broker cancels a Premium_Subscription at least 24 hours before the renewal date, THE Payment_Service SHALL mark the subscription for non-renewal and retain premium access until the end of the current billing period.
5. IF a Broker cancels a Premium_Subscription less than 24 hours before the renewal date, THEN THE Payment_Service SHALL process the renewal charge and cancel the subsequent renewal.
6. WHEN a Premium_Subscription renewal payment fails, THE Payment_Service SHALL notify the Broker and downgrade the account to standard Broker access within 24 hours.

---

### Requirement 16: Featured Listings

**User Story:** As a Broker with a Premium_Subscription, I want to feature my listings, so that they appear prominently in search results and attract more Buyers.

#### Acceptance Criteria

1. WHEN a Broker with an active Premium_Subscription marks a listing as featured, THE Listing_Service SHALL set the listing's featured flag to true and include it in the featured listings result set.
2. WHEN the Search_Engine returns search results, THE Search_Engine SHALL display Featured_Listings before non-featured listings within the same relevance tier.
3. WHILE a Broker's Premium_Subscription is inactive, THE Listing_Service SHALL not allow the Broker to mark new listings as featured and SHALL automatically unfeature existing featured listings.

---

### Requirement 17: Listing Analytics for Premium Users

**User Story:** As a Broker with a Premium_Subscription, I want to view analytics for my listings, so that I can understand performance and optimize my strategy.

#### Acceptance Criteria

1. WHILE a Broker holds an active Premium_Subscription, THE System SHALL provide per-listing analytics including total views, unique views, message inquiries count, and offer count, updated within 1 hour of each event.
2. WHILE a Broker holds an active Premium_Subscription, THE System SHALL provide aggregate analytics across all the Broker's listings for the current billing period.
3. IF a Broker's Premium_Subscription expires, THEN THE System SHALL restrict access to analytics data and display a subscription prompt.

---

### Requirement 18: Administration — User Management

**User Story:** As an Administrator, I want to manage user accounts, so that I can enforce platform policies and maintain a trustworthy community.

#### Acceptance Criteria

1. WHEN an Administrator searches for a user by phone number, name, or ID, THE Admin_Panel SHALL return matching user records within 2 seconds.
2. WHEN an Administrator suspends a user account, THE Admin_Panel SHALL set the account status to "suspended", revoke all active sessions, and prevent the user from logging in.
3. WHEN an Administrator reinstates a suspended user account, THE Admin_Panel SHALL restore the account status to "active" and allow the user to log in.
4. WHEN an Administrator permanently deletes a user account, THE Admin_Panel SHALL anonymize all personally identifiable information associated with the account while retaining transaction records for audit purposes.
5. THE Admin_Panel SHALL display a paginated list of all pending National ID and business license verification submissions, sortable by submission date.

---

### Requirement 19: Administration — Content Moderation

**User Story:** As an Administrator, I want to review and moderate listings and messages, so that the platform remains free of fraudulent or inappropriate content.

#### Acceptance Criteria

1. WHEN an Administrator flags a listing as violating platform policies, THE Admin_Panel SHALL set the listing status to "removed" and notify the listing owner with the reason.
2. WHEN a user reports a listing or message, THE System SHALL create a moderation report and notify an Administrator.
3. WHEN an Administrator reviews a moderation report and takes action, THE Admin_Panel SHALL record the action taken and close the report.
4. THE Admin_Panel SHALL display a queue of open moderation reports, sortable by report date and category.

---

### Requirement 20: Administration — Reports and Analytics

**User Story:** As an Administrator, I want to view platform-wide reports, so that I can monitor health, revenue, and usage trends.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a dashboard displaying total active users, total active listings, total transactions (count and value), and total platform commission collected, updated within 1 hour.
2. WHEN an Administrator requests a report for a specified date range, THE Admin_Panel SHALL generate and display the report within 10 seconds for ranges up to 12 months.
3. THE Admin_Panel SHALL allow an Administrator to export reports in CSV format.

---

### Requirement 21: Administration — Category Management

**User Story:** As an Administrator, I want to manage listing categories and their required fields, so that the platform can expand to new verticals without code changes.

#### Acceptance Criteria

1. WHEN an Administrator creates a new category with a name and set of required fields, THE Admin_Panel SHALL persist the category and make it available for listing creation immediately.
2. WHEN an Administrator updates a category's required fields, THE Admin_Panel SHALL apply the changes to new listings only and SHALL not retroactively alter existing listings.
3. WHEN an Administrator deactivates a category, THE Admin_Panel SHALL prevent new listings from being created in that category while existing listings remain visible.

---

### Requirement 22: Data Backup and Recovery

**User Story:** As an Administrator, I want the platform to perform automated daily backups, so that data can be recovered within 2 hours in the event of a failure.

#### Acceptance Criteria

1. THE System SHALL perform a full database backup daily at a configurable time, retaining backups for a minimum of 30 days.
2. WHEN an Administrator initiates a restore from a backup, THE System SHALL complete the restore within 2 hours and notify the Administrator upon completion.
3. IF a backup job fails, THEN THE System SHALL notify the Administrator via email and in-app notification within 15 minutes of the failure.

---

### Requirement 23: Multilingual Support

**User Story:** As a user, I want to use the platform in Amharic or English, so that I can interact in my preferred language.

#### Acceptance Criteria

1. THE System SHALL render all UI labels, navigation elements, error messages, and notifications in both Amharic and English.
2. WHEN a user selects a preferred language, THE System SHALL persist the preference to the user's profile and apply it on all subsequent sessions.
3. WHEN a Guest selects a language before registering, THE System SHALL apply the selected language for the current session.

---

### Requirement 24: Security

**User Story:** As a platform operator, I want the system to enforce security best practices, so that user data and transactions are protected from common attacks.

#### Acceptance Criteria

1. THE API SHALL enforce HTTPS (TLS 1.2 or higher) for all client-server communication.
2. THE API SHALL sanitize all user-supplied input to prevent XSS and NoSQL injection attacks before processing or persisting data.
3. THE API SHALL implement CSRF protection for all state-changing endpoints.
4. THE Auth_Service SHALL lock a user account for 15 minutes after 5 consecutive failed login attempts from the same IP address.
5. THE API SHALL set appropriate HTTP security headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security) on all responses.

---

### Requirement 25: Performance and Scalability

**User Story:** As a platform operator, I want the system to handle high traffic without degradation, so that users have a consistent experience as the platform grows.

#### Acceptance Criteria

1. THE System SHALL serve page loads within 3 seconds at the 95th percentile under a load of 10,000 concurrent users.
2. THE Search_Engine SHALL return search results within 2 seconds at the 95th percentile under a load of 10,000 concurrent users.
3. THE System SHALL support horizontal scaling of the API layer without requiring changes to application code.
4. THE System SHALL achieve 99.5% uptime measured on a rolling 30-day window.

---

### Requirement 26: USSD Access

**User Story:** As a user with a feature phone, I want to access core platform features via USSD, so that I can participate in the marketplace without a smartphone.

#### Acceptance Criteria

1. WHEN a user dials the platform's USSD code, THE System SHALL present a menu allowing the user to search listings by category and region, view listing summaries, and initiate contact with a Seller or Broker.
2. WHEN a USSD session is initiated, THE System SHALL respond to each menu selection within 3 seconds.
3. IF a USSD session is inactive for more than 3 minutes, THEN THE System SHALL terminate the session and release the USSD channel.
