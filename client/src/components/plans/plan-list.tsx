import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TeachingPlan } from "@shared/schema";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Search, Eye, Edit, Trash2, Plus, Calendar, User } from "lucide-react";

interface PlanListProps {
  onAddPlan: () => void;
  onEditPlan: (plan: TeachingPlan) => void;
  onViewPlan: (plan: TeachingPlan) => void;
}

export default function PlanList({ onAddPlan, onEditPlan, onViewPlan }: PlanListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // State for filters
  const [classFilter, setClassFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<TeachingPlan | null>(null);
  
  // Fetch plans
  const { data: plans = [], isLoading, isError } = useQuery({
    queryKey: ["/api/plans", classFilter, typeFilter],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, typeFilter] = queryKey as string[];
      let url = "/api/plans";
      
      const params = new URLSearchParams();
      if (classFilter !== "all") params.append("class", classFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json() as TeachingPlan[];
    },
  });
  
  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: "Plan Deleted",
        description: "Teaching plan has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter plans based on search term
  const filteredPlans = plans.filter((plan) => {
    if (searchTerm && !plan.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !plan.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  // Handle delete button click
  const handleDeleteClick = (plan: TeachingPlan) => {
    setPlanToDelete(plan);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (planToDelete) {
      deletePlanMutation.mutate(planToDelete.id);
    }
  };
  
  // Get badge color for plan type
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Annual":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "Monthly":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "Weekly":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      default:
        return "";
    }
  };
  
  // Get badge color for class
  const getClassBadgeColor = (className: string) => {
    switch (className) {
      case "Nursery":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "LKG":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "UKG":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "";
    }
  };
  
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Plans</h3>
            <p className="text-sm text-gray-500 mt-2">
              There was a problem loading the teaching plans. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/plans"] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Teaching Plans</CardTitle>
        <Button onClick={onAddPlan}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          <div>
            <Label htmlFor="plan-type-filter">Plan Type</Label>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger id="plan-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="plan-class-filter">Class</Label>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger id="plan-class-filter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Nursery">Nursery</SelectItem>
                <SelectItem value="LKG">LKG</SelectItem>
                <SelectItem value="UKG">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="plan-search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="plan-search"
                placeholder="Search plans"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <>
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No teaching plans found.</p>
                <Button 
                  className="mt-4"
                  onClick={onAddPlan}
                >
                  Create Your First Plan
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlans.map((plan) => (
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
                      <h3 className="text-lg leading-6 font-medium text-gray-900 truncate" title={plan.title}>
                        {plan.title}
                      </h3>
                      <div className="mt-2 max-w-xl text-sm text-gray-500 h-24 overflow-hidden">
                        <p>{plan.description}</p>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <p>
                            {format(new Date(plan.startDate), 'PP')} to {format(new Date(plan.endDate), 'PP')}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <p>Created by: {user?.id === plan.createdById ? 'You' : 'Another Teacher'}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewPlan(plan)}
                          className="mr-2"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onEditPlan(plan)}
                          className="mr-2 bg-purple-600 hover:bg-purple-700"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(plan)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{planToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
