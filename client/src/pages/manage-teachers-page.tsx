import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/MainLayout";
import TeacherList from "@/components/teacher/TeacherList";
import TeacherForm from "@/components/teacher/TeacherForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle } from "lucide-react";
import { useLocation, useRouter } from "wouter";

export default function ManageTeachersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  
  // Redirect non-admin users
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      return apiRequest("DELETE", `/api/teachers/${teacherId}`);
    },
    onSuccess: () => {
      toast({
        title: "Teacher deleted",
        description: "Teacher has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete teacher: ${error.message}`,
      });
    },
  });

  // Reset password mutation (would be implemented in a real app)
  const resetPasswordMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      // In a real implementation, this would call an API endpoint
      // For this demo, we'll simulate a successful password reset
      return new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Teacher password has been reset to default",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
      });
    },
  });

  const handleAddTeacher = () => {
    setSelectedTeacherId(null);
    setShowAddForm(true);
  };

  const handleEditTeacher = (teacherId: number) => {
    setSelectedTeacherId(teacherId);
    setShowAddForm(true);
  };

  const handleDeleteTeacher = (teacherId: number) => {
    if (window.confirm("Are you sure you want to delete this teacher? Any assigned students will be unassigned.")) {
      deleteTeacherMutation.mutate(teacherId);
    }
  };

  const handleResetPassword = (teacherId: number) => {
    if (window.confirm("Are you sure you want to reset this teacher's password to the default?")) {
      resetPasswordMutation.mutate(teacherId);
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setSelectedTeacherId(null);
  };

  return (
    <MainLayout title="Manage Teachers">
      {showAddForm ? (
        <TeacherForm 
          teacherId={selectedTeacherId} 
          onClose={closeForm} 
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
              <p className="mt-1 text-sm text-gray-500">Add, edit, and delete teacher accounts</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={handleAddTeacher}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Teacher
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          ) : (
            <TeacherList 
              teachers={teachers || []}
              onEdit={handleEditTeacher}
              onDelete={handleDeleteTeacher}
              onResetPassword={handleResetPassword}
            />
          )}
        </>
      )}
    </MainLayout>
  );
}
