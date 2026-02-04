import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueueStatus, useAcceptTable, useCancelBooking } from "@/hooks/use-queue";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { PartyPopper, Ban, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
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
import { motion } from "framer-motion";
import { differenceInSeconds } from "date-fns";

export default function Accept() {
  const [, params] = useRoute("/queue/:id/accept");
  const [, setLocation] = useLocation();
  const id = params?.id || "0";
  
  const { data: queue, isLoading } = useQueueStatus(id);
  const { mutate: accept, isPending: isAccepting } = useAcceptTable();
  const { mutate: cancel, isPending: isCancelling } = useCancelBooking();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    if (!queue?.responseDeadline) return;

    const interval = setInterval(() => {
      const now = new Date();
      const deadline = new Date(queue.responseDeadline!);
      const diff = differenceInSeconds(deadline, now);

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // If expired locally, trigger reload or just wait for poll to redirect
        window.location.reload(); 
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [queue?.responseDeadline]);

  // Handle redirects
  useEffect(() => {
    if (!queue) return;
    if (queue.status === 'confirmed') setLocation(`/queue/${queue.id}/confirmed`);
    if (queue.status === 'expired' || queue.status === 'cancelled') setLocation(`/queue/${queue.id}/expired`);
  }, [queue, id, setLocation]);

  const handleAccept = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#16a34a', '#4ade80']
    });
    accept(queue!.id);
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    cancel(queue!.id);
  };

  if (isLoading || !queue) return null;

  const minutes = timeLeft ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft ? timeLeft % 60 : 0;
  const timerColor = (timeLeft || 600) < 120 ? "text-red-500" : (timeLeft || 600) < 300 ? "text-orange-500" : "text-green-600";

  return (
    <CustomerLayout>
      <div className="text-center space-y-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-200">
            <PartyPopper className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        <div>
          <h1 className="text-3xl font-black font-display text-stone-800 mb-2">Your Table is Ready!</h1>
          <p className="text-stone-500 text-lg">We have a spot open for your party of {queue.numberOfPeople}.</p>
        </div>

        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-inner">
          <p className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-2">Please respond in</p>
          <div className={`text-5xl font-mono font-bold ${timerColor} tabular-nums`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isCancelling}
            className="w-full h-16 text-xl font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 hover:scale-[1.02] transition-transform"
          >
            {isAccepting ? <Loader2 className="animate-spin" /> : "I'm Coming!"}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isAccepting || isCancelling}
            className="w-full h-12 font-semibold text-stone-400 hover:text-red-500 hover:bg-red-50"
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancel Booking
          </Button>
        </div>
      </div>

      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="rounded-2xl border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-stone-800">Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500">
              Are you sure you want to give up your spot? You'll have to join the queue again if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-stone-200 text-stone-600">
              Keep my spot
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CustomerLayout>
  );
}
