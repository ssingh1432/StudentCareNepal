import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Student, Progress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ProgressEntry } from "@/components/ui/progress-entry";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProgressForm from "@/components/forms/progress-form";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  
  const [isProgressFormOpen, setIsProgressFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<Progress | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Get students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  
  // Get progress for selected student
  const { data: progressEntries, isLoading: isLoadingProgress } = useQuery<Progress[]>({
    queryKey: ["/api/progress", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const res = await fetch(`/api/progress/${selectedStudentId}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      return res.json();
    },
    enabled: !!selectedStudentId,
  });
  
  // Delete progress mutation
  const deleteProgressMutation = useMutation({
    mutationFn: async (progressId: number) => {
      await apiRequest("DELETE", `/api/progress/${progressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", selectedStudentId] });
      toast({
        title: "Progress deleted",
        description: "The progress entry has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter students by class
  const filteredStudents = students?.filter(student => {
    if (selectedClass && student.class !== selectedClass) return false;
    
    // For teachers, only show assigned students
    if (user?.role !== "admin" && student.teacherId !== user?.id) return false;
    
    return true;
  });
  
  // Filter progress entries by date
  const filteredProgress = progressEntries?.filter(entry => {
    if (selectedDate) {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      if (entryDate !== selectedDate) return false;
    }
    
    return true;
  });
  
  // Sort progress by date (newest first)
  const sortedProgress = filteredProgress?.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Open progress form for editing or creating
  const handleOpenProgressForm = (progress?: Progress) => {
    if (progress) {
      // Editing existing progress
      setSelectedProgress(progress);
      const student = students?.find(s => s.id === progress.studentId);
      setSelectedStudent(student || null);
    } else {
      // Creating new progress
      setSelectedProgress(null);
      // If a student is already selected in the dropdown, use that
      if (selectedStudentId) {
        const student = students?.find(s => s.id === parseInt(selectedStudentId));
        setSelectedStudent(student || null);
      } else {
        setSelectedStudent(null);
      }
    }
    
    setIsProgressFormOpen(true);
  };
  
  // Confirm progress deletion
  const handleDeleteProgress = (progress: Progress) => {
    setSelectedProgress(progress);
    setIsDeleteDialogOpen(true);
  };
  
  // Get student name by ID
  const getStudentName = (studentId: number): string => {
    const student = students?.find(s => s.id === studentId);
    return student?.name || "Unknown";
  };
  
  // Reset student selection when class changes
  useEffect(() => {
    setSelectedStudentId("");
  }, [selectedClass]);
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Progress Tracking" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
                <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex-shrink-0">
                <Button 
                  onClick={() => handleOpenProgressForm()}
                  className="inline-flex items-center"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Record Progress
                </Button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="bg-white p-4 shadow rounded-lg mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Student Filter */}
                <div>
                  <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700">Student</label>
                  <Select
                    value={selectedStudentId}
                    onValueChange={setSelectedStudentId}
                  >
                    <SelectTrigger id="student-filter" className="mt-1">
                      <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Students</SelectItem>
                      {filteredStudents?.map(student => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Class Filter */}
                <div>
                  <label htmlFor="class-filter-progress" className="block text-sm font-medium text-gray-700">Class</label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger id="class-filter-progress" className="mt-1">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      <SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="LKG">LKG</SelectItem>
                      <SelectItem value="UKG">UKG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date Filter */}
                <div>
                  <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Date</label>
                  <Input 
                    type="date" 
                    id="date-filter" 
                    className="mt-1" 
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Progress Entries */}
            <div className="space-y-4">
              {isLoadingStudents || (selectedStudentId && isLoadingProgress) ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-4 border-b bg-gray-50">
                        <Skeleton className="h-6 w-48" />
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[...Array(6)].map((_, idx) => (
                            <div key={idx}>
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-6 w-32" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !selectedStudentId ? (
                <div className="bg-white p-12 text-center shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">Select a student to view progress</h3>
                  <p className="mt-1 text-sm text-gray-500">Or record progress for a new student</p>
                  <div className="mt-6">
                    <Button onClick={() => handleOpenProgressForm()}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Record Progress
                    </Button>
                  </div>
                </div>
              ) : sortedProgress?.length === 0 ? (
                <div className="bg-white p-12 text-center shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    No progress entries found for {getStudentName(parseInt(selectedStudentId))}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">Start tracking progress by recording an entry</p>
                  <div className="mt-6">
                    <Button onClick={() => handleOpenProgressForm()}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Record Progress
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedProgress?.map(progress => (
                    <ProgressEntry
                      key={progress.id}
                      progress={progress}
                      studentName={selectedStudentId ? getStudentName(parseInt(selectedStudentId)) : undefined}
                      onEdit={() => handleOpenProgressForm(progress)}
                      onDelete={() => handleDeleteProgress(progress)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Progress Form Dialog */}
      {isProgressFormOpen && (
        <ProgressForm
          progress={selectedProgress}
          student={selectedStudent}
          students={students}
          onClose={() => {
            setIsProgressFormOpen(false);
            setSelectedProgress(null);
            setSelectedStudent(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedProgress && (
        <ConfirmationDialog
          title="Delete Progress Entry"
          message={`Are you sure you want to delete this progress entry? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          isOpen={isDeleteDialogOpen}
          onConfirm={() => deleteProgressMutation.mutate(selectedProgress.id)}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isPending={deleteProgressMutation.isPending}
        />
      )}
    </div>
  );
}
