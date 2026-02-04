import { useQueueList, useUpdateQueueStatus, useCallCustomer } from "@/hooks/use-queue";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, CheckCircle, Ban, Clock, Megaphone, Users, Loader2, Calendar, Eye, Copy, Search, RefreshCw, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: queue, isLoading: isQueueLoading, refetch } = useQueueList();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<{name: string, message: string} | null>(null);
  
  const { mutate: updateStatus } = useUpdateQueueStatus();
  const { mutate: callCustomer, isPending: isCalling } = useCallCustomer();

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, [refetch]);

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

  const waitingList = queue?.filter(q => q.status === "waiting") || [];
  const calledList = queue?.filter(q => q.status === "called") || [];
  const activeList = [...calledList, ...waitingList]
    .sort((a, b) => a.queueNumber - b.queueNumber)
    .filter(entry => entry.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCall = (id: string, phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
    callCustomer(id);
  };

  const handleStatus = (id: string, status: any) => {
    updateStatus({ id, status });
  };

  const getBorderColor = (index: number) => {
    if (index < 3) return "border-l-[#0066FF]";
    if (index < 6) return "border-l-[#FF8C00]";
    return "border-l-gray-300";
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-5xl font-serif text-[#4A2810] italic">Recent Activity</h1>
            <p className="text-[#6B6B6B] mt-2 text-lg">Welcome back, here's what's happening today</p>
          </div>
          <Badge className="bg-[#FFA500] hover:bg-[#FFA500] text-white px-6 py-2 rounded-full text-sm font-bold self-start md:self-auto shadow-sm">
            {waitingList.length} Waiting
          </Badge>
        </div>

        {/* Table Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 p-4 rounded-xl">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B8B8B]" />
            <Input 
              placeholder="Search customers..." 
              className="pl-10 bg-white border-[#E0E0E0] rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8B8B8B] font-medium">
            <RefreshCw className="w-3 h-3" />
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#D4C4B0] hover:bg-[#D4C4B0] border-none">
                <TableHead className="w-16 font-bold text-[#2C1810]">#</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Customer</TableHead>
                <TableHead className="text-center font-bold text-[#2C1810]">Party Size</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Wait Time</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Message 💬</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Date & Time</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Status</TableHead>
                <TableHead className="text-right font-bold text-[#2C1810]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Users className="w-12 h-12 text-[#E0E0E0]" />
                      <h3 className="text-lg font-medium text-[#2C1810]">No customers in queue</h3>
                      <p className="text-[#8B8B8B] text-sm">New bookings will appear here automatically</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activeList.map((entry, index) => (
                  <TableRow 
                    key={entry.id} 
                    className={`h-20 hover:bg-[#F0E6D2] transition-colors border-l-4 ${getBorderColor(index)} border-b-[#E0E0E0]`}
                  >
                    <TableCell className="font-bold text-lg text-[#2C1810]">#{entry.queueNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2C1810]">{entry.name}</span>
                          <button className="text-[#5C3317] hover:opacity-70">
                            <Phone className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-[#8B8B8B]">+{entry.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div className="flex items-center justify-center gap-1 text-[#2C1810]">
                        <Users className="w-4 h-4" />
                        {entry.numberOfPeople}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase tracking-tight ${entry.status === 'called' ? 'text-[#0066FF]' : 'text-[#8B8B8B]'}`}>
                          {entry.status === 'called' ? 'Waiting for response...' : 'Waiting'}
                        </span>
                        {entry.status === 'called' && <Loader2 className="w-3 h-3 animate-spin text-[#0066FF] mt-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[150px]">
                        <button 
                          onClick={() => setSelectedMessage({ name: entry.name, message: "Sample message content..." })}
                          className="text-xs text-[#6B6B6B] truncate hover:text-[#2C1810] transition-colors flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          <span className="truncate">No special requests</span>
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-[#6B6B6B]">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.createdAt!), "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(entry.createdAt!), "hh:mm a")}
                        </span>
                        <span className="text-[10px] text-[#8B8B8B] mt-1 italic">
                          {formatDistanceToNow(new Date(entry.createdAt!), { addSuffix: true })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === 'waiting' ? (
                          <Button 
                            size="sm"
                            onClick={() => handleCall(entry.id, entry.phoneNumber)}
                            className="bg-[#0066FF] hover:bg-[#0044CC] text-white px-4"
                          >
                            <Phone className="w-4 h-4 mr-1.5" />
                            Call Now
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleStatus(entry.id, 'confirmed')}
                            className="bg-[#28A745] hover:bg-[#218838] text-white px-4"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Confirm
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleStatus(entry.id, 'cancelled')}
                          className="text-[#8B8B8B] hover:text-[#DC3545] hover:bg-red-50"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C1810]">
              Message from {selectedMessage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-[#6B6B6B] leading-relaxed">
            {selectedMessage?.message}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedMessage(null)} className="border-[#E0E0E0]">
              Mark as Read
            </Button>
            <Button className="bg-[#5C3317] text-white hover:bg-[#452611]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-[#FFA500] text-white",
    confirmed: "bg-[#28A745] text-white",
    waiting: "bg-[#0066FF] text-white",
    seated: "bg-[#6F42C1] text-white",
    called: "bg-[#0066FF] text-white",
    cancelled: "bg-[#DC3545] text-white",
    completed: "bg-[#0066FF] text-white",
    expired: "bg-gray-400 text-white",
  };

  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-[12px] ${styles[status as keyof typeof styles] || styles.waiting}`}>
      {status}
    </span>
  );
}
