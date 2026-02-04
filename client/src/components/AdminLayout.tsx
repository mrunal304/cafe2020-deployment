import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LogOut, LayoutDashboard, History, User } from "lucide-react";
import { useLogout, useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/logo_transparent.png";
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
    "--sidebar-background": "30 60% 22%", // #5C3317
    "--sidebar-foreground": "60 40% 98%",
    "--sidebar-primary": "60 40% 98%",
    "--sidebar-primary-foreground": "30 60% 22%",
    "--sidebar-accent": "30 50% 32%",
    "--sidebar-accent-foreground": "60 40% 98%",
    "--sidebar-border": "30 50% 32%",
    "--sidebar-ring": "30 60% 22%",
    "--sidebar-width": "16rem",
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
      <div className="flex h-svh w-full overflow-hidden bg-[#F5F5DC]">
        <Sidebar className="border-none">
          <SidebarHeader className="p-4 flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="h-8 w-auto brightness-0 invert" />
            <span className="font-serif text-xl font-bold text-white tracking-tight">Admin Panel</span>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        className="transition-all duration-200"
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none capitalize">{user?.username || "admin"}</span>
                <span className="text-xs text-white/60 mt-1">Admin</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
