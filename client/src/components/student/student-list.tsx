import { useState } from "react";
import { Student } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentCard } from "@/components/student/student-card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

interface StudentListProps {
  students: Student[];
  teachers?: { id: number; name: string }[];
  isAdmin: boolean;
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onViewProgress: (student: Student) => void;
}

export function StudentList({
  students,
  teachers = [],
  isAdmin,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onViewProgress,
}: StudentListProps) {
  const [classFilter, setClassFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Apply filters
  const filteredStudents = students.filter(student => {
    // Class filter
    if (classFilter !== "all" && student.class !== classFilter) {
      return false;
    }
    
    // Ability filter
    if (abilityFilter !== "all" && student.learningAbility !== abilityFilter) {
      return false;
    }
    
    // Teacher filter
    if (isAdmin && teacherFilter !== "all" && student.teacherId !== parseInt(teacherFilter)) {
      return false;
    }
    
    // Search term
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Map teacherId to teacher name
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.name || "Unassigned";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
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
            <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700 mb-1">Learning Ability</label>
            <Select
              value={abilityFilter}
              onValueChange={setAbilityFilter}
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
          
          {isAdmin && (
            <div>
              <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <Select
                value={teacherFilter}
                onValueChange={setTeacherFilter}
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
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search-filter"
                placeholder="Student name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Students
          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            {filteredStudents.length} of {students.length}
          </span>
        </h2>
        
        <Button
          onClick={onAddStudent}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>
      
      {filteredStudents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No students match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              teacherName={isAdmin ? getTeacherName(student.teacherId) : undefined}
              onEdit={onEditStudent}
              onDelete={onDeleteStudent}
              onViewProgress={onViewProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
