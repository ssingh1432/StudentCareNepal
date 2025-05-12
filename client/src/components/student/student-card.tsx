import { Student } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon, BarChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: Student;
  teacherName?: string;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onViewProgress: (student: Student) => void;
}

export function StudentCard({ 
  student, 
  teacherName,
  onEdit, 
  onDelete, 
  onViewProgress 
}: StudentCardProps) {
  // Generate color based on class
  const getClassColor = (className: string) => {
    switch (className) {
      case "Nursery":
        return "bg-yellow-100 text-yellow-800";
      case "LKG":
        return "bg-blue-100 text-blue-800";
      case "UKG":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate color based on learning ability
  const getAbilityColor = (ability: string) => {
    switch (ability) {
      case "Talented":
        return "bg-green-100 text-green-800";
      case "Average":
        return "bg-yellow-100 text-yellow-800";
      case "Slow Learner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate color based on writing speed
  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Speed Writing":
        return "bg-blue-100 text-blue-800";
      case "Slow Writing":
        return "bg-orange-100 text-orange-800";
      case "N/A":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Generate initials for avatar fallback
  const getInitials = () => {
    return student.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge className={cn("mb-1", getClassColor(student.class))}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onEdit(student)}
            className="text-gray-400 hover:text-gray-500"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(student)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="flex-1 p-0">
        <div className="flex">
          <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
            <Avatar className="h-24 w-24 rounded-full border-2 border-white shadow">
              <AvatarImage 
                src={student.photoUrl} 
                alt={student.name} 
                className="object-cover"
              />
              <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="w-2/3 p-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Age</p>
                <p className="font-medium">{student.age} years</p>
              </div>
              <div>
                <p className="text-gray-500">Learning Ability</p>
                <Badge variant="outline" className={getAbilityColor(student.learningAbility)}>
                  {student.learningAbility}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Writing Speed</p>
                <Badge variant="outline" className={getSpeedColor(student.writingSpeed)}>
                  {student.writingSpeed}
                </Badge>
              </div>
              {teacherName && (
                <div>
                  <p className="text-gray-500">Teacher</p>
                  <p className="font-medium">{teacherName}</p>
                </div>
              )}
            </div>
            
            {student.parentContact && (
              <div className="mt-2 text-sm">
                <p className="text-gray-500">Parent Contact</p>
                <p className="font-medium">{student.parentContact}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
          onClick={() => onViewProgress(student)}
        >
          <BarChart className="h-4 w-4 mr-1" />
          View Progress
        </Button>
      </CardFooter>
    </Card>
  );
}
