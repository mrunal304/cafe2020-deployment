import { useRoute, useLocation } from "wouter";
import { CustomerLayout } from "@/components/CustomerLayout";
import { Button } from "@/components/ui/button";
import { useQueueStatus } from "@/hooks/use-queue";
import { motion } from "framer-motion";

export default function Expired() {
  const [, params] = useRoute("/queue/:id/expired");
  const [, setLocation] = useLocation();
  const id = params?.id || "0";
  const { data: queue } = useQueueStatus(id);

  const isTimerExpired = queue?.responseType === 'expired' || (queue?.status === 'expired');
  const isCancelledByCustomer = queue?.responseType === 'cancelled';

  return (
    <CustomerLayout>
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl max-w-md mx-auto text-center space-y-6">
        
        {/* Error Icon - Red circle with exclamation */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-2"
        >
          <div className="bg-red-100 rounded-full w-32 h-32 flex items-center justify-center">
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center border-4 border-red-500 shadow-sm">
              <span className="text-red-500 text-4xl font-bold">!</span>
            </div>
          </div>
        </motion.div>
        
        {/* Heading */}
        <h1 className="text-3xl font-black font-display text-stone-900">
          Booking Expired
        </h1>
        
        {/* Error Message */}
        <div className="space-y-2">
          {isTimerExpired ? (
            <>
              <p className="text-stone-500 text-base leading-relaxed">
                Your 10-minute response time has expired.
              </p>
              <p className="text-stone-500 text-base leading-relaxed">
                Please join the queue again to get a new spot.
              </p>
            </>
          ) : isCancelledByCustomer ? (
            <p className="text-stone-500 text-base leading-relaxed">
              Sorry, this booking has either expired or was cancelled.
            </p>
          ) : (
            <p className="text-stone-500 text-base leading-relaxed">
              This booking was cancelled by the restaurant. Please join the queue again if you'd like to visit.
            </p>
          )}
        </div>
        
        {/* Join Queue Again Button */}
        <Button 
          onClick={() => setLocation('/')} 
          className="w-full h-14 bg-stone-900 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-[0.98]"
        >
          <span>←</span>
          <span>Join Queue Again</span>
        </Button>
        
      </div>
    </CustomerLayout>
  );
}
