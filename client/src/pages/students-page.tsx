import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { StudentList } from "@/components/student/student-list";
import { StudentForm } from "@/components/student/student-form";
import { 
  Dialog, 
  DialogContent,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { studentApi, teacherApi } from "@/lib/api";
import { Student, studentValidationSchema } from "@shared/schema";

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Fetch students
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const filters = user?.role === "teacher" ? { teacherId: user.id } : {};
      return await studentApi.getStudents(filters);
    },
  });
  
  // Fetch teachers (admin only)
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: teacherApi.getTeachers,
    enabled: isAdmin,
  });
  
  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'photo' && value) {
          formData.append('photo', value as Blob);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      if (user?.role === 'teacher') {
        formData.append('teacherId', String(user.id));
      }
      
      return await studentApi.createStudent(formData);
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Added",
        description: "The student has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number; values: any }) => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'photo' && value) {
          formData.append('photo', value as Blob);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      return await studentApi.updateStudent(id, formData);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Updated",
        description: "The student has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => studentApi.deleteStudent(id),
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Deleted",
        description: "The student has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleAddStudent = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmitAdd = (values: any) => {
    addStudentMutation.mutate(values);
  };
  
  const handleSubmitEdit = (values: any) => {
    if (selectedStudent) {
      updateStudentMutation.mutate({ id: selectedStudent.id, values });
    }
  };
  
  const handleConfirmDelete = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };
  
  const handleViewProgress = (student: Student) => {
    navigate(`/progress?studentId=${student.id}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Student Management" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-lg text-gray-600">Loading students...</span>
            </div>
          ) : (
            <StudentList
              students={students}
              teachers={teachers}
              isAdmin={isAdmin}
              onAddStudent={handleAddStudent}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewProgress={handleViewProgress}
            />
          )}
          
          {/* Add Student Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
              <StudentForm
                onSubmit={handleSubmitAdd}
                onCancel={() => setIsAddDialogOpen(false)}
                isSubmitting={addStudentMutation.isPending}
                teachers={teachers}
              />
            </DialogContent>
          </Dialog>
          
          {/* Edit Student Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-4xl">
              {selectedStudent && (
                <StudentForm
                  defaultValues={selectedStudent}
                  onSubmit={handleSubmitEdit}
                  onCancel={() => setIsEditDialogOpen(false)}
                  isSubmitting={updateStudentMutation.isPending}
                  teachers={teachers}
                />
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedStudent?.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
