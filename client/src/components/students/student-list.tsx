import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Student } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { StudentForm } from "./student-form";
import { StudentCard } from "./student-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, UserPlus, UsersRound } from "lucide-react";

export function StudentList() {
  const { isAdmin } = useAuth();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<(Student & { id: number }) | null>(null);
  
  // Fetch teachers (for admin filter)
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin,
  });
  
  // Fetch students with filters
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: [
      '/api/students', 
      classFilter !== "all" ? classFilter : undefined,
      teacherFilter !== "all" && isAdmin ? parseInt(teacherFilter) : undefined,
      abilityFilter !== "all" ? abilityFilter : undefined
    ],
  });
  
  // Apply search filter client-side
  const filteredStudents = students?.filter(student => {
    if (!searchTerm) return true;
    return student.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const handleEditStudent = (student: Student & { id: number }) => {
    setEditingStudent(student);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
        <Button onClick={() => setShowAddStudentForm(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
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
            <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700 mb-1">Learning Ability</label>
            <Select 
              value={abilityFilter} 
              onValueChange={setAbilityFilter}
            >
              <SelectTrigger>
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
          
          {isAdmin && (
            <div>
              <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <Select 
                value={teacherFilter} 
                onValueChange={setTeacherFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers?.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                id="search-filter"
                placeholder="Student name" 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Students list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <Badge variant="purple" className="px-3 py-1">
            {isLoading ? "Loading..." : `${filteredStudents?.length || 0} Total`}
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <UsersRound className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-4 text-gray-500">Loading students...</p>
          </div>
        ) : filteredStudents?.length === 0 ? (
          <div className="p-8 text-center">
            <UsersRound className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500">No students found matching the filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
            {filteredStudents?.map(student => (
              <StudentCard 
                key={student.id} 
                student={student} 
                onEdit={() => handleEditStudent(student as Student & { id: number })}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Add/Edit student form */}
      {showAddStudentForm && (
        <StudentForm 
          open={showAddStudentForm} 
          onClose={() => setShowAddStudentForm(false)} 
        />
      )}
      
      {editingStudent && (
        <StudentForm 
          open={!!editingStudent} 
          onClose={() => setEditingStudent(null)} 
          editingStudent={editingStudent}
        />
      )}
    </div>
  );
}
