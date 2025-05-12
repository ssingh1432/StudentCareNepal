import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Student, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Check, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AssignmentForm() {
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students', classFilter !== "all" ? classFilter : undefined],
  });
  
  // Fetch teachers
  const { data: teachers } = useQuery<User[]>({
    queryKey: ['/api/teachers'],
  });
  
  // Assign student mutation
  const assignMutation = useMutation({
    mutationFn: async ({ studentId, teacherId }: { studentId: number, teacherId: number }) => {
      return await apiRequest("POST", `/api/students/${studentId}/assign/${teacherId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Student Assigned",
        description: "Student has been assigned to the teacher successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter students
  const filteredStudents = students?.filter(student => {
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  // Handler to assign students
  const handleAssign = async (student: Student, teacherId: number) => {
    setIsUpdating(true);
    try {
      await assignMutation.mutateAsync({ studentId: student.id, teacherId });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Function to get the class badge variant
  const getClassVariant = (className: string): "nursery" | "lkg" | "ukg" => {
    switch(className) {
      case "Nursery": return "nursery";
      case "LKG": return "lkg";
      case "UKG": return "ukg";
      default: return "nursery";
    }
  };
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number | undefined): string => {
    if (!teacherId) return "Unassigned";
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };
  
  // Check if a teacher can be assigned to this class
  const canAssignTeacher = (student: Student, teacherId: number): boolean => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.assignedClasses?.includes(student.class) || false;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="assign-class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select 
              value={classFilter} 
              onValueChange={setClassFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Nursery">Nursery</SelectItem>
                <SelectItem value="LKG">LKG</SelectItem>
                <SelectItem value="UKG">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                id="assign-search"
                placeholder="Student name" 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Assignment Interface */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Current Teacher</TableHead>
                <TableHead>Assign To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingStudents ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <UsersRound className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                    <p className="mt-2 text-gray-500">Loading students...</p>
                  </TableCell>
                </TableRow>
              ) : filteredStudents?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <UsersRound className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No students found matching the filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents?.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.photoUrl ? (
                            <img 
                              src={student.photoUrl} 
                              alt={student.name} 
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getClassVariant(student.class)}>
                        {student.class}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {getTeacherName(student.teacherId)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap w-64">
                      <div className="flex items-center space-x-2">
                        <Select 
                          value={selectedTeacher || (student.teacherId?.toString() || "")}
                          onValueChange={(value) => setSelectedTeacher(value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers?.map(teacher => (
                              <SelectItem 
                                key={teacher.id} 
                                value={teacher.id.toString()}
                                disabled={!canAssignTeacher(student, teacher.id)}
                              >
                                {teacher.name}
                                {!canAssignTeacher(student, teacher.id) && " (Incompatible class)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedTeacher) {
                              handleAssign(student, parseInt(selectedTeacher))
                            }
                          }}
                          disabled={isUpdating || !selectedTeacher || parseInt(selectedTeacher) === student.teacherId}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
