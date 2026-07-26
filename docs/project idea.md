Product Requirements Document (PRD)
Motion Connect Campus WiFi Management Platform

Version: 1.0
Status: Development
Prepared By: Olives Technologies

1. Product Overview

Motion Connect is a centralized hotspot management platform that enables educational institutions to provide paid internet access through their existing MikroTik hotspot infrastructure.

The platform automates the complete customer journey from WiFi connection to payment verification and internet access while providing administrators with tools to manage packages, pricing, transactions and future business operations.

The project will be delivered in phases to reduce initial cost while establishing a scalable software foundation.

2. Objectives
Integrate NGS/Hubtel payment services.
Automate hotspot access after successful payment.
Provide a centralized administration platform.
Support dynamic package and pricing management.
Record transactions and operational data.
Build a scalable platform for future expansion.
3. Users
Student
Connect to WiFi
Purchase internet
Make payment
Receive internet access
Administrator
Manage packages
Update prices
View transactions
Monitor hotspot activity
Configure business settings
Super Administrator
Manage routers
Manage campuses
Manage administrators
Configure payment settings
View overall system reports
4. Technology Stack
Frontend
Next.js 15
React
TypeScript
TailwindCSS
shadcn/ui
Backend
Next.js API Routes
Server Actions (where appropriate)
Database

appwrite

Collections

Users
Packages
Transactions
Routers
Settings
Sessions
Activity Logs
Hosting

Frontend + Backend

Vercel

Database

appwrite
Integrations
NGS APIs
Hubtel (through NGS)
MikroTik RouterOS API / REST API
5. Core Modules
Module 1

Captive Portal

Functions

Display packages
Display pricing
Collect phone number
Start payment
Show payment status
Module 2

Payment Processing

Functions

Create payment request
Verify callback
Record transaction
Handle failed payments
Retry handling
Module 3

Hotspot Integration

Functions

Authorize device
Activate internet
Disconnect expired sessions
Synchronize package duration
Module 4

Administration

Functions

Login
Dashboard
Package Management
Pricing Management
Settings
Module 5

Reporting

Functions

Revenue
Transactions
Active Users
Internet Package Statistics
6. Database Collections
Users
Name
Phone
Device MAC
Status
Packages
Name
Price
Data
Duration
Active
Transactions
Reference
Amount
Status
Package
Payment Method
Date
Routers
Name
Campus
IP
API Status
Settings
Company Name
Currency
Support Number
Payment Configuration
Activity Logs

System activities

7. Version Roadmap
Version 1.0 (MVP)

Goal

Launch the hotspot payment service.

Features

Hosted Next.js Captive Portal
Payment Integration
NGS API
Hubtel Checkout
Payment Callback
MikroTik Integration
Transaction Logging
Basic Admin Login
Basic Package Management
Basic Settings

Deliverable

Students can purchase internet and receive automatic access.

Version 1.5

Goal

Operational Management

Features

Dashboard
Transaction History
Active Sessions
Search
Package Management Improvements
Router Monitoring
Version 2.0

Goal

Business Management

Features

Revenue Reports
Sales Analytics
Customer History
Export Reports
Activity Logs
Multiple Administrators
Version 3.0

Goal

Enterprise Platform

Features

Multi Campus
Multiple Routers
Voucher System
Promotions
Discounts
Notifications
Role Management
8. Project Structure
motionconnect/

app/

(app)

(admin)

(api)

(login)

(dashboard)

components/

lib/

services/

hubtel.ts

mikrotik.ts

database/

models/

hooks/

types/

public/

9. Development Phases
Phase 1

Foundation

Tasks

Create Next.js project
appwrite
Authentication
UI Components
Theme
Routing
Phase 2

Captive Portal

Tasks

Landing page
Package display
Payment UI
Redirect logic
Phase 3

Payment Integration

Tasks

NGS Integration
Hubtel Checkout
Callback Verification
Transaction Storage
Phase 4

Hotspot Integration

Tasks

RouterOS API
Internet Activation
Session Control
Phase 5

Administration

Tasks

Login
Dashboard
Packages
Pricing
Settings
Phase 6

Deployment

Tasks

Vercel
appwrite
Domain
UAT
Production
10. Future Enhancements
Multiple campuses
Multiple hotspot providers
SMS notifications
Email receipts
AI usage analytics
Customer portal
Mobile App
Subscription billing
Bandwidth analytics
Network monitoring
Recommendation Before You Start

One suggestion I'd make is to avoid making the captive portal itself the center of the application.

Instead, think of the product as a Campus WiFi Management Platform.

The captive portal is simply one entry point into that platform.

Mentally, your architecture should look like this:

                    Motion Connect Platform
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
 Captive Portal      Admin Dashboard     APIs
        │                  │                  │
        ├──────────────┬───┘                  │
        │              │                      │
   Payment Service  Package Service     Router Service
        │              │                      │
        └──────────────┼──────────────────────┘
                       │
                   appwrite
                       │
        NGS APIs   Hubtel   MikroTik