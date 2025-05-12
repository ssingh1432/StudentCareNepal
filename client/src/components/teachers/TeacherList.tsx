import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@shared/schema";

interface TeacherListProps {
  onEditTeacher: (teacher: User) => void;
  onAddTeacher: () => void;
}

const TeacherList = ({ onEditTeacher, onAddTeacher }: TeacherListProps) => {
  const { toast } = useToast();
  
  // Fetch teachers
  const { data: teachers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      
      return response.json();
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      return await apiRequest("POST", `/api/teachers/${teacherId}/reset-password`, {});
    },
    onSuccess: (data) => {
      toast({
        title: "Password reset",
        description: `The teacher's password has been reset to ${data.password}. Please make sure they change it on their first login.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      await apiRequest("DELETE", `/api/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Teacher deleted",
        description: "Teacher has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete teacher",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle teacher deletion
  const handleDeleteTeacher = (teacher: User) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.name}?`)) {
      deleteTeacherMutation.mutate(teacher.id);
    }
  };
  
  // Handle password reset
  const handleResetPassword = (teacher: User) => {
    if (window.confirm(`Are you sure you want to reset ${teacher.name}'s password?`)) {
      resetPasswordMutation.mutate(teacher.id);
    }
  };
  
  // Helper to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Fetch student counts for each teacher
  const { data: studentCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/teachers/student-counts"],
    queryFn: async () => {
      const response = await fetch("/api/teachers/student-counts", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch student counts");
      }
      
      return response.json();
    },
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
          <p className="mt-1 text-sm text-gray-500">Add, edit, and delete teacher accounts</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <Button
            onClick={onAddTeacher}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Classes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-medium">{getInitials(teacher.name)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                          teacher.assignedClasses.map((className, index) => (
                            <Badge
                              key={index}
                              className={`${
                                className === "nursery"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : className === "lkg"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {className.toUpperCase()}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">No classes assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {studentCounts ? (
                        `${studentCounts[teacher.id] || 0} students`
                      ) : (
                        <Loader2 className="h-4 w-4 inline animate-spin text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onEditTeacher(teacher)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleResetPassword(teacher)}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No teachers found. Click "Add Teacher" to create a new teacher account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TeacherList;
