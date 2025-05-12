import { TeachingPlan } from "@shared/schema";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, BookOpen, Edit, Eye, FileText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanListProps {
  plans: TeachingPlan[];
  onEdit: (plan: TeachingPlan) => void;
  onDelete: (id: number) => void;
}

export function PlanList({ plans, onEdit, onDelete }: PlanListProps) {
  // Helper to determine badge color for plan type
  const getTypeBadgeColor = (type: string) => {
    switch(type) {
      case "Annual":
        return "bg-green-100 text-green-800";
      case "Monthly":
        return "bg-blue-100 text-blue-800";
      case "Weekly":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper to determine badge color for class
  const getClassBadgeColor = (classLevel: string) => {
    switch(classLevel) {
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

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10">
          <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No teaching plans found</h3>
          <p className="text-gray-500 mb-4">There are no teaching plans matching your filters</p>
          <Button onClick={() => onEdit({} as TeachingPlan)} className="bg-purple-600 hover:bg-purple-700">
            Create Your First Teaching Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className="overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge
                variant="outline"
                className={getTypeBadgeColor(plan.type)}
              >
                {plan.type}
              </Badge>
              <Badge
                variant="outline"
                className={getClassBadgeColor(plan.class)}
              >
                {plan.class}
              </Badge>
            </div>
            
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1">
              {plan.title}
            </h3>
            
            <div className="mt-2 max-w-xl text-sm text-gray-500 h-24 overflow-hidden">
              <p>{plan.description}</p>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="text-gray-400 mr-1 h-4 w-4" />
                <p>
                  {new Date(plan.startDate).toLocaleDateString()} to{" "}
                  {new Date(plan.endDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {plan.goals.split(/[\.,;]/).filter(g => g.trim()).slice(0, 3).map((goal, idx) => (
                  <div key={idx} className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                    {goal.trim().substring(0, 20)}{goal.trim().length > 20 ? '...' : ''}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-5 flex">
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 mr-2"
                onClick={() => window.open(`/view-plan/${plan.id}`, '_blank')}
              >
                <Eye className="mr-1 h-4 w-4" /> View
              </Button>
              
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 mr-2"
                onClick={() => onEdit(plan)}
              >
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-red-700 hover:bg-red-50"
                onClick={() => onDelete(plan.id)}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
