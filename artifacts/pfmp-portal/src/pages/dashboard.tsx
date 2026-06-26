import { useGetDashboardStats, useGetDashboardActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, MapPin, Users, CheckCircle, Clock, FileText, Percent, Activity as ActivityIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useGetDashboardActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground mt-1">Overview of today's field operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : stats ? (
          <>
            <StatCard title="Total Deliveries" value={stats.totalDeliveries} icon={Package} />
            <StatCard title="Delivered Today" value={stats.deliveredToday} icon={CheckCircle} className="text-green-600" />
            <StatCard title="Pending" value={stats.pendingDeliveries} icon={Clock} className="text-amber-500" />
            <StatCard title="Delivery Rate" value={`${stats.deliveryRate}%`} icon={Percent} />
            <StatCard title="Active Postmen" value={stats.activePostmen} icon={Users} />
            <StatCard title="Total Beats" value={stats.totalBeats} icon={MapPin} />
            <StatCard title="Present Today" value={stats.presentToday} icon={Users} className="text-blue-500" />
            <StatCard title="Total Articles" value={stats.totalArticles} icon={FileText} />
          </>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>
        
        {/* We would put a mini map here, but keeping it simple for now */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Field Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-64 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">Go to Live Map for full view</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, className }: { title: string; value: React.ReactNode; icon: any; className?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-muted-foreground ${className || ""}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
