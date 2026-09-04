import { useEffect, useRef, useState, useCallback } from "react";

export interface CartStatePayload {
  items: unknown[];
  discount: number;
  selectedCustomerId: string;
  receivedAmount: number;
  paymentMethod: "cash" | "credit";
  version: number;
  originClientId: string;
  updatedAt: string;
}

export interface InvoiceSavedPayload {
  invoiceNumber: string;
  invoiceId?: string;
  total: number;
  finalizedBy: string;
  originClientId: string;
  updatedAt: string;
}

export interface UseCheckoutLiveSyncOptions {
  enabled: boolean;
  tenantId: string;
  terminalId: string;
  userRole: string;
  onRemoteCartState: (payload: CartStatePayload) => void;
  onInvoiceFinalized: (payload: InvoiceSavedPayload) => void;
  debounceMs?: number;
}

export interface UseCheckoutLiveSyncResult {
  isConnected: boolean;
  peerCount: number;
  isApplyingRemoteState: () => boolean;
  broadcastCartState: (state: Omit<CartStatePayload, "version" | "originClientId" | "updatedAt">) => void;
  broadcastInvoiceSaved: (payload: Omit<InvoiceSavedPayload, "originClientId" | "updatedAt">) => void;
}

function resolveApiBase(): string {
  const apiBase = (import.meta as any).env?.VITE_API_URL || "https://api.liyanage.ecosystemlk.app/api";
  return apiBase.replace(/\/$/, "");
}

function makeClientId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useCheckoutLiveSync(options: UseCheckoutLiveSyncOptions): UseCheckoutLiveSyncResult {
  const { enabled, tenantId, terminalId, userRole, onRemoteCartState, onInvoiceFinalized, debounceMs = 150 } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const clientIdRef = useRef<string>(makeClientId());
  const versionRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyingRemoteRef = useRef<boolean>(false);

  const onRemoteCartStateRef = useRef(onRemoteCartState);
  const onInvoiceFinalizedRef = useRef(onInvoiceFinalized);
  useEffect(() => { onRemoteCartStateRef.current = onRemoteCartState; }, [onRemoteCartState]);
  useEffect(() => { onInvoiceFinalizedRef.current = onInvoiceFinalized; }, [onInvoiceFinalized]);

  // 🌟 Listen for Server-Sent Events
  useEffect(() => {
    if (!enabled || !tenantId || !terminalId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setPeerCount(0);
      return;
    }

    const apiBase = resolveApiBase();
    const streamUrl = `${apiBase}/sync/stream?tenantId=${encodeURIComponent(tenantId)}&terminalId=${encodeURIComponent(terminalId)}&userRole=${encodeURIComponent(userRole)}&clientId=${encodeURIComponent(clientIdRef.current)}`;
    
    // withCredentials: true මඟින් CORS එක සහ auth cookies handle කරයි
    const es = new EventSource(streamUrl, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    es.onmessage = (event) => {
      try {
        const { event: evName, payload } = JSON.parse(event.data);
        
        if (evName === "connected") {
          setIsConnected(true);      
          if (payload?.initialState) {
            applyingRemoteRef.current = true;
            try {
              onRemoteCartStateRef.current(payload.initialState);
            } finally {
              setTimeout(() => {
                applyingRemoteRef.current = false;
              }, 0);
            }
          }
        } else if (evName === "session_peers") {
          setPeerCount(payload?.count || 0);
        } else if (evName === "sync_cart_state") {
          if (payload.originClientId === clientIdRef.current) return;
          applyingRemoteRef.current = true;
          try {
            onRemoteCartStateRef.current(payload);
          } finally {
            setTimeout(() => { applyingRemoteRef.current = false; }, 0);
          }
        } else if (evName === "invoice_finalized") {
          if (payload.originClientId === clientIdRef.current) return;
          onInvoiceFinalizedRef.current(payload);
        }
      } catch (err) {
        console.warn("[SSE Parse Error]", err);
      }
    };

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      es.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      setPeerCount(0);
    };
  }, [enabled, tenantId, terminalId, userRole]);

  // 🌟 Broadcast changes using standard HTTP POST (No WebSockets needed!)
  const broadcastCartState = useCallback(
    (state: Omit<CartStatePayload, "version" | "originClientId" | "updatedAt">) => {
      if (!enabled || applyingRemoteRef.current) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        versionRef.current += 1;
        const payload: CartStatePayload = {
          ...state,
          version: versionRef.current,
          originClientId: clientIdRef.current,
          updatedAt: new Date().toISOString(),
        };

        fetch(`${resolveApiBase()}/sync/broadcast-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tenantId, terminalId, payload }),
        }).catch(console.warn);
      }, debounceMs);
    },
    [enabled, tenantId, terminalId, debounceMs],
  );

  const broadcastInvoiceSaved = useCallback(
    (payload: Omit<InvoiceSavedPayload, "originClientId" | "updatedAt">) => {
      if (!enabled) return;
      fetch(`${resolveApiBase()}/sync/broadcast-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId,
          terminalId,
          payload: { ...payload, originClientId: clientIdRef.current, updatedAt: new Date().toISOString() },
        }),
      }).catch(console.warn);
    },
    [enabled, tenantId, terminalId],
  );

  return {
    isConnected,
    peerCount,
    isApplyingRemoteState: () => applyingRemoteRef.current,
    broadcastCartState,
    broadcastInvoiceSaved,
  };
}