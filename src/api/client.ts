// API Client for GateKeeper Backend
// Centralized service layer for all backend communication

import type { User, Entry, Checkpoint, UserRole } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============================================================================
// Types for API Requests/Responses
// ============================================================================

interface AuthRequest {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

interface SyncPushRequest {
  entries: Entry[];
}

interface SyncPushResponse {
  success: boolean;
  accepted: number;
  rejected: number;
  rejected_ids?: string[];
  message: string;
}

interface SyncPullResponse {
  entries: Entry[];
  count: number;
}

interface CreateUserRequest {
  username: string;
  role: UserRole;
  allowed_checkpoints: string[];
  password?: string;
  supervisor_id?: string; // For GATE_OPERATOR: assign to a supervisor
}

interface CreateCheckpointRequest {
  checkpoint_id: string;
  name: string;
  location: string;
}

// ============================================================================
// Error Handling
// ============================================================================

export class APIError extends Error {
  statusCode?: number;
  response?: any;
  
  constructor(
    message: string,
    statusCode?: number,
    response?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchWithAuth(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  
  // Merge with any additional headers from options
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new APIError(
      errorText || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorText
    );
  }

  return response;
}

// ============================================================================
// Authentication API
// ============================================================================

export const authAPI = {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password } as AuthRequest),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new APIError(error.error || 'Login failed', response.status);
    }

    return response.json();
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const response = await fetch(`${API_BASE_URL}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new APIError('Token refresh failed', response.status);
    }

    return response.json();
  },
};

// ============================================================================
// Synchronization API
// ============================================================================

export const syncAPI = {
  /**
   * Push local pending entries to the server
   */
  async push(
    token: string,
    pendingEntries: Entry[]
  ): Promise<SyncPushResponse> {
    const response = await fetchWithAuth(
      '/api/sync/push',
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          entries: pendingEntries,
        } as SyncPushRequest),
      }
    );

    return response.json();
  },

  /**
   * Pull updated entries from the server since last sync
   */
  async pull(token: string, since?: string): Promise<SyncPullResponse> {
    const url = since ? `/api/sync/pull?since=${encodeURIComponent(since)}` : '/api/sync/pull';
    const response = await fetchWithAuth(
      url,
      token,
      {
        method: 'GET',
      }
    );

    return response.json();
  },
};

// ============================================================================
// Admin API
// ============================================================================

export const adminAPI = {
  /**
   * Get all users (Admin only)
   */
  async getUsers(token: string): Promise<User[]> {
    const response = await fetchWithAuth('/api/admin/users', token, {
      method: 'GET',
    });
    return response.json();
  },

  /**
   * Create a new user (Admin only)
   */
  async createUser(token: string, userData: CreateUserRequest): Promise<User> {
    const response = await fetchWithAuth('/api/admin/users/create', token, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  /**
   * Update user (Admin only)
   */
  async updateUser(
    token: string,
    userId: string,
    updates: Partial<CreateUserRequest>
  ): Promise<User> {
    const response = await fetchWithAuth('/api/admin/users/update', token, {
      method: 'PUT',
      body: JSON.stringify({ user_id: userId, ...updates }),
    });
    return response.json();
  },

  /**
   * Delete user (Admin only)
   */
  async deleteUser(token: string, userId: string): Promise<void> {
    await fetchWithAuth('/api/admin/users/delete', token, {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  /**
   * Get all checkpoints (Admin only)
   */
  async getCheckpoints(token: string): Promise<Checkpoint[]> {
    const response = await fetchWithAuth('/api/admin/checkpoints', token, {
      method: 'GET',
    });
    return response.json();
  },

  /**
   * Create a new checkpoint (Admin only)
   */
  async createCheckpoint(
    token: string,
    checkpointData: CreateCheckpointRequest
  ): Promise<Checkpoint> {
    const response = await fetchWithAuth(
      '/api/admin/checkpoints/create',
      token,
      {
        method: 'POST',
        body: JSON.stringify(checkpointData),
      }
    );
    return response.json();
  },
};

// ============================================================================
// Supervisor API
// ============================================================================

export const supervisorAPI = {
  /**
   * Get entries (filtered by role)
   */
  async getEntries(token: string): Promise<{ entries: Entry[]; count: number }> {
    const response = await fetchWithAuth('/api/supervisor/entries', token, {
      method: 'GET',
    });
    return response.json();
  },

  /**
   * Export data to CSV (Supervisor/Admin only)
   */
  async exportToCSV(token: string): Promise<Blob> {
    const response = await fetchWithAuth('/api/supervisor/export', token, {
      method: 'GET',
    });
    return response.blob();
  },

  /**
   * Reset user password (Supervisor/Admin only)
   */
  async resetPassword(token: string, userId: string, newPassword: string): Promise<void> {
    await fetchWithAuth('/api/supervisor/reset-password', token, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, new_password: newPassword }),
    });
  },
};

// ============================================================================
// Unified API Client Export
// ============================================================================

export const api = {
  auth: authAPI,
  sync: syncAPI,
  admin: adminAPI,
  supervisor: supervisorAPI,
};

export default api;
