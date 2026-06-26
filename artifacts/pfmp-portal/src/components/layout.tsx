import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Home, Map, Users, MapPin, Package, FileText, CalendarCheck, Settings, LogOut, Mailbox, WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Live Map", href: "/map", icon: Map },
  { name: "Beats", href: "/beats", icon: MapPin },
  { name: "Deliveries", href: "/deliveries", icon: Package },
  { name: "Articles", href: "/articles", icon: FileText },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="p-4 flex flex-row items-center gap-2 text-sidebar-primary">
            <Mailbox className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-sidebar-foreground">PFMP Portal</span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href || location.startsWith(item.href + "/")}
                        tooltip={item.name}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-sidebar-foreground">{user?.name}</span>
                  <span className="text-xs text-sidebar-foreground/70 capitalize">{user?.role?.replace("_", " ")}</span>
                </div>
              </div>
              {pendingCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-amber-600 border-amber-300 hover:text-amber-700"
                  onClick={syncNow}
                  disabled={isSyncing || !isOnline}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3 w-3 mr-2" />
                  )}
                  {isSyncing ? "Syncing…" : `${pendingCount} pending`}
                </Button>
              )}
              <SidebarMenuButton onClick={logout} variant="outline" className="mt-2 text-red-400 hover:text-red-500 justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 flex items-center px-4 border-b bg-card">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <span className="ml-4 font-semibold md:hidden">PFMP</span>
            <div className="ml-auto flex items-center gap-2">
              {!isOnline && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                  <WifiOff className="h-3 w-3" />
                  Offline mode
                </span>
              )}
              {pendingCount > 0 && isOnline && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100"
                  onClick={syncNow}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3 w-3 mr-1" />
                  )}
                  {isSyncing ? "Syncing…" : `${pendingCount} unsynced`}
                </Badge>
              )}
            </div>
          </header>

          {!isOnline && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
              <WifiOff className="h-4 w-4 flex-shrink-0" />
              <span>
                You&apos;re offline. Delivery and attendance changes will be saved locally and synced automatically when you reconnect.
                {pendingCount > 0 && (
                  <strong className="ml-1">{pendingCount} change{pendingCount !== 1 ? "s" : ""} queued.</strong>
                )}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
