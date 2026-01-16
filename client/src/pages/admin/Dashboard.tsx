import { useQueueList, useUpdateQueueStatus, useCallCustomer } from "@/hooks/use-queue";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, CheckCircle, Ban, Clock, Megaphone, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: queue, isLoading: isQueueLoading } = useQueueList();
  
  const { mutate: updateStatus } = useUpdateQueueStatus();
  const { mutate: callCustomer, isPending: isCalling } = useCallCustomer();

  // Route protection
  if (!isUserLoading && !user) {
    setLocation("/admin");
    return null;
  }

  if (isQueueLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // Filter lists
  const waitingList = queue?.filter(q => q.status === "waiting") || [];
  const calledList = queue?.filter(q => q.status === "called") || [];
  const activeList = [...calledList, ...waitingList].sort((a, b) => a.queueNumber - b.queueNumber);
  
  const historyList = queue?.filter(q => ["confirmed", "completed", "cancelled", "expired"].includes(q.status))
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 10) || [];

  const handleCall = (id: number) => {
    callCustomer(id);
  };

  const handleStatus = (id: number, status: any) => {
    updateStatus({ id, status });
  };

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Queue Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-800">Active Queue</h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-bold px-3 py-1">
              {activeList.length} Waiting
            </Badge>
          </div>

          <div className="space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-dashed border-stone-200">
                <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-900">Queue is empty</h3>
                <p className="text-stone-500">No customers waiting right now.</p>
              </div>
            ) : (
              activeList.map((entry) => (
                <Card key={entry.id} className={`overflow-hidden transition-shadow hover:shadow-md border-l-4 ${entry.status === 'called' ? 'border-l-blue-500 ring-1 ring-blue-100' : 'border-l-orange-500'}`}>
                  <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-stone-100 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-stone-700 shrink-0">
                        #{entry.queueNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-stone-900">{entry.name}</h3>
                          <Badge variant="outline" className="text-stone-500 border-stone-200 bg-stone-50">
                            <Users className="w-3 h-3 mr-1" />
                            {entry.numberOfPeople}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {entry.phoneNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(entry.createdAt!), { addSuffix: true })}
                          </span>
                        </div>
                        {entry.status === 'called' && (
                          <div className="mt-2 text-blue-600 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                             <Loader2 className="w-3 h-3 animate-spin" />
                             Waiting for response...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.status === 'waiting' && (
                        <Button 
                          onClick={() => handleCall(entry.id)}
                          disabled={isCalling}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Megaphone className="w-4 h-4 mr-2" />
                          Call Now
                        </Button>
                      )}

                      {entry.status === 'called' && (
                        <Button 
                          onClick={() => handleStatus(entry.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Arrival
                        </Button>
                      )}

                      <Button 
                        variant="outline"
                        size="icon"
                        onClick={() => handleStatus(entry.id, 'cancelled')}
                        className="text-stone-400 hover:text-red-500 hover:bg-red-50"
                        title="Cancel Booking"
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* History Sidebar */}
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-stone-800">Recent Activity</h2>
           <Card>
             <CardContent className="p-0">
               <div className="divide-y divide-stone-100">
                 {historyList.map((entry) => (
                   <div key={entry.id} className="p-4 hover:bg-stone-50 transition-colors">
                     <div className="flex justify-between items-start mb-1">
                       <span className="font-semibold text-stone-800">#{entry.queueNumber} {entry.name}</span>
                       <span className="text-xs text-stone-400">{formatDistanceToNow(new Date(entry.updatedAt!), { addSuffix: true })}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm text-stone-500">{entry.numberOfPeople} people</span>
                        <StatusBadge status={entry.status} />
                     </div>
                   </div>
                 ))}
                 {historyList.length === 0 && (
                   <div className="p-8 text-center text-stone-400 text-sm">
                     No history yet.
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    waiting: "bg-orange-100 text-orange-700 border-orange-200",
    called: "bg-blue-100 text-blue-700 border-blue-200",
    confirmed: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-stone-100 text-stone-700 border-stone-200",
    cancelled: "bg-red-50 text-red-600 border-red-100",
    expired: "bg-stone-100 text-stone-500 border-stone-200",
  };

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${styles[status as keyof typeof styles] || styles.waiting}`}>
      {status}
    </span>
  );
}
