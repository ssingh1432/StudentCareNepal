import { TeachingPlan } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Edit, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PlanCardProps {
  plan: TeachingPlan;
  teacherName?: string;
  onView?: (plan: TeachingPlan) => void;
  onEdit?: (plan: TeachingPlan) => void;
  onDelete?: (plan: TeachingPlan) => void;
}

export function PlanCard({
  plan,
  teacherName,
  onView,
  onEdit,
  onDelete
}: PlanCardProps) {
  const { user } = useAuth();

  // Format dates for display
  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get class badge class
  const getClassBadgeClass = (classLevel: string) => {
    switch (classLevel.toLowerCase()) {
      case "nursery": return "badge-nursery";
      case "lkg": return "badge-lkg";
      case "ukg": return "badge-ukg";
      default: return "badge-lkg";
    }
  };

  // Get plan type badge class
  const getPlanTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "annual": return "badge-annual";
      case "monthly": return "badge-monthly";
      case "weekly": return "badge-weekly";
      default: return "badge-monthly";
    }
  };

  // Extract goals and activities for display
  const extractKeyPoints = (text: string, limit: number = 3): string[] => {
    // Split by line breaks, numbering, or bullets
    const points = text.split(/\r?\n|(?:\d+\.)|(?:-\s*)/);
    return points
      .map(point => point.trim())
      .filter(point => point.length > 0)
      .slice(0, limit);
  };

  // Check if user can edit/delete the plan
  const canModify = user?.role === "admin" || plan.createdBy === user?.id;

  return (
    <Card className="overflow-hidden card-hover">
      <CardHeader className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary-50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <span className={`badge ${getPlanTypeBadgeClass(plan.type)}`}>
              {plan.type}
            </span>
            <span className={`badge ${getClassBadgeClass(plan.class)}`}>
              {plan.class}
            </span>
          </div>
          {canModify && (
            <div className="flex">
              <Button variant="ghost" size="sm" className="mr-1" onClick={() => onEdit?.(plan)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete?.(plan)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">{plan.title}</h3>
        
        <div className="text-sm text-gray-600 line-clamp-2 mb-4">
          {plan.description}
        </div>
        
        <div className="space-y-4">
          {/* Plan date range */}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
            <p>{formatDate(plan.startDate)} to {formatDate(plan.endDate)}</p>
          </div>
          
          {/* Created by */}
          <div className="flex items-center text-sm text-gray-500">
            <User className="h-4 w-4 text-gray-400 mr-2" />
            <p>Created by: {teacherName || "Unknown"}</p>
          </div>
        </div>
        
        {/* Key activities preview */}
        {plan.activities && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Activities:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {extractKeyPoints(plan.activities).map((activity, index) => (
                <li key={index} className="truncate">{activity}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onView?.(plan)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
