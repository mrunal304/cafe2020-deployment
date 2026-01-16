import { CustomerLayout } from "@/components/CustomerLayout";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Expired() {
  return (
    <CustomerLayout>
      <div className="text-center py-8 space-y-6">
        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500">
          <AlertCircle className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-3xl font-bold font-display text-stone-800 mb-2">Booking Expired</h1>
          <p className="text-stone-500 max-w-xs mx-auto">
            Sorry, this booking has either expired or was cancelled.
          </p>
        </div>

        <Link href="/" className="inline-flex items-center justify-center w-full h-14 bg-stone-900 text-white rounded-xl font-bold shadow-lg hover:bg-stone-800 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Join Queue Again
        </Link>
      </div>
    </CustomerLayout>
  );
}
