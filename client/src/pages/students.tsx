import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layouts/MainLayout';
import StudentCard from '@/components/StudentCard';
import StudentForm from '@/components/StudentForm';
import ProgressForm from '@/components/ProgressForm';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  UserPlus,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Student {
  id: number;
  name: string;
  age: number;
  class: string;
  learningAbility: string;
  writingSpeed?: string;
  photoUrl?: string;
  teacherId: number;
}

interface Teacher {
  id: number;
  name: string;
  assignedClasses: string[];
}

const Students: React.FC = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for dialog management
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [progressFormOpen, setProgressFormOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  
  // State for filters
  const [classFilter, setClassFilter] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState<string>('');
  const [abilityFilter, setAbilityFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Parse URL params
  const params = new URLSearchParams(location.split('?')[1]);
  const action = params.get('action');
  
  // Effect to handle URL actions
  useEffect(() => {
    if (action === 'add') {
      setStudentFormOpen(true);
      // Clear the URL parameter after opening the form
      setLocation('/students', { replace: true });
    }
  }, [action, setLocation]);

  // Get students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students', classFilter],
    queryFn: async ({ queryKey }) => {
      const [_, className] = queryKey;
      const url = className 
        ? `/api/students?class=${className}` 
        : '/api/students';
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      return response.json();
    }
  });
  
  // Get teachers (for filters and forms)
  const { data: teachers, isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: isAdmin // Only fetch if user is admin
  });
  
  // Apply client-side filters to students data
  const filteredStudents = students
    ? students.filter(student => {
        // Filter by search term
        if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by class (already filtered on server, this is redundant but safe)
        if (classFilter && student.class !== classFilter) {
          return false;
        }
        
        // Filter by teacher
        if (teacherFilter && student.teacherId !== parseInt(teacherFilter)) {
          return false;
        }
        
        // Filter by learning ability
        if (abilityFilter && student.learningAbility !== abilityFilter) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Reset filters
  const resetFilters = () => {
    setClassFilter('');
    setTeacherFilter('');
    setAbilityFilter('');
    setSearchTerm('');
  };
  
  // Handle opening student form for editing
  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);
    setStudentFormOpen(true);
  };
  
  // Handle form submission success
  const handleFormSuccess = () => {
    setStudentFormOpen(false);
    setProgressFormOpen(false);
    setCurrentStudent(null);
  };
  
  // Handle progress view
  const handleViewProgress = (student: Student) => {
    // Redirect to progress page with student ID filter
    setLocation(`/progress?studentId=${student.id}`);
  };
  
  // Handle add progress entry
  const handleAddProgress = (student: Student) => {
    setCurrentStudent(student);
    setProgressFormOpen(true);
  };
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };
  
  // Create a map of teacher objects by ID for easy lookup
  const teachersMap = teachers
    ? teachers.reduce((map, teacher) => {
        map[teacher.id] = teacher;
        return map;
      }, {} as Record<number, Teacher>)
    : {};

  return (
    <MainLayout title="Student Management">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex-shrink-0">
          <Button onClick={() => setStudentFormOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>
      
      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <Select
                value={classFilter}
                onValueChange={setClassFilter}
              >
                <SelectTrigger id="class-filter">
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
            
            <div>
              <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Learning Ability
              </label>
              <Select
                value={abilityFilter}
                onValueChange={setAbilityFilter}
              >
                <SelectTrigger id="ability-filter">
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
            
            {isAdmin && (
              <div>
                <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher
                </label>
                <Select
                  value={teacherFilter}
                  onValueChange={setTeacherFilter}
                >
                  <SelectTrigger id="teacher-filter">
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
            
            <div>
              <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="search-filter"
                  type="text"
                  placeholder="Student name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <X
                      className="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-pointer"
                      onClick={() => setSearchTerm('')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Active filters */}
          {(classFilter || teacherFilter || abilityFilter || searchTerm) && (
            <div className="mt-4 flex items-center">
              <span className="text-sm text-gray-500 mr-2">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {classFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Class: {classFilter}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setClassFilter('')}
                    />
                  </span>
                )}
                {teacherFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Teacher: {getTeacherName(parseInt(teacherFilter))}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setTeacherFilter('')}
                    />
                  </span>
                )}
                {abilityFilter && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ability: {abilityFilter}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setAbilityFilter('')}
                    />
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Search: {searchTerm}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </span>
                )}
                <button
                  className="text-sm text-purple-600 hover:text-purple-500 ml-2"
                  onClick={resetFilters}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Students Grid */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>
        
        {studentsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500 mb-4">No students found</p>
            <Button onClick={() => setStudentFormOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredStudents.map(student => (
              <StudentCard
                key={student.id}
                student={student}
                teacher={teachersMap[student.teacherId]}
                onEdit={handleEditStudent}
                onViewProgress={handleViewProgress}
                onAddProgress={handleAddProgress}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Student Form Dialog */}
      <Dialog open={studentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
            <DialogDescription>
              {currentStudent 
                ? `Update information for ${currentStudent.name}`
                : 'Fill in the details to register a new student'
              }
            </DialogDescription>
          </DialogHeader>
          
          <StudentForm
            student={currentStudent || undefined}
            teachers={teachers || []}
            onSuccess={handleFormSuccess}
            onCancel={() => setStudentFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Progress Form Dialog */}
      <Dialog open={progressFormOpen} onOpenChange={setProgressFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentStudent ? `Record Progress for ${currentStudent.name}` : 'Record Progress'}
            </DialogTitle>
            <DialogDescription>
              Fill in the progress details for the student
            </DialogDescription>
          </DialogHeader>
          
          <ProgressForm
            student={currentStudent ? { 
              id: currentStudent.id, 
              name: currentStudent.name,
              class: currentStudent.class
            } : undefined}
            students={students || []}
            onSuccess={handleFormSuccess}
            onCancel={() => setProgressFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Students;
