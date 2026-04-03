import { useEffect, useState } from "react";
import {
  activateUser,
  deactivateUser,
  getBookingDetails,
  getBookings,
  getComplaintDetails,
  getComplaints,
  getMyProfile,
  getProviders,
  getUserDetails,
  getUsers,
  loginAdmin,
  updateComplaint,
  updateProviderStatus
} from "./api";
import { clearSession, getSavedUser, saveSession } from "./auth";

const TABS = ["providers", "bookings", "complaints", "users"];

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("admin@zariaserviceconnect.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const session = await loginAdmin(email, password);
      if (session.role !== "admin") {
        throw new Error("This dashboard is for admin accounts only.");
      }
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Zaria ServiceConnect Admin</h1>
        <p>Login with your existing backend admin account.</p>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? <div className="message error">{error}</div> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

function Navigation({ activeTab, setActiveTab, currentUser, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h2>Admin Dashboard</h2>
        <p>Welcome, {currentUser?.name || "Admin"}</p>
      </div>

      <nav className="nav">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "nav-button active" : "nav-button"}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <button className="nav-button logout" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </header>
  );
}

function StatusButtonGroup({ onAction, actions }) {
  return (
    <div className="button-row">
      {actions.map((action) => (
        <button key={action.value} onClick={() => onAction(action.value)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}

function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProviders() {
    setLoading(true);
    setError("");
    try {
      const data = await getProviders();
      setProviders(data);
      setSelectedProvider(data[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function handleStatusChange(status) {
    if (!selectedProvider) {
      return;
    }

    setMessage("");
    setError("");
    try {
      const response = await updateProviderStatus(selectedProvider.id, status);
      setMessage(response.message);
      await loadProviders();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <div className="section-header">
          <h3>Providers</h3>
          <button onClick={loadProviders}>Refresh</button>
        </div>

        {loading ? <p>Loading providers...</p> : null}
        {error ? <div className="message error">{error}</div> : null}

        <div className="list">
          {providers.map((provider) => (
            <button
              key={provider.id}
              className={
                selectedProvider?.id === provider.id ? "list-item active" : "list-item"
              }
              onClick={() => setSelectedProvider(provider)}
            >
              <strong>{provider.user.name}</strong>
              <span>{provider.service_name || provider.category?.name || "No service name"}</span>
              <span>Status: {provider.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Provider Details</h3>
        {message ? <div className="message success">{message}</div> : null}

        {!selectedProvider ? <p>Select a provider to view details.</p> : null}

        {selectedProvider ? (
          <div className="details">
            <p><strong>Name:</strong> {selectedProvider.user.name}</p>
            <p><strong>Email:</strong> {selectedProvider.user.email}</p>
            <p><strong>Phone:</strong> {selectedProvider.user.phone}</p>
            <p><strong>Service:</strong> {selectedProvider.service_name || selectedProvider.category?.name || "Not set"}</p>
            <p><strong>Status:</strong> {selectedProvider.status}</p>
            <p><strong>Availability:</strong> {selectedProvider.availability_status}</p>
            <p><strong>Location:</strong> {selectedProvider.location || "Not set"}</p>
            <p><strong>Description:</strong> {selectedProvider.description || "No description"}</p>

            <StatusButtonGroup
              onAction={handleStatusChange}
              actions={[
                { value: "approved", label: "Approve" },
                { value: "rejected", label: "Reject" },
                { value: "suspended", label: "Suspend" }
              ]}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const data = await getBookings();
      setBookings(data);
      if (data[0]) {
        await handleSelectBooking(data[0].id);
      } else {
        setSelectedBooking(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBooking(bookingId) {
    try {
      const data = await getBookingDetails(bookingId);
      setSelectedBooking(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <section className="page-grid">
      <div className="card">
        <div className="section-header">
          <h3>Bookings</h3>
          <button onClick={loadBookings}>Refresh</button>
        </div>

        {loading ? <p>Loading bookings...</p> : null}
        {error ? <div className="message error">{error}</div> : null}

        <div className="list">
          {bookings.map((booking) => (
            <button
              key={booking.id}
              className={
                selectedBooking?.id === booking.id ? "list-item active" : "list-item"
              }
              onClick={() => handleSelectBooking(booking.id)}
            >
              <strong>Booking #{booking.id}</strong>
              <span>{booking.resident.name} {"->"} {booking.provider.user.name}</span>
              <span>Status: {booking.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Booking Details</h3>
        {!selectedBooking ? <p>Select a booking to view details.</p> : null}

        {selectedBooking ? (
          <div className="details">
            <p><strong>ID:</strong> {selectedBooking.id}</p>
            <p><strong>Resident:</strong> {selectedBooking.resident.name}</p>
            <p><strong>Provider:</strong> {selectedBooking.provider.user.name}</p>
            <p><strong>Status:</strong> {selectedBooking.status}</p>
            <p><strong>Date:</strong> {selectedBooking.scheduled_date}</p>
            <p><strong>Time:</strong> {selectedBooking.scheduled_time}</p>
            <p><strong>Description:</strong> {selectedBooking.service_description}</p>
            <p><strong>Resident Notes:</strong> {selectedBooking.notes || "No notes"}</p>
            <p><strong>Provider Notes:</strong> {selectedBooking.provider_notes || "No notes"}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("open");
  const [resolutionNote, setResolutionNote] = useState("");

  async function loadComplaints() {
    setLoading(true);
    setError("");
    try {
      const data = await getComplaints();
      setComplaints(data);
      if (data[0]) {
        await handleSelectComplaint(data[0].id);
      } else {
        setSelectedComplaint(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectComplaint(complaintId) {
    try {
      const data = await getComplaintDetails(complaintId);
      setSelectedComplaint(data);
      setStatus(data.status);
      setResolutionNote(data.resolution_note || "");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleUpdateComplaint() {
    if (!selectedComplaint) {
      return;
    }

    setMessage("");
    setError("");
    try {
      const updated = await updateComplaint(
        selectedComplaint.id,
        status,
        resolutionNote
      );
      setSelectedComplaint(updated);
      setMessage("Complaint updated successfully.");
      await loadComplaints();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <div className="section-header">
          <h3>Complaints</h3>
          <button onClick={loadComplaints}>Refresh</button>
        </div>

        {loading ? <p>Loading complaints...</p> : null}
        {error ? <div className="message error">{error}</div> : null}

        <div className="list">
          {complaints.map((complaint) => (
            <button
              key={complaint.id}
              className={
                selectedComplaint?.id === complaint.id ? "list-item active" : "list-item"
              }
              onClick={() => handleSelectComplaint(complaint.id)}
            >
              <strong>Complaint #{complaint.id}</strong>
              <span>{complaint.user.name}</span>
              <span>Status: {complaint.status}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Complaint Details</h3>
        {message ? <div className="message success">{message}</div> : null}

        {!selectedComplaint ? <p>Select a complaint to view details.</p> : null}

        {selectedComplaint ? (
          <div className="details">
            <p><strong>ID:</strong> {selectedComplaint.id}</p>
            <p><strong>User:</strong> {selectedComplaint.user.name}</p>
            <p><strong>Provider:</strong> {selectedComplaint.provider.user.name}</p>
            <p><strong>Booking ID:</strong> {selectedComplaint.booking_id}</p>
            <p><strong>Message:</strong> {selectedComplaint.message}</p>

            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">open</option>
                <option value="in_review">in_review</option>
                <option value="resolved">resolved</option>
              </select>
            </label>

            <label>
              Resolution Note
              <textarea
                rows="5"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </label>

            <button onClick={handleUpdateComplaint}>Save Complaint Update</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers();
      setUsers(data);
      if (data[0]) {
        await handleSelectUser(data[0].id);
      } else {
        setSelectedUser(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectUser(userId) {
    try {
      const data = await getUserDetails(userId);
      setSelectedUser(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleUserStatusChange(action) {
    if (!selectedUser) {
      return;
    }

    setMessage("");
    setError("");
    try {
      if (action === "activate") {
        await activateUser(selectedUser.id);
      } else {
        await deactivateUser(selectedUser.id);
      }
      setMessage(`User ${action}d successfully.`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-grid">
      <div className="card">
        <div className="section-header">
          <h3>Users</h3>
          <button onClick={loadUsers}>Refresh</button>
        </div>

        {loading ? <p>Loading users...</p> : null}
        {error ? <div className="message error">{error}</div> : null}

        <div className="list">
          {users.map((user) => (
            <button
              key={user.id}
              className={selectedUser?.id === user.id ? "list-item active" : "list-item"}
              onClick={() => handleSelectUser(user.id)}
            >
              <strong>{user.name}</strong>
              <span>{user.role}</span>
              <span>{user.is_active ? "Active" : "Inactive"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>User Details</h3>
        {message ? <div className="message success">{message}</div> : null}

        {!selectedUser ? <p>Select a user to view details.</p> : null}

        {selectedUser ? (
          <div className="details">
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Phone:</strong> {selectedUser.phone}</p>
            <p><strong>Role:</strong> {selectedUser.role}</p>
            <p><strong>Location:</strong> {selectedUser.location || "Not set"}</p>
            <p><strong>Status:</strong> {selectedUser.is_active ? "Active" : "Inactive"}</p>

            <div className="button-row">
              <button onClick={() => handleUserStatusChange("activate")}>Activate</button>
              <button onClick={() => handleUserStatusChange("deactivate")}>Deactivate</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Dashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState("providers");

  return (
    <div className="app-shell">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <main className="content">
        {activeTab === "providers" ? <ProvidersPage /> : null}
        {activeTab === "bookings" ? <BookingsPage /> : null}
        {activeTab === "complaints" ? <ComplaintsPage /> : null}
        {activeTab === "users" ? <UsersPage /> : null}
      </main>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(getSavedUser());
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function validateSession() {
      const saved = getSavedUser();

      if (!saved?.access_token) {
        setCheckingSession(false);
        return;
      }

      try {
        const profile = await getMyProfile();
        if (profile.role !== "admin") {
          clearSession();
          setCurrentUser(null);
        } else {
          setCurrentUser(saved);
        }
      } catch (error) {
        clearSession();
        setCurrentUser(null);
      } finally {
        setCheckingSession(false);
      }
    }

    validateSession();
  }, []);

  function handleLogin(session) {
    setCurrentUser(session);
  }

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
  }

  if (checkingSession) {
    return <div className="loading-screen">Checking saved session...</div>;
  }

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
}
