import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Student, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AssignStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filter states
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Student assignments state
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  
  const isAdmin = user?.role === "admin";
  
  // Redirect if not admin
  if (!isAdmin) {
    window.location.href = "/";
    return null;
  }
  
  // Query students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students", classFilter, teacherFilter],
    queryFn: async () => {
      let url = "/api/students";
      
      // Add filters if they are set
      const params = new URLSearchParams();
      if (classFilter !== "all") params.append("class", classFilter);
      if (teacherFilter !== "all") params.append("teacherId", teacherFilter);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch students");
      
      const data = await res.json();
      
      // Initialize assignments with current teacher IDs
      const newAssignments = { ...assignments };
      data.forEach((student: Student) => {
        newAssignments[student.id] = student.teacherId;
      });
      setAssignments(newAssignments);
      
      return data;
    },
  });
  
  // Query teachers
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });
  
  // Filter students based on search query
  const filteredStudents = students ? students.filter((student: Student) => {
    // Filter by search query (case insensitive)
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }) : [];
  
  // Get teacher by ID
  const getTeacherById = (id: number) => {
    return teachers?.find((t: User) => t.id === id) || null;
  };
  
  // Check if assignments have changed
  const hasAssignmentsChanged = () => {
    return students?.some((student: Student) => student.teacherId !== assignments[student.id]);
  };
  
  // Save assignments
  const saveAssignments = async () => {
    try {
      // Find changed assignments
      const changedAssignments = students
        ?.filter((student: Student) => student.teacherId !== assignments[student.id])
        .map((student: Student) => ({
          studentId: student.id,
          teacherId: assignments[student.id]
        }));
      
      // If no changes, do nothing
      if (!changedAssignments?.length) {
        toast({
          title: "No changes to save",
          description: "No student assignments have been changed.",
        });
        return;
      }
      
      // Save each assignment
      await Promise.all(
        changedAssignments.map(async (assignment) => {
          await apiRequest("POST", `/api/students/${assignment.studentId}/assign`, {
            teacherId: assignment.teacherId
          });
        })
      );
      
      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      toast({
        title: "Assignments saved",
        description: `Successfully updated ${changedAssignments.length} student assignments.`,
      });
    } catch (error) {
      toast({
        title: "Error saving assignments",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Assign Students" 
          openMobileSidebar={() => setMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
            <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
          </div>
          
          {/* Filter Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="assign-class-filter">Class</Label>
                  <Select 
                    value={classFilter} 
                    onValueChange={setClassFilter}
                  >
                    <SelectTrigger id="assign-class-filter" className="mt-1">
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
                  <Label htmlFor="assign-teacher-filter">Teacher</Label>
                  <Select 
                    value={teacherFilter} 
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="assign-teacher-filter" className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher: User) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                          {teacher.classes?.length ? ` (${teacher.classes.join(", ")})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="assign-search">Search</Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="assign-search"
                      type="text"
                      placeholder="Student name"
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Assignment Interface */}
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium">Student Assignments</CardTitle>
            </CardHeader>
            
            {isLoadingStudents || isLoadingTeachers ? (
              <div className="flex justify-center my-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredStudents.length > 0 ? (
              <>
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
                      {filteredStudents.map((student: Student) => {
                        const currentTeacher = getTeacherById(student.teacherId);
                        return (
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
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                      <span className="text-purple-600 font-medium">
                                        {student.name?.charAt(0) || "S"}
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
                              <div className="text-sm text-gray-900">{student.class}</div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {currentTeacher ? currentTeacher.name : "None"}
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={assignments[student.id]?.toString() || ""}
                                onValueChange={(value) => {
                                  setAssignments({
                                    ...assignments,
                                    [student.id]: Number(value)
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers
                                    ?.filter((teacher: User) => 
                                      !teacher.classes || 
                                      teacher.classes.includes(student.class)
                                    )
                                    .map((teacher: User) => (
                                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="p-4 border-t border-gray-200 flex justify-end">
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={saveAssignments}
                    disabled={!hasAssignmentsChanged()}
                  >
                    Save Assignments
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">No students found. Try adjusting your filters.</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
