import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Student } from "@shared/schema";
import { Loader2, ChevronLeft, ChevronRight, Search, UserPlus, Filter } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface StudentListProps {
  onStudentSelect: (student: Student | null) => void;
  onAddStudent: () => void;
  onViewProgress: (student: Student) => void;
}

const StudentList = ({ onStudentSelect, onAddStudent, onViewProgress }: StudentListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState("all");
  const [abilityFilter, setAbilityFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role === "admin";

  // Fetch students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students", classFilter, abilityFilter, teacherFilter, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, abilityFilter, teacherFilter, searchQuery] = queryKey;
      const url = new URL("/api/students", window.location.origin);
      
      if (classFilter !== "all") url.searchParams.append("class", classFilter as string);
      if (abilityFilter !== "all") url.searchParams.append("ability", abilityFilter as string);
      if (teacherFilter !== "all") url.searchParams.append("teacherId", teacherFilter as string);
      if (searchQuery) url.searchParams.append("search", searchQuery as string);
      
      const response = await fetch(url.toString(), {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      return response.json();
    },
  });

  // Fetch teachers for the filter
  const { data: teachers } = useQuery<any[]>({
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
    enabled: isAdmin, // Only fetch if user is admin
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
        description: "Student has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle student deletion
  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  // Pagination logic
  const totalStudents = students?.length || 0;
  const totalPages = Math.ceil(totalStudents / itemsPerPage);
  const paginatedStudents = students ? students.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  // Style helper functions
  const getLearningAbilityBadgeClass = (ability: string) => {
    switch (ability) {
      case "talented":
        return "bg-green-100 text-green-800";
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "slow-learner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getWritingSpeedBadgeClass = (speed: string | null) => {
    if (!speed) return "bg-gray-100 text-gray-800";
    
    switch (speed) {
      case "speed-writing":
        return "bg-blue-100 text-blue-800";
      case "slow-writing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="lkg">LKG</SelectItem>
                <SelectItem value="ukg">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
                <SelectItem value="all">All Abilities</SelectItem>
                <SelectItem value="talented">Talented</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="slow-learner">Slow Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isAdmin && (
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
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers?.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                id="search-filter"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                placeholder="Student name"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Students List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <Badge variant="outline" className="px-3 py-1 rounded-full bg-purple-100 text-purple-800">
            {totalStudents} Total
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Ability</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Writing Speed</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {student.photoUrl ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={student.photoUrl}
                            alt={student.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        {student.parentContact && (
                          <div className="text-sm text-gray-500">Parent: {student.parentContact}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.class.toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.age} years</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLearningAbilityBadgeClass(student.learningAbility)}`}>
                      {student.learningAbility}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getWritingSpeedBadgeClass(student.writingSpeed)}`}>
                      {student.writingSpeed || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* Teacher name would come from a join/lookup in a real implementation */}
                    {student.teacherId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => onViewProgress(student)}
                      className="text-purple-600 hover:text-purple-900 mr-3"
                    >
                      Progress
                    </button>
                    <button 
                      onClick={() => onStudentSelect(student)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteStudent(student)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No students found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * itemsPerPage, totalStudents)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalStudents)}</span> of <span className="font-medium">{totalStudents}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-md"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  {/* Page buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? "z-10 bg-purple-50 border-purple-500 text-purple-600" : ""}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-r-md"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Student Button (Fixed) */}
      <div className="fixed bottom-6 right-6">
        <Button 
          onClick={onAddStudent}
          className="rounded-full h-14 w-14 shadow-lg bg-purple-600 hover:bg-purple-700 focus:outline-none p-0"
        >
          <UserPlus className="h-6 w-6 text-white" />
          <span className="sr-only">Add Student</span>
        </Button>
      </div>
    </div>
  );
};

export default StudentList;
