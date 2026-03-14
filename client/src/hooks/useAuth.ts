import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api/client';
import { USER } from '@/lib/api/endpoints';
import type { AxiosError } from 'axios';

/**
 * Waits for Zustand persist hydration, then validates the token
 * by fetching the user profile from the server.
 */
export function useAuthInit() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const ran = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (ran.current) return;
    ran.current = true;

    const token = localStorage.getItem('access_token');

    if (!token) {
      // No token — make sure state reflects that
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        state.setUser(null);
      }
      return;
    }

    // Token exists — validate by fetching profile
    useAuthStore.getState().setLoading(true);

    api
      .get(USER.PROFILE)
      .then((res) => {
        const profile = res.data.data;

        // Flatten roles → permissions into a string[] for the frontend
        const permissions: string[] = [];
        if (Array.isArray(profile.roles)) {
          for (const role of profile.roles) {
            if (Array.isArray(role.permissions)) {
              for (const perm of role.permissions) {
                const slug = typeof perm === 'string' ? perm : perm.slug;
                if (slug && !permissions.includes(slug)) {
                  permissions.push(slug);
                }
              }
            }
          }
        }

        useAuthStore.getState().setUser({
          id: profile._id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: Array.isArray(profile.roles) ? profile.roles.map((r: any) => r.slug || r.name) : [],
          permissions,
          status: profile.status,
          avatar: profile.avatar,
          phone: profile.phone,
          isEmailVerified: profile.is_verified,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        });
      })
      .catch((error: AxiosError) => {
        const status = error.response?.status;
        // Only logout if token is truly invalid (401)
        // For other errors (403, 500, network), keep the session alive
        if (status === 401) {
          useAuthStore.getState().logout();
        }
      })
      .finally(() => {
        useAuthStore.getState().setLoading(false);
      });
  }, [hasHydrated]);
}
