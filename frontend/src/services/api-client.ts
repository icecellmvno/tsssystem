import { useAuthStore } from '@/stores/auth-store';

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = '/api') {
        this.baseURL = baseURL;
    }

    private getAuthHeaders(): HeadersInit {
        // First try to get token from Zustand store
        let token = useAuthStore.getState().token;
        
        // If not found in store, try localStorage as fallback
        if (!token) {
            token = localStorage.getItem('token');
        }
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();

        const config: RequestInit = {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // Handle 401 Unauthorized
            if (error instanceof Error && error.message.includes('401')) {
                useAuthStore.getState().logout();
                // Also clear localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirect to login
                window.location.href = '/login';
            }
            throw error;
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const url = params ? this.buildUrlWithParams(endpoint, params) : endpoint;
        return this.request<T>(url, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    async patch<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    private buildUrlWithParams(endpoint: string, params: Record<string, any>): string {
        const url = new URL(endpoint, window.location.origin);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(v => url.searchParams.append(key, v.toString()));
                } else {
                    url.searchParams.append(key, value.toString());
                }
            }
        });

        return url.pathname + url.search;
    }
}

export const apiClient = new ApiClient(); 