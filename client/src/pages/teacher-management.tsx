import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { TeacherList } from "@/components/teacher/teacher-list";
import { TeacherForm } from "@/components/teacher/teacher-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, TeacherClass } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { UserCog } from "lucide-react";

export default function TeacherManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch teachers
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/admin/teachers"],
  });

  // Fetch teacher class assignments
  const { data: teacherClasses } = useQuery<Record<number, TeacherClass[]>>({
    queryKey: ["/api/admin/teacher-classes"],
    queryFn: async () => {
      if (!teachers) return {};
      
      const classAssignments: Record<number, TeacherClass[]> = {};
      
      // For each teacher, fetch their classes
      for (const teacher of teachers) {
        const res = await fetch(`/api/admin/teachers/${teacher.id}/classes`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const classes = await res.json();
          classAssignments[teacher.id] = classes;
        }
      }
      
      return classAssignments;
    },
    enabled: !!teachers,
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      toast({
        title: "Teacher deleted",
        description: "Teacher has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation (simplified - in real app would send reset link/token)
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      // This would normally reset or send a reset token, but for simplicity:
      await apiRequest("PUT", `/api/admin/teachers/${id}`, {
        password: "lkg123", // Reset to default password
      });
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Teacher's password has been reset to the default (lkg123)",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleDeleteTeacher = (id: number) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      deleteTeacherMutation.mutate(id);
    }
  };

  const handleResetPassword = (id: number) => {
    if (window.confirm("Are you sure you want to reset this teacher's password to the default?")) {
      resetPasswordMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedTeacher(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedTeacher(null);
    queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/teacher-classes"] });
  };

  return (
    <MainLayout title="Manage Teachers">
      {!showForm ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add, edit, and delete teacher accounts
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          </div>

          <TeacherList
            teachers={teachers || []}
            teacherClasses={teacherClasses || {}}
            isLoading={isLoadingTeachers}
            onEdit={handleEditTeacher}
            onDelete={handleDeleteTeacher}
            onResetPassword={handleResetPassword}
          />
        </>
      ) : (
        <TeacherForm
          teacher={selectedTeacher}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </MainLayout>
  );
}
