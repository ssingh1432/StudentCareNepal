import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { StudentList } from '@/components/students/student-list';
import { StudentForm } from '@/components/students/student-form';
import { Button } from '@/components/ui/button';
import { 
  PlusIcon, 
  SearchIcon,
  FilterIcon 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  classOptions,
  learningAbilityOptions,
  Student
} from '@shared/schema';

export default function StudentsPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Extract query params
  const params = new URLSearchParams(location.split('?')[1]);
  const initialAction = params.get('action');
  
  // State for filtering and actions
  const [classFilter, setClassFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(initialAction === 'add');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Fetch students with filters
  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ['/api/students', { class: classFilter === 'all' ? undefined : classFilter, teacherId: teacherFilter === 'all' ? undefined : teacherFilter }],
    retry: false,
  });

  // Fetch teachers if admin
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin',
    retry: false,
  });

  // Filter students by search query and ability
  const filteredStudents = students?.filter((student: Student) => {
    const matchesSearch = searchQuery === "" || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAbility = abilityFilter === "all" || 
      student.learningAbility === abilityFilter;
    
    return matchesSearch && matchesAbility;
  });

  // Handlers
  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowAddForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingStudent(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Student Management" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={handleAddStudent}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                <Select 
                  value={classFilter} 
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="ability-filter" className="block text-sm font-medium text-gray-700">Learning Ability</label>
                <Select 
                  value={abilityFilter} 
                  onValueChange={setAbilityFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Abilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Abilities</SelectItem>
                    {learningAbilityOptions.map((ability) => (
                      <SelectItem key={ability} value={ability}>{ability}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {user?.role === 'admin' && (
                <div>
                  <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700">Teacher</label>
                  <Select 
                    value={teacherFilter} 
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
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
                    <SearchIcon className="text-gray-400 h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    id="search-filter"
                    className="pl-10"
                    placeholder="Student name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Students List */}
          <StudentList 
            students={filteredStudents || []} 
            isLoading={isLoading}
            onEdit={handleEditStudent}
            onRefresh={refetch}
          />
          
          {/* Add/Edit Student Dialog */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </DialogTitle>
                <DialogDescription>
                  {editingStudent 
                    ? 'Update the student information below.' 
                    : 'Fill out the form below to add a new student.'}
                </DialogDescription>
              </DialogHeader>
              <StudentForm 
                student={editingStudent}
                onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
