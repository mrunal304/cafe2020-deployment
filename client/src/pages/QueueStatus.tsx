import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueueStatus } from "@/hooks/use-queue";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Share2, Navigation, Check } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function QueueStatus() {
  const [, params] = useRoute("/queue/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  
  const { data: queue, isLoading, error } = useQueueStatus(id);

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
      <div className="flex flex-col items-center w-full relative">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#86C37A] text-white w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm"
        >
          <Check className="w-7 h-7 stroke-[3]" />
        </motion.div>

        {/* Headings */}
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black text-stone-900 tracking-tight leading-none mb-2">Queued!</h2>
          <p className="text-[10px] font-bold text-stone-500 uppercase leading-tight opacity-70">
            Restaurant Timings: 10:30 am to 10:30 pm (Monday to Sunday)
          </p>
        </div>

        {/* Queue Info */}
        <div className="text-center mb-6">
          <span className="text-stone-900 font-bold text-xs block mb-1">Your queue number is</span>
          <h1 className="text-7xl font-black text-stone-900 tracking-tighter leading-none">
            # {queue.queueNumber}
          </h1>
        </div>

        {/* Side-by-Side Cards */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col items-center justify-center min-h-[100px]">
            <span className="text-stone-500 font-bold text-[11px] uppercase mb-1">Booking for</span>
            <span className="text-[#F39C12] text-3xl font-black leading-none">{queue.numberOfPeople}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-stone-500 font-bold text-[11px] uppercase mb-1">Date & Time</span>
            <span className="text-[#F39C12] text-sm font-black leading-tight">
              {format(new Date(queue.createdAt!), 'dd MMM, hh:mm a')}
            </span>
          </div>
        </div>

        {/* Name & Leave Queue */}
        <div className="flex flex-col items-center pb-2">
          <p className="text-stone-500 font-bold text-xs mb-3 uppercase">Name: {queue.name}</p>
          <Button 
            variant="outline" 
            className="bg-white text-stone-900 border-stone-200 font-black px-8 h-10 rounded-xl shadow-sm hover:bg-stone-50 uppercase tracking-wide text-xs"
          >
            Leave Queue
          </Button>
        </div>

        {/* Action Buttons - Placed directly below within the flow for smaller screens, but styled for prominence */}
        <div className="w-full flex mt-8 bg-white shadow-lg rounded-xl overflow-hidden border border-stone-100">
          <button className="flex-1 flex items-center justify-center gap-2 py-4 font-black text-stone-800 border-r border-stone-100 hover:bg-stone-50 transition-colors uppercase tracking-tight text-sm">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-4 font-black text-white bg-[#FF9933] hover:bg-[#e68a2e] transition-colors uppercase tracking-tight text-sm">
            <Navigation className="w-4 h-4" />
            Direction
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}
