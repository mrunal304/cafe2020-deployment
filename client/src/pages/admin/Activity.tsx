import { useQueueList } from "@/hooks/use-queue";
import { AdminLayout } from "@/components/AdminLayout";
import { MobileAdminLayout } from "@/components/MobileAdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Loader2, Search, RefreshCw, Users, Phone } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useUser } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

export default function AdminActivity() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/export-bookings?date=${formattedDate}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings_${format(selectedDate, "dd-MMM-yyyy")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const { data: queue, isLoading: isQueueLoading, refetch } = useQueueList(formattedDate, ["waiting", "called", "confirmed", "completed", "cancelled", "expired", "left"]);

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
      setLastUpdated(new Date());
    }, 5000);
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

  const historyList = queue?.filter(entry => 
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()) || [];

  const activityContent = (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-5xl font-serif text-[#4A2810] italic">Recent Activity</h1>
        <p className="text-[#6B6B6B] mt-2 text-base md:text-lg">Track completed and cancelled bookings</p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-white/50 p-6 rounded-xl border border-[#E0E0E0]">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <span className="text-sm font-bold text-[#4A2810] uppercase tracking-wider whitespace-nowrap">Filter by Date:</span>
          <div className="relative w-full md:w-auto">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => date && setSelectedDate(date)}
              dateFormat="dd MMM yyyy"
              className="w-full md:w-48 px-4 py-2 bg-white border border-[#E0E0E0] rounded-lg text-sm font-medium text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#5C3317]/20"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="flex-1 md:flex-none bg-white border-[#E0E0E0] text-[#2C1810] hover:bg-[#F0E6D2]"
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              setSelectedDate(yesterday);
            }}
            className="flex-1 md:flex-none bg-white border-[#E0E0E0] text-[#2C1810] hover:bg-[#F0E6D2]"
          >
            Yesterday
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExport}
            className="flex-1 md:flex-none bg-[#5C3317] border-[#5C3317] text-white hover:bg-[#4A2810] gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export to Excel
          </Button>
        </div>

        <div className="md:ml-auto text-sm font-medium text-[#6B6B6B]">
          Showing bookings for: <span className="text-[#2C1810] font-bold">{format(selectedDate, "dd MMM yyyy")}</span>
        </div>
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

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#D4C4B0] hover:bg-[#D4C4B0] border-none">
                <TableHead className="w-16 font-bold text-[#2C1810]">#</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Customer</TableHead>
                <TableHead className="text-center font-bold text-[#2C1810]">Party Size</TableHead>
                <TableHead className="font-bold text-[#2C1810] hidden sm:table-cell">Wait Time</TableHead>
                <TableHead className="font-bold text-[#2C1810] hidden md:table-cell">Message 💬</TableHead>
                <TableHead className="font-bold text-[#2C1810] hidden lg:table-cell">Date & Time</TableHead>
                <TableHead className="font-bold text-[#2C1810]">Status</TableHead>
                <TableHead className="text-right font-bold text-[#2C1810]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Clock className="w-12 h-12 text-[#E0E0E0]" />
                      <h3 className="text-lg font-medium text-[#2C1810]">No activities found</h3>
                      <p className="text-[#8B8B8B] text-sm">Completed or cancelled bookings will appear here</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                historyList.map((entry) => (
                  <TableRow 
                    key={entry.id} 
                    className="h-20 hover:bg-[#F0E6D2] transition-colors border-b-[#E0E0E0]"
                  >
                    <TableCell className="font-bold text-lg text-[#2C1810]">#{entry.queueNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#2C1810]">{entry.name}</span>
                        </div>
                        <span className="text-xs text-[#8B8B8B]">+{entry.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <div className="flex items-center justify-center gap-1 text-[#2C1810]">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        {entry.numberOfPeople}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-[#8B8B8B]">-</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="max-w-[150px] lg:max-w-[200px]">
                        <div className="text-sm text-[#2C1810] font-medium truncate">
                          {entry.message || "No special requests"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col text-xs text-[#6B6B6B]">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {format(new Date(entry.createdAt!), "dd MMM")}
                        </span>
                        <span className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {format(new Date(entry.createdAt!), "hh:mm a")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-[#5C3317] hover:bg-[#F0E6D2] h-8 md:h-9">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        <AdminLayout>
          {activityContent}
        </AdminLayout>
      </div>
      <div className="md:hidden">
        <MobileAdminLayout>
          {activityContent}
        </MobileAdminLayout>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    confirmed: "bg-[#28A745] text-white",
    completed: "bg-[#28A745] text-white", // Display completed as green "CONFIRMED"
    cancelled: "bg-[#DC3545] text-white",
    expired: "bg-gray-400 text-white",
    called: "bg-[#0066FF] text-white",
    left: "bg-gray-500 text-white",
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'called': return 'Called';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Finished';
      case 'cancelled': return 'Cancelled';
      case 'left': return 'Left Queue';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const label = getStatusLabel(status);

  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-[12px] ${styles[status as keyof typeof styles] || "bg-gray-400 text-white"}`}>
      {label}
    </span>
  );
}
