import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AuthProvider } from "@/hooks/use-auth";
import { OfflineProvider } from "@/hooks/use-offline";
import { ProtectedRoute } from "@/components/protected-route";
import { AppLayout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Beats from "@/pages/beats";
import Deliveries from "@/pages/deliveries";
import Articles from "@/pages/articles";
import Attendance from "@/pages/attendance";
import Users from "@/pages/users";
import LiveMap from "@/pages/map";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/map">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <LiveMap />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/beats">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Beats />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/deliveries">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Deliveries />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/articles">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Articles />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/attendance">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Attendance />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/users">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Users />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <OfflineProvider>
              <Router />
            </OfflineProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
