import cafeLogo from "@/assets/cafe-logo.png";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, LayoutDashboard, History, User } from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/logo_transparent.png";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

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

  const style = {
    "--sidebar-background": "22 39% 39%", // #8B5A3C (Rust/Brown)
    "--sidebar-foreground": "0 0% 100%", // White
    "--sidebar-primary": "0 0% 100%",
    "--sidebar-primary-foreground": "22 39% 39%",
    "--sidebar-accent": "0 0% 100% / 0.1", 
    "--sidebar-accent-foreground": "0 0% 100%",
    "--sidebar-border": "0 0% 100% / 0.2",
    "--sidebar-ring": "22 39% 39%",
    "--sidebar-width": "14rem", // ~224px
    "--sidebar-width-icon": "3rem",
  };

  const menuItems = [
    {
      title: "Active Queue",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Recent Activity",
      url: "/admin/activity",
      icon: History,
    },
  ];

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-svh w-full overflow-hidden bg-[#FDF8F3]">
        <Sidebar className="border-none bg-[#8B5A3C]">
          <SidebarHeader className="p-4 pb-2">
            <div className="flex flex-col items-center mb-2">
              <img 
                src={cafeLogo}
                alt="Cafe Twenty Twenty"
                className="w-20 h-20 object-contain mb-2"
              />
              <h2 className="font-serif text-xl font-normal text-white italic tracking-tight text-center leading-tight">Admin Panel</h2>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 pt-6">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title} className="mb-3">
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        className={cn(
                          "transition-all duration-200 px-4 py-3 h-12 rounded-md border border-transparent",
                          location === item.url 
                            ? "bg-white/10 border-white/40 text-white font-medium shadow-sm" 
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="text-base">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-6 mt-auto border-t border-white/10 bg-transparent">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DCC4B0] flex items-center justify-center border border-white/20">
                  <span className="text-[#8B5A3C] font-bold text-lg">A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-medium text-white leading-none capitalize">{user?.username || "admin"}</span>
                  <span className="text-sm text-white/60 mt-1">Admin</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-fit justify-start text-white border border-white/40 hover:bg-white/10 hover:text-white font-medium h-10 px-6 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
