import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ReportGenerator } from "@/components/ui/reports/ReportGenerator";

export default function Reports() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Reports" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="mt-1 text-sm text-gray-500">Generate and download student progress and teaching plan reports</p>
          </div>
          
          <ReportGenerator />
        </main>
      </div>
    </div>
  );
}
