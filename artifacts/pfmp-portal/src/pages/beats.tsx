import { useGetBeats } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Beats() {
  const { data: beats, isLoading } = useGetBeats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Beats</h1>
        <p className="text-muted-foreground mt-1">Manage geographic delivery areas.</p>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Post Office</TableHead>
              <TableHead>Assigned Postman</TableHead>
              <TableHead>Houses</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : beats?.length ? (
              beats.map((beat) => (
                <TableRow key={beat.id}>
                  <TableCell className="font-mono text-xs">{beat.code}</TableCell>
                  <TableCell className="font-medium">{beat.name}</TableCell>
                  <TableCell>{beat.postOffice}</TableCell>
                  <TableCell>{beat.assignedPostmanName || "Unassigned"}</TableCell>
                  <TableCell>{beat.totalHouses}</TableCell>
                  <TableCell>
                    <Badge variant={beat.status === "active" ? "default" : "secondary"}>
                      {beat.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No beats found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
