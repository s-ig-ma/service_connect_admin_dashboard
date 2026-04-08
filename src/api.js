import { API_BASE_URL } from "./config";
import { getToken } from "./auth";

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed.");
  }

  return data;
}

export function loginAdmin(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getMyProfile() {
  return request("/auth/me");
}

export function getProviders() {
  return request("/providers/admin/all");
}

export function updateProviderStatus(providerId, status) {
  return request(`/providers/${providerId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function getBookings() {
  return request("/bookings/admin/all");
}

export function getBookingDetails(bookingId) {
  return request(`/bookings/${bookingId}`);
}

export function getComplaints() {
  return request("/complaints/");
}

export function getComplaintDetails(complaintId) {
  return request(`/complaints/${complaintId}`);
}

export function updateComplaint(complaintId, status, resolutionNote) {
  return request(`/complaints/${complaintId}/resolve`, {
    method: "PUT",
    body: JSON.stringify({
      status,
      resolution_note: resolutionNote
    })
  });
}

export function getComplaintActions(complaintId) {
  return request(`/complaints/${complaintId}/actions`);
}

export function createComplaintAction(complaintId, payload) {
  return request(`/complaints/${complaintId}/actions`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getComplaintMessages(complaintId, counterpartUserId = null) {
  const search = counterpartUserId
    ? `?counterpart_user_id=${counterpartUserId}`
    : "";
  return request(`/messages/complaint/${complaintId}${search}`);
}

export function sendMessage(payload) {
  return request("/messages/", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getUsers() {
  return request("/users/admin/all");
}

export function getUserDetails(userId) {
  return request(`/users/admin/${userId}`);
}

export function activateUser(userId) {
  return request(`/users/admin/${userId}/activate`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}

export function deactivateUser(userId) {
  return request(`/users/admin/${userId}/deactivate`, {
    method: "PATCH",
    body: JSON.stringify({})
  });
}
