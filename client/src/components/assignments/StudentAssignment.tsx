import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Student, User } from "@shared/schema";

const StudentAssignment = () => {
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch teachers
  const { data: teachers } = useQuery<User[]>({
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
  
  // Fetch students
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students", classFilter, teacherFilter, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, teacherFilter, searchQuery] = queryKey;
      
      let url = "/api/students";
      const params = new URLSearchParams();
      
      if (classFilter !== "all") params.append("class", classFilter as string);
      if (teacherFilter !== "all") params.append("teacherId", teacherFilter as string);
      if (searchQuery) params.append("search", searchQuery as string);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      return response.json();
    },
  });
  
  // Assign student mutation
  const assignStudentMutation = useMutation({
    mutationFn: async ({ studentId, teacherId }: { studentId: number; teacherId: number }) => {
      await apiRequest("PUT", `/api/students/${studentId}/assign`, { teacherId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student assigned",
        description: "Student has been successfully assigned to the teacher.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle teacher assignment
  const handleAssignTeacher = (studentId: number, teacherId: number) => {
    assignStudentMutation.mutate({ studentId, teacherId });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? teacher.name : `Teacher ID: ${teacherId}`;
  };
  
  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
          <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="lkg">LKG</SelectItem>
                <SelectItem value="ukg">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="assign-teacher-filter" className="block text-sm font-medium text-gray-700">Current Teacher</label>
            <Select 
              value={teacherFilter} 
              onValueChange={setTeacherFilter}
            >
              <SelectTrigger id="assign-teacher-filter" className="mt-1">
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
          
          <div>
            <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                id="assign-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                placeholder="Student name"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Student Assignment Interface */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
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
              {students && students.length > 0 ? (
                students.map((student) => (
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
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${
                        student.class === "nursery"
                          ? "bg-yellow-100 text-yellow-800"
                          : student.class === "lkg"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {student.class.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getTeacherName(student.teacherId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select 
                        value={student.teacherId.toString()}
                        onValueChange={(value) => handleAssignTeacher(student.id, parseInt(value))}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers?.map((teacher) => (
                            <SelectItem 
                              key={teacher.id} 
                              value={teacher.id.toString()}
                              disabled={!teacher.assignedClasses?.includes(student.class)}
                            >
                              {teacher.name}{!teacher.assignedClasses?.includes(student.class) ? ' (Not assigned to class)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No students found matching the filters.
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

export default StudentAssignment;
