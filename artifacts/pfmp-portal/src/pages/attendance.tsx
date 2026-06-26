import { useGetAttendance, useCheckIn, useCheckOut } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAttendanceQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useOffline } from "@/hooks/use-offline";
import { useToast } from "@/hooks/use-toast";
import { WifiOff } from "lucide-react";

export default function Attendance() {
  const { data: records, isLoading } = useGetAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline, enqueue } = useOffline();
  const { toast } = useToast();

  const handleCheckIn = () => {
    if (!user) return;

    if (!isOnline) {
      enqueue({ type: "checkIn", userId: user.id }).then(() => {
        toast({
          title: "Check-in saved offline",
          description: "Will be synced to server when reconnected.",
        });
      });
      return;
    }

    checkIn.mutate(
      { data: { userId: user.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
        },
      },
    );
  };

  const handleCheckOut = (recordId: number) => {
    if (!isOnline) {
      enqueue({ type: "checkOut", recordId }).then(() => {
        queryClient.setQueryData(
          getGetAttendanceQueryKey(),
          (old: typeof records) =>
            old?.map(r =>
              r.id === recordId
                ? { ...r, checkOutTime: new Date().toISOString(), status: "present" }
                : r,
            ),
        );
        toast({
          title: "Check-out saved offline",
          description: "Will be synced to server when reconnected.",
        });
      });
      return;
    }

    checkOut.mutate(
      { id: recordId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAttendanceQueryKey() });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track postmen check-ins and field presence.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              <WifiOff className="h-3 w-3" /> Offline — will sync later
            </span>
          )}
          <Button onClick={handleCheckIn} disabled={checkIn.isPending}>
            Check In Now
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Postman</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : records?.length ? (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{record.userName}</TableCell>
                  <TableCell>{new Date(record.checkInTime).toLocaleTimeString()}</TableCell>
                  <TableCell>
                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.status === "present" ? "default" : "secondary"} className="capitalize">
                      {record.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!record.checkOutTime && record.userId === user?.id && (
                      <Button variant="outline" size="sm" onClick={() => handleCheckOut(record.id)} disabled={checkOut.isPending}>
                        Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No attendance records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
