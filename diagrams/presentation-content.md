# 3akarati - Graduation Project Presentation
# Sadat Academy for Management Sciences - Software Engineering Department
# Supervisor: Prof. Nashaat ElKhamisy | Dr. Heba Sabry
# Team: Ahmed Hesham, Farouk Mohamed, Abdelrhman Ahmed, Ali Essam, Marwan Emad

---

## Slide 1: Title Slide

**3akarati**
A Scalable Real Estate Platform with Cloud-Native Infrastructure

Sadat Academy for Management Sciences
Faculty of Computer Science
Software Engineering Department

Supervised by: Prof. Nashaat ElKhamisy & Dr. Heba Sabry

Ahmed Hesham | Farouk Mohamed | Abdelrhman Ahmed | Ali Essam | Marwan Emad

2026

---

## Slide 2: Agenda

1. Problem Statement
2. Objectives
3. System Architecture
4. Technology Stack
5. Key Features
6. Database Design
7. DevOps & Infrastructure
8. Security Measures
9. Testing & Validation
10. Live Demo
11. Conclusion & Future Work

---

## Slide 3: Problem Statement

- Traditional real estate platforms suffer from poor scalability and frequent downtime
- "It works on my machine" syndrome — inconsistencies between dev and production
- Manual infrastructure provisioning is time-consuming and error-prone
- Complex geospatial queries require specialized handling
- No automated deployment pipelines — slow release cycles

**Goal:** Build a scalable, automated, cloud-native real estate platform

---

## Slide 4: Objectives

1. Develop a responsive UI using React.js
2. Build a robust backend API with Node.js/Express
3. Implement spatial database with PostgreSQL + PostGIS
4. Containerize with Docker for environmental consistency
5. Automate infrastructure with Terraform (IaC)
6. Establish CI/CD pipelines with GitHub Actions
7. Deploy on AWS with EKS orchestration

---

## Slide 5: System Architecture

[INSERT: Architecture Diagram - diagrams/architecture diagram.drawio]

Three-tier cloud architecture:
- Public Subnets: Load Balancers, NAT, Bastion Host
- Private Subnets: EKS Cluster (Backend + Frontend containers)
- Database Subnets: RDS PostgreSQL with PostGIS

Distributed across 3 AWS Availability Zones for fault tolerance.

---

## Slide 6: Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + PostGIS |
| Auth | Session-based (express-session), Google OAuth 2.0 |
| File Storage | Amazon S3 (presigned URLs) |
| AI | Google Gemini (Chatbot) |
| ML | Python (Price Prediction) |
| Containerization | Docker, Docker Compose |
| Orchestration | Amazon EKS (Kubernetes) |
| IaC | Terraform (HCL) |
| CI/CD | GitHub Actions |
| Reverse Proxy | Nginx |

---

## Slide 7: Key Features — Buyer

- Geospatial property search (by city, district, radius)
- Advanced filtering (price, type, rooms, area)
- Interactive map with property markers
- Save properties to favorites
- Contact seller (phone, email, WhatsApp, chat)
- Submit purchase offers
- AI-powered chatbot for property recommendations
- Become a seller (verification workflow)
- Google Sign-In / OAuth 2.0 integration

---

## Slide 8: Key Features — Seller

- Verified seller application process
- Add/Edit/Delete property listings
- Direct-to-S3 media upload (presigned URLs)
- Seller analytics dashboard
  - Property views & contact events
  - Performance metrics
  - Market trends
- In-app chat with buyers
- Accept/Reject/Counter purchase offers

---

## Slide 9: Key Features — Admin

- Dashboard with KPI cards (users, properties, contacts)
- User management (search, filter, role change, delete)
- Seller verification (approve/reject with reason)
- Property moderation (approve/reject listings, bulk Approve All Pending)
- Contact events log with date filtering
- Activity log (all admin actions tracked)
- Analytics reports (registrations, listings, top cities)
- Site settings management
- Notification badges for pending requests

---

## Slide 10: Database Design (ERD)

[INSERT: ERD Screenshot]

Key entities:
- **users** — with role-based access (buyer/seller/admin)
- **seller_profile** — verification status + business info
- **properties** — PostGIS geometry(Point, 4326) for coordinates
- **property_media** — S3 keys (decoupled from DB)
- **property_views / contact_events** — analytics engine
- **purchase_offers** — offer lifecycle management
- **chat_messages** — real-time messaging
- **admin_activity_log** — audit trail

16 tables | 6 custom ENUM types | Full referential integrity

---

## Slide 11: Geospatial Search

How property search works:
1. Buyer applies filters (city, price range, type)
2. Backend builds parameterized SQL query
3. PostGIS executes spatial calculations (ST_DWithin for radius)
4. Results include S3 media URLs (not blobs)
5. Frontend fetches images directly from S3
6. Properties rendered on interactive map

Benefits:
- Sub-second query response
- No backend bottleneck for media
- Scalable to millions of listings

---

## Slide 12: Media Upload Architecture

Direct-to-S3 upload flow:
1. Seller submits property + file metadata
2. Backend creates DB record (pending_media = true)
3. Backend generates S3 presigned URLs
4. Frontend uploads directly to S3 (PUT)
5. Frontend confirms upload → Backend marks active

Benefits:
- Server never handles file bytes
- Faster uploads for users
- Reduced bandwidth costs
- Scalable media storage

---

## Slide 13: Seller Verification Workflow

[INSERT: Activity Diagram - seller verification]

1. Buyer fills application (business name, type, national ID)
2. Status = "pending" → Admin notified
3. Admin reviews in dashboard
4. Approve → role changes to seller, features unlocked
5. Reject → reason shown, buyer can reapply

Security: Only verified sellers can list properties.

---

## Slide 14: DevOps Pipeline

[INSERT: CI/CD Diagram]

GitHub Actions workflow:
1. Developer pushes code to main
2. CI: Lint → Test → Build Docker image
3. CD: Push image to registry → Deploy to EKS

Infrastructure as Code (Terraform):
- VPC, Subnets, Security Groups
- EKS Cluster + Worker Nodes
- RDS PostgreSQL
- S3 Buckets
- Load Balancers

All infrastructure version-controlled and reproducible.

---

## Slide 15: Containerization

Docker Compose services:
- **db**: PostGIS (PostgreSQL + spatial extensions)
- **api**: Node.js backend
- **redis-stack**: Session store + caching
- **rustfs**: S3-compatible object storage (dev)
- **ml**: Python ML service (price prediction)

Benefits:
- Identical environments (dev = staging = prod)
- One command to spin up entire stack
- Isolated dependencies
- Easy horizontal scaling

---

## Slide 16: Security Measures

| Layer | Protection |
|-------|-----------|
| Authentication | Session-based with secure cookies, bcrypt hashing |
| Authorization | Role-based access control (buyer/seller/admin) |
| API | Input validation, rate limiting, parameterized queries |
| Network | VPC segmentation, private subnets for DB |
| Infrastructure | Bastion host, NAT gateway, security groups |
| Media | Presigned URLs (time-limited access) |
| Transport | HTTPS/TLS termination at load balancer |
| Admin | Activity logging, all actions auditable |

---

## Slide 17: Testing Strategy

Testing approach: Integration tests against real PostgreSQL (no mocks)

| Metric | Value |
|--------|-------|
| Test Files | 7 |
| Total Tests | 56 |
| Pass Rate | 100% |
| Duration | ~19 seconds |

Modules tested:
- Authentication (9) | Users (8) | Properties (10)
- Favorites (6) | Analytics (5) | Admin (15) | Chat (3)

Tools: Vitest + Supertest + Real PostgreSQL

---

## Slide 18: Test Results

[INSERT: Screenshot of test terminal output showing 56/56 passed]

Key findings during testing:
- 9 bugs discovered and fixed
- Critical: Session regeneration bug (would lose user sessions)
- Critical: Route conflict in Express 5 (/properties/mine vs /:id)
- All bugs resolved before deployment

Testing validated:
- Full middleware chain execution
- Real SQL constraint enforcement
- Session persistence across requests
- Role-based access control

---

## Slide 19: AI Integration

**Chatbot (Google Gemini)**
- Natural language property search
- Answers questions about listings
- Provides recommendations based on preferences

**ML Price Prediction (Python)**
- Trained on Egyptian real estate data
- Predicts property prices based on features
- Helps sellers price competitively
- Helps buyers identify good deals

---

## Slide 20: Live Demo

Demo flow:
1. Register as buyer
2. Search properties (map + filters)
3. View property details
4. Apply to become seller
5. Admin approves seller
6. Seller adds property with images
7. Admin dashboard overview
8. Chat between buyer and seller

---

## Slide 21: Conclusion

Achievements:
- Full-stack real estate platform with geospatial capabilities
- Automated cloud infrastructure (Terraform + EKS)
- CI/CD pipeline for zero-downtime deployments
- 56 automated tests with 100% pass rate
- Role-based access with seller verification workflow
- Direct-to-S3 media handling for scalability
- AI chatbot + ML price prediction

The platform demonstrates modern software engineering practices bridging development and operations.

---

## Slide 22: Future Work

1. **SSO Expansion** — Login with Apple, Facebook, and Microsoft IDPs
2. **360° Virtual Tours** — WebGL-based panoramic property tours
3. **Load Testing** — JMeter/k6 stress testing on EKS cluster
4. **Mobile App** — React Native for iOS/Android
5. **Payment Integration** — Secure deposit/escrow system
6. **Advanced ML** — Property valuation trends, investment scoring
7. **Real-time Notifications** — WebSocket push notifications

---

## Slide 23: Thank You

**3akarati**
A Scalable Real Estate Platform

Questions?

Team: Ahmed Hesham | Farouk Mohamed | Abdelrhman Ahmed | Ali Essam | Marwan Emad
Supervisor: Prof. Nashaat ElKhamisy & Dr. Heba Sabry
Sadat Academy for Management Sciences — 2026
