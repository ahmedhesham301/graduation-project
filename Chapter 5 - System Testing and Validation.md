# Chapter 5: System Testing and Validation

## 5.1 Testing Methodology and Coverage

### 5.1.1 Testing Methodology

The testing process for the Real Estate Platform followed a multi-level approach to ensure system reliability, security, and usability:

| Level | Type | Description |
|-------|------|-------------|
| 1 | Unit Testing | Testing individual functions, validators, and middleware in isolation |
| 2 | Integration Testing | Testing API endpoints with real database (PostgreSQL) and session management |
| 3 | System Testing | End-to-end testing of complete user workflows across frontend and backend |
| 4 | User Acceptance Testing (UAT) | Manual testing by team members simulating real user behavior |

### 5.1.2 Testing Tools and Framework

The project uses an automated testing framework built with industry-standard tools:

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1.7 | Test runner and assertion library (fast, ESM-native) |
| Supertest | 7.2.2 | HTTP assertion library for testing Express API endpoints |
| PostgreSQL | 17.5 | Real database used during tests (no mocking) |
| Vitest UI | 4.1.7 | Interactive visual dashboard for running and viewing test results |

### 5.1.3 Test Architecture

```
backend/
├── tests/
│   ├── setup.js              # Global setup/teardown (DB connection cleanup)
│   ├── helpers.js            # Shared utilities (agent creation, user generation, seller flow)
│   ├── auth.test.js          # Authentication module tests (9 tests)
│   ├── user.test.js          # User management & seller application tests (8 tests)
│   ├── property.test.js      # Property CRUD tests (10 tests)
│   ├── favorites.test.js     # Favorites module tests (6 tests)
│   ├── analytics.test.js     # Analytics module tests (5 tests)
│   ├── admin.test.js         # Admin dashboard & management tests (15 tests)
│   ├── chat.test.js          # Chat module tests (3 tests)
│   └── security.test.js      # Security protections & lockout tests (8 tests)
├── vitest.config.js          # Test configuration
└── package.json              # Test scripts
```

### 5.1.4 Testing Coverage

| Module | Test File | Tests | Features Tested |
|--------|-----------|-------|-----------------|
| Authentication | auth.test.js | 9 | Register, Login, Logout, Validation, Protected routes |
| User Management | user.test.js | 8 | Profile retrieval, Update, Seller application, Status check, Validation |
| Property Management | property.test.js | 10 | Create, Read, Update, Delete, Search, Nearby, Types, My Properties |
| Favorites | favorites.test.js | 6 | Save, Remove, List, Duplicate handling, Authorization |
| Chat | chat.test.js | 3 | Inbox, Messages, Authorization |
| Admin Dashboard | admin.test.js | 15 | Stats, Users, Properties, Reports, Contacts, Activity Log, Notifications, Seller Requests |
| Analytics (Seller) | analytics.test.js | 5 | Seller dashboard, Market trends, Performance, Authorization |
| Security & Integrity | security.test.js | 8 | Account lockout, Password complexity, CSRF protection, security logs access control |
| **Total** | **8 files** | **64** | **Full system coverage** |

### 5.1.5 What Each Test File Does

**auth.test.js** — Tests the complete authentication lifecycle. Registers a user, verifies duplicate/invalid inputs are rejected, logs in with correct and incorrect credentials, tests logout, and confirms that unauthenticated users cannot access protected endpoints.

**user.test.js** — Tests user profile management and the seller application workflow. Verifies that users can view and update their profile, submit a seller application with business details, checks that duplicate applications are rejected, and confirms the status endpoint returns the correct state (none/pending/rejected).

**property.test.js** — Tests the full property CRUD cycle. Uses `createSellerAgent()` which goes through the entire seller approval flow (register → apply → admin approve → re-login) before creating a property. Then tests reading, updating, searching (by city, nearby coordinates), listing types, viewing own properties, and deleting.

**favorites.test.js** — Tests the save/unsave functionality. Creates a seller with a property, then a separate buyer who saves it to favorites, lists favorites, removes it, and verifies authorization is enforced.

**analytics.test.js** — Tests seller-specific analytics endpoints (dashboard stats, property analytics, performance) and the public market trends endpoint. Verifies that non-sellers get 403 Forbidden.

**admin.test.js** — Tests all admin panel API endpoints. Logs in as the seeded admin user (`admin@3akarati.com`) and verifies: dashboard stats, recent data, user management (list/search/filter/role change), property listing, contact events with date filtering, activity log, notifications count, seller requests, and system settings.

**chat.test.js** — Tests the messaging system's authorization. Verifies that authenticated users can access their inbox and that unauthenticated users are blocked from both inbox and message endpoints.

**security.test.js** — Tests security-related mechanisms. Verifies account lockout policies (blocking login after 5 consecutive failed attempts, recording the lockout event, resetting on successful login), checks password strength requirements, verifies CSRF cookie/token issuance, and ensures only admin users can access the security logs endpoint.

### 5.1.6 How Tests Interact with the Real System

```
npm test
    │
    ▼
Vitest loads vitest.config.js (sets DB credentials, NODE_ENV=test)
    │
    ▼
Each test file imports helpers.js → imports app.js → calls createApp()
    │
    ▼
createApp() connects to real PostgreSQL (Docker container on localhost:5432)
    │  Skips: Redis, S3, Rate Limiters (because NODE_ENV=test)
    ▼
Supertest sends real HTTP requests through the full Express stack:
    Request → CORS → Session → Validation → Controller → Model → PostgreSQL
    │
    ▼
Tests assert on real HTTP responses (status codes, response bodies)
    │
    ▼
setup.js closes the DB pool after all tests complete
```

No mocking is used. Every test hits the real database, which means:
- SQL errors are caught (wrong column names, missing JOINs)
- Constraint violations are tested (unique emails, foreign keys)
- Session behavior is real (cookies, regeneration, persistence)
- The full middleware chain runs (auth checks, validation, role guards)

---

## 5.2 Test Configuration

### 5.2.1 Vitest Configuration (vitest.config.js)

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 30000,
        hookTimeout: 30000,
        setupFiles: ['./tests/setup.js'],
        fileParallelism: false,
        env: {
            NODE_ENV: 'test',
            PGHOST: 'localhost',
            PGUSER: 'postgres',
            PGPASSWORD: '1234',
            PGDATABASE: 'postgres',
            PGPORT: '5432'
        },
        reporters: ['default', 'html'],
        outputFile: {
            html: './test-report/index.html'
        },
    },
});
```

### 5.2.2 Test Helpers (helpers.js)

Key utilities used across all test files:

| Function | Purpose |
|----------|---------|
| `createAgent()` | Creates a Supertest agent with session persistence (cookie jar) |
| `createRequest()` | Creates a stateless Supertest request (no session) |
| `generateUser()` | Generates unique test user data with timestamp-based email/phone |
| `createSellerAgent()` | Full seller flow: register → apply → admin approve → re-login |

### 5.2.3 How to Run Tests

```bash
# Prerequisites: Docker containers must be running
docker compose up -d

# Stop local PostgreSQL if installed (conflicts with Docker port)
# Windows: Stop-Service postgresql*

# Run all tests
cd backend
npm test

# Run with interactive UI
npx vitest --ui

# Run specific test file
npx vitest run tests/admin.test.js

# Generate HTML report
npx vite preview --outDir test-report
```

---

## 5.3 Test Cases

### 5.3.1 Authentication Module (9 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-AUTH-01 | Successful Registration | No duplicate email | Valid name/email/pass/phone | 201 Created | ✅ Pass |
| TC-AUTH-02 | Reject duplicate email | Email exists | Same email | 400 Bad Request | ✅ Pass |
| TC-AUTH-03 | Reject invalid email | None | Invalid email format | 400 Bad Request | ✅ Pass |
| TC-AUTH-04 | Reject short password | None | Password < 8 chars | 400 Bad Request | ✅ Pass |
| TC-AUTH-05 | Successful Login | User registered | Valid credentials | 200 OK, session set | ✅ Pass |
| TC-AUTH-06 | Reject wrong password | User registered | Wrong password | 400 Bad Request | ✅ Pass |
| TC-AUTH-07 | Reject non-existent email | None | Unknown email | 400 Bad Request | ✅ Pass |
| TC-AUTH-08 | Successful Logout | User logged in | POST /auth/logout | 200 OK | ✅ Pass |
| TC-AUTH-09 | Unauthorized Access | Not logged in | GET /user/me | 401 Unauthorized | ✅ Pass |

### 5.3.2 User Management Module (8 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-USER-01 | Get current user profile | Logged in | GET /user/me | 200 OK, email + role | ✅ Pass |
| TC-USER-02 | Update user profile | Logged in | { fullName: "New" } | 200 OK | ✅ Pass |
| TC-USER-03 | Submit seller application | Logged in buyer | businessName, nationalId | 200 OK, pending | ✅ Pass |
| TC-USER-04 | Reject empty update | Logged in | {} | 400 Bad Request | ✅ Pass |
| TC-USER-05 | Reject duplicate application | Already pending | Same data | 400, already pending | ✅ Pass |
| TC-USER-06 | Reject without required fields | Logged in | {} | 400, fields required | ✅ Pass |
| TC-USER-07 | Get seller request status | Application submitted | GET /user/seller-status | 200, status=pending | ✅ Pass |
| TC-USER-08 | Status for user without request | No application | GET /user/seller-status | 200, status=none | ✅ Pass |

### 5.3.3 Property Management Module (10 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-PROP-01 | Create property as seller | Approved seller | Full property data | 201 Created | ✅ Pass |
| TC-PROP-03 | Reject without auth | Not logged in | Property data | 401 Unauthorized | ✅ Pass |
| TC-PROP-04 | Get property by ID | Property exists | GET /properties/:id | 200 OK | ✅ Pass |
| TC-PROP-05 | Reject invalid property ID | None | GET /properties/abc | 400 Bad Request | ✅ Pass |
| TC-PROP-06 | Update property as owner | Owner logged in | { price: 2500000 } | 200 OK | ✅ Pass |
| TC-PROP-08 | Delete property as owner | Owner logged in | DELETE /properties/:id | 204 No Content | ✅ Pass |
| TC-PROP-09 | Search properties | None | ?city=Cairo&page=1 | 200 OK | ✅ Pass |
| TC-PROP-10 | Get nearby properties | None | ?lat=30&lon=31&radius=10 | 200 OK | ✅ Pass |
| TC-PROP-11 | Get property types | None | GET /properties/types | 200 OK, array | ✅ Pass |
| TC-PROP-12 | Get my properties | Seller logged in | GET /my-properties | 200 OK, array | ✅ Pass |

### 5.3.4 Favorites Module (6 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-FAV-01 | Save to favorites | Logged in, property exists | POST /favorites/:id | 201 Created | ✅ Pass |
| TC-FAV-02 | Reject duplicate favorite | Already saved | POST /favorites/:id | 400/409 | ✅ Pass |
| TC-FAV-03 | List favorites | Has saved properties | GET /favorites | 200 OK, array | ✅ Pass |
| TC-FAV-04 | Remove from favorites | Property saved | DELETE /favorites/:id | 204 No Content | ✅ Pass |
| TC-FAV-05 | Remove non-saved property | Not in favorites | DELETE /favorites/99999 | 400/404 | ✅ Pass |
| TC-FAV-06 | Reject without auth | Not logged in | GET /favorites | 401 Unauthorized | ✅ Pass |

### 5.3.5 Analytics Module (5 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-ANA-01 | Seller analytics | Approved seller | GET /seller/analytics | 200 OK | ✅ Pass |
| TC-ANA-02 | Seller property analytics | Approved seller | GET /analytics/seller/properties | 200 OK | ✅ Pass |
| TC-ANA-03 | Market trends (public) | None | GET /analytics/market-trends | 200 OK | ✅ Pass |
| TC-ANA-04 | Seller performance | Approved seller | GET /analytics/seller-performance | 200 OK | ✅ Pass |
| TC-ANA-05 | Reject non-seller access | Buyer logged in | GET /seller/analytics | 403 Forbidden | ✅ Pass |

### 5.3.6 Admin Dashboard Module (15 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-ADM-01 | Dashboard stats | Admin logged in | GET /admin/stats | 200 OK, all KPIs | ✅ Pass |
| TC-ADM-02 | Reject non-admin | Buyer logged in | GET /admin/stats | 403 Forbidden | ✅ Pass |
| TC-ADM-03 | Recent users & properties | Admin logged in | GET /admin/recent | 200 OK, arrays | ✅ Pass |
| TC-ADM-04 | List users with pagination | Admin logged in | GET /admin/users?page=1 | 200 OK, paginated | ✅ Pass |
| TC-ADM-05 | Filter users by role | Admin logged in | GET /admin/users?role=admin | 200, all admin | ✅ Pass |
| TC-ADM-06 | Search users by name | Admin logged in | GET /admin/users?search=Test | 200, matches | ✅ Pass |
| TC-ADM-07 | Change user role | Admin logged in | PATCH /admin/users/:id/role | 200 OK, role changed | ✅ Pass |
| TC-ADM-08 | Reject invalid role | Admin logged in | { role: "invalid" } | 400 Bad Request | ✅ Pass |
| TC-ADM-12 | Contact events | Admin logged in | GET /admin/contacts?page=1 | 200 OK, events | ✅ Pass |
| TC-ADM-13 | Filter contacts by date | Admin logged in | ?from=2020-01-01&to=2030-12-31 | 200 OK | ✅ Pass |
| TC-ADM-14 | Activity log | Admin logged in | GET /admin/activity-log | 200 OK, logs | ✅ Pass |
| TC-ADM-15 | Notifications | Admin logged in | GET /admin/notifications | 200, pendingSellers | ✅ Pass |
| TC-ADM-16 | Seller requests list | Admin logged in | GET /admin/seller-requests | 200 OK, array | ✅ Pass |
| TC-ADM-17 | Site settings | Admin logged in | GET /admin/settings | 200 OK | ✅ Pass |
| TC-ADM-18 | Update site settings | Admin logged in | PATCH /admin/settings | 200 OK | ✅ Pass |

### 5.3.7 Chat Module (3 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-CHAT-03 | Get inbox | Logged in | GET /chat/inbox | 200 OK | ✅ Pass |
| TC-CHAT-04 | Reject inbox without auth | Not logged in | GET /chat/inbox | 401 Unauthorized | ✅ Pass |
| TC-CHAT-05 | Reject messages without auth | Not logged in | GET /chat/messages/:id | 401 Unauthorized | ✅ Pass |

### 5.3.8 Security & Integrity Module (8 Tests)

| TC-ID | Test Case | Precondition | Input | Expected Output | Status |
|-------|-----------|--------------|-------|-----------------|--------|
| TC-SEC-01 | Password complexity enforcement | None | Password without uppercase/number/special char | 400 Bad Request | ✅ Pass |
| TC-SEC-02 | Account lockout trigger | User registered | 5 consecutive failed login attempts | 400 Bad Request, account locked | ✅ Pass |
| TC-SEC-03 | Lockout block on login | Account locked | Valid credentials while locked | 400 Bad Request, locked message | ✅ Pass |
| TC-SEC-04 | Lockout reset on successful login | User registered | Failed logins < 5, then successful login | 200 OK, failed attempts reset | ✅ Pass |
| TC-SEC-05 | CSRF cookie & token issuance | None | GET /auth/csrf-token | 200 OK, token returned, cookie set | ✅ Pass |
| TC-SEC-06 | Security logs admin access | Admin logged in | GET /admin/security-logs | 200 OK, paginated logs returned | ✅ Pass |
| TC-SEC-07 | Security logs non-admin access | Buyer logged in | GET /admin/security-logs | 403 Forbidden | ✅ Pass |
| TC-SEC-08 | Security logs unauthenticated access | Not logged in | GET /admin/security-logs | 401 Unauthorized | ✅ Pass |

---

## 5.4 Test Scenarios

### Scenario 1: User Registration and Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User fills registration form | Form validates input |
| 2 | Submit with valid data | 201 Created, user in DB |
| 3 | Login with credentials | 200 OK, session created |
| 4 | Access protected route | 200 OK, user data returned |
| 5 | Logout | Session destroyed |

### Scenario 2: Seller Application and Approval

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buyer clicks "Become a Seller" | Application form shown |
| 2 | Fills business name, type, national ID | Form validates required fields |
| 3 | Submits application | Status changes to "pending" |
| 4 | Admin opens "Seller Requests" tab | Pending request visible |
| 5 | Admin clicks "Approve" | User role changes to seller |
| 6 | Buyer refreshes profile | Seller features (Add Property, Dashboard) appear |

### Scenario 3: Seller Application Rejection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buyer submits seller application | Status = pending |
| 2 | Admin clicks "Reject" and types reason | Status = rejected, reason saved |
| 3 | Buyer opens profile | Sees "Rejected" with reason, can reapply |
| 4 | Buyer resubmits with updated info | Status resets to pending |

### Scenario 4: Property Lifecycle

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Approved seller creates property | 201 Created with media upload URLs |
| 2 | Property appears in search | Searchable by city, nearby |
| 3 | Seller updates price | 200 OK, price updated |
| 4 | Buyer saves to favorites | Appears in favorites list |
| 5 | Seller deletes property | 204, removed from search |

### Scenario 5: Admin Dashboard Operations

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin logs in | Redirected to admin dashboard |
| 2 | Views overview | KPI cards with platform stats |
| 3 | Navigates to Users | Paginated user list with search/filter |
| 4 | Changes a user's role | Role updated, logged in activity |
| 5 | Views Properties | All listings with detail modal on click |
| 6 | Removes a listing | Property deleted |
| 7 | Views Contact Events | Filterable by date range |
| 8 | Views Activity Log | All admin actions recorded |

### Scenario 6: Admin Notifications

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Buyer submits seller application | Pending count increments |
| 2 | Admin sees badge on "Seller Requests" | Red badge with count |
| 3 | Admin approves request | Badge count decreases |

### Scenario 7: Account Lockout and Security Audit Logs

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Attacker submits 5 incorrect login attempts | 400 Bad Request on each; account is locked, lockout recorded |
| 2 | Attacker submits 6th login with correct credentials | 400 Bad Request, message "Account is temporarily locked" |
| 3 | Admin logs in and opens the Security Logs tab | Admin sees lockout and failed login attempts in the audit trail |

---

## 5.5 Test Execution Results

### 5.5.1 Terminal Output

```
 RUN  v4.1.7

 ✓ tests/favorites.test.js (6 tests) 894ms
 ✓ tests/analytics.test.js (5 tests) 832ms
 ✓ tests/user.test.js (8 tests) 798ms
 ✓ tests/property.test.js (10 tests) 709ms
 ✓ tests/auth.test.js (9 tests) 660ms
 ✓ tests/admin.test.js (15 tests) 567ms
 ✓ tests/security.test.js (8 tests) 420ms
 ✓ tests/chat.test.js (3 tests) 317ms

 Test Files  8 passed (8)
      Tests  64 passed (64)
   Duration  20.15s
```

### 5.5.2 Key Metrics

| Metric | Value |
|--------|-------|
| Total Test Files | 8 |
| Total Test Cases | 64 |
| Passed | 64 |
| Failed | 0 |
| Skipped | 0 |
| Total Duration | ~20 seconds |
| Import Time | ~12 seconds |
| Test Execution Time | ~5 seconds |

---

## 5.6 Bug Reports

### 5.6.1 Bugs Found During Testing

| Bug-ID | Module | Description | Severity | Status |
|--------|--------|-------------|----------|--------|
| BUG-01 | Auth | `session.regenerate()` not awaited — sessions lost between requests | High | Fixed |
| BUG-02 | Properties | `/properties/mine` caught by `/:propertyId` route in Express 5 | High | Fixed — renamed to `/my-properties` |
| BUG-03 | Properties | Error messages for 422 were generic ("seller_id does not exist") | Low | Fixed — detailed FK/NULL messages |
| BUG-04 | Seller | `become-seller` instantly upgraded role without verification | Medium | Fixed — now requires admin approval |
| BUG-05 | Admin | SQL queries used `p.city` instead of `city_id` JOIN | High | Fixed — proper JOINs |
| BUG-06 | Admin | `getAllProperties` count query broken by greedy regex | Medium | Fixed — separated query building |
| BUG-07 | Docker | API container used remote image, local changes not reflected | High | Fixed — volume mount |
| BUG-08 | Docker | SQL init files sorted incorrectly (10_ before 1_) | Medium | Fixed — zero-padded filenames |
| BUG-09 | Tests | Local PostgreSQL on port 5432 conflicting with Docker | Medium | Fixed — stop local service |

### 5.6.2 Resolution Summary

All 9 bugs were identified during the integration testing phase and resolved before final deployment. The most critical bugs (BUG-01, BUG-02) were real production issues that would have affected users — demonstrating the value of automated testing with a real database.

---

## 5.7 Testing Best Practices Applied

| Practice | Implementation |
|----------|---------------|
| Real Database | Tests run against PostgreSQL, not mocks — catches real SQL errors |
| Session Persistence | Supertest agents maintain cookies across requests |
| Test Isolation | Each test file creates its own users/data |
| Full Workflow Testing | `createSellerAgent()` tests the complete approval pipeline |
| Role-Based Testing | Tests verify admin, seller, and buyer access controls |
| No Test Pollution | `fileParallelism: false` prevents race conditions |
| Automated Reports | HTML report generated on every run |

---

## 5.8 Conclusion

The testing suite provides comprehensive coverage of all system modules with 64 automated integration tests. Testing against a real PostgreSQL database (not mocks) uncovered critical bugs including session management issues and route conflicts that would have been missed by unit tests alone. The admin dashboard, seller verification workflow, and property management system are all validated end-to-end through automated tests that simulate real user interactions.
