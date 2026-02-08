import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQueueStatus, useAcceptTable, useCancelBooking } from "@/hooks/use-queue";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { PartyPopper, Ban, Loader2, Check } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { differenceInSeconds } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function Accept() {
  const [, params] = useRoute("/queue/:id/accept");
  const [, setLocation] = useLocation();
  const id = params?.id || "0";
  
  const { data: queue, isLoading } = useQueueStatus(id);
  const { mutate: accept, isPending: isAccepting } = useAcceptTable();
  const { mutate: cancel, isPending: isCancelling } = useCancelBooking();

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  // Countdown timer logic
  useEffect(() => {
    if (!queue?.responseDeadline || queue.status !== 'called') return;

    const interval = setInterval(() => {
      const now = new Date();
      const deadline = new Date(queue.responseDeadline!);
      const diff = differenceInSeconds(deadline, now);

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Instead of reloading, we'll let the polling or a manual status update handle it
        // but for immediate UI feedback we can trigger the expired state
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [queue?.responseDeadline, queue?.status]);

  // Handle timer expiry status update
  useEffect(() => {
    if (timeLeft === 0 && queue?.status === 'called') {
      cancel({ id: queue.id, reason: 'expired' });
    }
  }, [timeLeft, queue?.status, queue?.id, cancel]);

  // Handle redirects
  useEffect(() => {
    if (!queue) return;
    if (queue.status === 'confirmed') setLocation(`/queue/${queue.id}/confirmed`);
    if (queue.status === 'expired' || queue.status === 'cancelled') setLocation(`/queue/${queue.id}/expired`);
  }, [queue, id, setLocation]);

  const handleAccept = () => {
    accept({ id: queue!.id, message });
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    accept({ id: queue!.id, message, onlyMessage: true });
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 3000);
  };

  const quickMessages = [
    "Running 5 mins late",
    "Be there in 10 mins",
    "Still coming"
  ];

  if (isLoading || !queue) return null;

  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 10;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const timerColor = (timeLeft ?? 600) < 120 ? "text-red-500" : (timeLeft ?? 600) < 300 ? "text-orange-500" : "text-green-600";

  return (
    <CustomerLayout>
      <div className="relative z-10 w-full">
        <div className="bg-[var(--beige)]/95 p-6 rounded-2xl shadow-xl border border-white/20 w-full text-center space-y-6 max-w-sm mx-auto">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <div className="bg-[var(--olive)]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-[var(--olive)]/20">
              <PartyPopper className="w-12 h-12 text-[var(--olive)]" />
            </div>
          </motion.div>

          <div>
            <h1 className="text-2xl font-black font-display text-[var(--text-dark)] mb-1">Your Table is Ready!</h1>
            <p className="text-[var(--text-muted)] text-base">We have a spot open for your party of {queue.numberOfPeople}.</p>
          </div>

          <div className="bg-[var(--off-white)]/80 p-4 rounded-2xl border border-[var(--input-border)] shadow-inner">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]/50 mb-1">Please respond in</p>
            <div className={`text-4xl font-mono font-bold ${timerColor} tabular-nums`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Message (Optional)</label>
              <span className="text-[10px] text-[var(--text-muted)]/50">{message.length}/500</span>
            </div>
            <div className="relative group">
              <Textarea
                placeholder="Running late? Let us know..."
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                className="resize-none min-h-[80px] rounded-xl border-[var(--input-border)] focus:border-[var(--olive)]/30 focus:ring-[var(--olive)]/10 transition-all text-sm bg-[var(--off-white)]/90"
              />
              <AnimatePresence>
                {messageSent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-2 right-2 bg-[var(--olive)] text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    Message sent
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickMessages.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setMessage(msg)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[var(--off-white)]/90 text-[var(--text-muted)] hover:bg-[var(--olive)]/10 hover:text-[var(--olive)] border border-[var(--input-border)] hover:border-[var(--olive)]/20 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendMessage}
              className="w-full h-8 text-xs font-bold rounded-lg border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--olive)] hover:bg-[var(--olive)]/10 bg-[var(--off-white)]/90"
            >
              Send Message Only
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={handleAccept}
              disabled={isAccepting || isCancelling}
              className="w-full h-14 text-lg font-bold rounded-xl bg-[var(--olive)] hover:bg-[var(--olive)]/90 text-white shadow-lg shadow-[var(--olive)]/20 hover:scale-[1.02] transition-transform"
            >
              {isAccepting ? <Loader2 className="animate-spin" /> : "I'm Coming!"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowCancelConfirm(true)}
              disabled={isAccepting || isCancelling}
              className="w-full h-10 font-semibold text-[var(--text-muted)] hover:text-destructive hover:bg-destructive/10"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Booking
            </Button>
          </div>
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
              onClick={() => cancel({ id: queue!.id, reason: 'cancelled' })}
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
