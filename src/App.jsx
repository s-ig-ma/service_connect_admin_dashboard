import { useEffect, useState } from "react";
import {
  createComplaintAction,
  getComplaintActions,
  getComplaintMessages,
  activateUser,
  sendMessage,
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
            <p><strong>Has Shop in Zaria:</strong> {selectedProvider.has_shop_in_zaria ? "Yes" : "No"}</p>
            <p><strong>Shop Address:</strong> {selectedProvider.shop_address || "Not set"}</p>
            <p><strong>Passport Photo:</strong> {selectedProvider.passport_photo_path || "Not uploaded"}</p>
            <p><strong>ID Document:</strong> {selectedProvider.id_document_path || "Not uploaded"}</p>
            <p><strong>Skill Proof:</strong> {selectedProvider.skill_proof_path || "Not uploaded"}</p>
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
            <p><strong>Service Address:</strong> {selectedBooking.service_address || "No address saved"}</p>
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
  const [complaintMessages, setComplaintMessages] = useState([]);
  const [complaintActions, setComplaintActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("open");
  const [resolutionNote, setResolutionNote] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeConversation, setActiveConversation] = useState("resident");
  const [actionType, setActionType] = useState("warning");
  const [targetUserId, setTargetUserId] = useState("");
  const [actionNote, setActionNote] = useState("");

  const currentRecipient =
    !selectedComplaint
      ? null
      : activeConversation === "provider"
        ? {
            role: "provider",
            userId: selectedComplaint.provider.user.id,
            name: selectedComplaint.provider.user.name
          }
        : {
            role: "resident",
            userId: selectedComplaint.user.id,
            name: selectedComplaint.user.name
          };

  function getAdminMessageLabel(item) {
    if (item.sender.role !== "admin") {
      return item.sender.name;
    }
    return `admin(${item.recipient.name})`;
  }

  function getMessageTone(item) {
    if (item.sender.role === "admin") {
      return "conversation-bubble admin";
    }
    if (item.sender.role === "provider") {
      return "conversation-bubble provider";
    }
    return "conversation-bubble resident";
  }

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

  async function loadConversation(complaintId, counterpartUserId) {
    const messages = await getComplaintMessages(complaintId, counterpartUserId);
    setComplaintMessages(messages);
  }

  async function handleSelectComplaint(complaintId) {
    try {
      const [data, actions] = await Promise.all([
        getComplaintDetails(complaintId),
        getComplaintActions(complaintId)
      ]);
      setSelectedComplaint(data);
      setComplaintActions(actions);
      setStatus(data.status);
      setResolutionNote(data.resolution_note || "");
      setActiveConversation("resident");
      setTargetUserId(String(data.provider.user.id));
      setMessageText("");
      setActionNote("");
      await loadConversation(complaintId, data.user.id);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    if (!selectedComplaint || !currentRecipient) {
      return undefined;
    }

    loadConversation(selectedComplaint.id, currentRecipient.userId).catch((err) => {
      setError(err.message);
    });

    const timer = window.setInterval(() => {
      loadConversation(selectedComplaint.id, currentRecipient.userId).catch((err) => {
        setError(err.message);
      });
    }, 15000);

    return () => window.clearInterval(timer);
  }, [selectedComplaint?.id, currentRecipient?.userId]);

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

  async function handleSendMessage() {
    if (!selectedComplaint || !currentRecipient || !messageText.trim()) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await sendMessage({
        recipient_user_id: currentRecipient.userId,
        complaint_id: selectedComplaint.id,
        content: messageText.trim()
      });
      setMessage("Complaint message sent successfully.");
      setMessageText("");
      await loadConversation(selectedComplaint.id, currentRecipient.userId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateAction() {
    if (!selectedComplaint) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await createComplaintAction(selectedComplaint.id, {
        action_type: actionType,
        target_user_id: targetUserId ? Number(targetUserId) : null,
        note: actionNote.trim() || null
      });
      setMessage("Complaint action saved successfully.");
      await handleSelectComplaint(selectedComplaint.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="complaint-workspace">
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

            <hr />

            <label>
              Action Type
              <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                <option value="warning">warning</option>
                <option value="provider_suspension">provider_suspension</option>
                <option value="account_deactivation">account_deactivation</option>
                <option value="note">note</option>
              </select>
            </label>

            <label>
              Action Target
              <select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
                <option value="">No target</option>
                <option value={selectedComplaint.user.id}>
                  Resident: {selectedComplaint.user.name}
                </option>
                <option value={selectedComplaint.provider.user.id}>
                  Provider: {selectedComplaint.provider.user.name}
                </option>
              </select>
            </label>

            <label>
              Action Note
              <textarea
                rows="3"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Add a short admin note or penalty reason..."
              />
            </label>

            <button onClick={handleCreateAction}>Save Complaint Action</button>

            <div className="details">
              <p><strong>Action Log</strong></p>
              {complaintActions.length ? (
                complaintActions.map((item) => (
                  <div key={item.id}>
                    <p>
                      <strong>{item.action_type}</strong>
                      {item.target_user ? ` for ${item.target_user.name}` : ""}
                    </p>
                    <p>{item.note || "No note added."}</p>
                  </div>
                ))
              ) : (
                <p>No complaint actions yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="card conversation-stage">
        <div className="section-header">
          <h3>Conversation</h3>
          {selectedComplaint ? (
            <span className="conversation-chip">
              Complaint #{selectedComplaint.id}
            </span>
          ) : null}
        </div>

        {!selectedComplaint ? <p>Select a complaint to open the conversation.</p> : null}

        {selectedComplaint ? (
          <>
            <div className="conversation-audience">
              <button
                className={
                  activeConversation === "resident"
                    ? "audience-card resident active"
                    : "audience-card resident"
                }
                onClick={() => {
                  setActiveConversation("resident");
                  setMessageText("");
                }}
              >
                <strong>Chat with Resident</strong>
                <span>{selectedComplaint.user.name}</span>
              </button>
              <button
                className={
                  activeConversation === "provider"
                    ? "audience-card provider active"
                    : "audience-card provider"
                }
                onClick={() => {
                  setActiveConversation("provider");
                  setMessageText("");
                }}
              >
                <strong>Chat with Provider</strong>
                <span>{selectedComplaint.provider.user.name}</span>
              </button>
            </div>

            <div className="conversation-chip">
              {currentRecipient
                ? `Admin conversation with ${currentRecipient.name}`
                : "Select a conversation"}
            </div>

            <div className="conversation-thread">
              {complaintMessages.length ? (
                complaintMessages.map((item) => (
                  <article key={item.id} className={getMessageTone(item)}>
                    <div className="conversation-head">
                      <strong>{getAdminMessageLabel(item)}</strong>
                      <span>{item.sender.role}</span>
                    </div>
                    <p>{item.content}</p>
                  </article>
                ))
              ) : (
                <p>No complaint messages yet.</p>
              )}
            </div>

            <div className="conversation-composer">
              <label>
                Message
                <textarea
                  rows="5"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    currentRecipient
                      ? `Write a message for ${currentRecipient.name}...`
                      : "Select a conversation target..."
                  }
                />
              </label>

              <button onClick={handleSendMessage} disabled={!currentRecipient || !messageText.trim()}>
                Send Message
              </button>
            </div>
          </>
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
