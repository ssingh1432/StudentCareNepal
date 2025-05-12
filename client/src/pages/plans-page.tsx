import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { PlanList } from '@/components/plans/plan-list';
import { PlanForm } from '@/components/plans/plan-form';
import { Button } from '@/components/ui/button';
import { PlusIcon, SearchIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  classOptions,
  planTypeOptions,
  TeachingPlan
} from '@shared/schema';

export default function PlansPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Extract query params
  const params = new URLSearchParams(location.split('?')[1]);
  const initialAction = params.get('action');
  
  // State for filtering and actions
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(initialAction === 'add');
  const [editingPlan, setEditingPlan] = useState<TeachingPlan | null>(null);

  // Fetch teaching plans with filters
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['/api/plans', { 
      class: classFilter === 'all' ? undefined : classFilter,
      type: typeFilter === 'all' ? undefined : typeFilter
    }],
    retry: false,
  });

  // Fetch teachers if admin
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin',
    retry: false,
  });

  // Filter plans by search query
  const filteredPlans = plans?.filter((plan: TeachingPlan) => {
    return searchQuery === "" || 
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Handlers
  const handleAddPlan = () => {
    setEditingPlan(null);
    setShowAddForm(true);
  };

  const handleEditPlan = (plan: TeachingPlan) => {
    setEditingPlan(plan);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingPlan(null);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Teaching Plans" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
              <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={handleAddPlan}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700">Plan Type</label>
                <Select 
                  value={typeFilter} 
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {planTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="plan-class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                <Select 
                  value={classFilter} 
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classOptions.map((cls) => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700">Search</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="text-gray-400 h-4 w-4" />
                  </div>
                  <Input
                    type="text"
                    id="plan-search"
                    className="pl-10"
                    placeholder="Search plans"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Teaching Plans Cards */}
          <PlanList 
            plans={filteredPlans || []} 
            teachers={teachers || []}
            isLoading={isLoading}
            onEdit={handleEditPlan}
            onRefresh={refetch}
          />
          
          {/* Add/Edit Plan Dialog */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Teaching Plan' : 'Create Teaching Plan'}
                </DialogTitle>
                <DialogDescription>
                  {editingPlan 
                    ? 'Update the teaching plan information below.' 
                    : 'Fill out the form below to create a new teaching plan.'}
                </DialogDescription>
              </DialogHeader>
              <PlanForm 
                plan={editingPlan}
                onClose={handleCloseForm}
              />
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
