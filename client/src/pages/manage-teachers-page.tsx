import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { TeacherList } from "@/components/teachers/teacher-list";

export default function ManageTeachersPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<User | null>(null);
  
  const isAdmin = user?.role === "admin";
  
  // Redirect if not admin
  if (!isAdmin) {
    window.location.href = "/";
    return null;
  }
  
  // Query teachers
  const { data: teachers, isLoading, refetch } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });
  
  // Handle teacher creation/update
  const handleTeacherSaved = () => {
    refetch();
    setShowTeacherForm(false);
    setSelectedTeacher(null);
  };
  
  // Handle edit teacher
  const handleEditTeacher = (teacher: User) => {
    setSelectedTeacher(teacher);
    setShowTeacherForm(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Manage Teachers" 
          openMobileSidebar={() => setMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
              <p className="mt-1 text-sm text-gray-500">Add, edit, and delete teacher accounts</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Dialog open={showTeacherForm} onOpenChange={setShowTeacherForm}>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center bg-purple-600 hover:bg-purple-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <TeacherForm 
                    teacher={selectedTeacher}
                    onSaved={handleTeacherSaved}
                    onCancel={() => {
                      setShowTeacherForm(false);
                      setSelectedTeacher(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Teachers List */}
          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <TeacherList 
              teachers={teachers} 
              onEdit={handleEditTeacher}
              onDelete={() => refetch()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
