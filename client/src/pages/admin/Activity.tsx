import { useQueueList } from "@/hooks/use-queue";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AdminActivity() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: queue, isLoading: isQueueLoading } = useQueueList();

  if (!isUserLoading && !user) {
    setLocation("/admin");
    return null;
  }

  if (isQueueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5C3317]" />
      </div>
    );
  }

  const historyList = queue?.filter(q => ["confirmed", "completed", "cancelled", "expired"].includes(q.status))
    .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
    .slice(0, 30) || [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif text-[#2C1810]">Recent Activity Overview</h1>
          <p className="text-[#6B6B6B] mt-2">Track completed and cancelled bookings</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {historyList.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-dashed border-[#E0E0E0]">
              <Clock className="w-12 h-12 text-[#E0E0E0] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#2C1810]">No activities yet</h3>
              <p className="text-[#8B8B8B]">History will appear here as bookings are processed</p>
            </div>
          ) : (
            historyList.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow border-[#E0E0E0]">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-[#F0E6D2] w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-[#2C1810]">
                        #{entry.queueNumber}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-[#2C1810] capitalize">{entry.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-[#8B8B8B]">
                          <Users className="w-3 h-3" />
                          <span>{entry.numberOfPeople} people</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-[#8B8B8B] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(entry.updatedAt!), { addSuffix: true })}
                        </span>
                        <StatusBadge status={entry.status} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    confirmed: "bg-[#28A745] text-white",
    completed: "bg-[#0066FF] text-white",
    cancelled: "bg-[#DC3545] text-white",
    expired: "bg-gray-400 text-white",
  };

  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-[12px] ${styles[status as keyof typeof styles] || "bg-gray-400 text-white"}`}>
      {status}
    </span>
  );
}
