import { File, Edit, Trash, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { TeachingPlan } from "@shared/schema";

interface PlanCardProps {
  plan: TeachingPlan;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function PlanCard({ plan, onEdit, onDelete }: PlanCardProps) {
  const getPlanTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'plan-badge-annual';
      case 'monthly': return 'plan-badge-monthly';
      case 'weekly': return 'plan-badge-weekly';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassBadgeClass = (className: string) => {
    switch (className.toLowerCase()) {
      case 'nursery': return 'class-badge-nursery';
      case 'lkg': return 'class-badge-lkg';
      case 'ukg': return 'class-badge-ukg';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} to ${end}`;
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(plan.id);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete this plan?`)) {
      onDelete(plan.id);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPlanTypeBadgeClass(plan.type)}>
                {plan.type}
              </Badge>
              <Badge variant="outline" className={getClassBadgeClass(plan.class)}>
                {plan.class}
              </Badge>
            </div>
            <h3 className="mt-1 text-lg font-medium text-gray-900">{plan.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatDateRange(plan.startDate, plan.endDate)}
            </p>
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{plan.description}</p>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={handleEdit}>
                <Edit className="h-5 w-5 text-gray-400" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash className="h-5 w-5 text-gray-400" />
              </Button>
            )}
          </div>
        </div>

        {plan.goals && (
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.goals.split(',').map((goal, index) => (
              <div 
                key={index} 
                className="text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {goal.trim()}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Created by: {plan.createdBy}
        </div>
      </CardFooter>
    </Card>
  );
}
