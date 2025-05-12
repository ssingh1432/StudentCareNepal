import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PlanList } from "@/components/teaching-plan/plan-list";
import { PlanForm } from "@/components/teaching-plan/plan-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TeachingPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BookOpen, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TeachingPlansPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);
  const [filters, setFilters] = useState({
    type: "all",
    class: "all",
    search: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const search = useSearch();

  // Parse URL for showing form
  useEffect(() => {
    if (search.includes("new=true")) {
      setShowForm(true);
    }
  }, [search]);

  // Fetch teaching plans
  const { data: plans, isLoading } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/protected/teaching-plans", filters.type, filters.class],
    queryFn: async ({ queryKey }) => {
      const [_, type, classLevel] = queryKey;
      
      let url = "/api/protected/teaching-plans";
      const params = new URLSearchParams();
      
      if (type !== "all") params.append("type", type as string);
      if (classLevel !== "all") params.append("class", classLevel as string);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch teaching plans");
      return res.json();
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/teaching-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/teaching-plans"] });
      toast({
        title: "Plan deleted",
        description: "Teaching plan has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teaching plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter plans by search term
  const filteredPlans = plans
    ? plans.filter((plan) =>
        plan.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        plan.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    : [];

  const handleEditPlan = (plan: TeachingPlan) => {
    setSelectedPlan(plan);
    setShowForm(true);
  };

  const handleDeletePlan = (id: number) => {
    if (window.confirm("Are you sure you want to delete this teaching plan?")) {
      deletePlanMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedPlan(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ["/api/protected/teaching-plans"] });
  };

  return (
    <MainLayout title="Teaching Plans">
      {!showForm ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage teaching plans for each class
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>
          </div>

          <Card className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="plan-type-filter">Plan Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
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
                  value={filters.class}
                  onValueChange={(value) => setFilters({ ...filters, class: value })}
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="plan-search"
                    type="text"
                    placeholder="Search plans"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <PlanList
              plans={filteredPlans}
              onEdit={handleEditPlan}
              onDelete={handleDeletePlan}
            />
          )}
        </>
      ) : (
        <PlanForm
          plan={selectedPlan}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </MainLayout>
  );
}
