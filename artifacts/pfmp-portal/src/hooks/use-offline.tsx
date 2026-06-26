import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  enqueueOperation,
  getPendingCount,
  getPendingOperations,
  removeOperation,
  type SyncOperation,
} from "@/lib/offline-db";
import { useToast } from "@/hooks/use-toast";

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  enqueue: (operation: SyncOperation) => Promise<void>;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

async function executeOperation(operation: SyncOperation): Promise<void> {
  const token = localStorage.getItem("pfmp_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (operation.type === "updateDeliveryStatus") {
    const res = await fetch(`/api/deliveries/${operation.id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: operation.status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } else if (operation.type === "checkIn") {
    const res = await fetch("/api/attendance/checkin", {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: operation.userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } else if (operation.type === "checkOut") {
    const res = await fetch(`/api/attendance/${operation.recordId}/checkout`, {
      method: "PATCH",
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const enqueue = useCallback(
    async (operation: SyncOperation) => {
      await enqueueOperation(operation);
      await refreshCount();
    },
    [refreshCount],
  );

  const syncNow = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const pending = await getPendingOperations();
      if (pending.length === 0) return;

      let succeeded = 0;
      let failed = 0;

      for (const entry of pending) {
        try {
          await executeOperation(entry.operation);
          await removeOperation(entry.id!);
          succeeded++;
        } catch {
          failed++;
        }
      }

      await refreshCount();

      if (succeeded > 0) {
        toast({
          title: "Sync complete",
          description: `${succeeded} change${succeeded !== 1 ? "s" : ""} synced.${
            failed > 0 ? ` ${failed} could not be synced.` : ""
          }`,
        });
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshCount, toast]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Syncing pending changes to server…",
      });
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "You are offline",
        description: "Changes will be queued and synced when reconnected.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow, toast]);

  return (
    <OfflineContext.Provider
      value={{ isOnline, pendingCount, isSyncing, enqueue, syncNow }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
