import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Student, User } from "@shared/schema";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StudentAssignmentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState<string>("");
  const [teacherFilter, setTeacherFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [assignmentUpdates, setAssignmentUpdates] = useState<Record<number, number>>({});
  
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
  
  // Get students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
  
  // Get teachers
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });
  
  // Assign student mutation
  const assignStudentMutation = useMutation({
    mutationFn: async ({ studentId, teacherId }: { studentId: number, teacherId: number }) => {
      await apiRequest("PUT", `/api/assign-student/${studentId}`, { teacherId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Save all assignments
  const handleSaveAssignments = async () => {
    try {
      // Process assignments one by one
      for (const [studentId, teacherId] of Object.entries(assignmentUpdates)) {
        await assignStudentMutation.mutateAsync({
          studentId: parseInt(studentId),
          teacherId
        });
      }
      
      // Reset assignment updates
      setAssignmentUpdates({});
      
      toast({
        title: "Assignments saved",
        description: "Student assignments have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: "Error",
        description: "Some assignments could not be saved. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle teacher assignment change
  const handleTeacherChange = (studentId: number, teacherId: number) => {
    setAssignmentUpdates(prev => ({
      ...prev,
      [studentId]: teacherId
    }));
  };
  
  // Apply filters to students
  const filteredStudents = students?.filter(student => {
    // Class filter
    if (classFilter && student.class !== classFilter) return false;
    
    // Teacher filter
    if (teacherFilter && student.teacherId !== parseInt(teacherFilter)) return false;
    
    // Search filter
    if (searchFilter && !student.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    
    return true;
  });
  
  // Sort students by class and name
  const sortedStudents = filteredStudents?.sort((a, b) => {
    // Sort by class first
    if (a.class !== b.class) {
      return a.class.localeCompare(b.class);
    }
    // Then by name
    return a.name.localeCompare(b.name);
  });
  
  // Get teacher select options
  const teacherOptions = teachers?.filter(t => t.role === "teacher");
  
  // Check if there are any pending changes
  const hasPendingChanges = Object.keys(assignmentUpdates).length > 0;
  
  // Get class badge
  const getClassBadge = (className: string) => {
    const badges = {
      "Nursery": "badge-nursery",
      "LKG": "badge-lkg",
      "UKG": "badge-ukg"
    };
    return badges[className as keyof typeof badges] || "";
  };
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    return teachers?.find(t => t.id === teacherId)?.name || "Unassigned";
  };
  
  // Track if any assignments changed from this teacher
  const isTeacherChanging = (teacherId: number): boolean => {
    return Object.values(assignmentUpdates).some(tid => tid === teacherId);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Assign Students" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
              <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
            </div>
            
            {/* Filter Controls */}
            <div className="bg-white p-4 shadow rounded-lg mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Class Filter */}
                <div>
                  <label htmlFor="assign-class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                  <Select
                    value={classFilter}
                    onValueChange={setClassFilter}
                  >
                    <SelectTrigger id="assign-class-filter" className="mt-1">
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
                
                {/* Teacher Filter */}
                <div>
                  <label htmlFor="assign-teacher-filter" className="block text-sm font-medium text-gray-700">Teacher</label>
                  <Select
                    value={teacherFilter}
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="assign-teacher-filter" className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teachers</SelectItem>
                      {teacherOptions?.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name} ({teacher.assignedClasses?.join(", ") || "No Classes"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Search Filter */}
                <div>
                  <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700">Search</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="assign-search"
                      className="pl-10"
                      placeholder="Student name"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Assignment Interface */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
                {hasPendingChanges && (
                  <Button 
                    onClick={handleSaveAssignments}
                    disabled={assignStudentMutation.isPending}
                  >
                    {assignStudentMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Teacher</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign To</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingStudents || isLoadingTeachers ? (
                      [...Array(5)].map((_, index) => (
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
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Skeleton className="h-8 w-40" />
                          </td>
                        </tr>
                      ))
                    ) : sortedStudents?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                          No students found. Adjust your filters or add students to begin.
                        </td>
                      </tr>
                    ) : (
                      sortedStudents?.map(student => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {student.photoUrl ? (
                                  <img 
                                    className="h-10 w-10 rounded-full object-cover" 
                                    src={student.photoUrl} 
                                    alt={student.name} 
                                    onError={e => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-primary font-medium">{student.name.charAt(0)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`badge ${getClassBadge(student.class)}`}>
                              {student.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getTeacherName(student.teacherId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Select
                              value={
                                assignmentUpdates[student.id] !== undefined 
                                  ? assignmentUpdates[student.id].toString() 
                                  : student.teacherId.toString()
                              }
                              onValueChange={(value) => handleTeacherChange(student.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teacherOptions?.map(teacher => {
                                  // Check if teacher is assigned to the student's class
                                  const canTeach = teacher.assignedClasses?.includes(student.class);
                                  return (
                                    <SelectItem 
                                      key={teacher.id} 
                                      value={teacher.id.toString()}
                                      disabled={!canTeach}
                                    >
                                      {teacher.name} 
                                      {!canTeach && " (Not assigned to this class)"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {hasPendingChanges && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                  <Button 
                    onClick={handleSaveAssignments}
                    disabled={assignStudentMutation.isPending}
                  >
                    {assignStudentMutation.isPending ? "Saving..." : "Save All Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
