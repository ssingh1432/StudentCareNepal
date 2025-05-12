import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical,
  Pencil,
  Trash2,
  BarChart2,
  PlusCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClassBadge, LearningAbilityBadge, WritingSpeedBadge } from '../shared/Badge';
import { DEFAULT_AVATAR_URL } from '@/lib/cloudinary';

export interface StudentCardProps {
  student: {
    id: number;
    name: string;
    age: number;
    class: string;
    photoUrl?: string;
    learningAbility: string;
    writingSpeed: string;
    teacherId?: number;
    teacherName?: string;
  };
  onEdit: (student: any) => void;
  onDelete: (student: any) => void;
  onViewProgress: (student: any) => void;
  onAddProgress: (student: any) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onDelete,
  onViewProgress,
  onAddProgress
}) => {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <ClassBadge className={student.class} />
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewProgress(student)}>
                <BarChart2 className="h-4 w-4 mr-2" />
                View Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddProgress(student)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Progress Entry
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(student)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          <img 
            src={student.photoUrl || DEFAULT_AVATAR_URL} 
            alt={student.name} 
            className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              e.currentTarget.src = DEFAULT_AVATAR_URL;
            }}
          />
        </div>
        
        <div className="w-2/3 p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium">{student.age} years</p>
            </div>
            <div>
              <p className="text-gray-500">Learning Ability</p>
              <LearningAbilityBadge ability={student.learningAbility} />
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <WritingSpeedBadge speed={student.writingSpeed} />
            </div>
            <div>
              <p className="text-gray-500">Teacher</p>
              <p className="font-medium">{student.teacherName || "Unassigned"}</p>
            </div>
          </div>
        </div>
      </div>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="link" 
          className="text-xs text-purple-600 hover:text-purple-700 p-0"
          onClick={() => onViewProgress(student)}
        >
          View Progress
        </Button>
        <Button 
          variant="link" 
          className="text-xs text-purple-600 hover:text-purple-700 p-0"
          onClick={() => onAddProgress(student)}
        >
          Add Progress Entry
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentCard;
