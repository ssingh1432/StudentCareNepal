import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  ChartBar, 
  Edit, 
  MoreVertical, 
  Trash,
  Users
} from "lucide-react";
import { Student } from "@shared/schema";

interface StudentCardProps {
  student: Student;
  teacherName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentCard({ student, teacherName, onEdit, onDelete }: StudentCardProps) {
  // Get badge color based on learning ability
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

  // Get badge color based on writing speed
  const getWritingSpeedColor = (speed: string) => {
    switch (speed) {
      case "Speed Writing":
        return "bg-blue-100 text-blue-800";
      case "Slow Writing":
        return "bg-yellow-100 text-yellow-800";
      case "N/A":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get badge color based on class
  const getClassColor = (cls: string) => {
    switch (cls) {
      case "Nursery":
        return "bg-purple-100 text-purple-800";
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
      <CardHeader className="flex justify-between items-center p-4 border-b bg-gray-50">
        <div>
          <Badge className={getClassColor(student.class)}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0 flex">
        <div className="w-1/3 bg-gray-50 flex items-center justify-center p-4">
          {student.photoUrl ? (
            <img 
              src={student.photoUrl} 
              alt={student.name}
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow" 
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-white shadow">
              <span className="text-purple-600 text-2xl font-medium">
                {student.name.charAt(0).toUpperCase()}
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
              <Badge className={getLearningAbilityColor(student.learningAbility)}>
                {student.learningAbility}
              </Badge>
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <Badge className={getWritingSpeedColor(student.writingSpeed || "N/A")}>
                {student.writingSpeed || "N/A"}
              </Badge>
            </div>
            {teacherName && (
              <div>
                <p className="text-gray-500">Teacher</p>
                <p className="font-medium">{teacherName}</p>
              </div>
            )}
          </div>
          {student.notes && (
            <div className="mt-2">
              <p className="text-gray-500">Notes</p>
              <p className="text-sm text-gray-700 line-clamp-2">{student.notes}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 px-4 py-3 border-t flex justify-between">
        <Link href={`/progress?studentId=${student.id}`}>
          <Button variant="outline" size="sm" className="text-xs text-purple-600 hover:text-purple-700">
            <Users className="mr-1 h-3 w-3" />
            View Profile
          </Button>
        </Link>
        <Link href={`/progress?action=add&studentId=${student.id}`}>
          <Button variant="outline" size="sm" className="text-xs text-purple-600 hover:text-purple-700">
            <ChartBar className="mr-1 h-3 w-3" />
            Add Progress
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
