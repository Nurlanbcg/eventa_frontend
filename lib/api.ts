import { toast } from "sonner";

// Dynamically determine API URL based on environment or hostname
const getApiUrl = () => {
    // Use environment variable if set (for production deployments)
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    if (typeof window !== 'undefined') {
        // Use same hostname as frontend but with port 5000 (for local development)
        return `http://${window.location.hostname}:5000/api`;
    }
    // Fallback for SSR
    return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchOptions extends RequestInit {
    data?: any;
}

async function fetchClient<T>(endpoint: string, { data, ...options }: FetchOptions = {}): Promise<T> {
    const token = localStorage.getItem("token");

    const headers: any = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            // If 401 Unauthorized, maybe logout?
            if (response.status === 401 && !endpoint.includes("/auth/login")) {
                // Optional: Force logout if token expired
            }
            throw new Error(result.message || "An error occurred");
        }

        return result;
    } catch (error: any) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

export const api = {
    auth: {
        login: (data: any) => fetchClient<any>("/auth/login", { method: "POST", data }),
        register: (data: any) => fetchClient<any>("/auth/register", { method: "POST", data }),
        me: () => fetchClient<any>("/auth/me", { method: "GET" }),
        checkSetupStatus: () => fetchClient<any>("/auth/setup-status", { method: "GET" }),
        setup: (data: any) => fetchClient<any>("/auth/setup", { method: "POST", data }),
    },
    events: {
        getAll: (params?: any) => {
            const query = new URLSearchParams(params).toString();
            return fetchClient<any>(`/events?${query}`, { method: "GET" });
        },
        getOne: (id: string) => fetchClient<any>(`/events/${id}`, { method: "GET" }),
        create: (data: any) => fetchClient<any>("/events", { method: "POST", data }),
        update: (id: string, data: any) => fetchClient<any>(`/events/${id}`, { method: "PUT", data }),
        delete: (id: string) => fetchClient<any>(`/events/${id}`, { method: "DELETE" }),
        getStats: () => fetchClient<any>("/events/dashboard/stats", { method: "GET" }),
    },
    drivers: {
        getAll: (params?: any) => {
            const query = new URLSearchParams(params).toString();
            return fetchClient<any>(`/drivers?${query}`, { method: "GET" });
        },
        create: (data: any) => fetchClient<any>("/drivers", { method: "POST", data }),
        update: (id: string, data: any) => fetchClient<any>(`/drivers/${id}`, { method: "PUT", data }),
        changePassword: (id: string, data: any) => fetchClient<any>(`/drivers/${id}/change-password`, { method: "PUT", data }),
        delete: (id: string) => fetchClient<any>(`/drivers/${id}`, { method: "DELETE" }),
        getStats: () => fetchClient<any>("/drivers/dashboard/stats", { method: "GET" }),
    },
    guests: {
        getAll: (params?: any) => {
            const query = new URLSearchParams(params).toString();
            return fetchClient<any>(`/guests?${query}`, { method: "GET" });
        },
        create: (data: any) => fetchClient<any>("/guests", { method: "POST", data }),
        update: (id: string, data: any) => fetchClient<any>(`/guests/${id}`, { method: "PUT", data }),
        delete: (id: string) => fetchClient<any>(`/guests/${id}`, { method: "DELETE" }),
    },
    users: {
        getAll: () => fetchClient<any>("/users", { method: "GET" }),
        create: (data: any) => fetchClient<any>("/users", { method: "POST", data }),
        update: (id: string, data: any) => fetchClient<any>(`/users/${id}`, { method: "PUT", data }),
        delete: (id: string) => fetchClient<any>(`/users/${id}`, { method: "DELETE" }),
    },
    settings: {
        getSessions: () => fetchClient<any>("/settings/sessions", { method: "GET" }),
        terminateSession: (id: string) => fetchClient<any>(`/settings/sessions/${id}`, { method: "DELETE" }),
        getAuditLogs: (limit?: number) => fetchClient<any>(`/settings/audit-logs?limit=${limit || 20}`, { method: "GET" }),
        exportAuditLogs: (range: string) => fetchClient<any>(`/settings/audit-logs/export?range=${range}`, { method: "GET" }),
    },
};
