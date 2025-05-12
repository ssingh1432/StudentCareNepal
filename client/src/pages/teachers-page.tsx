import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Edit, Trash2, KeyRound, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TeacherForm from "@/components/forms/teacher-form";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";

export default function TeachersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  
  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  // Get teachers
  const { data: teachers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Get students
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
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
        description: "The teacher account has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      // In a real implementation, this would reset the password to a default or send a reset link
      await apiRequest("POST", `/api/teachers/${teacherId}/reset-password`);
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "The password has been reset to 'lkg123'",
      });
      setIsResetPasswordDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get student count for a teacher
  const getStudentCount = (teacherId: number) => {
    return students?.filter(student => student.teacherId === teacherId).length || 0;
  };
  
  // Open teacher form for editing or creating
  const handleOpenTeacherForm = (teacher?: User) => {
    setSelectedTeacher(teacher || null);
    setIsTeacherFormOpen(true);
  };
  
  // Confirm teacher deletion
  const handleDeleteTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm password reset
  const handleResetPassword = (teacher: User) => {
    setSelectedTeacher(teacher);
    setIsResetPasswordDialogOpen(true);
  };
  
  // Format assigned classes
  const formatAssignedClasses = (classes: string[]) => {
    return classes.join(", ") || "None";
  };
  
  // Get badge class for a class
  const getClassBadge = (className: string) => {
    const classNames = {
      "Nursery": "badge-nursery",
      "LKG": "badge-lkg",
      "UKG": "badge-ukg"
    };
    return classNames[className as keyof typeof classNames] || "";
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Teacher Management" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
                <p className="mt-1 text-sm text-gray-500">Add, edit, and manage teacher accounts</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex-shrink-0">
                <Button 
                  onClick={() => handleOpenTeacherForm()}
                  className="inline-flex items-center"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Teacher
                </Button>
              </div>
            </div>
            
            {/* Teachers List */}
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
                    {isLoading ? (
                      [...Array(3)].map((_, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="ml-4">
                                <Skeleton className="h-4 w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-36" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Skeleton className="h-8 w-32 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : teachers?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No teachers found. Add a teacher to get started.
                        </td>
                      </tr>
                    ) : (
                      teachers?.map(teacher => (
                        <tr key={teacher.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 font-medium">{teacher.name.charAt(0)}</span>
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
                            {teacher.assignedClasses?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {teacher.assignedClasses.map((cls, idx) => (
                                  <span key={idx} className={`badge ${getClassBadge(cls)}`}>
                                    {cls}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No classes assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getStudentCount(teacher.id)} students
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenTeacherForm(teacher)}
                              className="text-indigo-600 hover:text-indigo-900 mr-2"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResetPassword(teacher)}
                              className="text-yellow-600 hover:text-yellow-900 mr-2"
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTeacher(teacher)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Teacher Form Dialog */}
      {isTeacherFormOpen && (
        <TeacherForm
          teacher={selectedTeacher}
          onClose={() => {
            setIsTeacherFormOpen(false);
            setSelectedTeacher(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedTeacher && (
        <ConfirmationDialog
          title="Delete Teacher"
          message={`Are you sure you want to delete ${selectedTeacher.name}? This action cannot be undone and will remove their access to the system.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          isOpen={isDeleteDialogOpen}
          onConfirm={() => deleteTeacherMutation.mutate(selectedTeacher.id)}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isPending={deleteTeacherMutation.isPending}
        />
      )}
      
      {/* Reset Password Confirmation Dialog */}
      {isResetPasswordDialogOpen && selectedTeacher && (
        <ConfirmationDialog
          title="Reset Password"
          message={`Are you sure you want to reset the password for ${selectedTeacher.name}? Their password will be reset to 'lkg123'.`}
          confirmLabel="Reset Password"
          cancelLabel="Cancel"
          isDestructive={false}
          isOpen={isResetPasswordDialogOpen}
          onConfirm={() => resetPasswordMutation.mutate(selectedTeacher.id)}
          onCancel={() => setIsResetPasswordDialogOpen(false)}
          isPending={resetPasswordMutation.isPending}
        />
      )}
    </div>
  );
}
