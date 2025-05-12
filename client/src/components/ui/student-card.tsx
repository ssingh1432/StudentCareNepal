import { Student, Progress } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileBarChart, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface StudentCardProps {
  student: Student;
  teacher?: { id: number; name: string };
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onViewProgress?: (student: Student) => void;
  onAddProgress?: (student: Student) => void;
  latestProgress?: Progress;
}

export function StudentCard({
  student,
  teacher,
  onEdit,
  onDelete,
  onViewProgress,
  onAddProgress,
  latestProgress
}: StudentCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isImageError, setIsImageError] = useState(false);

  // Handle image load error
  const handleImageError = () => {
    setIsImageError(true);
  };

  // Format learning ability for display
  const getLearningAbilityClass = (ability: string | null | undefined) => {
    if (!ability) return "badge-average";
    
    switch (ability.toLowerCase()) {
      case "talented": return "badge-talented";
      case "average": return "badge-average";
      case "slow learner": return "badge-slow";
      default: return "badge-average";
    }
  };

  // Format class for display
  const getClassBadgeClass = (classLevel: string | null | undefined) => {
    if (!classLevel) return "badge-lkg";
    
    switch (classLevel.toLowerCase()) {
      case "nursery": return "badge-nursery";
      case "lkg": return "badge-lkg";
      case "ukg": return "badge-ukg";
      default: return "badge-lkg";
    }
  };

  return (
    <Card className="overflow-hidden card-hover">
      <CardHeader className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary-50">
        <div>
          <span className={`badge ${getClassBadgeClass(student.class)}`}>
            {student.class}
          </span>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        {user?.role === "admin" || student.teacherId === user?.id ? (
          <div className="flex">
            <Button variant="ghost" size="sm" className="mr-1" onClick={() => onEdit?.(student)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete?.(student)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex-1 flex">
          <div className="w-1/3 bg-primary-50 flex items-center justify-center p-2">
            {student.photoUrl && !isImageError ? (
              <img 
                src={student.photoUrl} 
                alt={`${student.name} photo`} 
                className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
                onError={handleImageError}
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold border-2 border-white shadow">
                {student.name.charAt(0)}
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
                <p className={`font-medium ${getLearningAbilityClass(student.learningAbility)}`}>
                  {student.learningAbility}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Writing Speed</p>
                <p className="font-medium">
                  {student.writingSpeed || (student.class === "Nursery" ? "N/A" : "Not Set")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Teacher</p>
                <p className="font-medium">{teacher?.name || "Unassigned"}</p>
              </div>
            </div>
            
            {latestProgress && (
              <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                <p className="text-xs text-gray-500">Latest Progress ({new Date(latestProgress.date).toLocaleDateString()})</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className={`text-xs badge ${latestProgress.socialSkills === "Excellent" ? "badge-excellent" : latestProgress.socialSkills === "Good" ? "badge-good" : "badge-needs-improvement"}`}>
                    Social: {latestProgress.socialSkills}
                  </span>
                  <span className={`text-xs badge ${latestProgress.preLiteracy === "Excellent" ? "badge-excellent" : latestProgress.preLiteracy === "Good" ? "badge-good" : "badge-needs-improvement"}`}>
                    Literacy: {latestProgress.preLiteracy}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-primary hover:text-primary-700 font-medium"
          onClick={() => onViewProgress?.(student)}
        >
          <FileBarChart className="h-3.5 w-3.5 mr-1" />
          View Progress
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-primary hover:text-primary-700 font-medium"
          onClick={() => onAddProgress?.(student)}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Add Progress
        </Button>
      </CardFooter>
    </Card>
  );
}
