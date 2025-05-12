import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ProgressList } from "@/components/progress/progress-list";
import { ProgressForm } from "@/components/progress/progress-form";
import { studentApi, progressApi } from "@/lib/api";
import { Progress, InsertProgress, Student } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function ProgressPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract student ID from URL if available
  const params = new URLSearchParams(location.split('?')[1]);
  const urlStudentId = params.get('studentId') ? parseInt(params.get('studentId')!) : null;
  
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(urlStudentId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<Progress | null>(null);
  
  // Fetch students based on user role
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const filters = user?.role === "teacher" ? { teacherId: user.id } : {};
      return await studentApi.getStudents(filters);
    },
  });
  
  // Set first student as selected if not already set
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);
  
  // Selected student
  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  // Fetch progress for selected student
  const { data: progress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/progress", selectedStudentId],
    queryFn: () => progressApi.getStudentProgress(selectedStudentId!),
    enabled: !!selectedStudentId,
  });
  
  // Add progress mutation
  const addProgressMutation = useMutation({
    mutationFn: (data: InsertProgress) => progressApi.createProgress(data),
    onSuccess: () => {
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/progress", selectedStudentId] });
      toast({
        title: "Progress Recorded",
        description: "The progress has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Record Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Progress> }) => 
      progressApi.updateProgress(id, data),
    onSuccess: () => {
      setIsEditDialogOpen(false);
      setSelectedProgress(null);
      queryClient.invalidateQueries({ queryKey: ["/api/progress", selectedStudentId] });
      toast({
        title: "Progress Updated",
        description: "The progress entry has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete progress mutation
  const deleteProgressMutation = useMutation({
    mutationFn: (id: number) => progressApi.deleteProgress(id),
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setSelectedProgress(null);
      queryClient.invalidateQueries({ queryKey: ["/api/progress", selectedStudentId] });
      toast({
        title: "Progress Deleted",
        description: "The progress entry has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete Progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(parseInt(studentId));
    // Update URL without navigation
    setLocation(`/progress?studentId=${studentId}`, { replace: true });
  };
  
  const handleAddProgress = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditProgress = (progress: Progress) => {
    setSelectedProgress(progress);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProgress = (progress: Progress) => {
    setSelectedProgress(progress);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmitAdd = (data: InsertProgress) => {
    addProgressMutation.mutate(data);
  };
  
  const handleSubmitEdit = (data: InsertProgress) => {
    if (selectedProgress) {
      updateProgressMutation.mutate({
        id: selectedProgress.id,
        data
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (selectedProgress) {
      deleteProgressMutation.mutate(selectedProgress.id);
    }
  };
  
  const isLoading = isLoadingStudents || isLoadingProgress;
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Progress Tracking" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
              <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
            </div>
            
            {selectedStudentId && (
              <div className="mt-4 md:mt-0 flex-shrink-0">
                <Button
                  onClick={handleAddProgress}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Progress
                </Button>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-lg text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {/* Student selection */}
              {students.length > 0 && (
                <div className="bg-white p-4 shadow rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                      <Select
                        value={selectedStudentId?.toString()}
                        onValueChange={handleStudentChange}
                      >
                        <SelectTrigger id="student-select">
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.name} ({student.class})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedStudentId && selectedStudent ? (
                <ProgressList
                  progress={progress}
                  onEdit={handleEditProgress}
                  onDelete={handleDeleteProgress}
                />
              ) : (
                <div className="bg-white p-8 shadow rounded-lg text-center">
                  <p className="text-gray-500">
                    {students.length > 0 
                      ? "Select a student to view their progress."
                      : "No students found. Add students to track their progress."}
                  </p>
                </div>
              )}
            </>
          )}
          
          {/* Add Progress Dialog */}
          {selectedStudent && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogContent className="sm:max-w-3xl">
                <ProgressForm
                  student={selectedStudent}
                  onSubmit={handleSubmitAdd}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={addProgressMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
          
          {/* Edit Progress Dialog */}
          {selectedStudent && selectedProgress && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-3xl">
                <ProgressForm
                  student={selectedStudent}
                  defaultValues={selectedProgress}
                  onSubmit={handleSubmitEdit}
                  onCancel={() => setIsEditDialogOpen(false)}
                  isSubmitting={updateProgressMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Progress Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this progress entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deleteProgressMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
