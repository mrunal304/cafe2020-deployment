import { CustomerLayout } from "@/components/CustomerLayout";
import { CheckCircle, MapPin } from "lucide-react";
import { useRoute } from "wouter";
import { useQueueStatus } from "@/hooks/use-queue";

export default function Confirmed() {
  const [, params] = useRoute("/queue/:id/confirmed");
  const id = parseInt(params?.id || "0");
  const { data: queue } = useQueueStatus(id);

  return (
    <CustomerLayout>
      <div className="text-center py-8 space-y-6">
        <div className="bg-green-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-3xl font-bold font-display text-stone-800 mb-2">You're Confirmed!</h1>
          <p className="text-stone-500">
            Thanks {queue?.name}. Please head to the counter and show this screen.
          </p>
        </div>

        <div className="bg-orange-50 p-6 rounded-2xl border-2 border-dashed border-orange-200">
          <span className="block text-orange-400 text-sm font-bold uppercase tracking-widest mb-1">Queue Number</span>
          <span className="block text-5xl font-black text-stone-800">#{queue?.queueNumber}</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>Cafe 2020 Main Counter</span>
        </div>
      </div>
    </CustomerLayout>
  );
}
