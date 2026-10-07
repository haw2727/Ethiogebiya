# Requirements Document

## Introduction

This feature adds a subscription plan selection flow that intercepts non-admin users before they reach the listing creation form. When any authenticated non-admin user (role: `user`, `broker`, or `company`) attempts to create a listing — either by clicking a category card on the homepage "Choose Your Category and Post Listings" section or by clicking a "Post Listing" button in the Navbar — they are first shown a plan selection screen with three options: Free Trial, Premium Monthly, and Premium Yearly. Selecting Free Trial proceeds directly to the listing creation form. Selecting a paid plan navigates the user to the existing Premium Subscription payment page, pre-filled with the selected category and billing duration. Admin users bypass this flow entirely and go directly to listing creation.

The project is a full-stack app with a React/Vite frontend and a Node.js/Express/MongoDB backend. The frontend already contains a `PlanSelectionModal` component and the `PremiumSubscription` page. The backend already has premium subscription controllers and routes. This feature primarily wires up the existing pieces and adds the Navbar entry point.

## Glossary

- **Plan_Selection_Modal**: The React modal component (`PlanSelectionModal.jsx`) that presents the three plan options (Free Trial, Premium Monthly, Premium Yearly) to the user before listing creation.
- **Category_Slug**: A kebab-case string identifier for a listing category (e.g., `real-estate`, `automotive`). Sourced from the homepage category grid.
- **Non_Admin_User**: Any authenticated user whose role is `user`, `broker`, or `company`.
- **Admin_User**: An authenticated user whose role is `admin`.
- **Premium_Subscription_Page**: The existing `/premium-subscription` React page that handles subscription payment (Chapa and manual receipt upload).
- **Create_Listing_Page**: The existing `/listings/create` React page where users fill in listing details.
- **Free_Trial**: A plan option that allows the user to proceed to listing creation without payment.
- **PRICE_TABLE**: The pricing matrix defined in `PremiumSubscription.js` and mirrored in `PlanSelectionModal.jsx`, keyed by role tier (`basic`, `standard`, `premium`) and category price level (`low`, `medium`, `high`).
- **ROLE_TIER**: The mapping from user role to price tier: `user → basic`, `broker → standard`, `company → premium`.
- **CATEGORY_LEVEL**: The mapping from Category_Slug to price level: `real-estate/automotive/business-industrial → high`, `professional-jobs/domestic-jobs/services → medium`, all others → `low`.

---

## Requirements

### Requirement 1: Plan Selection Interception for Non-Admin Users

**User Story:** As a non-admin user, I want to see a plan selection screen when I try to create a listing, so that I can choose the right subscription option before posting.

#### Acceptance Criteria

1. WHEN a Non_Admin_User clicks a category card in the "Choose Your Category and Post Listings" section on the homepage, THE Plan_Selection_Modal SHALL be displayed instead of navigating directly to the Create_Listing_Page.
2. WHEN a Non_Admin_User clicks the "Post Listing" button in the Navbar, THE Plan_Selection_Modal SHALL be displayed.
3. WHEN an Admin_User clicks a category card in the "Choose Your Category and Post Listings" section, THE System SHALL navigate directly to the Create_Listing_Page without displaying the Plan_Selection_Modal.
4. WHEN an Admin_User clicks the "Post Listing" button in the Navbar, THE System SHALL navigate directly to the Create_Listing_Page without displaying the Plan_Selection_Modal.
5. WHEN an unauthenticated user clicks a category card in the "Choose Your Category and Post Listings" section, THE System SHALL navigate to the search results page for that category without displaying the Plan_Selection_Modal.
6. FOR ALL roles in `{user, broker, company}`, WHEN the user triggers listing creation, THE Plan_Selection_Modal SHALL be displayed before any navigation to the Create_Listing_Page occurs.

---

### Requirement 2: Plan Selection Modal Content and Pricing

**User Story:** As a non-admin user, I want the plan selection modal to show accurate pricing for my role and the category I selected, so that I can make an informed decision.

#### Acceptance Criteria

1. THE Plan_Selection_Modal SHALL display three plan options: Free Trial, Premium Monthly, and Premium Yearly.
2. WHEN the Plan_Selection_Modal is displayed, THE Plan_Selection_Modal SHALL show the name of the selected category to the user.
3. WHEN the Plan_Selection_Modal is displayed for a user with role `user`, THE Plan_Selection_Modal SHALL compute prices using the `basic` tier from PRICE_TABLE.
4. WHEN the Plan_Selection_Modal is displayed for a user with role `broker`, THE Plan_Selection_Modal SHALL compute prices using the `standard` tier from PRICE_TABLE.
5. WHEN the Plan_Selection_Modal is displayed for a user with role `company`, THE Plan_Selection_Modal SHALL compute prices using the `premium` tier from PRICE_TABLE.
6. FOR ALL valid combinations of (role, Category_Slug), THE Plan_Selection_Modal SHALL display a monthly price equal to `PRICE_TABLE[ROLE_TIER[role]][CATEGORY_LEVEL[categorySlug]].monthly` and a yearly price equal to `PRICE_TABLE[ROLE_TIER[role]][CATEGORY_LEVEL[categorySlug]].yearly`.
7. THE Plan_Selection_Modal SHALL label the Premium Yearly option with a "Best Value" indicator.
8. THE Plan_Selection_Modal SHALL display the Free Trial option as free (no cost).

---

### Requirement 3: Free Trial Plan Selection

**User Story:** As a non-admin user, I want to select the Free Trial plan and proceed directly to the listing creation form, so that I can post a listing without paying.

#### Acceptance Criteria

1. WHEN a Non_Admin_User selects the Free Trial option in the Plan_Selection_Modal, THE System SHALL close the Plan_Selection_Modal and navigate to the Create_Listing_Page.
2. WHEN a Non_Admin_User selects the Free Trial option and a Category_Slug was selected, THE System SHALL pass the Category_Slug as a `category` query parameter to the Create_Listing_Page URL.
3. WHEN a Non_Admin_User selects the Free Trial option, THE System SHALL NOT navigate to the Premium_Subscription_Page.

---

### Requirement 4: Premium Monthly Plan Selection

**User Story:** As a non-admin user, I want to select the Premium Monthly plan and be taken to the payment page with my category pre-filled, so that I can subscribe and then post listings.

#### Acceptance Criteria

1. WHEN a Non_Admin_User selects the Premium Monthly option in the Plan_Selection_Modal, THE System SHALL close the Plan_Selection_Modal and navigate to the Premium_Subscription_Page.
2. WHEN a Non_Admin_User selects the Premium Monthly option and a Category_Slug was selected, THE System SHALL pass the Category_Slug as a `category` query parameter to the Premium_Subscription_Page URL.
3. WHEN a Non_Admin_User selects the Premium Monthly option, THE System SHALL pass `duration=monthly` as a query parameter to the Premium_Subscription_Page URL.
4. WHEN the Premium_Subscription_Page receives a `category` query parameter, THE Premium_Subscription_Page SHALL pre-select that category in the subscription form.
5. WHEN the Premium_Subscription_Page receives a `duration` query parameter with value `monthly`, THE Premium_Subscription_Page SHALL pre-select the monthly billing duration in the subscription form.

---

### Requirement 5: Premium Yearly Plan Selection

**User Story:** As a non-admin user, I want to select the Premium Yearly plan and be taken to the payment page with my category and yearly duration pre-filled, so that I can subscribe at the discounted annual rate.

#### Acceptance Criteria

1. WHEN a Non_Admin_User selects the Premium Yearly option in the Plan_Selection_Modal, THE System SHALL close the Plan_Selection_Modal and navigate to the Premium_Subscription_Page.
2. WHEN a Non_Admin_User selects the Premium Yearly option and a Category_Slug was selected, THE System SHALL pass the Category_Slug as a `category` query parameter to the Premium_Subscription_Page URL.
3. WHEN a Non_Admin_User selects the Premium Yearly option, THE System SHALL pass `duration=yearly` as a query parameter to the Premium_Subscription_Page URL.
4. WHEN the Premium_Subscription_Page receives a `duration` query parameter with value `yearly`, THE Premium_Subscription_Page SHALL pre-select the yearly billing duration in the subscription form.

---

### Requirement 6: Plan Selection Modal Dismissal

**User Story:** As a non-admin user, I want to be able to close the plan selection modal without being navigated anywhere, so that I can change my mind without unintended side effects.

#### Acceptance Criteria

1. WHEN a Non_Admin_User clicks the close button on the Plan_Selection_Modal, THE System SHALL close the Plan_Selection_Modal without navigating to any other page.
2. WHEN a Non_Admin_User clicks outside the Plan_Selection_Modal dialog area, THE System SHALL close the Plan_Selection_Modal without navigating to any other page.
3. WHEN the Plan_Selection_Modal is closed without a plan selection, THE System SHALL return the user to the page they were on before the modal was opened.

---

### Requirement 7: Navbar "Post Listing" Entry Point

**User Story:** As a non-admin authenticated user, I want a "Post Listing" button in the Navbar, so that I can start the listing creation flow from any page without having to return to the homepage.

#### Acceptance Criteria

1. WHILE a Non_Admin_User is authenticated, THE Navbar SHALL display a "Post Listing" button.
2. WHILE an Admin_User is authenticated, THE Navbar SHALL NOT display the "Post Listing" button (admin uses the Admin Panel link instead).
3. WHILE no user is authenticated, THE Navbar SHALL NOT display the "Post Listing" button.
4. WHEN a Non_Admin_User clicks the "Post Listing" button in the Navbar and no Category_Slug has been pre-selected, THE Plan_Selection_Modal SHALL be displayed without a pre-selected category.
5. WHEN the Plan_Selection_Modal is opened from the Navbar without a pre-selected category, THE Plan_Selection_Modal SHALL allow the user to proceed to the Create_Listing_Page or Premium_Subscription_Page without a category query parameter.

---

### Requirement 8: Premium Subscription Page Category and Duration Pre-fill

**User Story:** As a non-admin user arriving at the Premium Subscription page from the plan selection flow, I want the category and duration to be pre-filled based on my earlier selection, so that I do not have to re-enter information I already provided.

#### Acceptance Criteria

1. WHEN the Premium_Subscription_Page is loaded with a `category` query parameter matching a valid Category_Slug, THE Premium_Subscription_Page SHALL pre-select that category in the category dropdown.
2. WHEN the Premium_Subscription_Page is loaded with a `duration` query parameter with value `monthly`, THE Premium_Subscription_Page SHALL pre-select the monthly duration option.
3. WHEN the Premium_Subscription_Page is loaded with a `duration` query parameter with value `yearly`, THE Premium_Subscription_Page SHALL pre-select the yearly duration option.
4. IF the `category` query parameter is absent or does not match a valid Category_Slug, THEN THE Premium_Subscription_Page SHALL display the category dropdown with no pre-selection.
5. IF the `duration` query parameter is absent or has an invalid value, THEN THE Premium_Subscription_Page SHALL default to the `monthly` duration option.
