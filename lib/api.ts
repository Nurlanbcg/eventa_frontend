import type {
    ApiResponse,
    AuthResponse,
    LoginCredentials,
    RegisterData,
    SetupData,
    Event,
    EventsResponse,
    EventDetailResponse,
    EventFormData,
    DashboardStats,
    Driver,
    DriversResponse,
    DriverFormData,
    DriverStats,
    Guest,
    GuestsResponse,
    GuestFormData,
    User,
    Transfer,
    TransfersResponse,
} from './types';

// Dynamically determine API URL based on environment or hostname
const getApiUrl = (): string => {
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

interface FetchOptions extends Omit<RequestInit, 'body'> {
    data?: object;
}

async function fetchClient<T>(endpoint: string, { data, ...options }: FetchOptions = {}): Promise<T> {
    // Check both localStorage and sessionStorage for token
    const token = typeof window !== 'undefined'
        ? (localStorage.getItem("token") || sessionStorage.getItem("token"))
        : null;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
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
            if (response.status === 401 && !endpoint.includes("/auth/login")) {
                // Token expired - could trigger logout here
            }
            throw new Error(result.message || "An error occurred");
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Helper to build query string from params
function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return '';
    const filtered = Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
    return filtered.length ? `?${filtered.join('&')}` : '';
}

export const api = {
    auth: {
        login: (data: LoginCredentials) =>
            fetchClient<AuthResponse>("/auth/login", { method: "POST", data }),
        register: (data: RegisterData) =>
            fetchClient<AuthResponse>("/auth/register", { method: "POST", data }),
        me: () =>
            fetchClient<ApiResponse<{ user: User }>>("/auth/me", { method: "GET" }),
        checkSetupStatus: () =>
            fetchClient<ApiResponse<{ isSetupComplete: boolean }>>("/auth/setup-status", { method: "GET" }),
        setup: (data: SetupData) =>
            fetchClient<AuthResponse>("/auth/setup", { method: "POST", data }),
        forgotPassword: (email: string, language: string = 'en') =>
            fetchClient<ApiResponse<null>>("/auth/forgot-password", { method: "POST", data: { email, language } }),
        resetPassword: (token: string, password: string) =>
            fetchClient<ApiResponse<null>>("/auth/reset-password", { method: "POST", data: { token, password } }),
    },
    events: {
        getAll: (params?: { limit?: number; sort?: string; status?: string }) =>
            fetchClient<ApiResponse<EventsResponse>>(`/events${buildQuery(params)}`, { method: "GET" }),
        getOne: (id: string) =>
            fetchClient<ApiResponse<EventDetailResponse>>(`/events/${id}`, { method: "GET" }),
        create: (data: EventFormData) =>
            fetchClient<ApiResponse<{ event: Event }>>("/events", { method: "POST", data }),
        update: (id: string, data: Partial<EventFormData>) =>
            fetchClient<ApiResponse<{ event: Event }>>(`/events/${id}`, { method: "PUT", data }),
        delete: (id: string) =>
            fetchClient<ApiResponse<null>>(`/events/${id}`, { method: "DELETE" }),
        getStats: () =>
            fetchClient<ApiResponse<DashboardStats>>("/events/dashboard/stats", { method: "GET" }),
    },
    drivers: {
        getAll: (params?: { status?: string; limit?: number }) =>
            fetchClient<ApiResponse<DriversResponse>>(`/drivers${buildQuery(params)}`, { method: "GET" }),
        create: (data: DriverFormData) =>
            fetchClient<ApiResponse<{ driver: Driver }>>("/drivers", { method: "POST", data }),
        update: (id: string, data: Partial<DriverFormData>) =>
            fetchClient<ApiResponse<{ driver: Driver }>>(`/drivers/${id}`, { method: "PUT", data }),
        changePassword: (id: string, data: { currentPassword?: string; newPassword: string }) =>
            fetchClient<ApiResponse<null>>(`/drivers/${id}/change-password`, { method: "PUT", data }),
        delete: (id: string) =>
            fetchClient<ApiResponse<null>>(`/drivers/${id}`, { method: "DELETE" }),
        getStats: () =>
            fetchClient<ApiResponse<DriverStats>>("/drivers/dashboard/stats", { method: "GET" }),
        updateBusyStatus: (data: { status: 'available' | 'offline'; busyReason?: string }) =>
            fetchClient<ApiResponse<{ driver: Driver }>>("/drivers/me/busy-status", { method: "PUT", data }),
    },
    guests: {
        getAll: (params?: { eventId?: string; limit?: number; sort?: string }) =>
            fetchClient<ApiResponse<GuestsResponse>>(`/guests${buildQuery(params)}`, { method: "GET" }),
        create: (data: GuestFormData & { eventId: string }) =>
            fetchClient<ApiResponse<{ guest: Guest }>>("/guests", { method: "POST", data }),
        update: (id: string, data: Partial<GuestFormData>) =>
            fetchClient<ApiResponse<{ guest: Guest }>>(`/guests/${id}`, { method: "PUT", data }),
        delete: (id: string) =>
            fetchClient<ApiResponse<null>>(`/guests/${id}`, { method: "DELETE" }),
    },
    users: {
        getAll: () =>
            fetchClient<ApiResponse<{ users: User[] }>>("/users", { method: "GET" }),
        create: (data: { name: string; email: string; password: string; role: string }) =>
            fetchClient<ApiResponse<{ user: User }>>("/users", { method: "POST", data }),
        update: (id: string, data: Partial<User>) =>
            fetchClient<ApiResponse<{ user: User }>>(`/users/${id}`, { method: "PUT", data }),
        delete: (id: string) =>
            fetchClient<ApiResponse<null>>(`/users/${id}`, { method: "DELETE" }),
    },
    settings: {
        getSessions: () =>
            fetchClient<ApiResponse<{ sessions: { id: string; device: string; lastActive: string }[] }>>("/settings/sessions", { method: "GET" }),
        terminateSession: (id: string) =>
            fetchClient<ApiResponse<null>>(`/settings/sessions/${id}`, { method: "DELETE" }),
        getAuditLogs: (limit?: number) =>
            fetchClient<ApiResponse<{ logs: { action: string; user: string; timestamp: string }[] }>>(`/settings/audit-logs?limit=${limit || 20}`, { method: "GET" }),
        exportAuditLogs: (range: string) =>
            fetchClient<ApiResponse<{ url: string }>>(`/settings/audit-logs/export?range=${range}`, { method: "GET" }),
    },
    transfers: {
        getAll: (params?: { limit?: number; sort?: string }) =>
            fetchClient<ApiResponse<TransfersResponse>>(`/transfers${buildQuery(params)}`, { method: "GET" }),
        getByDriver: (driverId: string) =>
            fetchClient<ApiResponse<TransfersResponse>>(`/transfers/driver/${driverId}`, { method: "GET" }),
        getByEvent: (eventId: string) =>
            fetchClient<ApiResponse<TransfersResponse>>(`/transfers/event/${eventId}`, { method: "GET" }),
        update: (id: string, data: { status?: string }) =>
            fetchClient<ApiResponse<{ transfer: Transfer }>>(`/transfers/${id}`, { method: "PUT", data }),
    },
};
