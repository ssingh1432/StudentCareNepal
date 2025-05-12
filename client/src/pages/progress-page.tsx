import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProgressList } from '@/components/progress/progress-list';
import { ProgressForm } from '@/components/progress/progress-form';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
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
import { classOptions, Student, ProgressEntry } from '@shared/schema';

export default function ProgressPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Extract query params
  const params = new URLSearchParams(location.split('?')[1]);
  const initialAction = params.get('action');
  const initialStudentId = params.get('studentId');
  
  // State for filtering and actions
  const [studentFilter, setStudentFilter] = useState<string>(initialStudentId || 'all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(initialAction === 'add');
  const [editingProgress, setEditingProgress] = useState<ProgressEntry | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
    initialStudentId ? parseInt(initialStudentId) : null
  );

  // Fetch students for dropdown
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    retry: false,
  });

  // Filter students by class if class filter is active
  const filteredStudents = students?.filter((student: Student) => {
    return classFilter === 'all' || student.class === classFilter;
  });

  // Get selected student for form
  const selectedStudent = selectedStudentId 
    ? students?.find((s: Student) => s.id === selectedStudentId) 
    : null;

  // Fetch progress entries for the selected student
  const { data: progressEntries, isLoading: progressLoading, refetch } = useQuery({
    queryKey: ['/api/students', studentFilter === 'all' ? 'all' : parseInt(studentFilter), 'progress'],
    queryFn: async ({ queryKey }) => {
      const [, id, ] = queryKey;
      if (id === 'all') {
        // TODO: Implement endpoint to get all progress entries
        // For now, return empty array
        return [];
      }
      const res = await fetch(`/api/students/${id}/progress`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch progress entries');
      return res.json();
    },
    enabled: studentFilter !== 'all',
  });

  // Filter progress entries by date if date filter is active
  const filteredProgressEntries = progressEntries?.filter((entry: ProgressEntry) => {
    if (!dateFilter) return true;
    
    const entryDate = new Date(entry.date).toISOString().split('T')[0];
    return entryDate === dateFilter;
  });

  // Handlers
  const handleAddProgress = () => {
    setEditingProgress(null);
    setShowAddForm(true);
  };

  const handleEditProgress = (progress: ProgressEntry) => {
    setEditingProgress(progress);
    // Set the student filter to show entries for this student
    setStudentFilter(String(progress.studentId));
    // Find the student for the form
    const student = students?.find((s: Student) => s.id === progress.studentId);
    if (student) {
      setSelectedStudentId(student.id);
    }
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingProgress(null);
    refetch();
  };

  const handleStudentSelect = (value: string) => {
    setStudentFilter(value);
    if (value !== 'all') {
      setSelectedStudentId(parseInt(value));
    } else {
      setSelectedStudentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Progress Tracking" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
              <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={handleAddProgress}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Record Progress
              </Button>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700">Student</label>
                <Select 
                  value={studentFilter} 
                  onValueChange={handleStudentSelect}
                  disabled={studentsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {filteredStudents?.map((student: Student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {student.name} ({student.class})
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
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Progress Entries List */}
          <ProgressList 
            progressEntries={filteredProgressEntries || []} 
            students={students || []}
            isLoading={progressLoading || studentsLoading}
            onEdit={handleEditProgress}
            onRefresh={refetch}
          />
          
          {/* Add/Edit Progress Dialog */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProgress ? 'Edit Progress Entry' : 'Record Student Progress'}
                </DialogTitle>
                <DialogDescription>
                  {editingProgress 
                    ? 'Update the progress information below.' 
                    : 'Fill out the form below to record new progress.'}
                </DialogDescription>
              </DialogHeader>
              <ProgressForm 
                progress={editingProgress}
                student={selectedStudent || undefined}
                students={students || []}
                onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
