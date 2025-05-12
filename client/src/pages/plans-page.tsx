import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeachingPlan, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanCard } from "@/components/ui/plan-card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PlanForm from "@/components/forms/plan-form";
import ConfirmationDialog from "@/components/dialogs/confirmation-dialog";

export default function PlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const [isPlanFormOpen, setIsPlanFormOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);

  // Get plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/teaching-plans"],
  });

  // Get teachers for attribution
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: number) => {
      await apiRequest("DELETE", `/api/teaching-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      toast({
        title: "Plan deleted",
        description: "The teaching plan has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Open plan form for editing or creating
  const handleOpenPlanForm = (plan?: TeachingPlan, viewOnly: boolean = false) => {
    setSelectedPlan(plan || null);
    setIsViewMode(viewOnly);
    setIsPlanFormOpen(true);
  };

  // Confirm plan deletion
  const handleDeletePlan = (plan: TeachingPlan) => {
    setSelectedPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Apply filters to plans
  const filteredPlans = plans?.filter(plan => {
    // Type filter
    if (typeFilter && plan.type !== typeFilter) return false;
    
    // Class filter
    if (classFilter && plan.class !== classFilter) return false;
    
    // Search filter
    if (searchFilter && !plan.title.toLowerCase().includes(searchFilter.toLowerCase())) {
      // Also search in description
      if (!plan.description.toLowerCase().includes(searchFilter.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  // Sort plans by date (most recent first)
  const sortedPlans = filteredPlans?.sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  // Get teacher name by ID
  const getTeacherName = (teacherId: number): string => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher?.name || "Unknown";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Teaching Plans" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
                <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex-shrink-0">
                <Button 
                  onClick={() => handleOpenPlanForm()}
                  className="inline-flex items-center"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create Plan
                </Button>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="bg-white p-4 shadow rounded-lg mb-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Plan Type Filter */}
                <div>
                  <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700">Plan Type</label>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger id="plan-type-filter" className="mt-1">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Class Filter */}
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
                      <SelectItem value="">All Classes</SelectItem>
                      <SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="LKG">LKG</SelectItem>
                      <SelectItem value="UKG">UKG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Search Filter */}
                <div>
                  <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700">Search</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      id="plan-search"
                      className="pl-10"
                      placeholder="Search plans"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Plans Grid */}
            <div>
              {isLoadingPlans ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between mb-4">
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="h-5 w-24" />
                        </div>
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedPlans?.length === 0 ? (
                <div className="bg-white p-12 text-center shadow rounded-lg">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No teaching plans found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {typeFilter || classFilter || searchFilter
                      ? "Try changing your filters or create a new plan"
                      : "Get started by creating your first teaching plan"
                    }
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => handleOpenPlanForm()}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Create New Plan
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedPlans?.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      teacherName={getTeacherName(plan.createdBy)}
                      onView={() => handleOpenPlanForm(plan, true)}
                      onEdit={() => handleOpenPlanForm(plan)}
                      onDelete={() => handleDeletePlan(plan)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Plan Form Dialog */}
      {isPlanFormOpen && (
        <PlanForm
          plan={selectedPlan}
          viewOnly={isViewMode}
          onClose={() => {
            setIsPlanFormOpen(false);
            setSelectedPlan(null);
            setIsViewMode(false);
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedPlan && (
        <ConfirmationDialog
          title="Delete Teaching Plan"
          message={`Are you sure you want to delete "${selectedPlan.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDestructive={true}
          isOpen={isDeleteDialogOpen}
          onConfirm={() => deletePlanMutation.mutate(selectedPlan.id)}
          onCancel={() => setIsDeleteDialogOpen(false)}
          isPending={deletePlanMutation.isPending}
        />
      )}
    </div>
  );
}
