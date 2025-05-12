import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AssignStudentsForm } from "@/components/ui/assignment/AssignStudents";

export default function AssignStudents() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Assign Students" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
            <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
          </div>
          
          <AssignStudentsForm />
        </main>
      </div>
    </div>
  );
}
