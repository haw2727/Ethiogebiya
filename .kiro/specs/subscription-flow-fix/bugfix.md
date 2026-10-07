# Bugfix Requirements Document

## Introduction

Three related bugs affect the subscription and listing flow in the EthioGebiya marketplace. First, the free trial is tracked as a single boolean (`hasUsedFreeTrial`) but the product requires a 2-listing allowance with a live remaining-count display. Second, selecting a subscription plan type (monthly/yearly) on the Premium Subscription page does not automatically pre-select the matching billing period, forcing users to pick it twice. Third, the category a user selects on the Create Listing page is not automatically pre-selected on the Premium Subscription page when they are redirected there, requiring them to re-select it manually.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user views the free trial banner before posting any listing THEN the system displays an incorrect free trial count (not "Your free trial is 2")

1.2 WHEN a user has posted 1 listing using the free trial THEN the system does not display "Remaining: 1 free trial"

1.3 WHEN a user has exhausted all free trial listings THEN the system does not display "You have finished your free trial" and does not disable the free posting option

1.4 WHEN a user selects the "monthly" subscription plan type on the Premium Subscription page THEN the system does not automatically pre-select the monthly billing period, requiring the user to select it again manually

1.5 WHEN a user selects the "yearly" subscription plan type on the Premium Subscription page THEN the system does not automatically pre-select the yearly billing period, requiring the user to select it again manually

1.6 WHEN a user selects a category on the Create Listing page and is redirected to the Premium Subscription page THEN the system does not automatically pre-select that category in the subscription form

### Expected Behavior (Correct)

2.1 WHEN a user views the free trial banner before posting any listing THEN the system SHALL display "Your free trial is 2" (reflecting the correct limit of 2 free listings)

2.2 WHEN a user has posted 1 listing using the free trial THEN the system SHALL display "Remaining: 1 free trial"

2.3 WHEN a user has used all 2 free trial listings THEN the system SHALL display "You have finished your free trial" and SHALL disable the free posting option

2.4 WHEN a user selects the "monthly" subscription plan type on the Premium Subscription page THEN the system SHALL automatically pre-select the monthly billing period without requiring a second selection

2.5 WHEN a user selects the "yearly" subscription plan type on the Premium Subscription page THEN the system SHALL automatically pre-select the yearly billing period without requiring a second selection

2.6 WHEN a user is redirected from the Create Listing page to the Premium Subscription page with a `category` query parameter THEN the system SHALL automatically pre-select that category in the subscription form

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user has not yet used any free trial listings THEN the system SHALL CONTINUE TO allow them to post a listing without a subscription

3.2 WHEN a user has an active premium subscription for a category THEN the system SHALL CONTINUE TO allow them to post listings in that category regardless of free trial status

3.3 WHEN a user manually selects a different billing period after a plan type is auto-selected THEN the system SHALL CONTINUE TO respect the user's manual selection

3.4 WHEN a user navigates to the Premium Subscription page without a `category` query parameter THEN the system SHALL CONTINUE TO show an empty category selector requiring manual selection

3.5 WHEN a user manually changes the category on the Premium Subscription page after arriving with a pre-selected one THEN the system SHALL CONTINUE TO respect the user's manual selection

3.6 WHEN an admin posts a listing THEN the system SHALL CONTINUE TO bypass all free trial and subscription checks

---

## Bug Condition Pseudocode

### Bug 1 — Free Trial Count

```pascal
FUNCTION isBugCondition_FreeTrial(X)
  INPUT: X of type { user, action }
  OUTPUT: boolean

  // Bug triggers when the UI reads free trial state
  RETURN X.action IN ['view_banner', 'post_listing'] AND
         X.user.freeTrialListingsUsed IS NOT tracked as integer
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_FreeTrial(X) DO
  result ← renderFreeTrial'(X)
  ASSERT result.displayCount = 2 AND
         result.remaining = (2 - X.user.freeTrialListingsUsed) AND
         result.postingDisabled = (X.user.freeTrialListingsUsed >= 2)
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_FreeTrial(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

### Bug 2 — Subscription Period Auto-Selection

```pascal
FUNCTION isBugCondition_PeriodSync(X)
  INPUT: X of type { selectedPlanType, currentDuration }
  OUTPUT: boolean

  // Bug triggers when plan type is selected but duration is not synced
  RETURN X.selectedPlanType IN ['monthly', 'yearly'] AND
         X.currentDuration != X.selectedPlanType
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_PeriodSync(X) DO
  result ← selectPlanType'(X)
  ASSERT result.duration = X.selectedPlanType
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_PeriodSync(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

### Bug 3 — Category Not Carried Over

```pascal
FUNCTION isBugCondition_CategoryCarryover(X)
  INPUT: X of type { urlParams, selectedCategory }
  OUTPUT: boolean

  // Bug triggers when category param exists but is not applied to form
  RETURN X.urlParams.category IS NOT NULL AND
         X.selectedCategory != X.urlParams.category
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition_CategoryCarryover(X) DO
  result ← initSubscriptionForm'(X)
  ASSERT result.selectedCategory = X.urlParams.category
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition_CategoryCarryover(X) DO
  ASSERT F(X) = F'(X)
END FOR
```
