import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. This page requires admin privileges.
          </p>
          <a href="/" className="text-purple-600 hover:text-purple-800 font-medium">
            Return to Dashboard
          </a>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
