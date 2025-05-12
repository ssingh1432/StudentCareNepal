import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  PencilIcon, 
  Trash2, 
  BarChart2, 
  Plus 
} from 'lucide-react';
import { getImageThumbnail } from '@/lib/cloudinary';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Teacher {
  id: number;
  name: string;
}

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

interface StudentCardProps {
  student: Student;
  teacher?: Teacher;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onViewProgress?: (student: Student) => void;
  onAddProgress?: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  teacher,
  onEdit,
  onDelete,
  onViewProgress,
  onAddProgress
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === 'admin';
  
  // Get badge color based on class
  const getClassBadgeColor = (className: string) => {
    switch (className) {
      case 'Nursery':
        return 'bg-yellow-100 text-yellow-800';
      case 'LKG':
        return 'bg-blue-100 text-blue-800';
      case 'UKG':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get color based on learning ability
  const getAbilityColor = (ability: string) => {
    switch (ability) {
      case 'Talented':
        return 'text-green-600';
      case 'Average':
        return 'text-blue-600';
      case 'Slow Learner':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };
  
  // Get thumbnail of student photo
  const thumbnailUrl = student.photoUrl 
    ? getImageThumbnail(student.photoUrl, 96, 96) 
    : '';
    
  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (studentId: number) => {
      return await apiRequest('DELETE', `/api/students/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Student deleted',
        description: 'The student has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      if (onDelete) onDelete(student);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete student',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle delete with confirmation
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      deleteMutation.mutate(student.id);
    }
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge className={getClassBadgeColor(student.class)}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit && onEdit(student)}>
              <PencilIcon className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewProgress && onViewProgress(student)}>
              <BarChart2 className="mr-2 h-4 w-4" />
              <span>View Progress</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddProgress && onAddProgress(student)}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Progress</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600" 
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <CardContent className="flex-1 flex p-0">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`${student.name} photo`}
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-purple-200 flex items-center justify-center border-2 border-white shadow">
              <span className="text-purple-600 text-xl font-semibold">
                {getInitials(student.name)}
              </span>
            </div>
          )}
        </div>
        
        <div className="w-2/3 p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium">{student.age} years</p>
            </div>
            <div>
              <p className="text-gray-500">Learning Ability</p>
              <p className={`font-medium ${getAbilityColor(student.learningAbility)}`}>
                {student.learningAbility}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <p className="font-medium">
                {student.writingSpeed && student.writingSpeed !== 'N/A' 
                  ? student.writingSpeed 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Teacher</p>
              <p className="font-medium">
                {teacher?.name || (isAdmin ? 'Unassigned' : user?.name || 'Unknown')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="link" 
          className="text-xs text-purple-600 hover:text-purple-500 p-0"
          onClick={() => onViewProgress && onViewProgress(student)}
        >
          View Progress
        </Button>
        <Button 
          variant="link" 
          className="text-xs text-purple-600 hover:text-purple-500 p-0"
          onClick={() => onAddProgress && onAddProgress(student)}
        >
          Add Progress Entry
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
