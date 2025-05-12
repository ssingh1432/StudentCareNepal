import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Link } from "wouter";
import { 
  getClassColorClass, 
  getLearningAbilityColorClass, 
  getWritingSpeedColorClass,
  formatCloudinaryUrl
} from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Edit, Trash2, UserPlus, BarChart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Student, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    class: "all",
    learningAbility: "all",
    teacher: "all",
    search: ""
  });

  // Fetch students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch teachers (for filtering by teacher - admin only)
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin"
  });

  // Create map of teacher IDs to names
  const teacherNames: Record<number, string> = {};
  teachers.forEach(teacher => {
    teacherNames[teacher.id] = teacher.name;
  });

  // Apply filters
  const filteredStudents = students.filter(student => {
    // Filter by class
    if (filters.class !== "all" && student.class !== filters.class) {
      return false;
    }
    
    // Filter by learning ability
    if (filters.learningAbility !== "all" && student.learningAbility !== filters.learningAbility) {
      return false;
    }
    
    // Filter by teacher (admin only)
    if (user?.role === "admin" && filters.teacher !== "all" && student.teacherId !== parseInt(filters.teacher)) {
      return false;
    }
    
    // Filter by search term
    if (filters.search && !student.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Function to delete a student
  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/students/${studentId}`);
      
      // Invalidate the students query to refresh the data
      queryClient.invalidateQueries({queryKey: ["/api/students"]});
      
      toast({
        title: "Student deleted",
        description: "The student has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Table columns definition
  const columns = [
    {
      header: "Student",
      accessorKey: "name",
      cell: (student: Student) => (
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarImage 
              src={student.photoUrl ? formatCloudinaryUrl(student.photoUrl, { width: 40, height: 40 }) : undefined} 
              alt={student.name} 
            />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-500">{student.age} years</div>
          </div>
        </div>
      ),
    },
    {
      header: "Class",
      accessorKey: "class",
      cell: (student: Student) => (
        <Badge className={getClassColorClass(student.class)}>
          {student.class}
        </Badge>
      ),
    },
    {
      header: "Learning Ability",
      accessorKey: "learningAbility",
      cell: (student: Student) => (
        <Badge className={getLearningAbilityColorClass(student.learningAbility)}>
          {student.learningAbility}
        </Badge>
      ),
    },
    {
      header: "Writing Speed",
      accessorKey: "writingSpeed",
      cell: (student: Student) => (
        <Badge className={getWritingSpeedColorClass(student.writingSpeed)}>
          {student.writingSpeed}
        </Badge>
      ),
    },
    {
      header: "Teacher",
      accessorKey: "teacherId",
      cell: (student: Student) => (
        <span className="text-gray-600">
          {student.teacherId && teacherNames[student.teacherId] 
            ? teacherNames[student.teacherId] 
            : "Not Assigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (student: Student) => (
        <div className="flex justify-end space-x-2">
          <Link href={`/progress/new?studentId=${student.id}`}>
            <Button variant="ghost" size="sm">
              <BarChart className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only md:ml-1">Progress</span>
            </Button>
          </Link>
          <Link href={`/students/${student.id}`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only md:ml-1">Edit</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => handleDeleteStudent(student.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:ml-1">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Student Management">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
            <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Link href="/students/new">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <Select
                  value={filters.class}
                  onValueChange={(value) => setFilters({ ...filters, class: value })}
                >
                  <SelectTrigger id="class-filter">
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
                <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Ability
                </label>
                <Select
                  value={filters.learningAbility}
                  onValueChange={(value) => setFilters({ ...filters, learningAbility: value })}
                >
                  <SelectTrigger id="ability-filter">
                    <SelectValue placeholder="All Abilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Abilities</SelectItem>
                    <SelectItem value="Talented">Talented</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Slow Learner">Slow Learner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {user?.role === "admin" && (
                <div>
                  <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Teacher
                  </label>
                  <Select
                    value={filters.teacher}
                    onValueChange={(value) => setFilters({ ...filters, teacher: value })}
                  >
                    <SelectTrigger id="teacher-filter">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="Student name"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Students</h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {filteredStudents.length} Total
            </Badge>
          </div>
          
          <div className="px-4 py-4">
            <DataTable
              data={filteredStudents}
              columns={columns}
              searchPlaceholder="Search students..."
              searchKeys={["name"]}
            />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
