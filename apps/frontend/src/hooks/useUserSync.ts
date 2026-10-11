"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usersService } from "@/lib/api";
import { User } from "@affexai/shared-types";

/**
 * useUserSync Hook
 *
 * Smart polling system that keeps user data synchronized with backend.
 * Detects role changes and provides callbacks for UI updates.
 *
 * Features:
 * - Polls every 3 minutes (180 seconds)
 * - Pauses when tab is not visible (battery saving)
 * - Detects role changes and triggers callbacks
 * - Handles network errors gracefully
 * - Tab synchronization via BroadcastChannel
 *
 * @param options.enabled - Enable/disable polling (default: true)
 * @param options.onRoleChange - Callback when roles change
 * @param options.onError - Callback for errors
 * @param options.pollInterval - Polling interval in ms (default: 180000 = 3 min)
 */

export interface UseUserSyncOptions {
  enabled?: boolean;
  onUserUpdate?: (newUser: User) => void;
  onRoleChange?: (newUser: User, oldUser: User) => void;
  onError?: (error: Error) => void;
  pollInterval?: number;
}

export interface UseUserSyncReturn {
  isPolling: boolean;
  lastSync: Date | null;
  error: Error | null;
  syncNow: () => Promise<void>;
}

const DEFAULT_POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes
const BROADCAST_CHANNEL_NAME = "user-sync-channel";

export function useUserSync(
  options: UseUserSyncOptions = {},
): UseUserSyncReturn {
  const {
    enabled = true,
    onUserUpdate,
    onRoleChange,
    onError,
    pollInterval = DEFAULT_POLL_INTERVAL,
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUserRef = useRef<User | null>(null);
  const isSyncingRef = useRef(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const callbacksRef = useRef({ onUserUpdate, onRoleChange, onError });

  useEffect(() => {
    callbacksRef.current = { onUserUpdate, onRoleChange, onError };
  }, [onUserUpdate, onRoleChange, onError]);

  /**
   * Check if roles have changed
   */
  const hasRolesChanged = useCallback(
    (oldUser: User | null, newUser: User): boolean => {
      if (!oldUser || !oldUser.roles || !newUser.roles) {
        return false;
      }

      // Compare role IDs
      const oldRoleIds = oldUser.roles.map((r) => r.id).sort();
      const newRoleIds = newUser.roles.map((r) => r.id).sort();

      if (oldRoleIds.length !== newRoleIds.length) {
        return true;
      }

      return oldRoleIds.some((id, index) => id !== newRoleIds[index]);
    },
    [],
  );

  /**
   * Sync user data from backend
   */
  const syncUserData = useCallback(async () => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      return;
    }

    try {
      isSyncingRef.current = true;
      setIsPolling(true);
      setError(null);

      const freshUser = await usersService.getCurrentUser();

      // Check for role changes
      if (
        previousUserRef.current &&
        hasRolesChanged(previousUserRef.current, freshUser)
      ) {
        callbacksRef.current.onRoleChange?.(freshUser, previousUserRef.current);

        // Broadcast role change to other tabs
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: "role-changed",
          });
        }
      }

      previousUserRef.current = freshUser;
      setLastSync(new Date());
      callbacksRef.current.onUserUpdate?.(freshUser);
    } catch (err) {
      const error = err as Error;
      console.error("❌ User sync failed:", error);
      setError(error);

      callbacksRef.current.onError?.(error);
    } finally {
      isSyncingRef.current = false;
      setIsPolling(false);
    }
  }, [hasRolesChanged]);

  /**
   * Manual sync trigger
   */
  const syncNow = useCallback(async () => {
    await syncUserData();
  }, [syncUserData]);

  /**
   * Setup polling and visibility detection
   */
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize BroadcastChannel for tab synchronization
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      broadcastChannelRef.current = new BroadcastChannel(
        BROADCAST_CHANNEL_NAME,
      );

      broadcastChannelRef.current.onmessage = (
        event: MessageEvent<unknown>,
      ) => {
        if (
          typeof event.data === "object" &&
          event.data !== null &&
          "type" in event.data &&
          event.data.type === "role-changed"
        ) {
          void syncUserData();
        }
      };
    }

    // Initial sync is scheduled to avoid a cascading render inside this effect.
    const initialSyncTimeout = window.setTimeout(() => {
      void syncUserData();
    }, 0);

    // Setup polling interval
    intervalRef.current = setInterval(() => {
      // Only sync if tab is visible
      if (document.visibilityState === "visible") {
        syncUserData();
      } else {
        console.log("⏸️  Tab not visible, skipping sync (battery saving)");
      }
    }, pollInterval);

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("👁️  Tab became visible, syncing user data...");
        syncUserData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      window.clearTimeout(initialSyncTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [enabled, pollInterval, syncUserData]);

  return {
    isPolling,
    lastSync,
    error,
    syncNow,
  };
}
