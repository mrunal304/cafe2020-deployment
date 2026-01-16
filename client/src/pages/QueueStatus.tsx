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
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-400 p-4 border-2 border-stone-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-2 border-stone-800 p-2 text-stone-800 font-black flex flex-col items-center">
              <span className="text-xl tracking-tighter">Prithvi</span>
              <div className="w-12 h-12 border-2 border-stone-800 rounded-full flex items-center justify-center my-1">
                 <div className="w-8 h-8 border-t-4 border-stone-800 rounded-full rotate-45" />
              </div>
              <span className="text-xl tracking-tighter">CAFÉ</span>
            </div>
          </div>
        </div>
        
        <p className="font-bold text-stone-800 text-sm">Prithvi Cafe - Juhu</p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <h2 className="text-3xl font-black text-stone-800">Queued!</h2>
        
        <p className="text-stone-800 text-[10px] font-medium opacity-80">
          Restaurant Timings: 10:30 am to 10:30 pm (Monday to Sunday)
        </p>

        <div className="py-2">
          <span className="text-stone-800 font-bold text-sm block mb-1">Your queue number is</span>
          <h1 className="text-6xl font-black text-stone-800">
            # {queue.queueNumber}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col items-center justify-center min-h-[120px]">
            <span className="text-stone-800 font-bold text-sm mb-2">Booking for</span>
            <span className="text-orange-500 text-3xl font-black">{queue.numberOfPeople}</span>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col items-center justify-center min-h-[120px]">
            <span className="text-stone-800 font-bold text-sm mb-2">Date & Time</span>
            <span className="text-orange-500 text-lg font-black leading-tight">
              {format(new Date(queue.createdAt!), 'dd MMM, hh:mm a')}
            </span>
          </div>
        </div>

        <div className="pt-2 pb-4">
          <p className="text-stone-400 font-bold text-sm mb-4">Name: {queue.name}</p>
          <Button 
            variant="outline" 
            className="bg-white text-stone-800 border-stone-200 font-bold px-8 h-12 rounded-xl shadow-sm hover:bg-stone-50"
            onClick={() => {/* Add leave queue logic if needed */}}
          >
            Leave Queue
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 flex border-t border-stone-200 bg-white">
          <button className="flex-1 h-16 flex items-center justify-center gap-2 font-bold text-stone-800 border-r border-stone-200 hover:bg-stone-50 transition-colors">
            <span className="text-xl">Share with Friends</span>
          </button>
          <button className="flex-1 h-16 flex items-center justify-center gap-2 font-bold text-white bg-[#FF9933] hover:bg-[#e68a2e] transition-colors">
            <span className="text-xl">Get Direction</span>
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}
