import { useGetDeliveries, useUpdateDeliveryStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronDown, WifiOff } from "lucide-react";
import { useState } from "react";
import type { DeliveryStatusUpdateStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDeliveriesQueryKey } from "@workspace/api-client-react";
import { useOffline } from "@/hooks/use-offline";
import { useToast } from "@/hooks/use-toast";

export default function Deliveries() {
  const { data: deliveries, isLoading } = useGetDeliveries();
  const updateStatus = useUpdateDeliveryStatus();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const { isOnline, enqueue } = useOffline();
  const { toast } = useToast();

  const filteredDeliveries = deliveries?.filter(d => filter === "all" || d.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "out_for_delivery": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "returned": return "bg-red-100 text-red-800 border-red-200";
      case "undelivered": return "bg-gray-100 text-gray-800 border-gray-200";
      case "attempted": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "";
    }
  };

  const handleUpdateStatus = (id: number, status: DeliveryStatusUpdateStatus) => {
    if (!isOnline) {
      enqueue({ type: "updateDeliveryStatus", id, status }).then(() => {
        queryClient.setQueryData(
          getGetDeliveriesQueryKey(),
          (old: typeof deliveries) => old?.map(d => d.id === id ? { ...d, status } : d),
        );
        toast({
          title: "Saved offline",
          description: "Status change queued — will sync when reconnected.",
        });
      });
      return;
    }

    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDeliveriesQueryKey() });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground mt-1">Track and manage mail item deliveries.</p>
        </div>
        <div className="flex gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              <WifiOff className="h-3 w-3" /> Offline — status changes will sync later
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {filter.replace("_", " ")} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("pending")}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("out_for_delivery")}>Out for Delivery</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("delivered")}>Delivered</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("attempted")}>Attempted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("returned")}>Returned</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("undelivered")}>Undelivered</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>New Delivery</Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking No.</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Beat</TableHead>
              <TableHead>Postman</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredDeliveries?.length ? (
              filteredDeliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-xs">{delivery.trackingNumber}</TableCell>
                  <TableCell>
                    <div className="font-medium">{delivery.recipientName}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{delivery.recipientAddress}</div>
                  </TableCell>
                  <TableCell>{delivery.beatName}</TableCell>
                  <TableCell>{delivery.postmanName}</TableCell>
                  <TableCell className="capitalize">{delivery.articleType.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(delivery.status)}>
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.id, "delivered" as DeliveryStatusUpdateStatus)}>
                          Mark Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.id, "attempted" as DeliveryStatusUpdateStatus)}>
                          Mark Attempted
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(delivery.id, "returned" as DeliveryStatusUpdateStatus)}>
                          Mark Returned
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No deliveries found matching the filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
