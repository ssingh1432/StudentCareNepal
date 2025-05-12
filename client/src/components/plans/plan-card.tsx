import { 
  Card, 
  CardContent
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
  BookOpen, 
  CalendarDays, 
  Edit, 
  EyeIcon, 
  FileText, 
  MoreVertical, 
  Trash, 
  User 
} from "lucide-react";
import { TeachingPlan } from "@shared/schema";

interface PlanCardProps {
  plan: TeachingPlan;
  createdBy: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanCard({ plan, createdBy, onEdit, onDelete }: PlanCardProps) {
  // Get badge color based on plan type
  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case "Annual":
        return "bg-green-100 text-green-800";
      case "Monthly":
        return "bg-indigo-100 text-indigo-800";
      case "Weekly":
        return "bg-yellow-100 text-yellow-800";
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

  // Format date ranges
  const formatDateRange = () => {
    const startDate = new Date(plan.startDate).toLocaleDateString();
    const endDate = new Date(plan.endDate).toLocaleDateString();
    return `${startDate} to ${endDate}`;
  };

  // Extract goals for badges (assuming goals are comma-separated)
  const extractGoals = () => {
    // Split by commas, periods, or newlines and filter out empty entries
    return plan.goals
      .split(/[,.\n]+/)
      .map(goal => goal.trim())
      .filter(goal => goal.length > 0)
      .slice(0, 3); // Show max 3 goals
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge className={getPlanTypeColor(plan.type)}>
            {plan.type}
          </Badge>
          <Badge className={getClassColor(plan.class)}>
            {plan.class}
          </Badge>
        </div>
        
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">{plan.title}</h3>
        
        <div className="mt-2 max-w-xl text-sm text-gray-500 h-20 overflow-hidden">
          <p>{plan.description}</p>
        </div>
        
        <div className="mt-4 space-y-1">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDays className="mr-1.5 h-4 w-4 text-gray-400" />
            <p>{formatDateRange()}</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <User className="mr-1.5 h-4 w-4 text-gray-400" />
            <p>Created by: {createdBy}</p>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {extractGoals().map((goal, index) => (
            <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {goal.length > 20 ? goal.slice(0, 20) + '...' : goal}
            </Badge>
          ))}
        </div>
        
        <div className="mt-5 flex justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <EyeIcon className="mr-1 h-4 w-4" /> View
            </Button>
            
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-1 h-4 w-4" /> Edit
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
            <Trash className="mr-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
