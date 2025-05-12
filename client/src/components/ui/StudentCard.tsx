import { Link } from "wouter";
import { Edit, Trash, File, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Student } from "@shared/schema";

interface StudentCardProps {
  student: Student;
  onDelete?: (id: number) => void;
}

export default function StudentCard({ student, onDelete }: StudentCardProps) {
  const getClassBadgeClass = (className: string) => {
    switch (className.toLowerCase()) {
      case 'nursery': return 'class-badge-nursery';
      case 'lkg': return 'class-badge-lkg';
      case 'ukg': return 'class-badge-ukg';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAbilityBadgeClass = (ability: string) => {
    switch (ability.toLowerCase()) {
      case 'talented': return 'ability-badge-talented';
      case 'average': return 'ability-badge-average';
      case 'slow learner': return 'ability-badge-slow-learner';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      onDelete(student.id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge variant="outline" className={getClassBadgeClass(student.class)}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Link href={`/students/${student.id}`}>
            <Button variant="ghost" size="icon">
              <Edit className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash className="h-5 w-5 text-gray-500" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          {student.photoUrl ? (
            <img 
              src={student.photoUrl} 
              alt={student.name} 
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow">
              <span className="text-2xl font-semibold text-gray-400">
                {student.name.charAt(0)}
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
              <p className="font-medium">{student.learningAbility}</p>
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <p className="font-medium">{student.writingSpeed || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Teacher</p>
              <p className="font-medium">{student.teacherName}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Link href={`/students/${student.id}`}>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-500">
            <File className="h-4 w-4 mr-1" />
            View Progress
          </Button>
        </Link>
        <Link href={`/progress/add/${student.id}`}>
          <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-500">
            <Plus className="h-4 w-4 mr-1" />
            Add Progress
          </Button>
        </Link>
      </div>
    </div>
  );
}
