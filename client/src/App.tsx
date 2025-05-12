import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "./hooks/use-auth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Progress from "@/pages/Progress";
import Teachers from "@/pages/Teachers";
import Plans from "@/pages/Plans";
import Reports from "@/pages/Reports";
import AssignStudents from "@/pages/AssignStudents";
import NotFound from "@/pages/not-found";
import { lazy, Suspense, useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Protected route wrapper
const ProtectedRoute = ({ component: Component, adminOnly = false, ...rest }: any) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!isLoading && adminOnly && user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, adminOnly, user, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return isAuthenticated && (!adminOnly || user?.role === 'admin') ? (
    <Component {...rest} />
  ) : null;
};

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/students">
        <ProtectedRoute component={Students} />
      </Route>
      <Route path="/progress">
        <ProtectedRoute component={Progress} />
      </Route>
      <Route path="/teachers">
        <ProtectedRoute component={Teachers} adminOnly={true} />
      </Route>
      <Route path="/plans">
        <ProtectedRoute component={Plans} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/assign-students">
        <ProtectedRoute component={AssignStudents} adminOnly={true} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="nepal-central-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Suspense fallback={
              <div className="h-screen w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            }>
              <Router />
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
