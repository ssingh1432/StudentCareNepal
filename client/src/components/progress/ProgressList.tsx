import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Progress, Student } from "@shared/schema";
import { Loader2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

interface ProgressListProps {
  student?: Student;
  onAddProgress: (student?: Student) => void;
  onEditProgress: (progress: Progress) => void;
}

const ProgressList = ({ student, onAddProgress, onEditProgress }: ProgressListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentFilter, setStudentFilter] = useState(student?.id.toString() || "all");
  const [classFilter, setClassFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all students for filter if no specific student is provided
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      return response.json();
    },
    enabled: !student,
  });

  // Fetch progress entries
  const { data: progressEntries, isLoading } = useQuery<Progress[]>({
    queryKey: ["/api/progress", studentFilter, classFilter, dateFilter],
    queryFn: async ({ queryKey }) => {
      const [_, studentId, classFilter, dateFilter] = queryKey;
      let url = "/api/progress";
      
      // If looking at a specific student's progress
      if (student) {
        url = `/api/students/${student.id}/progress`;
      } else {
        url = "/api/progress";
        const params = new URLSearchParams();
        
        if (studentId !== "all") params.append("studentId", studentId as string);
        if (classFilter !== "all") params.append("class", classFilter as string);
        if (dateFilter) params.append("date", dateFilter as string);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch progress entries");
      }
      
      return response.json();
    },
  });

  // Delete progress mutation
  const deleteProgressMutation = useMutation({
    mutationFn: async (progressId: number) => {
      await apiRequest("DELETE", `/api/progress/${progressId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      if (student) {
        queryClient.invalidateQueries({ queryKey: [`/api/students/${student.id}/progress`] });
      }
      toast({
        title: "Progress entry deleted",
        description: "Progress entry has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete progress entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle progress deletion
  const handleDeleteProgress = (progress: Progress) => {
    if (window.confirm("Are you sure you want to delete this progress entry?")) {
      deleteProgressMutation.mutate(progress.id);
    }
  };

  // Pagination logic
  const totalEntries = progressEntries?.length || 0;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const paginatedEntries = progressEntries ? progressEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) : [];

  // Style helper functions
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "needs-improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
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
      {/* Filter Controls (only show if not viewing a specific student) */}
      {!student && (
        <div className="bg-white p-4 shadow rounded-lg mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700">Student</label>
              <Select 
                value={studentFilter} 
                onValueChange={setStudentFilter}
              >
                <SelectTrigger id="student-filter" className="mt-1">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="class-filter-progress" className="block text-sm font-medium text-gray-700">Class</label>
              <Select 
                value={classFilter} 
                onValueChange={setClassFilter}
              >
                <SelectTrigger id="class-filter-progress" className="mt-1">
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
              <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Date</label>
              <Input 
                type="date" 
                id="date-filter" 
                className="mt-1" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Entries List */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {student ? `${student.name}'s Progress Entries` : "Recent Progress Entries"}
          </h3>
          <Button 
            onClick={() => onAddProgress(student)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Progress
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {!student && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Skills</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Literacy</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Numeracy</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motor Skills</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emotional Dev.</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedEntries.length > 0 ? (
                paginatedEntries.map((entry) => (
                  <tr key={entry.id}>
                    {!student && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* This would ideally show the student's name and photo, but for now we'll just show the ID */}
                          <div className="text-sm font-medium text-gray-900">
                            ID: {entry.studentId}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getRatingBadgeClass(entry.socialSkills)}`}>
                        {entry.socialSkills}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getRatingBadgeClass(entry.preLiteracy)}`}>
                        {entry.preLiteracy}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getRatingBadgeClass(entry.preNumeracy)}`}>
                        {entry.preNumeracy}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getRatingBadgeClass(entry.motorSkills)}`}>
                        {entry.motorSkills}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${getRatingBadgeClass(entry.emotionalDevelopment)}`}>
                        {entry.emotionalDevelopment}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => onEditProgress(entry)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProgress(entry)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={student ? 7 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No progress entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min(1 + (currentPage - 1) * itemsPerPage, totalEntries)}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalEntries)}</span> of <span className="font-medium">{totalEntries}</span> results
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
                      disabled={currentPage === totalPages}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressList;
