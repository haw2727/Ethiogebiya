# Requirements Document

## Introduction

The Premium Subscription system enables users of the EthioDelala Ethiopian marketplace to pay for a subscription that grants them the right to post and manage listings. Pricing is tiered by user role (`user`, `broker`, `company`), by listing category (e.g., real-estate costs more than electronics), and by duration (monthly or yearly, with a yearly discount). Payment is made offline through one of three supported Ethiopian payment channels — CBE (Commercial Bank of Ethiopia), Telebirr, or M-Pesa — after which the subscriber uploads a proof-of-payment receipt. An admin then reviews the receipt and manually activates or deactivates the subscription. No user, broker, or company account can self-activate or self-deactivate a subscription; only an admin may change subscription status.

## Glossary

- **Subscriber**: A registered user with role `user`, `broker`, or `company` who has submitted a subscription request.
- **Subscription_Request**: A pending record created when a Subscriber submits payment proof, awaiting admin review.
- **Subscription**: An admin-activated record that grants a Subscriber the right to post listings for a defined period.
- **Subscription_Plan**: The combination of role tier, category price level, and duration that determines the subscription fee.
- **Price_Tier**: The role-based pricing level — `basic` (user), `standard` (broker), or `premium` (company).
- **Category_Price_Level**: A per-category multiplier that adjusts the base subscription fee (e.g., `high` for real-estate, `low` for electronics).
- **Duration**: The subscription period — `monthly` (30 days) or `yearly` (365 days).
- **Yearly_Discount**: A percentage reduction applied to the yearly price compared to 12 × the monthly price.
- **Payment_Method**: One of `cbe`, `telebirr`, or `mpesa`.
- **Receipt**: An image or PDF file uploaded by the Subscriber as proof of offline payment.
- **Admin**: A platform administrator with role `admin` who reviews Subscription_Requests and activates or deactivates Subscriptions.
- **Subscription_Status**: The lifecycle state of a Subscription — `pending`, `active`, or `inactive`.
- **Listing_Gate**: The enforcement check that prevents a Subscriber from creating a listing unless they hold an active Subscription covering the target category.
- **Notification**: An in-app message delivered to a recipient via the existing notification service.
- **Price_Config**: An admin-managed configuration record that stores the base price for each combination of Price_Tier, Category_Price_Level, and Duration.

---

## Requirements

### Requirement 1: Subscription Plan Pricing Configuration

**User Story:** As an admin, I want to configure subscription prices per role tier, category price level, and duration, so that the platform can charge different rates for different use cases.

#### Acceptance Criteria

1. THE Price_Config SHALL define a base monthly price for each combination of Price_Tier (`basic`, `standard`, `premium`) and Category_Price_Level (`low`, `medium`, `high`).
2. THE Price_Config SHALL define a yearly price for each combination of Price_Tier and Category_Price_Level that is less than 12 × the corresponding monthly price (Yearly_Discount applied).
3. WHEN an admin updates a Price_Config entry, THE System SHALL persist the new price and apply it to all future Subscription_Requests.
4. THE System SHALL assign a Category_Price_Level to each active Category, with a default of `medium` for categories that have no explicit assignment.
5. WHEN a Subscriber selects a category for their Subscription_Request, THE System SHALL compute the applicable fee using the Subscriber's Price_Tier, the category's Category_Price_Level, and the chosen Duration.

---

### Requirement 2: Subscription Request Submission

**User Story:** As a user, broker, or company account holder, I want to submit a subscription request with proof of payment, so that an admin can review and activate my subscription.

#### Acceptance Criteria

1. WHEN a Subscriber initiates a subscription request, THE System SHALL require the Subscriber to select a target Category, a Duration (`monthly` or `yearly`), and a Payment_Method (`cbe`, `telebirr`, or `mpesa`).
2. WHEN a Subscriber submits a subscription request, THE System SHALL require the Subscriber to upload a Receipt file.
3. THE System SHALL accept Receipt files in JPEG, PNG, or PDF format with a maximum size of 10 MB.
4. IF a Subscriber submits a Receipt file that exceeds 10 MB or is not JPEG, PNG, or PDF, THEN THE System SHALL reject the upload and return a descriptive error message.
5. WHEN a valid subscription request is submitted, THE System SHALL create a Subscription_Request record with status `pending` and store the Receipt URL, selected Category, Duration, Payment_Method, computed fee, and submission timestamp.
6. WHEN a Subscriber already has a Subscription_Request with status `pending` for the same Category, THEN THE System SHALL reject the duplicate request and return an error message indicating a pending request already exists.
7. WHEN a Subscriber already has an active Subscription for the same Category, THEN THE System SHALL reject the new request and return an error message indicating an active subscription already exists for that category.

---

### Requirement 3: Admin Notification of Pending Requests

**User Story:** As an admin, I want to be notified when a new subscription request is submitted, so that I can review it promptly.

#### Acceptance Criteria

1. WHEN a Subscription_Request is created, THE Notification_Service SHALL deliver an in-app Notification to all users with role `admin` indicating a new subscription request is pending review.
2. THE Notification SHALL include the Subscriber's full name, role, selected Category name, Duration, Payment_Method, and computed fee.
3. WHEN the Notification_Service fails to deliver a Notification to an admin, THE System SHALL log the failure and continue processing without returning an error to the Subscriber.

---

### Requirement 4: Admin Review Queue

**User Story:** As an admin, I want to see all pending subscription requests with their receipts, so that I can review and act on them.

#### Acceptance Criteria

1. WHEN an admin requests the subscription review queue, THE System SHALL return a paginated list of all Subscription_Requests with status `pending`, sorted by submission timestamp ascending (oldest first).
2. THE System SHALL include in each queue item: Subscriber ID, full name, role, selected Category name, Duration, Payment_Method, computed fee, submission timestamp, and Receipt URL.
3. WHEN an admin requests a specific Subscription_Request by ID, THE System SHALL return the full details including the Receipt URL so the admin can view the uploaded proof of payment.
4. IF a Subscription_Request ID does not exist, THEN THE System SHALL return a 404 error.

---

### Requirement 5: Admin Subscription Activation

**User Story:** As an admin, I want to activate a pending subscription request, so that the subscriber gains the right to post listings.

#### Acceptance Criteria

1. WHEN an admin activates a Subscription_Request, THE System SHALL set the Subscription_Request status to `active`, record the activating admin's ID, and set the subscription start date to the current timestamp.
2. WHEN an admin activates a Subscription_Request with Duration `monthly`, THE System SHALL set the subscription expiry date to 30 days after the start date.
3. WHEN an admin activates a Subscription_Request with Duration `yearly`, THE System SHALL set the subscription expiry date to 365 days after the start date.
4. WHEN a Subscription_Request is activated, THE Notification_Service SHALL deliver an in-app Notification to the Subscriber confirming activation, including the Category name, start date, and expiry date.
5. IF a Subscription_Request is not in `pending` status, THEN THE System SHALL reject the activation request and return an error message indicating the request is not in a reviewable state.
6. THE System SHALL enforce that only users with role `admin` may activate a Subscription_Request; any other role SHALL receive a 403 Forbidden response.

---

### Requirement 6: Admin Subscription Deactivation

**User Story:** As an admin, I want to deactivate an active subscription, so that I can revoke posting rights when necessary.

#### Acceptance Criteria

1. WHEN an admin deactivates an active Subscription, THE System SHALL set the Subscription status to `inactive` and record the deactivating admin's ID and the deactivation timestamp.
2. WHEN a Subscription is deactivated, THE Notification_Service SHALL deliver an in-app Notification to the Subscriber informing them that their subscription has been deactivated and they can no longer post listings.
3. IF a Subscription is not in `active` status, THEN THE System SHALL reject the deactivation request and return an error message indicating the subscription is not currently active.
4. THE System SHALL enforce that only users with role `admin` may deactivate a Subscription; any other role SHALL receive a 403 Forbidden response.
5. THE System SHALL enforce that a Subscriber cannot deactivate their own Subscription; a Subscriber who attempts self-deactivation SHALL receive a 403 Forbidden response.

---

### Requirement 7: Self-Activation Prevention

**User Story:** As a platform operator, I want to ensure no user can self-activate or self-deactivate their subscription, so that all subscription state changes are controlled by admins.

#### Acceptance Criteria

1. THE System SHALL reject any request from a non-admin user to set their own Subscription status to `active`; the requester SHALL receive a 403 Forbidden response.
2. THE System SHALL reject any request from a non-admin user to set another user's Subscription status to `active`; the requester SHALL receive a 403 Forbidden response.
3. THE System SHALL reject any request from a non-admin user to set any Subscription status to `inactive`; the requester SHALL receive a 403 Forbidden response.
4. WHEN a Subscription_Request is submitted by a Subscriber, THE System SHALL create the record with status `pending` and SHALL NOT automatically transition it to `active`.

---

### Requirement 8: Listing Gate Enforcement

**User Story:** As a platform operator, I want to prevent users without an active subscription from creating listings, so that only paying subscribers can post.

#### Acceptance Criteria

1. WHEN a Subscriber attempts to create a listing in a Category, THE Listing_Gate SHALL verify that the Subscriber holds an active Subscription covering that Category.
2. IF the Subscriber does not hold an active Subscription for the target Category, THEN THE Listing_Gate SHALL reject the listing creation request and return an error message indicating a subscription is required.
3. IF the Subscriber's Subscription for the target Category has expired, THEN THE Listing_Gate SHALL reject the listing creation request and return an error message indicating the subscription has expired.
4. WHILE a Subscriber holds an active, non-expired Subscription for a Category, THE Listing_Gate SHALL permit the Subscriber to create listings in that Category.
5. THE System SHALL enforce that the `user` role Price_Tier grants access only to categories with Category_Price_Level `low` or `medium`.
6. THE System SHALL enforce that the `broker` role Price_Tier grants access to categories with Category_Price_Level `low`, `medium`, or `high`.
7. THE System SHALL enforce that the `company` role Price_Tier grants access to all categories regardless of Category_Price_Level.

---

### Requirement 9: Subscription Expiry

**User Story:** As a platform operator, I want subscriptions to expire automatically at the end of their duration, so that subscribers must renew to continue posting.

#### Acceptance Criteria

1. WHEN the current timestamp exceeds a Subscription's expiry date, THE System SHALL treat the Subscription as expired and the Listing_Gate SHALL deny new listing creation for that Category.
2. WHEN a Subscription expires, THE Notification_Service SHALL deliver an in-app Notification to the Subscriber informing them that their subscription has expired and they must renew to continue posting.
3. THE System SHALL send the expiry Notification within 24 hours of the expiry timestamp.
4. WHEN a Subscription is 7 days from expiry, THE Notification_Service SHALL deliver an in-app Notification to the Subscriber as a renewal reminder.

---

### Requirement 10: Subscriber Subscription Status View

**User Story:** As a subscriber, I want to view my current subscription status and history, so that I know whether I can post listings and when my subscription expires.

#### Acceptance Criteria

1. WHEN a Subscriber requests their subscription status, THE System SHALL return all Subscription records associated with that Subscriber, including Category name, Duration, status, start date, expiry date, Payment_Method, and computed fee.
2. WHEN a Subscriber requests their subscription history, THE System SHALL return all past Subscription_Requests and Subscriptions for that Subscriber, sorted by submission timestamp descending.
3. THE System SHALL enforce that a Subscriber can only view their own subscription records; accessing another user's records SHALL return a 403 Forbidden response.

---

### Requirement 11: Receipt Storage and Access

**User Story:** As an admin, I want uploaded receipts to be stored securely and accessible for review, so that I can verify payment proof.

#### Acceptance Criteria

1. WHEN a Receipt is uploaded, THE System SHALL store the file using the existing Cloudinary integration and persist the resulting secure URL in the Subscription_Request record.
2. THE System SHALL enforce that only the submitting Subscriber and users with role `admin` may access the Receipt URL for a given Subscription_Request.
3. IF a Receipt upload to Cloudinary fails, THEN THE System SHALL return an error to the Subscriber and SHALL NOT create the Subscription_Request record.
