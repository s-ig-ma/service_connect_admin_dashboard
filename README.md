# Zaria ServiceConnect Admin Dashboard

This is the React admin dashboard for managing Zaria ServiceConnect.

The admin dashboard is a control panel. It is not for normal residents or providers. It is for admin users who monitor the system and handle important decisions.

## Why The Admin Dashboard Is Important

The system needs admin control because providers should not automatically become visible to residents without review.

Admin helps protect the platform by:

- Reviewing provider registrations.
- Approving trustworthy providers.
- Rejecting or suspending providers when needed.
- Checking bookings.
- Resolving complaints.
- Activating or deactivating user accounts.

Without the admin dashboard, the system would have less control and less trust.

## How It Connects To The Backend

The dashboard sends requests to the same FastAPI backend used by the web app and Android app.

The backend URL is stored in:

```text
src/config.js
```

The API functions are in:

```text
src/api.js
```

After admin login, the backend returns a token. The dashboard sends that token with protected admin requests.

## Main Admin Sections

The dashboard has four main tabs:

- Providers.
- Bookings.
- Complaints.
- Users.

## What Admin Can Do

### View And Approve Providers

Admin can view provider details such as:

- Name.
- Email.
- Phone.
- Service.
- Location.
- Shop address.
- Years of experience.
- Verification documents.
- Availability status.

Admin can change provider status to:

- `approved`: provider becomes visible to residents.
- `rejected`: provider is not accepted.
- `suspended`: provider is blocked from normal provider activity.

### View Bookings

Admin can see bookings between residents and providers.

This helps admin understand what is happening in the system and investigate complaints.

### View And Resolve Complaints

Admin can:

- View all complaints.
- Open a complaint.
- Read complaint details.
- Change complaint status.
- Add a resolution note.
- Chat with the resident.
- Chat with the provider.
- Record complaint actions.

Complaint statuses:

- `open`: complaint has been submitted.
- `in_review`: admin is checking it.
- `resolved`: admin has finished handling it.

Complaint actions:

- `warning`: admin records a warning.
- `provider_suspension`: admin suspends a provider.
- `account_deactivation`: admin deactivates a user.
- `note`: admin records a simple note.

### View And Manage Users

Admin can view all users and see details such as:

- Name.
- Email.
- Phone.
- Role.
- Location.
- Active or inactive status.
- Provider profile if the user is a provider.

Admin can activate or deactivate accounts.

## How Admin Actions Work Behind The Scenes

Example: approving a provider.

```text
Admin clicks "Approve"
        |
        v
Dashboard sends PATCH /providers/{provider_id}/status
        |
        v
Backend checks that the logged-in user is admin
        |
        v
Backend changes provider status in SQLite
        |
        v
Provider becomes visible to residents
```

Example: resolving a complaint.

```text
Admin updates complaint status and note
        |
        v
Dashboard sends PUT /complaints/{complaint_id}/resolve
        |
        v
Backend saves the status and resolution note
        |
        v
Backend creates notifications for the parties
```

## Important Files

- `src/App.jsx`: main dashboard screens and tab logic.
- `src/api.js`: all backend requests.
- `src/auth.js`: saving and clearing admin login session.
- `src/config.js`: backend URL.

## How To Run Locally

From the `admin-dashboard` folder:

```bash
npm install
npm run dev
```

Then open the local Vite address shown in the terminal.

## Defense Explanation

You can say:

"The admin dashboard is the management side of the system. Admin uses it to approve providers, view bookings, manage users, and resolve complaints. It talks to the same FastAPI backend, but the backend only allows admin users to access admin endpoints."
