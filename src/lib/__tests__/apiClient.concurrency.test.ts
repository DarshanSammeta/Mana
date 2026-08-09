import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../apiClient';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
    setState: vi.fn(),
  },
}));

describe('apiClient interceptor - Concurrency & Loop Termination', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup store mock
    (useAuthStore.getState as any).mockReturnValue({
      accessToken: 'expired-token',
      user: { id: '1' },
      logout: mockLogout,
      isLoggingOut: false // Initial state
    });

    // Mock window.location
    // // @ts-expect-error
    window.location = new URL('http://localhost:3000');
  });

  it('should handle multiple concurrent 401s and only trigger ONE refresh call', async () => {
    // 1. Mock axios.post to simulate a slow refresh call
    const refreshSpy = vi.spyOn(axios, 'post').mockImplementation(async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
        throw { response: { status: 401 } };
    });

    // 2. Find the interceptor handler
    // // @ts-expect-error
    const authInterceptor = apiClient.interceptors.response.handlers.find(h =>
        h.rejected && h.rejected.toString().includes('refresh')
    );

    // 3. Fire multiple concurrent 401 errors
    const errors = [
        { config: { url: '/api/data1', headers: {}, _retry: false }, response: { status: 401 } },
        { config: { url: '/api/data2', headers: {}, _retry: false }, response: { status: 401 } },
        { config: { url: '/api/data3', headers: {}, _retry: false }, response: { status: 401 } },
    ];

    // Fire them all at once
    console.log('--- FIRING CONCURRENT REQUESTS ---');
    const results = await Promise.allSettled(errors.map(err => authInterceptor.rejected(err)));

    // VERIFICATION:

    // 1. axios.post('/api/auth/refresh') should be called exactly ONCE
    // Even though 3 requests failed with 401, only the first one should start the refresh.
    // The other two should enter the "isRefreshing" queue.
    console.log('Verifying axios.post calls...');
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 2. logout() should be called exactly ONCE
    // When the refresh fails, it triggers logout. The queued requests should also reject.
    console.log('Verifying logout call...');
    expect(mockLogout).toHaveBeenCalledTimes(1);

    // 3. State should be cleared
    expect(useAuthStore.setState).toHaveBeenCalledWith({ accessToken: null, user: null });

    console.log('✅ CONCURRENCY TEST PASSED: Only one refresh attempt and one logout triggered.');
  });
});
