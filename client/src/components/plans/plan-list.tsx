import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TeachingPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { PlanForm } from "./plan-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Book, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  BookOpen,
  Plus
} from "lucide-react";

export function PlanList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAddPlanForm, setShowAddPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<(TeachingPlan & { id: number }) | null>(null);
  const [viewingPlan, setViewingPlan] = useState<TeachingPlan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  
  // Fetch teaching plans
  const { data: teachingPlans, isLoading } = useQuery<TeachingPlan[]>({
    queryKey: [
      '/api/teaching-plans',
      typeFilter !== "all" ? typeFilter : undefined,
      classFilter !== "all" ? classFilter : undefined,
    ],
  });
  
  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teaching-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-plans'] });
      toast({
        title: "Plan Deleted",
        description: "The teaching plan has been removed successfully.",
      });
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter plans
  const filteredPlans = teachingPlans?.filter(plan => {
    if (searchTerm && !plan.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Function to get badge variant based on plan type
  const getTypeVariant = (type: string): "annual" | "monthly" | "weekly" => {
    switch (type) {
      case "Annual": return "annual";
      case "Monthly": return "monthly";
      case "Weekly": return "weekly";
      default: return "weekly";
    }
  };
  
  // Function to get badge variant based on class
  const getClassVariant = (className: string): "nursery" | "lkg" | "ukg" => {
    switch (className) {
      case "Nursery": return "nursery";
      case "LKG": return "lkg";
      case "UKG": return "ukg";
      default: return "nursery";
    }
  };
  
  const handleEditPlan = (plan: TeachingPlan & { id: number }) => {
    setEditingPlan(plan);
  };
  
  const handleViewPlan = (plan: TeachingPlan) => {
    setViewingPlan(plan);
  };
  
  const handleDeletePlan = (id: number) => {
    setPlanToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (planToDelete) {
      deleteMutation.mutate(planToDelete);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
        <Button onClick={() => setShowAddPlanForm(true)}>
          <BookOpen className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <Select 
              value={typeFilter} 
              onValueChange={setTypeFilter}
            >
              <SelectTrigger>
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
            <label htmlFor="plan-class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select 
              value={classFilter} 
              onValueChange={setClassFilter}
            >
              <SelectTrigger>
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
            <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
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
      </div>
      
      {/* Teaching Plans Grid */}
      {isLoading ? (
        <div className="p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <p className="mt-4 text-gray-500">Loading teaching plans...</p>
        </div>
      ) : filteredPlans?.length === 0 ? (
        <div className="p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No teaching plans found matching the filters.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => setShowAddPlanForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans?.map(plan => (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getTypeVariant(plan.type)}>
                    {plan.type}
                  </Badge>
                  <Badge variant={getClassVariant(plan.class)}>
                    {plan.class}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <CardDescription>
                  <div className="flex items-center text-sm mt-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    {format(new Date(plan.startDate), "MMM d, yyyy")} to {format(new Date(plan.endDate), "MMM d, yyyy")}
                  </div>
                  <div className="flex items-center text-sm mt-1">
                    <Book className="h-3.5 w-3.5 text-gray-400 mr-1" />
                    Created by: {plan.teacherId === user?.id ? "You" : "Teacher"}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-3">{plan.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewPlan(plan)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleEditPlan(plan as TeachingPlan & { id: number })}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add plan form */}
      {showAddPlanForm && (
        <PlanForm 
          open={showAddPlanForm} 
          onClose={() => setShowAddPlanForm(false)} 
        />
      )}
      
      {/* Edit plan form */}
      {editingPlan && (
        <PlanForm 
          open={!!editingPlan} 
          onClose={() => setEditingPlan(null)} 
          editingPlan={editingPlan}
        />
      )}
      
      {/* View plan dialog */}
      {viewingPlan && (
        <Dialog open={!!viewingPlan} onOpenChange={() => setViewingPlan(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                <Badge variant={getTypeVariant(viewingPlan.type)}>
                  {viewingPlan.type}
                </Badge>
                <Badge variant={getClassVariant(viewingPlan.class)}>
                  {viewingPlan.class}
                </Badge>
              </div>
              <DialogTitle className="mt-2 text-xl">{viewingPlan.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  {format(new Date(viewingPlan.startDate), "MMMM d, yyyy")} to {format(new Date(viewingPlan.endDate), "MMMM d, yyyy")}
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{viewingPlan.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Activities</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{viewingPlan.activities}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Learning Goals</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{viewingPlan.goals}</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setViewingPlan(null)}
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setEditingPlan(viewingPlan as TeachingPlan & { id: number });
                  setViewingPlan(null);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teaching Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this teaching plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
