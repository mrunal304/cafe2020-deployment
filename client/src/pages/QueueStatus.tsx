import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueueStatus } from "@/hooks/use-queue";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Loader2, Calendar, Users, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function QueueStatus() {
  const [, params] = useRoute("/queue/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: queue, isLoading, error } = useQueueStatus(id);

  // Auto-redirect based on status
  useEffect(() => {
    if (!queue) return;

    if (queue.status === "called") {
      setLocation(`/queue/${id}/accept`);
    } else if (queue.status === "completed") {
      setLocation(`/queue/${id}/confirmed`);
    } else if (queue.status === "expired" || queue.status === "cancelled") {
      setLocation(`/queue/${id}/expired`);
    }
  }, [queue, id, setLocation]);

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex flex-col items-center justify-center py-12 text-stone-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-orange-500" />
          <p>Finding your booking...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !queue) {
    return (
      <CustomerLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-red-500 mb-2">Booking Not Found</h2>
          <p className="text-stone-500">Could not find queue entry #{id}.</p>
          <a href="/" className="inline-block mt-4 text-orange-500 font-medium hover:underline">Return Home</a>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-green-100 text-green-700 px-6 py-3 rounded-full inline-flex items-center gap-2 text-sm font-bold shadow-sm"
        >
          <CheckCircle2 className="w-5 h-5" />
          You're in the queue!
        </motion.div>

        <div className="py-6">
          <span className="text-stone-400 font-medium uppercase tracking-widest text-xs block mb-2">Your Ticket Number</span>
          <h1 className="text-8xl font-black font-display text-stone-800 tracking-tighter">
            #{queue.queueNumber}
          </h1>
        </div>

        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-4 shadow-inner">
          <div className="flex items-center justify-between text-stone-600 border-b border-stone-200 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-orange-400" />
              <span className="font-medium">Party Size</span>
            </div>
            <span className="font-bold text-lg">{queue.numberOfPeople} People</span>
          </div>

          <div className="flex items-center justify-between text-stone-600 border-b border-stone-200 pb-3 last:border-0 last:pb-0">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-400" />
              <span className="font-medium">Date</span>
            </div>
            <span className="font-bold">{format(new Date(queue.createdAt!), 'MMM d, yyyy')}</span>
          </div>

          <div className="flex items-center justify-between text-stone-600">
             <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="font-medium">Joined At</span>
            </div>
            <span className="font-bold">{format(new Date(queue.createdAt!), 'h:mm a')}</span>
          </div>
        </div>

        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
          <p>
            <strong>Keep this page open!</strong> The status will update automatically when we're ready for you. We'll also send an SMS to {queue.phoneNumber}.
          </p>
        </div>
      </div>
    </CustomerLayout>
  );
}
