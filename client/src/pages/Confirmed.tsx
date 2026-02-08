import { CustomerLayout } from "@/components/CustomerLayout";
import { CheckCircle, MapPin } from "lucide-react";
import { useRoute } from "wouter";
import { useQueueStatus } from "@/hooks/use-queue";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function Confirmed() {
  const [, params] = useRoute("/queue/:id/confirmed");
  const id = params?.id || "0";
  const { data: queue } = useQueueStatus(id);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#16a34a', '#4ade80']
    });
  }, []);

  return (
    <CustomerLayout>
      <div className="text-center py-8 space-y-6">
        <div className="bg-[#4CAF50] w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-[#4CAF50]/30">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-3xl font-bold font-display text-[var(--text-dark)] mb-2">You're Confirmed!</h1>
          <p className="text-[var(--text-muted)]">
            Thanks {queue?.name}. Please head to the counter and show this screen.
          </p>
        </div>

        <div className="bg-[var(--beige)]/30 p-6 rounded-2xl border-2 border-dashed border-[var(--beige)]">
          <span className="block text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest mb-1">Queue Number</span>
          <span className="block text-5xl font-black text-[var(--text-dark)]">#{queue?.position || 1}</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm">
          <MapPin className="w-4 h-4" />
          <span>Cafe 2020 Main Counter</span>
        </div>
      </div>
    </CustomerLayout>
  );
}
