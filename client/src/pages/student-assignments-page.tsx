import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';
import { AssignmentForm } from '@/components/assignments/assignment-form';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { classOptions, Student } from '@shared/schema';

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Only admin can access this page
  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // State for filtering
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch students with class filter
  const { data: students, isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['/api/students', { class: classFilter === 'all' ? undefined : classFilter }],
  });

  // Fetch all teachers
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Handle teacher assignment change
  const handleTeacherAssign = async (studentId: number, teacherId: number) => {
    try {
      await apiRequest('PUT', `/api/students/${studentId}/assign`, { teacherId });
      
      toast({
        title: 'Assignment Updated',
        description: 'The student has been assigned to the selected teacher.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign student to teacher',
        variant: 'destructive',
      });
    }
  };

  // Filter students
  const filteredStudents = students?.filter((student: Student) => {
    const matchesTeacher = teacherFilter === 'all' || student.teacherId === parseInt(teacherFilter);
    const matchesSearch = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTeacher && matchesSearch;
  });

  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unassigned';
  };

  // Check if a teacher can teach a specific class
  const canTeachClass = (teacherId: number, className: string) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.assignedClasses.includes(className) || false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Assign Students to Teachers" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
            <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
          </div>
          
          {/* Filter Controls */}
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="assign-class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger id="assign-class-filter">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="assign-teacher-filter" className="block text-sm font-medium text-gray-700">Teacher</label>
                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                  <SelectTrigger id="assign-teacher-filter">
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teachers</SelectItem>
                    {teachers?.map(teacher => (
                      <SelectItem key={teacher.id} value={String(teacher.id)}>
                        {teacher.name} ({teacher.assignedClasses.join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-gray-400 h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    id="assign-search"
                    className="pl-10"
                    placeholder="Student name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                  {studentsLoading || teachersLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-full mr-4" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredStudents?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        No students match the current filters
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
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{student.class}</div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {getTeacherName(student.teacherId)}
                        </TableCell>
                        <TableCell>
                          <AssignmentForm
                            studentId={student.id}
                            currentTeacherId={student.teacherId}
                            studentClass={student.class}
                            teachers={teachers || []}
                            onAssign={(teacherId) => handleTeacherAssign(student.id, teacherId)}
                            canTeachClass={canTeachClass}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
