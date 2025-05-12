import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import StudentsPage from "@/pages/students-page";
import StudentForm from "@/pages/student-form";
import ProgressPage from "@/pages/progress-page";
import ProgressForm from "@/pages/progress-form";
import TeachingPlansPage from "@/pages/teaching-plans-page";
import TeachingPlanForm from "@/pages/teaching-plan-form";
import ReportsPage from "@/pages/reports-page";
import TeachersPage from "@/pages/teachers-page";
import TeacherForm from "@/pages/teacher-form";
import AssignStudentsPage from "@/pages/assign-students-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/students" component={StudentsPage} />
      <ProtectedRoute path="/students/new" component={() => <StudentForm />} />
      <ProtectedRoute path="/students/:id" component={() => <StudentForm mode="edit" />} />
      <ProtectedRoute path="/progress" component={ProgressPage} />
      <ProtectedRoute path="/progress/new" component={() => <ProgressForm />} />
      <ProtectedRoute path="/progress/:id" component={() => <ProgressForm mode="edit" />} />
      <ProtectedRoute path="/teaching-plans" component={TeachingPlansPage} />
      <ProtectedRoute path="/teaching-plans/new" component={() => <TeachingPlanForm />} />
      <ProtectedRoute path="/teaching-plans/:id" component={() => <TeachingPlanForm mode="edit" />} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/teachers" component={TeachersPage} adminOnly />
      <ProtectedRoute path="/teachers/new" component={() => <TeacherForm />} adminOnly />
      <ProtectedRoute path="/teachers/:id" component={() => <TeacherForm mode="edit" />} adminOnly />
      <ProtectedRoute path="/assign-students" component={AssignStudentsPage} adminOnly />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
