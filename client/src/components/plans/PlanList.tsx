import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plan } from "@shared/schema";
import { Loader2, Plus, Search, FileText, Edit, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface PlanListProps {
  onAddPlan: () => void;
  onEditPlan: (plan: Plan) => void;
}

const PlanList = ({ onAddPlan, onEditPlan }: PlanListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.role === "admin";

  // Fetch teaching plans
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans", planTypeFilter, classFilter, searchQuery],
    queryFn: async ({ queryKey }) => {
      const [_, planType, classFilter, searchQuery] = queryKey;
      
      // Build the URL with query parameters
      const url = new URL("/api/plans", window.location.origin);
      
      if (planType !== "all") url.searchParams.append("type", planType as string);
      if (classFilter !== "all") url.searchParams.append("class", classFilter as string);
      if (searchQuery) url.searchParams.append("search", searchQuery as string);
      
      const response = await fetch(url.toString(), {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch teaching plans");
      }
      
      return response.json();
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
        title: "Plan deleted",
        description: "The teaching plan has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle plan deletion
  const handleDeletePlan = (plan: Plan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.title}"?`)) {
      deletePlanMutation.mutate(plan.id);
    }
  };

  // Helper functions for styling
  const getPlanTypeBadgeClass = (type: string) => {
    switch (type) {
      case "annual":
        return "bg-purple-100 text-purple-800";
      case "monthly":
        return "bg-green-100 text-green-800";
      case "weekly":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getClassBadgeClass = (classType: string) => {
    switch (classType) {
      case "nursery":
        return "bg-blue-100 text-blue-800";
      case "lkg":
        return "bg-purple-100 text-purple-800";
      case "ukg":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Filter Controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700">Plan Type</label>
            <Select 
              value={planTypeFilter} 
              onValueChange={setPlanTypeFilter}
            >
              <SelectTrigger id="plan-type-filter" className="mt-1">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="plan-class-filter" className="block text-sm font-medium text-gray-700">Class</label>
            <Select 
              value={classFilter} 
              onValueChange={setClassFilter}
            >
              <SelectTrigger id="plan-class-filter" className="mt-1">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="nursery">Nursery</SelectItem>
                <SelectItem value="lkg">LKG</SelectItem>
                <SelectItem value="ukg">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                id="plan-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                placeholder="Search plans"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Teaching Plans Cards */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {plans?.length || 0} Teaching Plans
        </h2>
        <Button 
          onClick={onAddPlan}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>
      
      {plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-white overflow-hidden shadow rounded-lg">
              <CardContent className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className={`${getPlanTypeBadgeClass(plan.type)}`}>
                    {plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}
                  </Badge>
                  <Badge className={`${getClassBadgeClass(plan.class)}`}>
                    {plan.class.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.title}</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500 h-24 overflow-hidden">
                  <p>{plan.description}</p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{formatDate(plan.startDate)} to {formatDate(plan.endDate)}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <p>Created by: {plan.teacherId}</p>
                  </div>
                </div>
                <div className="mt-5 flex">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mr-2"
                    onClick={() => window.open(`/api/plans/${plan.id}/view`, '_blank')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    View
                  </Button>
                  <Button 
                    size="sm"
                    className="mr-2 bg-purple-600 hover:bg-purple-700"
                    onClick={() => onEditPlan(plan)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeletePlan(plan)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No plans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || planTypeFilter !== "all" || classFilter !== "all"
              ? "Try adjusting your filters to find what you're looking for."
              : "Get started by creating a new teaching plan."}
          </p>
          <div className="mt-6">
            <Button 
              onClick={onAddPlan}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanList;
