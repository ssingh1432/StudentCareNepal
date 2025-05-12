import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Student, Progress } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentCard } from "@/components/ui/student-card";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StudentForm from "@/components/forms/student-form";
import ProgressForm from "@/components/forms/progress-form";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState<string>("");
  const [abilityFilter, setAbilityFilter] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isProgressFormOpen, setIsProgressFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Queries
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Get all student progress
  const { data: studentProgress } = useQuery<Record<number, Progress[]>>({
    queryKey: ["/api/all-progress"],
    queryFn: async () => {
      if (!students) return {};
      
      const progressMap: Record<number, Progress[]> = {};
      
      for (const student of students) {
        try {
          const res = await fetch(`/api/progress/${student.id}`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            progressMap[student.id] = data;
          }
        } catch (error) {
          console.error(`Error fetching progress for student ${student.id}:`, error);
        }
      }
      
      return progressMap;
    },
    enabled: !!students,
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student deleted",
        description: "The student has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Open student form for editing or creating
  const handleOpenStudentForm = (student?: Student) => {
    setSelectedStudent(student || null);
    setIsStudentFormOpen(true);
  };
  
  // Open progress form for a student
  const handleOpenProgressForm = (student: Student) => {
    setSelectedStudent(student);
    setIsProgressFormOpen(true);
  };
  
  // Confirm student deletion
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle view progress (would navigate to progress page with filter)
  const handleViewProgress = (student: Student) => {
    // In a real implementation, this would navigate to the progress page filtered for this student
    toast({
      title: "View Progress",
      description: `Viewing progress for ${student.name}`,
    });
  };
  
  // Apply filters to students
  const filteredStudents = students?.filter(student => {
    // Class filter
    if (classFilter && student.class !== classFilter) return false;
    
    // Ability filter
    if (abilityFilter && student.learningAbility !== abilityFilter) return false;
    
    // Teacher filter (admin only)
    if (teacherFilter && student.teacherId !== parseInt(teacherFilter)) return false;
    
    // Search filter
    if (searchFilter && !student.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    
    return true;
  });
  
  // Check if data is loading
  const isLoading = isLoadingStudents || isLoadingTeachers;
  
  // Find teacher by ID
  const getTeacherById = (teacherId: number) => {
    return teachers?.find(teacher => teacher.id === teacherId);
  };
  
  // Get latest progress for a student
  const getLatestProgress = (studentId: number) => {
    const progress = studentProgress?.[studentId];
    if (!progress || progress.length === 0) return undefined;
    
    return progress.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Student Management" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex-shrink-0">
                <Button 
                  onClick={() => handleOpenStudentForm()}
                  className="inline-flex items-center"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="bg-white p-4 shadow rounded-lg mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Class Filter */}
                <div>
                  <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                  <Select
                    value={classFilter}
                    onValueChange={setClassFilter}
                  >
                    <SelectTrigger id="class-filter" className="mt-1">
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
                
                {/* Learning Ability Filter */}
                <div>
                  <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700">Learning Ability</label>
                  <Select
                    value={abilityFilter}
                    onValueChange={setAbilityFilter}
                  >
                    <SelectTrigger id="ability-filter" className="mt-1">
                      <SelectValue placeholder="All Abilities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Abilities</SelectItem>
                      <SelectItem value="Talented">Talented</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Slow Learner">Slow Learner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Teacher Filter (Admin Only) */}
                {user?.role === "admin" && (
                  <div>
                    <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700">Teacher</label>
                    <Select
                      value={teacherFilter}
                      onValueChange={setTeacherFilter}
                    >
                      <SelectTrigger id="teacher-filter" className="mt-1">
                        <SelectValue placeholder="All Teachers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Teachers</SelectItem>
                        {teachers?.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Search Filter */}
                <div>
                  <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">Search</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="search-filter"
                      className="pl-10"
                      placeholder="Student name"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Students Grid */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Students</h3>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  {filteredStudents?.length || 0} Total
                </span>
              </div>
              
              {isLoading ? (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="p-4 border-b bg-gray-50">
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <div className="p-4 flex">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="ml-4 flex-1">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredStudents?.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-500">No students found matching your filters</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setClassFilter("");
                      setAbilityFilter("");
                      setTeacherFilter("");
                      setSearchFilter("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents?.map(student => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      teacher={getTeacherById(student.teacherId)}
                      latestProgress={getLatestProgress(student.id)}
                      onEdit={() => handleOpenStudentForm(student)}
                      onDelete={() => handleDeleteStudent(student)}
                      onViewProgress={() => handleViewProgress(student)}
                      onAddProgress={() => handleOpenProgressForm(student)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Student Form Dialog */}
      {isStudentFormOpen && (
        <StudentForm
          student={selectedStudent}
          teachers={teachers || []}
          onClose={() => {
            setIsStudentFormOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
      
      {/* Progress Form Dialog */}
      {isProgressFormOpen && selectedStudent && (
        <ProgressForm
          student={selectedStudent}
          onClose={() => {
            setIsProgressFormOpen(false);
            setSelectedStudent(null);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedStudent && (
        <ConfirmationDialog
          title="Delete Student"
          message={`Are you sure you want to delete ${selectedStudent.name}? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          isOpen={isDeleteDialogOpen}
          onConfirm={() => deleteStudentMutation.mutate(selectedStudent.id)}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isPending={deleteStudentMutation.isPending}
        />
      )}
    </div>
  );
}
