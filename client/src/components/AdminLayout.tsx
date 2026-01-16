import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Coffee, LogOut, Users, History } from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { mutate: logout } = useLogout();
  const { data: user } = useUser();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        window.location.href = "/admin";
      }
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">Cafe 2020 Admin</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-500 hidden sm:inline-block">
              Logged in as <span className="font-semibold text-stone-900">{user?.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-stone-500 hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
