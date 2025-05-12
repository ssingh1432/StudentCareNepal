import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Eye, Trash2, Search } from "lucide-react";
import { TeachingPlan, classLevels, planTypes } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlanListProps {
  onView: (planId: number) => void;
  onEdit: (planId: number) => void;
  onDelete: (planId: number) => void;
}

export function PlanList({ onView, onEdit, onDelete }: PlanListProps) {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: plans, isLoading } = useQuery<TeachingPlan[]>({
    queryKey: ['/api/plans', { typeFilter, classFilter, searchQuery }],
  });

  const handleDeleteConfirm = async (planId: number) => {
    try {
      await apiRequest("DELETE", `/api/plans/${planId}`, {});
      toast({
        title: "Success",
        description: "Plan has been deleted successfully",
      });
      // The query will be invalidated elsewhere
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getTypeBadgeClass = (type: string) => {
    const normalized = type.toLowerCase();
    return `plan-tag-${normalized}`;
  };

  const getClassBadgeClass = (className: string) => {
    const normalized = className.toLowerCase();
    return `class-tag-${normalized}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Teaching Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {planTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search plans..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans && plans.length > 0 ? (
            plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <Badge className={getTypeBadgeClass(plan.type)}>
                          {plan.type}
                        </Badge>
                        <Badge className={getClassBadgeClass(plan.class)}>
                          {plan.class}
                        </Badge>
                      </div>
                    </div>
                    
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.title}</h3>
                    
                    <div className="mt-2 max-w-xl text-sm text-gray-500 h-24 overflow-hidden">
                      <p>{plan.description}</p>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="text-gray-400 mr-1 h-4 w-4" />
                        <p>
                          {format(new Date(plan.startDate), "MMM d, yyyy")} to{" "}
                          {format(new Date(plan.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-5 flex">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => onView(plan.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="mr-2 bg-purple-600 hover:bg-purple-700"
                        onClick={() => onEdit(plan.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => onDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              No teaching plans found. Try adjusting your filters or create a new plan.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
