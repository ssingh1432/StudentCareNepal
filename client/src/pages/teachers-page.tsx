import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { TeacherList } from '@/components/teachers/teacher-list';
import { TeacherForm } from '@/components/teachers/teacher-form';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { User } from '@shared/schema';

export default function TeachersPage() {
  const { user } = useAuth();
  
  // State for actions
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);

  // Only admin can access this page
  if (user?.role !== 'admin') {
    return <Redirect to="/" />;
  }

  // Fetch teachers
  const { data: teachers, isLoading, refetch } = useQuery({
    queryKey: ['/api/teachers'],
    retry: false,
  });

  // Fetch students for count
  const { data: students } = useQuery({
    queryKey: ['/api/students'],
    retry: false,
  });

  // Handlers
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setShowAddForm(true);
  };

  const handleEditTeacher = (teacher: User) => {
    setEditingTeacher(teacher);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingTeacher(null);
    refetch();
  };

  // Count students per teacher
  const getStudentCount = (teacherId: number) => {
    if (!students) return 0;
    return students.filter((student: any) => student.teacherId === teacherId).length;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Manage Teachers" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
              <p className="mt-1 text-sm text-gray-500">Add, edit, and delete teacher accounts</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={handleAddTeacher}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          </div>
          
          {/* Teachers List */}
          <TeacherList 
            teachers={teachers || []} 
            getStudentCount={getStudentCount}
            isLoading={isLoading}
            onEdit={handleEditTeacher}
            onRefresh={refetch}
          />
          
          {/* Add/Edit Teacher Dialog */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </DialogTitle>
                <DialogDescription>
                  {editingTeacher 
                    ? 'Update the teacher information below.' 
                    : 'Fill out the form below to add a new teacher.'}
                </DialogDescription>
              </DialogHeader>
              <TeacherForm 
                teacher={editingTeacher}
                onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
