import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Trash, Plus, FileText, Calendar } from "lucide-react";
import { TeachingPlan } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlanForm } from "@/components/plans/plan-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export function PlanList() {
  const { toast } = useToast();
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [viewPlanData, setViewPlanData] = useState<TeachingPlan | null>(null);
  const [editPlanData, setEditPlanData] = useState<TeachingPlan | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Build query params
  const queryParams = new URLSearchParams();
  if (planTypeFilter !== "all") {
    queryParams.append("type", planTypeFilter);
  }
  if (classFilter !== "all") {
    queryParams.append("classType", classFilter);
  }

  const { data: plans = [], isLoading } = useQuery<TeachingPlan[]>({
    queryKey: [`/api/teaching-plans?${queryParams.toString()}`],
  });

  // Filter by search term
  const filteredPlans = plans.filter(plan => 
    searchTerm === "" || 
    plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;

    try {
      await apiRequest("DELETE", `/api/teaching-plans/${deletePlanId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      
      toast({
        title: "Teaching plan deleted",
        description: "The teaching plan has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teaching plan",
        variant: "destructive",
      });
    } finally {
      setDeletePlanId(null);
    }
  };

  const formatPlanType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teaching Plans</h2>
        <Button onClick={() => setAddPlanOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Plan
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={planTypeFilter} onValueChange={setPlanTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Plan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="nursery">Nursery</SelectItem>
              <SelectItem value="lkg">LKG</SelectItem>
              <SelectItem value="ukg">UKG</SelectItem>
            </SelectContent>
          </Select>

          <div className="md:col-span-2 relative">
            <Input
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            <FileText className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teaching plans found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new teaching plan.
          </p>
          <div className="mt-6">
            <Button onClick={() => setAddPlanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Plan
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="overflow-hidden flex flex-col">
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={plan.type as any}>
                        {formatPlanType(plan.type)}
                      </Badge>
                      <Badge variant={plan.classType as any}>
                        {plan.classType.toUpperCase()}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 truncate max-w-xs">
                      {plan.title}
                    </h3>
                  </div>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditPlanData(plan)}
                      title="Edit Plan"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletePlanId(plan.id)}
                      title="Delete Plan"
                    >
                      <Trash className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {format(new Date(plan.startDate), "MMM d, yyyy")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {plan.description}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 mt-auto border-t border-gray-200 bg-gray-50">
                <Button 
                  variant="link" 
                  size="sm"
                  className="p-0 h-auto text-purple-600"
                  onClick={() => setViewPlanData(plan)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create Teaching Plan</DialogTitle>
            <DialogDescription>
              Create a new teaching plan with activities and learning goals.
            </DialogDescription>
          </DialogHeader>
          <PlanForm
            onSuccess={() => setAddPlanOpen(false)}
            onCancel={() => setAddPlanOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog
        open={!!editPlanData}
        onOpenChange={(open) => !open && setEditPlanData(null)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Teaching Plan</DialogTitle>
            <DialogDescription>
              Update the teaching plan details, activities, and goals.
            </DialogDescription>
          </DialogHeader>
          {editPlanData && (
            <PlanForm
              initialData={editPlanData}
              isEditMode={true}
              onSuccess={() => setEditPlanData(null)}
              onCancel={() => setEditPlanData(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog
        open={!!viewPlanData}
        onOpenChange={(open) => !open && setViewPlanData(null)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center space-x-2">
                <span>{viewPlanData?.title}</span>
                <Badge variant={viewPlanData?.type as any}>
                  {viewPlanData?.type && formatPlanType(viewPlanData.type)}
                </Badge>
                <Badge variant={viewPlanData?.classType as any}>
                  {viewPlanData?.classType && viewPlanData.classType.toUpperCase()}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          {viewPlanData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                <p className="text-sm">
                  {format(new Date(viewPlanData.startDate), "MMMM d, yyyy")} - {format(new Date(viewPlanData.endDate), "MMMM d, yyyy")}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-sm whitespace-pre-line">{viewPlanData.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Activities</h3>
                <p className="text-sm whitespace-pre-line">{viewPlanData.activities}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Learning Goals</h3>
                <p className="text-sm whitespace-pre-line">{viewPlanData.goals}</p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewPlanData(null);
                    setEditPlanData(viewPlanData);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="default"
                  onClick={() => setViewPlanData(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletePlanId}
        onOpenChange={(open) => !open && setDeletePlanId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this teaching plan.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
