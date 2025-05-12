import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Edit, Trash2, BookOpen } from "lucide-react";
import { Link } from "wouter";

interface StudentCardProps {
  student: {
    id: number;
    name: string;
    age: number;
    class: string;
    learningAbility: string;
    writingSpeed: string;
    photoUrl?: string;
    teacherName?: string;
  };
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  // Function to get color for learning ability badge
  const getLearningAbilityColor = (ability: string) => {
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

  // Function to get color for writing speed badge
  const getWritingSpeedColor = (speed: string) => {
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

  // Function to get color for class badge
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 border-b border-gray-200 bg-primary-50 flex justify-between items-center">
        <div>
          <Badge className={getClassColor(student.class)}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(student.id)}
            className="h-8 w-8 text-gray-500 hover:text-gray-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(student.id)}
            className="h-8 w-8 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex">
          <div className="w-1/3 bg-primary-50 flex items-center justify-center p-4">
            <Avatar className="h-24 w-24 border-2 border-white shadow">
              {student.photoUrl ? (
                <AvatarImage src={student.photoUrl} alt={student.name} />
              ) : null}
              <AvatarFallback className="text-xl bg-purple-100 text-purple-600">
                {student.name.substring(0, 2).toUpperCase()}
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
                <Badge className={getLearningAbilityColor(student.learningAbility)}>
                  {student.learningAbility}
                </Badge>
              </div>
              
              <div>
                <p className="text-gray-500">Writing Speed</p>
                <Badge className={getWritingSpeedColor(student.writingSpeed)}>
                  {student.writingSpeed}
                </Badge>
              </div>
              
              <div>
                <p className="text-gray-500">Teacher</p>
                <p className="font-medium">{student.teacherName || "Unassigned"}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Link href={`/progress?studentId=${student.id}`}>
          <a className="text-xs text-purple-600 hover:text-purple-500 font-medium flex items-center">
            <BookOpen className="h-3 w-3 mr-1" />
            View Progress
          </a>
        </Link>
        <Link href={`/progress?add=true&studentId=${student.id}`}>
          <a className="text-xs text-purple-600 hover:text-purple-500 font-medium">
            Add Progress Entry
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
}
