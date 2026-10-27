import axios from "axios";


const STORAGE_KEY = "shiptrack.session";
const TOKEN_KEY = "shiptrack.token";

const latency = (min = 250, max = 650) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.random() * (max - min) + min),
  );

const clone = (data) =>
  typeof structuredClone !== "undefined"
    ? structuredClone(data)
    : JSON.parse(JSON.stringify(data));

const api = axios.create({
  baseURL: "/api",
  timeout: 8000,
});


api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});



// --- Auth ---
export const authApi = {
  async login(email, role) {
    await latency();
    const user = demoUsers[role];
    if (!user || email.trim().length === 0) {
      throw new Error("Invalid credentials");
    }
  
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    return { user, token };
  },
  

  async me() {
    
    try {
      
const token = sessionStorage.getItem(TOKEN_KEY);
      

      if (!token) {
        return null;
      }

      const response = await api.get("/auth/me");
     
      if (response.data?.email) {
        localStorage.setItem(`last_active_${response.data.email.toLowerCase()}`, new Date().toISOString());
      }
      if (response.data?.id) {
        localStorage.removeItem(`last_active_${response.data.id}`);
      }

      const storedAvatar = localStorage.getItem(`avatar_${response.data.id}`);
      return {
        id: response.data.id,
        name: `${response.data.firstName || ""} ${response.data.lastName || ""}`.trim(),
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        email: response.data.email,
        role: (response.data.role || "").toLowerCase(),
        phone: response.data.phone,
        address: response.data.address,
        company: response.data.companyName,
        companyName: response.data.companyName,
        avatar: response.data.profileImage || storedAvatar || null,
        profileImage: response.data.profileImage || storedAvatar || null,
        active: response.data.active,
        status: response.data.active === false ? "suspended" : "active",
        createdAt: response.data.createdAt,
        joinedAt: response.data.createdAt,
      };
    } catch (error) {
      console.error("authApi.me error =", error);

      
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("refreshToken");

      return null;
    }
  },
 
  async register(payload) {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },
 

  logout() {
    
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("refreshToken");
  },
  async updateProfile(updates) {
    const nameParts = (updates.name || "").trim().split(" ");
    const firstName = updates.firstName || nameParts[0] || "User";
    const lastName = updates.lastName || nameParts.slice(1).join(" ") || " ";
    const payload = {
      firstName,
      lastName,
      phone: updates.phone || "",
      address: updates.address || updates.location || "N/A",
      companyName: updates.company || updates.companyName || "",
    };

    try {
      const response = await api.put("/users/profile", payload);
      const data = response.data;
      if (updates.avatar || updates.profileImage) {
        localStorage.setItem(`avatar_${data.id}`, updates.avatar || updates.profileImage);
      }
      const avatar = updates.avatar || updates.profileImage || localStorage.getItem(`avatar_${data.id}`) || null;
      const updatedUser = {
        id: data.id,
        name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: (data.role || "").toLowerCase(),
        phone: data.phone,
        address: payload.address,
        company: payload.companyName,
        companyName: payload.companyName,
        avatar,
        profileImage: avatar,
      };

      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...parsed, user: updatedUser })
        );
      }
      return updatedUser;
    } catch {
      const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("Not authenticated");
      const { user, token } = JSON.parse(raw);
      const updated = { ...user, ...updates };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updated, token }));
      return updated;
    }
  },
};

// --- Shipments ---
export const shipmentsApi = {
  async list() {
    const response = await api.get("/shipments");
    return response.data;
  },
  async getById(id) {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },
  async getByTracking(trackingNumber) {
    await latency();
    return clone(
      db.shipments.find(
        (s) => s.trackingNumber.toLowerCase() === trackingNumber.toLowerCase(),
      ),
    );
  },
  async getByCustomer() {
    const response = await api.get("/shipments/customer/me");
    return response.data;
  },

  
  async cancelByCustomer(id, reason) {
    const response = await api.post(`/shipments/${id}/customer-cancel`, {
      reason,
    });

    return response.data;
  },
 
  async getTracking(idOrTracking) {
    const rawParam = String(idOrTracking).trim();
    const isNumeric = /^\d+$/.test(rawParam);

    if (isNumeric) {
      const response = await api.get(`/shipments/${rawParam}/tracking`);
      return response.data;
    }

    // If identifier is a tracking number (e.g. TRK-71865E6D), resolve ID first
    try {
      let shipmentList = [];
      try {
        const resMe = await api.get("/shipments/customer/me");
        if (Array.isArray(resMe.data)) shipmentList = resMe.data;
      } catch {}

      if (!shipmentList.length) {
        try {
          const resAll = await api.get("/shipments");
          if (Array.isArray(resAll.data)) shipmentList = resAll.data;
        } catch {}
      }

      const match = shipmentList.find(
        (s) => (s.trackingNumber || "").toLowerCase() === rawParam.toLowerCase()
      );

      if (match?.id) {
        const response = await api.get(`/shipments/${match.id}/tracking`);
        return {
          ...response.data,
          id: match.id,
          carrier: match.carrier || "ShipTrack Express",
          vehicleNumber: match.vehicleNumber || "TN 38 BL 7842",
          driverName: match.driverName || "Amrith Saravanan (Assigned Fleet Driver)",
          driverPhone: match.driverPhone || "+919999988888",
        };
      }
    } catch (e) {
      console.warn("Tracking number pre-resolution failed, trying direct endpoint:", e);
    }

    const response = await api.get(`/shipments/${encodeURIComponent(rawParam)}/tracking`);
    return response.data;
  },
  async getNavigation(id) {
    const response = await api.get(`/shipments/${id}/navigation`);
    return response.data;
  },
  async getHubs() {
    const response = await api.get("/shipments/hubs");
    return response.data;
  },

  async create(payload) {
    const response = await api.post("/shipments", payload);
    return response.data;
  },

 
  accept: async (id) => {
    const response = await api.post(`/shipments/${id}/accept`);

    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/shipments/${id}/status`, null, {
      params: {
        status,
      },
    });

    return response.data;
  },

  async updateJourney(payload) {
    const response = await api.post("/journey/update", payload);
    return response.data;
  },

  async reachNextHub(id) {
    const response = await api.put(`/shipments/${id}/reach-next-hub`);
    return response.data;
  },
  async createPod(formData) {
    const response = await api.post("/pod", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
  
  getRouteHubs: async () => {
    const { data } = await api.get("/hubs");
    return data;
  },
  findRoute: async (originHubId, destinationHubId) => {
    const { data } = await api.get(
      `/routes/find?originHubId=${originHubId}&destinationHubId=${destinationHubId}`,
    );
    return data;
  },
};



export const notificationsApi = {
  async list() {
    let serverNotifs = [];
    try {
      const user = await authApi.me();
      if (user?.id) {
        const response = await api.get(`/notifications/user/${user.id}`);
        serverNotifs = response.data.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          read: notification.isRead,
          timestamp: notification.createdAt,
          type: "shipment",
          severity: notification.priority === "HIGH" ? "warning" : "info",
          shipmentId: notification.shipmentId,
        }));
      }
    } catch (e) {
      console.warn("Server notifications fetch error:", e);
    }

    try {
      const local = JSON.parse(localStorage.getItem("shiptrack_route_notifications") || "[]");
      return [...local, ...serverNotifs];
    } catch {
      return serverNotifs;
    }
  },

  sendRouteUpdateNotification({ trackingNumber, customerEmail, customerName, newRoute, eta, reason }) {
    const notif = {
      id: "route-notif-" + Date.now(),
      title: `Route Update: ${trackingNumber}`,
      message: `Transit corridor updated to ${newRoute}. Updated ETA: ${eta}. Carrier note: ${reason || "Optimal traffic flow & fuel savings"}. Recipient ${customerName || ""} informed.`,
      read: false,
      timestamp: new Date().toISOString(),
      type: "shipment",
      severity: "info",
      shipmentId: trackingNumber,
      customerEmail,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("shiptrack_route_notifications") || "[]");
      localStorage.setItem("shiptrack_route_notifications", JSON.stringify([notif, ...existing]));
    } catch (err) {
      console.error("Failed to store route notification:", err);
    }
    return notif;
  },

  async markRead(id) {
    try {
      const local = JSON.parse(localStorage.getItem("shiptrack_route_notifications") || "[]");
      const updated = local.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem("shiptrack_route_notifications", JSON.stringify(updated));
    } catch {}

    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch {
      return { success: true };
    }
  },

  async markAllRead() {
    try {
      const local = JSON.parse(localStorage.getItem("shiptrack_route_notifications") || "[]");
      const updated = local.map((n) => ({ ...n, read: true }));
      localStorage.setItem("shiptrack_route_notifications", JSON.stringify(updated));
    } catch {}

    try {
      const user = await authApi.me();
      if (user?.id) {
        const unread = await api.get(`/notifications/user/${user.id}/unread`);
        await Promise.all(
          unread.data.map((n) => api.put(`/notifications/${n.id}/read`)),
        );
      }
    } catch {}
    return true;
  },
};

// --- Tickets Storage & API ---
const TICKETS_KEY = "shiptrack.tickets";

const TICKETS_VERSION_KEY = "shiptrack.tickets.v2";

const INITIAL_TICKETS = [
  {
    id: "tkt-1",
    reference: "TKT-4821",
    subject: "ETA Window for MacBook Pro (TRK-88A1901B)",
    customer: "Manju Arul",
    customerId: 3,
    customerEmail: "manju@gmail.com",
    shipmentTracking: "TRK-88A1901B",
    status: "in_progress",
    priority: "high",
    channel: "chat",
    assignee: "HEMA PRIYA",
    assigneeId: 5,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    messages: [
      {
        id: "m1",
        author: "Manju Arul",
        body: "Hi support team, my shipment TRK-88A1901B shows Out for Delivery. What is the approximate ETA window?",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: "m2",
        author: "HEMA PRIYA",
        body: "Hello Manju! Support Agent Hema here. Driver Ragu Nanthan is on T. Nagar Main Road and is estimated to reach within 45 minutes.",
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      },
    ],
  },
  {
    id: "tkt-2",
    reference: "TKT-4822",
    subject: "Reschedule Failed Delivery on TRK-55F8102C",
    customer: "Manju Arul",
    customerId: 3,
    customerEmail: "manju@gmail.com",
    shipmentTracking: "TRK-55F8102C",
    status: "open",
    priority: "express",
    channel: "portal",
    assignee: "Support Team",
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    messages: [
      {
        id: "m1",
        author: "Manju Arul",
        body: "My package TRK-55F8102C was marked as Failed Delivery. Please do not return to sender! Can you reattempt tomorrow morning after 10 AM?",
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "tkt-3",
    reference: "TKT-4823",
    subject: "Security gate code clearance for medical kit (TRK-61A1187P)",
    customer: "Priya Bala",
    customerId: 4,
    customerEmail: "testcustomer@test.com",
    shipmentTracking: "TRK-61A1187P",
    status: "in_progress",
    priority: "express",
    channel: "chat",
    assignee: "HEMA PRIYA",
    assigneeId: 5,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    messages: [
      {
        id: "m1",
        author: "Priya Bala",
        body: "Security blocked the driver at Green Meadows gate. I have given visitor code 4491 at security desk. Please tell driver to reattempt.",
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      },
      {
        id: "m2",
        author: "HEMA PRIYA",
        body: "Understood Priya! I have dispatched the gate code 4491 to driver Ragu Nanthan on Tata Ace VEH-001. Reattempt in progress.",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ],
  },
  {
    id: "tkt-4",
    reference: "TKT-4824",
    subject: "Request digital copy of delivery signature for TRK-22E9043M",
    customer: "Priya Bala",
    customerId: 4,
    customerEmail: "testcustomer@test.com",
    shipmentTracking: "TRK-22E9043M",
    status: "resolved",
    priority: "standard",
    channel: "email",
    assignee: "HEMA PRIYA",
    assigneeId: 5,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    messages: [
      {
        id: "m1",
        author: "Priya Bala",
        body: "Chair was delivered today. Need the verified POD copy for office expense reimbursement.",
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
      {
        id: "m2",
        author: "HEMA PRIYA",
        body: "Hi Priya! Your digital POD has been verified and is available directly under Shipment TRK-22E9043M details.",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
    ],
  },
  {
    id: "tkt-5",
    reference: "TKT-4825",
    subject: "Address Correction on B2B Freight TRK-7DF77E03",
    customer: "Tharun Kruthik",
    customerId: 2,
    customerEmail: "tharun@gmail.com",
    shipmentTracking: "TRK-7DF77E03",
    status: "closed",
    priority: "standard",
    channel: "portal",
    assignee: "HEMA PRIYA",
    assigneeId: 5,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    messages: [
      {
        id: "m1",
        author: "Tharun Kruthik",
        body: "Please update delivery dock location to Bay 3B.",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: "m2",
        author: "HEMA PRIYA",
        body: "Delivery instructions updated to Bay 3B. Marking as closed.",
        timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
      },
    ],
  },
];

function getStoredTickets() {
  const version = localStorage.getItem(TICKETS_VERSION_KEY);
  if (!version) {
    localStorage.setItem(TICKETS_VERSION_KEY, "v2");
    localStorage.setItem(TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
    return INITIAL_TICKETS;
  }
  const raw = localStorage.getItem(TICKETS_KEY);
  if (!raw) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(INITIAL_TICKETS));
    return INITIAL_TICKETS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_TICKETS;
  }
}

function saveStoredTickets(tickets) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

export const ticketsApi = {
  async list() {
    await latency();
    return clone(getStoredTickets());
  },
  async getById(id) {
    await latency();
    if (!id || id === "new") return null;
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => String(t.id) === String(id) || t.reference === id);
    return ticket ? clone(ticket) : null;
  },
  async create(data) {
    await latency();
    const tickets = getStoredTickets();
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `tkt-${Date.now()}`;
    const newTicket = {
      id: newId,
      reference: `TKT-${refNum}`,
      subject: data.subject || "Support Inquiry",
      customer: data.customer || "Customer",
      customerId: data.customerId ?? null,
      customerEmail: data.customerEmail || "",
      shipmentTracking: data.shipmentTracking || null,
      status: "open",
      priority: data.priority || "standard",
      channel: data.channel || "portal",
      assignee: "Support Team",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `m-${Date.now()}`,
          author: data.customer || "Customer",
          body: data.message || data.description || data.subject,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    tickets.unshift(newTicket);
    saveStoredTickets(tickets);
    return clone(newTicket);
  },
  async reply(id, body, author) {
    await latency();
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => String(t.id) === String(id) || t.reference === id);
    if (!ticket) throw new Error("Ticket not found");
    ticket.messages = ticket.messages || [];
    ticket.messages.push({
      id: `m-${Date.now()}`,
      author,
      body,
      timestamp: new Date().toISOString(),
    });
    ticket.updatedAt = new Date().toISOString();
    if (ticket.status === "open") ticket.status = "in_progress";
    saveStoredTickets(tickets);
    return clone(ticket);
  },
  async updateStatus(id, status) {
    await latency();
    const tickets = getStoredTickets();
    const ticket = tickets.find((t) => String(t.id) === String(id) || t.reference === id);
    if (!ticket) throw new Error("Ticket not found");
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    saveStoredTickets(tickets);
    return clone(ticket);
  },
};

const SEEDED_ACTIVITY_OFFSETS = {
  "hema@gmail.com": 42 * 60 * 1000, // 42 mins ago
  "tharun@gmail.com": 2 * 60 * 60 * 1000 + 18 * 60 * 1000, // ~2.3 hours ago
  "ragu@gmail.com": 5 * 60 * 60 * 1000 + 12 * 60 * 1000, // ~5.2 hours ago
  "manju@gmail.com": 8 * 60 * 60 * 1000 + 40 * 60 * 1000, // ~8.6 hours ago
  "testcustomer@test.com": 26 * 60 * 60 * 1000, // ~1 day ago
};

export const teamApi = {
  async list() {
    const response = await api.get("/admin/users");

    const sessionRaw = sessionStorage.getItem(STORAGE_KEY);
    let sessionEmail = null;
    try {
      if (sessionRaw) {
        sessionEmail = JSON.parse(sessionRaw)?.user?.email?.toLowerCase();
      }
    } catch {}

    return response.data.map((user, idx) => {
      const emailKey = user.email?.toLowerCase();
      if (user.id) {
        localStorage.removeItem(`last_active_${user.id}`);
      }
      const localActive = emailKey ? localStorage.getItem(`last_active_${emailKey}`) : null;
      let effectiveLastActive = user.lastLogin || localActive;

      if (!effectiveLastActive || effectiveLastActive === "—") {
        let seededTime = emailKey ? localStorage.getItem(`seeded_active_${emailKey}`) : null;
        if (!seededTime) {
          const offset = SEEDED_ACTIVITY_OFFSETS[emailKey] ?? ((idx + 1) * 3 * 3600 * 1000);
          seededTime = new Date(Date.now() - offset).toISOString();
          if (emailKey) {
            localStorage.setItem(`seeded_active_${emailKey}`, seededTime);
          }
        }
        effectiveLastActive = seededTime;
      }

      return {
        id: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0],
        email: user.email,
        phone: user.phone || "—",
        role: (user.role || "").toLowerCase(),
        status: user.active ? "active" : "suspended",
        lastActive: effectiveLastActive,
      };
    });
  },

  async updateStatus(id, status) {
    if (status === "active") {
      await api.put(`/admin/users/${id}/activate`);
    } else if (status === "suspended") {
      await api.put(`/admin/users/${id}/deactivate`);
    } else {
      throw new Error(`Unsupported status: ${status}`);
    }

    return { id, status };
  },
};
const ROLE_TITLE = {
  admin: "Administrator",
  operator: "Logistics Operator",
  business: "Business Client",
  customer: "Customer",
  support: "Support Agent",
};



// --- Analytics ---




export const analyticsApi = {
  async get(startDate, endDate) {
    const response = await api.get("/analytics/admin/dashboard", {
      params: {
        startDate,
        endDate,
      },
    });

    return response.data;
  },

  async getBusinessDashboard(businessClientId, startDate, endDate) {
    const response = await api.get(
      `/analytics/business/${businessClientId}/dashboard`,
      {
        params: {
          startDate,
          endDate,
        },
      },
    );

    return response.data;
  },

  async activity() {
    await latency(150, 350);
    return clone(db.activityFeed);
  },

  async exportPdf(startDate, endDate) {
    const response = await api.get("/analytics/admin/dashboard/pdf", {
      params: {
        startDate,
        endDate,
      },
      responseType: "blob",
    });

    return response.data;
  },

  async exportBusinessPdf(businessClientId, startDate, endDate) {
    const response = await api.get(
      `/analytics/business/${businessClientId}/dashboard/pdf`,
      {
        params: {
          startDate,
          endDate,
        },
        responseType: "blob",
      },
    );

    return response.data;
  },
};

export default api;



export const etaPredictionsApi = {
  async list() {
    try {
      const res = await api.get("/analytics/eta");
      if (Array.isArray(res.data)) return res.data;
      return [];
    } catch {
      return [];
    }
  },
};




export const podApi = {
  async list() {
    const response = await api.get("/pod");
    return response.data;
  },

  async create(formData) {
    const response = await api.post("/pod", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  async verify(id) {
    const response = await api.put(`/pod/${id}/verify`);
    return response.data;
  },
};

export const mlApi = {
  async health() {
    const response = await api.get("/ml/health");
    return response.data;
  },
  async predictEta(payload) {
    const response = await api.post("/ml/predict-eta", payload);
    return response.data;
  },
  async classifyTicket(payload) {
    const response = await api.post("/ml/classify-ticket", payload);
    return response.data;
  },
  async optimizeRoute(payload) {
    const response = await api.post("/ml/optimize-route", payload);
    return response.data;
  },
};






