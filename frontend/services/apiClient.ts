import { apiURL } from './config';

class ApiClient {
    private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        // PDF generation returns a blob
        if (options.headers && (options.headers as any)['Accept'] === 'application/pdf') {
            return await response.blob() as any;
        }

        return response.json();
    }

    get<T>(url: string, options: RequestInit = {}) {
        return this.request<T>(url, { ...options, method: 'GET' });
    }

    post<T>(url: string, body?: any, options: RequestInit = {}) {
        return this.request<T>(url, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }
}

export const apiClient = new ApiClient();
