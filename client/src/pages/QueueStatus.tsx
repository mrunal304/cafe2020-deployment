import { useEffect, useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueueStatus, useCancelBooking } from "@/hooks/use-queue";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function QueueStatus() {
  const [, params] = useRoute("/queue/:id");
  const [, setLocation] = useLocation();
  const id = params?.id || "0";
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const previousPosition = useRef<number | undefined>(undefined);
  
  const { data: queue, isLoading, error } = useQueueStatus(id);
  const { mutate: leaveQueue, isPending: isLeaving } = useCancelBooking();

  const handleLeaveQueue = () => {
    if (!queue) return;
    setShowConfirm(true);
  };

  const confirmLeave = () => {
    if (!queue) return;
    // @ts-ignore - Using the correct endpoint structure as requested
    import("@/lib/queryClient").then(({ apiRequest, queryClient }) => {
      apiRequest("POST", "/api/bookings/leave-queue", { bookingId: queue.id })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/queue", queue.id] });
          setLocation("/");
        });
    });
  };

  useEffect(() => {
    if (!queue) return;
    
    // Check for promotion
    if (previousPosition.current !== undefined && queue.position !== undefined) {
      if (queue.position < previousPosition.current) {
        setShowPromotion(true);
        setTimeout(() => setShowPromotion(false), 5000);
      }
    }
    previousPosition.current = queue.position;

    if (queue.status === "called") {
      setLocation(`/queue/${queue.id}/accept`);
    } else if (queue.status === "completed") {
      setLocation(`/queue/${queue.id}/confirmed`);
    } else if (queue.status === "expired" || queue.status === "cancelled") {
      setLocation(`/queue/${queue.id}/expired`);
    }
  }, [queue, setLocation]);

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
          <p className="text-stone-500">Could not find queue entry.</p>
          <a href="/" className="inline-block mt-4 text-orange-500 font-medium hover:underline">Return Home</a>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="flex flex-col items-center w-full relative">
        {/* Promotion Alert */}
        <AnimatePresence>
          {showPromotion && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 font-bold whitespace-nowrap"
            >
              <PartyPopper className="w-5 h-5" />
              You moved up! You are now #{queue.position} in line!
            </motion.div>
          )}
        </AnimatePresence>

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
            # {queue.position || 1}
          </h1>
          <div className="mt-2 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
            Welcome to the queue! You are #{queue.position || 1} in line.
          </div>
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
            onClick={handleLeaveQueue}
            disabled={isLeaving}
            className="bg-white text-stone-900 border-stone-200 font-black px-8 h-10 rounded-xl shadow-sm hover:bg-stone-50 uppercase tracking-wide text-xs"
          >
            {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Leave Queue"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl max-w-[90vw] sm:max-w-md bg-white">
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-xl font-black text-stone-900 tracking-tight">Leave Queue?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500 font-medium">
              Are you sure you want to leave the queue? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 mt-4">
            <AlertDialogCancel className="flex-1 mt-0 bg-stone-100 hover:bg-stone-200 border-none text-stone-600 font-bold rounded-xl h-11">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLeave}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-none font-bold rounded-xl h-11 shadow-sm shadow-red-200"
            >
              Leave Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
}
