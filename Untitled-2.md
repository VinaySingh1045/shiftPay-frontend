# ShiftPay Employee Attendance & Salary Management - Implementation Plan

This plan outlines the end-to-end development phases for the Employee Attendance & Salary Management application (ShiftPay), based on the provided Professional Design PDF and your recent clarifications. 

We will work through this plan phase by phase. We will only move to the next phase after the current phase is fully implemented, verified, and updated.

> [!IMPORTANT]
> **Authentication Strategy:**
> Google OAuth/Google Identity will be used for user authentication. The application's API will use short-lived Bearer access tokens for authenticated requests. A refresh-token mechanism will maintain the user's session without requiring repeated Google login. The frontend and backend are deployed separately on Vercel and Render, so the application will use Authorization headers rather than relying on cross-origin application cookies for API authentication.

## User Review Required

Please review the phased approach below, which mirrors the 15 phases outlined in the PDF, updated with your recent clarifications:
- **Default Role:** Any new user logging in via Google is an **Employee** by default and cannot create companies.
- **Manager Role:** To become a Manager, the user's record in the database must be manually updated (for now). Only Managers can create companies and access the Manager Dashboard.
- **Co-Managers:** This feature will be skipped for now and handled in a future update.

## Mobile-First Design & UI Language

Based on the reference design, the application will strictly follow a mobile-first PWA aesthetic, rather than a desktop layout.
- **Color Palette:** Deep teal (`bg-teal-800`) for headers and primary active states. Soft beige/yellow (`bg-orange-50`) for highlight cards (like Pending Salary). Light teal circles for icons.
- **Typography & Layout:** Clean sans-serif (Inter). Generous padding on cards, heavily rounded corners (`rounded-xl` or `rounded-2xl`).
- **Navigation:** A fixed bottom navigation bar containing `Home`, `Attendance`, `People`, `Salary`, and `Payments` icons.
- **Header:** A sticky top header containing the user's greeting, the current date, and a dropdown to switch the active `Company`.
- **Dashboard Structure:** A vertically scrolling list of cards grouped by sections (e.g., "TODAY'S ATTENDANCE", "QUICK ACTIONS").

## Proposed Phased Execution

The development is divided into 15 phases. We will tackle them sequentially.

### Phase 1: MERN Project Setup & PWA Foundation
- **Backend:** Initialize Express setup, environment variables, CORS (allowing Vercel frontend), and basic error handling.
- **Frontend:** Clean up Vite + React + TypeScript structure, setup TailwindCSS (if applicable) or core styling, and configure basic PWA manifesto/service worker. Setup **Redux Toolkit** and **Redux Persist**.

### Phase 2: MongoDB Models, Relationships & Indexes
- Define Mongoose schemas for `User`, `Company`, `Employee`, `EmployeeCompanyAssignment`, `Role`, `SalaryRateHistory`, `Attendance`, `Payment`, `SalarySettlement`, `OnboardingInvitation`, and `QRToken`.
- **Note:** The `User` model will have a `role` field (`User.role = "employee" | "manager"`) defaulting to `"employee"`.
- Set up indexes (e.g., unique constraints on assignment + date + shift).

### Phase 3: Google Authentication & Role Authorization
- **Backend:** Implement Google OAuth verification (using `google-auth-library`). Generate and return short-lived JWT Bearer access tokens and longer-lived refresh tokens upon successful login. The JWT payload will include the user's `isManager` status.
- **Frontend:** Implement Google Login UI. Store the short-lived access token in application memory using Redux Toolkit and attach it to API requests via the `Authorization: Bearer <token>` header. Store the refresh token using a secure mechanism and use it to obtain a new access token when the access token expires. The user should remain logged in without needing to sign in with Google again.

### Phase 4: Manager First Login & Dynamic Company Creation
- Build the Manager dashboard.
- Create API endpoints for managers to dynamically create companies and switch between active company contexts.
- **Authorization:** Only users with `isManager = true` (manually set in the DB) can hit these endpoints or view the Manager Dashboard.

### Phase 5: Employee Onboarding, Invitations & Email Auto-link
- Implement the flow for managers to add an employee directly.
- Implement the "Unknown employee" / Registration link flow where the manager can review and approve a user who signed in via Google.

### Phase 6: People Management & Bulk Import
- Employee listing and search on the frontend.
- API and frontend implementation for bulk importing 50+ employees using Excel/CSV.

### Phase 7: Manual Attendance & Joining-Date Rules
- Backend logic to handle manual attendance marking (Present, Half Day, Absent, Full Day Off).
- Enforce the rule that dates before the `joiningDate` do not count as absent.
- UI for the manager to backdate/edit attendance.

### Phase 8: Rotating QR & `html5-qrcode` Employee Scanner
- **Manager UI:** Render a rotating QR code that changes every minute (using short-lived QR tokens in the DB).
- **Employee UI:** Integrate `html5-qrcode` for fast in-browser scanning on the PWA.

### Phase 9: IST Shift Detection, Six-Hour Rule & Late Attendance
- Enforce Asia/Kolkata (IST) timezone globally on the backend.
- Shift boundary logic (6 AM - 6 PM Day, 6 PM - 6 AM Night).
- Enforce the 6-hour minimum time between successful scans rule.

### Phase 10: Salary Engine & Historical Wage Rates
- Implement the salary calculation engine: `Applicable Wage x Attendance Multiplier`.
- Read from `SalaryRateHistory` based on the effective date of the attendance, rather than just the current wage.

### Phase 11: Multiple Payments & Salary Closure
- Allow managers to record partial payments throughout the month.
- Implement the month closure logic where `Remaining Pay = Earned - Total Payments`.

### Phase 12: Employee Calendar & Salary UI
- Employee-facing UI showing simple states (Present, Half Day, Absent, Off) on a monthly calendar.
- Employee view for Earned, Received, and Remaining salary.

### Phase 13: Mobile/PWA Polish & Accessibility
- Refine the UI for "mobile-first" constraints (large buttons, recognizable icons, simple language).
- Ensure PWA installability works flawlessly.

### Phase 14: Full Business-Rule Testing
- Verify edge cases: night shift crossing midnight, duplicate scan attempts, expired QRs, multiple company assignments for the same employee, wage changes mid-month, etc.

### Phase 15: Deployment & Production Hardening

- Finalize environment variables for Render and Vercel.
- Enforce HTTPS and ensure secure context for camera APIs.
- Configure MongoDB Atlas network access.

## Verification Plan
We will create a `task.md` and check off items as we build. At the end of each Phase, I will ask you to start the backend and frontend servers, and we will manually verify the specific functionality introduced in that Phase before proceeding to the next.
