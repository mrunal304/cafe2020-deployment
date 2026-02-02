import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateQueueRequest, type UpdateQueueStatusRequest } from "@shared/routes";
import { type QueueEntry } from "@shared/schema";

// Customer: Create a queue entry
export function useCreateQueueEntry() {
  return useMutation({
    mutationFn: async (data: CreateQueueRequest) => {
      const res = await fetch(api.queue.create.path, {
        method: api.queue.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        if (res.status === 400) throw new Error("Invalid form data");
        throw new Error("Failed to join queue");
      }
      return api.queue.create.responses[201].parse(await res.json());
    },
  });
}

// Customer: Get status of specific entry (Public, Polling)
export function useQueueStatus(id: string) {
  return useQuery<QueueEntry>({
    queryKey: [api.queue.status.path, id],
    queryFn: async () => {
      const url = buildUrl(api.queue.status.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Queue entry not found");
      return api.queue.status.responses[200].parse(await res.json());
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling if completed, cancelled, or expired
      if (status === 'completed' || status === 'cancelled' || status === 'expired') {
        return false;
      }
      return 5000; // Poll every 5s
    },
    enabled: id !== "0",
  });
}

// Admin: List all queue entries
export function useQueueList() {
  return useQuery<QueueEntry[]>({
    queryKey: [api.queue.list.path],
    queryFn: async () => {
      const res = await fetch(api.queue.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch queue");
      return api.queue.list.responses[200].parse(await res.json());
    },
    refetchInterval: 10000, // Refresh dashboard every 10s
  });
}

// Admin: Update status manually
export function useUpdateQueueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string } & UpdateQueueStatusRequest) => {
      const url = buildUrl(api.queue.updateStatus.path, { id });
      const res = await fetch(url, {
        method: api.queue.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.queue.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.queue.list.path] });
    },
  });
}

// Admin: Call customer
export function useCallCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.queue.call.path, { id });
      const res = await fetch(url, { 
        method: api.queue.call.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to call customer");
      return api.queue.call.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.queue.list.path] });
    },
  });
}

// Customer: Accept table
export function useAcceptTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.queue.accept.path, { id });
      const res = await fetch(url, { 
        method: api.queue.accept.method 
      });
      if (!res.ok) throw new Error("Failed to accept");
      return api.queue.accept.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.queue.status.path, id] });
    },
  });
}

// Customer: Cancel booking
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.queue.cancel.path, { id });
      const res = await fetch(url, { 
        method: api.queue.cancel.method 
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return api.queue.cancel.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.queue.status.path, id] });
    },
  });
}
