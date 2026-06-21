# Product Requirements Document (PRD)

## 3akarati - Real Estate Platform

| Field | Details |
|-------|---------|
| **Project Name** | 3akarati |
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Team** | Ahmed Hesham, Farouk Mohamed, Abdelrhman Ahmed, Ali Essam, Marwan Emad |
| **Supervisors** | Prof. Nashaat ElKhamisy, Dr. Heba Sabry |
| **Institution** | Sadat Academy for Management Sciences |

---

## 1. Executive Summary

3akarati is a cloud-native real estate platform that enables buyers to search, filter, and purchase properties; sellers to list and manage property inventory; and administrators to moderate content, manage users, and monitor platform analytics. The platform is built on a full-stack architecture (React.js frontend, Node.js/Express backend, PostgreSQL/PostGIS database) with enterprise-grade DevOps practices including Docker containerization, Terraform IaC, Amazon EKS orchestration, and GitHub Actions CI/CD pipelines.

---

## 2. Problem Statement

Traditional real estate applications suffer from:

- **Environment inconsistencies** between development and production ("works on my machine" syndrome).
- **Manual infrastructure provisioning** that is time-consuming, error-prone, and costly.
- **Poor scalability** during traffic spikes due to monolithic architectures.
- **Lack of geospatial capabilities** for location-based property search.
- **No automated deployment pipelines**, leading to slow release cycles and downtime.

---

## 3. Project Goals & Objectives

### 3.1 Main Goal

Design, develop, and deploy a scalable, full-stack real estate web application utilizing automated cloud infrastructure and CI/CD pipelines.

### 3.2 Objectives

| # | Objective | Technology |
|---|-----------|-----------|
| 1 | Build a responsive, modern UI for property browsing | React.js, Vite, Tailwind CSS |
| 2 | Develop a secure, performant REST API | Node.js, Express.js |
| 3 | Implement geospatial property search | PostgreSQL, PostGIS |
| 4 | Enable direct-to-cloud media uploads | AWS S3, Presigned URLs |
| 5 | Containerize all services for environment consistency | Docker, Docker Compose |
| 6 | Automate cloud infrastructure provisioning | Terraform (HCL), AWS EKS |
| 7 | Establish automated CI/CD pipelines | GitHub Actions, Trivy scanning |
| 8 | Provide AI-powered property recommendations | Google Gemini 2.5 Flash |
| 9 | Integrate ML-based price prediction | Python, Flask, scikit-learn |
| 10 | Enable real-time buyer-seller communication | Socket.io |

---

## 4. Target Users

### 4.1 Buyer (End User)

- Property seekers looking to buy or rent properties.
- Needs: Search, filter, view details, virtual tours, save favorites, contact sellers, make purchase offers.

### 4.2 Seller (Property Owner / Agent)

- Property owners or real estate agents listing properties.
- Needs: Post/edit/delete listings, upload media, track analytics (views, saves, contacts), manage offers, real-time messaging.

### 4.3 Admin (Platform Administrator)

- Platform operator managing users, content, and system health.
- Needs: User management, property moderation, seller verification, analytics dashboards, security monitoring, site settings.

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | User registration with email/password (bcrypt hashed) | High |
| AUTH-02 | Login with session-based authentication (Redis-backed) | High |
| AUTH-03 | Google OAuth 2.0 login | Medium |
| AUTH-04 | Account lockout after 5 failed attempts (15-min timeout) | High |
| AUTH-05 | CSRF protection via double-submit cookie pattern | High |
| AUTH-06 | User profile view and update | Medium |
| AUTH-07 | Seller application submission and status tracking | Medium |

### 5.2 Property Listings

| ID | Requirement | Priority |
|----|-------------|----------|
| PROP-01 | Create property listing (type, area, rooms, price, location, description) | High |
| PROP-02 | Edit property details | High |
| PROP-03 | Soft delete property | High |
| PROP-04 | Mark property as sold | Medium |
| PROP-05 | Upload multiple images (JPEG, PNG, WebP) via S3 presigned URLs | High |
| PROP-06 | Upload virtual tour (ZIP) for 360-degree viewing | Medium |
| PROP-07 | View property details with image gallery and virtual tour | High |
| PROP-08 | Property moderation workflow (pending -> approved/rejected) | High |
| PROP-09 | Property view tracking (logged-in and anonymous) | Medium |
| PROP-10 | Contact seller (phone, email, WhatsApp, chat) with event tracking | Medium |

### 5.3 Search & Filtering

| ID | Requirement | Priority |
|----|-------------|----------|
| SEARCH-01 | Full-text search with filters (city, district, type, price range) | High |
| SEARCH-02 | Geospatial nearby search (PostGIS ST_DWithin) | High |
| SEARCH-03 | Sort results (price, area, date) | Medium |
| SEARCH-04 | Pagination | High |
| SEARCH-05 | Debounced input for real-time filtering | Low |

### 5.4 Favorites

| ID | Requirement | Priority |
|----|-------------|----------|
| FAV-01 | Save property to favorites | Medium |
| FAV-02 | Remove property from favorites | Medium |
| FAV-03 | View saved properties list | Medium |

### 5.5 Purchase Offers

| ID | Requirement | Priority |
|----|-------------|----------|
| OFFER-01 | Make a purchase offer on a property | Medium |
| OFFER-02 | View sent/received offers | Medium |
| OFFER-03 | Accept/reject/counter offers | Medium |
| OFFER-04 | Cancel an offer | Medium |
| OFFER-05 | Complete checkout/purchase flow | Medium |

### 5.6 Real-Time Messaging

| ID | Requirement | Priority |
|----|-------------|----------|
| CHAT-01 | Real-time buyer-seller messaging via Socket.io | High |
| CHAT-02 | Chat inbox with conversation list | Medium |
| CHAT-03 | Chat history per property and user pair | Medium |
| CHAT-04 | REST fallback for sending messages | Low |

### 5.7 Analytics & Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| ANALYTICS-01 | Seller dashboard (total views, saves, contacts, listings) | Medium |
| ANALYTICS-02 | Per-property analytics (views, saves, contacts over time) | Medium |
| ANALYTICS-03 | Seller performance KPIs | Low |
| ANALYTICS-04 | Global market trends (listing trends, sales trends, demand hotspots) | Low |

### 5.8 AI Chatbot

| ID | Requirement | Priority |
|----|-------------|----------|
| BOT-01 | AI-powered chatbot for property recommendations | Low |
| BOT-02 | Structured JSON output from Gemini for search filtering | Low |
| BOT-03 | Quick prompt suggestions | Low |
| BOT-04 | Display recommended property cards in chat | Low |

### 5.9 ML Price Prediction

| ID | Requirement | Priority |
|----|-------------|----------|
| ML-01 | Predict property price based on features (city, area, rooms, type, condition) | Low |
| ML-02 | Flask REST API for price prediction | Low |
| ML-03 | RandomForestRegressor trained on Egyptian property data | Low |

### 5.10 Admin Panel

| ID | Requirement | Priority |
|----|-------------|----------|
| ADMIN-01 | Dashboard with KPIs (users, properties, revenue indicators) | High |
| ADMIN-02 | User management (list, view, change role, delete) | High |
| ADMIN-03 | Property management (list, view, edit, hard delete) | High |
| ADMIN-04 | Property moderation (approve/reject pending listings) | High |
| ADMIN-05 | Seller application review (approve/reject) | High |
| ADMIN-06 | Contact event analytics | Medium |
| ADMIN-07 | Sold properties report | Medium |
| ADMIN-08 | Activity log (admin action audit trail) | Medium |
| ADMIN-09 | Security logs (unauthorized access, failed logins) | Medium |
| ADMIN-10 | Site settings (maintenance mode, featured properties limit) | Medium |

### 5.11 Maintenance Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| MAINT-01 | DB-driven maintenance mode toggle | Medium |
| MAINT-02 | Block non-admin/non-authenticated paths during maintenance | Medium |
| MAINT-03 | Health check endpoint exempt from maintenance | Low |
| MAINT-04 | Admin bypasses maintenance mode | Medium |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | API response time | < 500ms (95th percentile) |
| NFR-02 | Frontend initial load | < 3s on 3G |
| NFR-03 | Database query time | < 200ms for spatial queries |
| NFR-04 | Horizontal pod autoscaling | 3-12 replicas at 80% CPU |

### 6.2 Security

| ID | Requirement | Implementation |
|----|-------------|---------------|
| SEC-01 | Session security | httpOnly, sameSite=lax, 30-day expiry, Redis store |
| SEC-02 | CSRF protection | Double-submit cookie + X-CSRF-Token header |
| SEC-03 | Rate limiting | Redis-backed (auth: 3/15min, property create: 2/1hr, general: 100/min) |
| SEC-04 | Password hashing | bcrypt (cost factor 10) |
| SEC-05 | Input validation | Zod schemas on all endpoints |
| SEC-06 | Security headers | Helmet.js |
| SEC-07 | Role-based access control | Buyer, Seller, Admin middleware |
| SEC-08 | SQL injection prevention | Parameterized queries |
| SEC-09 | Container vulnerability scanning | Trivy in CI/CD (CRITICAL + HIGH) |
| SEC-10 | Security audit logging | security_logs table |
| SEC-11 | Admin activity audit trail | admin_activity_log table |

### 6.3 Scalability

| ID | Requirement | Implementation |
|----|-------------|---------------|
| SCAL-01 | Container orchestration | Amazon EKS (Kubernetes) |
| SCAL-02 | Multi-AZ deployment | 3 Availability Zones |
| SCAL-03 | Horizontal pod autoscaling | 3-12 replicas per service |
| SCAL-04 | Cluster autoscaling | EC2 Auto Scaling Groups |
| SCAL-05 | Database scaling | RDS Multi-AZ, read replicas |

### 6.4 Reliability

| ID | Requirement | Implementation |
|----|-------------|---------------|
| REL-01 | High availability | Multi-AZ EKS + RDS |
| REL-02 | Load balancing | AWS Application Load Balancer |
| REL-03 | Health checks | /api/health endpoint |
| REL-04 | Soft deletes | deleted_at column for properties |
| REL-05 | Price history audit trail | property_price_history table |

### 6.5 DevOps & Automation

| ID | Requirement | Implementation |
|----|-------------|---------------|
| DEVOPS-01 | Infrastructure as Code | Terraform (HCL) |
| DEVOPS-02 | Containerization | Docker + Docker Compose (local) |
| DEVOPS-03 | CI/CD pipelines | GitHub Actions (build, push, Trivy scan) |
| DEVOPS-04 | Environment consistency | Docker containers across all environments |
| DEVOPS-05 | Database migrations | Self-migrating schema on startup |

### 6.6 Maintainability

| ID | Requirement | Implementation |
|----|-------------|---------------|
| MAINT-01 | Code modularity | MVC architecture (routes, controllers, models, services) |
| MAINT-02 | Type safety | Zod validation, TypeScript for Gemini integration |
| MAINT-03 | Testing | 64 integration tests (Vitest + Supertest) |
| MAINT-04 | Documentation | Architecture diagrams, API documentation |

---

## 7. System Architecture

### 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  React.js SPA (Vite) ─── Nginx (Reverse Proxy)         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                 APPLICATION LAYER                        │
│  Amazon EKS Cluster (3 Availability Zones)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Frontend    │  │   Backend    │  │    Redis     │  │
│  │  Pods (Nginx)│  │  Pods (Node) │  │   Stack      │  │
│  │  3-12 repr.  │  │  3-12 repr.  │  │  (cache/     │  │
│  │              │  │              │  │   session)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │  AWS S3      │  │  ML Service  │  │
│  │  (RDS +      │  │  (Media      │  │  (Flask +    │  │
│  │  PostGIS)    │  │  Storage)    │  │  scikit-learn│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Infrastructure Layers

| Layer | Components | Purpose |
|-------|-----------|---------|
| **Public** | ALB, NAT Gateway, Bastion Host, Internet Gateway | External access & load balancing |
| **Private (Compute)** | EKS Worker Nodes, Backend/Frontend Pods, Redis | Application workloads |
| **Database** | RDS PostgreSQL (Multi-AZ), S3 Bucket | Persistent data & media storage |

### 7.3 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Frontend | React.js | 19.x |
| Build Tool | Vite | 8.x |
| Icons | Lucide React | 1.17.0 |
| Charts | Recharts | 2.15.4 |
| Real-time | Socket.io-client | 4.8.3 |
| Validation | Zod | 4.3.6 |
| HTTP Client | Axios | 1.16.1 |
| Backend | Node.js + Express.js | 24.x / 5.x |
| Database | PostgreSQL + PostGIS | 18.x |
| Cache / Session | Redis Stack | 7.x |
| Object Storage | AWS S3 / RustFS (local) | - |
| AI Chatbot | Google Gemini 2.5 Flash | - |
| ML Service | Python Flask + scikit-learn | 3.12 / 1.x |
| Containerization | Docker + Docker Compose | - |
| Reverse Proxy | Nginx | stable-alpine |
| Orchestration | Amazon EKS (Kubernetes) | 1.35 |
| IaC | Terraform (HCL) | AWS Provider 6.43.0 |
| CI/CD | GitHub Actions | - |
| Security Scanning | Trivy | - |
| Testing | Vitest + Supertest | 4.x / 7.x |

---

## 8. API Endpoints Summary

### 8.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (rate limited) |
| POST | `/api/auth/google-login` | Google OAuth login |
| POST | `/api/auth/logout` | Logout |

### 8.2 User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current user profile |
| PATCH | `/api/user/me` | Update profile |
| POST | `/api/user/become-seller` | Submit seller application |
| GET | `/api/user/seller-status` | Get seller application status |

### 8.3 Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties/types` | List property types |
| GET | `/api/properties/nearby` | Geospatial nearby search |
| GET | `/api/properties/:id` | Get property details |
| GET | `/api/properties/:id/tour` | Get virtual tour ZIP |
| GET | `/api/search` | Full search with filters |
| GET | `/api/my-properties` | Seller's own properties |
| POST | `/api/properties` | Create property |
| POST | `/api/properties/:id/contact` | Contact seller |
| POST | `/api/properties/:id/media` | Add media |
| PATCH | `/api/properties/:id` | Update property |
| PUT | `/api/properties/:id/media/:mediaId` | Confirm media upload |
| DELETE | `/api/properties/:id` | Soft delete |
| DELETE | `/api/properties/:id/media/:mediaKey` | Delete media |

### 8.4 Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/favorites/` | List saved properties |
| POST | `/api/favorites/:propertyId` | Save to favorites |
| DELETE | `/api/favorites/:propertyId` | Remove from favorites |

### 8.5 Offers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/properties/:id/offers` | Make offer |
| GET | `/api/user/offers` | Get sent offers |
| PATCH | `/api/user/offers/:id` | Update/cancel offer |
| POST | `/api/user/offers/:id/checkout` | Complete purchase |
| GET | `/api/seller/offers` | Get received offers |
| PATCH | `/api/seller/offers/:id` | Update offer |
| POST | `/api/seller/offers/:id/counter` | Counter offer |

### 8.6 Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/inbox` | Get chat inbox |
| POST | `/api/chat/messages` | Send message |
| GET | `/api/chat/:propertyId/:userId1/:userId2` | Get conversation |

### 8.7 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/seller/analytics` | Seller dashboard stats |
| GET | `/api/analytics/seller/properties` | Per-property analytics |
| GET | `/api/analytics/market-trends` | Market trends |
| GET | `/api/analytics/seller-performance` | Seller performance KPIs |

### 8.8 Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard KPIs |
| GET | `/api/admin/recent` | Recent activity |
| GET | `/api/admin/reports` | Analytics reports |
| GET | `/api/admin/users` | List users |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/properties` | List all properties |
| PATCH | `/api/admin/properties/:id` | Update property |
| DELETE | `/api/admin/properties/:id` | Hard delete property |
| POST | `/api/admin/properties/:id/approve` | Approve listing |
| POST | `/api/admin/properties/:id/reject` | Reject listing |
| POST | `/api/admin/properties/approve-all` | Bulk approve |
| GET | `/api/admin/seller-requests` | Seller applications |
| POST | `/api/admin/seller-requests/:id/approve` | Approve seller |
| POST | `/api/admin/seller-requests/:id/reject` | Reject seller |
| GET | `/api/admin/contacts` | Contact events |
| GET | `/api/admin/sold-properties` | Sold properties |
| GET | `/api/admin/activity-log` | Admin audit log |
| GET | `/api/admin/security-logs` | Security audit log |
| GET | `/api/admin/settings` | Site settings |
| PATCH | `/api/admin/settings` | Update settings |

### 8.9 Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/cities` | List cities |
| GET | `/api/cities/:cityName/districts` | Districts by city |
| POST | `/api/chatbot` | AI chatbot |
| GET | `/api/properties/:id/offers` | Property offers (public) |

**Total: ~55 REST endpoints + 4 Socket.io events**

---

## 9. Database Schema

### 9.1 Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (buyers, sellers, admins) |
| `seller_profile` | Seller verification applications |
| `properties` | Property listings (PostGIS coordinates) |
| `cities` | Egyptian cities (27) |
| `districts` | Districts per city |
| `property_types` | Property categories (7 types) |
| `property_media` | Uploaded media files (S3 keys) |
| `saved` | User favorites (many-to-many) |
| `features` | Property features |
| `property_features` | Feature-property junction |

### 9.2 Analytics & Tracking

| Table | Purpose |
|-------|---------|
| `property_views` | View tracking |
| `property_contact_events` | Contact event tracking |
| `property_price_history` | Price change audit trail |

### 9.3 Communication

| Table | Purpose |
|-------|---------|
| `chat_messages` | Buyer-seller messaging |
| `purchase_offers` | Purchase offers/bidding |

### 9.4 Admin & Configuration

| Table | Purpose |
|-------|---------|
| `admin_activity_log` | Admin action audit |
| `security_logs` | Security event log |
| `site_settings` | Key-value configuration |

### 9.5 Custom ENUMs

| Enum | Values |
|------|--------|
| `user_roles` | buyer, seller, admin |
| `verification_status` | unverified, pending, verified, rejected, banned |
| `media_types` | jpeg, jpg, png, webp, zip |
| `property_conditions` | not finished, semi finished, fully finished, luxury finished |
| `offer_status` | pending, accepted, rejected, cancelled, countered, completed |
| `moderation_status` | pending, approved, rejected |

---

## 10. Frontend Pages

| # | Page | Description |
|---|------|-------------|
| 1 | Home | Landing page with hero section, search bar, featured properties |
| 2 | Sign In | Email/password + Google OAuth login |
| 3 | Sign Up | User registration |
| 4 | Profile Settings | Profile update, seller application, account management |
| 5 | Search Results | Filtered property listings with pagination |
| 6 | Property Details | Full property view, image gallery, virtual tour, contact seller |
| 7 | Property Offers | Purchase offers management |
| 8 | Favourite Properties | Saved properties list |
| 9 | Add Property | Property creation form (sellers) |
| 10 | My Properties | Seller's own property listings |
| 11 | Seller Dashboard | Seller analytics (views, saves, contacts) |
| 12 | Inbox | Chat inbox |
| 13 | Chat History | Conversation thread |
| 14 | Checkout | Offer checkout/payment flow |
| 15-24 | Admin Panel | 10 tabs: Dashboard, Users, Properties, Seller Requests, Contacts, Analytics, Reports, Activity Log, Security Logs, Settings |

---

## 11. DevOps Pipeline

### 11.1 Local Development

```bash
docker-compose up    # Starts: db, redis-stack, api, rustfs, ml
npm run dev          # Frontend via Vite (port 5173)
```

### 11.2 CI/CD Flow

```
Code Push -> GitHub Actions -> Docker Build -> Trivy Scan -> Push to Docker Hub
                                                                        |
Deployment (manual) <- K8s apply <- Terraform apply <- AWS EKS
```

### 11.3 Infrastructure Provisioning

| Step | Tool | Action |
|------|------|--------|
| 1 | Terraform | Provision VPC, EKS, RDS, S3, Security Groups |
| 2 | kubectl | Deploy frontend, backend, Redis manifests |
| 3 | AWS LB Controller | Provision ALB from Ingress resource |
| 4 | HPA | Auto-scale pods 3-12 replicas at 80% CPU |

---

## 12. Security Measures

| Layer | Mechanism |
|-------|-----------|
| **Transport** | HTTPS via ALB SSL termination |
| **Session** | Redis-backed, httpOnly cookies, 30-day expiry |
| **CSRF** | Double-submit cookie pattern |
| **Rate Limiting** | Redis-backed per-endpoint limits |
| **Input Validation** | Zod schemas on all endpoints |
| **Headers** | Helmet.js security headers |
| **Auth** | bcrypt passwords, session validation |
| **Authorization** | Role-based middleware (buyer/seller/admin) |
| **SQL** | Parameterized queries |
| **Network** | VPC isolation, private subnets for DB and compute |
| **Scanning** | Trivy container vulnerability scanning in CI/CD |
| **Audit** | Security logs + admin activity logs |
| **Infrastructure** | Bastion host for SSH, NAT for outbound-only access |

---

## 13. Testing Strategy

| Type | Scope | Tools | Count |
|------|-------|-------|-------|
| Integration | Full API + database | Vitest + Supertest | 64 tests |
| Unit | Services, models | Vitest | Via integration |
| Security | Auth, CSRF, rate limiting, role access | Vitest | 8 tests |
| E2E | User workflows | Manual | - |

### Test Modules

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth | 9 | Registration, login, logout, Google OAuth, lockout |
| User | 8 | Profile, seller upgrade, role management |
| Property | 10 | CRUD, search, media upload, moderation |
| Favorites | 6 | Save, remove, list |
| Analytics | 5 | Dashboard, market trends, performance |
| Admin | 15 | Stats, user/property management, moderation |
| Chat | 3 | Inbox, messaging, conversations |
| Security | 8 | CSRF, rate limiting, unauthorized access |

---

## 14. Success Metrics

| Metric | Target |
|--------|--------|
| API uptime | 99.9% |
| Average response time | < 500ms |
| Test coverage | 64+ integration tests passing |
| Container scan | 0 CRITICAL/HIGH vulnerabilities |
| Deployment frequency | On every merge to main |
| Environment consistency | Identical behavior across local/staging/prod |

---

## 15. Project Constraints & Assumptions

### Constraints

- Budget limited to AWS free tier and basic instance types (t3.small, db.t4g.micro).
- Team of 5 students with a 1-semester timeline.
- Must use specific technologies as required by the SE curriculum.

### Assumptions

- AWS account is provisioned with appropriate IAM permissions.
- Domain and SSL certificates are managed separately.
- Initial seed data is generated via the Python Faker script (10,000 properties).
- Google Gemini API key is obtained and managed via environment variables.

---

## 16. Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| OAuth 2.0 / SSO | Integrate Google, Apple, Facebook login providers |
| 360 Virtual Tours | In-house virtual tour engine using Three.js/Pannellum |
| Load Testing | Apache JMeter / Grafana k6 stress testing |
| Push Notifications | Real-time notifications for messages, offers, status changes |
| Payment Integration | Stripe/PayPal integration for offer checkout |
| Mobile App | React Native companion app |
| Multi-language | Arabic/English localization |
| Advanced Search | Map-based drawing search, saved search alerts |

---

*End of PRD*
