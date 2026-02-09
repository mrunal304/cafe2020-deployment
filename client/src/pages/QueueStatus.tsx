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
    console.log("=== MAIN CARD DEBUG ===");
    console.log("Queue position being displayed in main card:", queue.position || queue.queueNumber || 1);
    console.log("Queue data:", queue);
    console.log("==================");
    
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
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-[var(--terracotta)]" />
          <p>Finding your booking...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !queue) {
    return (
      <CustomerLayout>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-destructive mb-2">Booking Not Found</h2>
          <p className="text-[var(--text-muted)]">Could not find queue entry.</p>
          <a href="/" className="inline-block mt-4 text-[var(--terracotta)] font-medium hover:underline">Return Home</a>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="relative z-10 w-full">
        <div className="bg-[var(--beige)]/95 p-6 rounded-2xl shadow-xl border border-white/20 w-full flex flex-col items-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#4CAF50] text-white w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm"
          >
            <Check className="w-7 h-7 stroke-[3]" />
          </motion.div>

          {/* Headings */}
          <div className="text-center mb-4">
            <h2 className="text-3xl font-black text-[var(--text-dark)] tracking-tight leading-none mb-2">Queued!</h2>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase leading-tight opacity-70">
              Cafe Timings: 12:30 PM to 11:00 PM (Everyday)
            </p>
          </div>

          {/* Queue Info */}
          <div className="text-center mb-6">
            <span className="text-[var(--text-dark)] font-bold text-xs block mb-1">Your queue number is</span>
            <h1 className="text-7xl font-black text-[var(--text-dark)] tracking-tighter leading-none">
              # {queue.position || queue.queueNumber || 1}
            </h1>
            <div className="mt-2 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
              YOU ARE #{queue.position || queue.queueNumber || 1} IN LINE
            </div>
          </div>

          {/* Side-by-Side Cards */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-[var(--off-white)]/90 rounded-2xl p-4 shadow-sm border border-[var(--input-border)] flex flex-col items-center justify-center min-h-[100px]">
              <span className="text-[var(--text-muted)] font-bold text-[11px] uppercase mb-1">Booking for</span>
              <span className="text-[var(--terracotta)] text-3xl font-black leading-none">{queue.numberOfPeople}</span>
            </div>

            <div className="bg-[var(--off-white)]/90 rounded-2xl p-4 shadow-sm border border-[var(--input-border)] flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[var(--text-muted)] font-bold text-[11px] uppercase mb-1">Date & Time</span>
              <span className="text-[var(--terracotta)] text-sm font-black leading-tight">
                {format(new Date(queue.createdAt!), 'dd MMM, hh:mm a')}
              </span>
            </div>
          </div>

          {/* Name & Leave Queue */}
          <div className="flex flex-col items-center pb-2">
            <p className="text-[var(--text-muted)] font-bold text-xs mb-3 uppercase">Name: {queue.name}</p>
            <div className="flex flex-col gap-[15px] w-full items-center">
              <Button 
                variant="outline" 
                onClick={handleLeaveQueue}
                disabled={isLeaving}
                className="bg-[#C46A3A] text-white border-[#C46A3A] font-black px-8 h-10 rounded-xl shadow-sm hover:bg-[#C46A3A] hover:border-[#C46A3A] hover:text-white transition-none uppercase tracking-wide text-xs active:opacity-90 w-full max-w-[200px]"
              >
                {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Leave Queue"}
              </Button>
              <Button
                id="exploreMenuBtn"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/menu.pdf', '_blank');
                }}
                className="bg-[#E6D3B1] text-[#C46A3A] border-[#E6D3B1] font-black px-8 h-10 rounded-xl shadow-sm hover:bg-[#E6D3B1] hover:border-[#E6D3B1] hover:text-[#C46A3A] transition-none uppercase tracking-wide text-xs active:opacity-90 w-full max-w-[200px]"
              >
                Explore Our Menu
              </Button>
            </div>
          </div>
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
