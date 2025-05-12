import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Student, Progress, Plan } from "@shared/schema";

interface ReportPreviewProps {
  data: any[];
  type: "student" | "plan";
}

const ReportPreview = ({ data, type }: ReportPreviewProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };
  
  // Style helper functions
  const getLearningAbilityBadgeClass = (ability: string) => {
    switch (ability) {
      case "talented":
        return "bg-green-100 text-green-800";
      case "average":
        return "bg-yellow-100 text-yellow-800";
      case "slow-learner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getWritingSpeedBadgeClass = (speed: string | null) => {
    if (!speed) return "bg-gray-100 text-gray-800";
    
    switch (speed) {
      case "speed-writing":
        return "bg-blue-100 text-blue-800";
      case "slow-writing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "needs-improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Preview</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <p>No data to preview. Generate a report to see a preview here.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
            <h2 className="text-lg font-medium text-gray-700">
              {type === "student" ? "Student Progress Report" : "Teaching Plans Report"}
            </h2>
            <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
          </div>
          
          {type === "student" ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Ability</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Writing Speed</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Skills</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Literacy</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Numeracy</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 5).map((student: any, index: number) => {
                      // Get latest progress entry if available
                      const latestProgress = student.progressHistory && student.progressHistory.length > 0
                        ? student.progressHistory.sort((a: any, b: any) => 
                            new Date(b.date).getTime() - new Date(a.date).getTime()
                          )[0]
                        : null;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{student.class.toUpperCase()}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge className={getLearningAbilityBadgeClass(student.learningAbility)}>
                              {student.learningAbility}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge className={getWritingSpeedBadgeClass(student.writingSpeed)}>
                              {student.writingSpeed || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {latestProgress ? (
                              <Badge className={getRatingBadgeClass(latestProgress.socialSkills)}>
                                {latestProgress.socialSkills}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {latestProgress ? (
                              <Badge className={getRatingBadgeClass(latestProgress.preLiteracy)}>
                                {latestProgress.preLiteracy}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {latestProgress ? (
                              <Badge className={getRatingBadgeClass(latestProgress.preNumeracy)}>
                                {latestProgress.preNumeracy}
                              </Badge>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.slice(0, 5).map((plan: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{plan.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{plan.class.toUpperCase()}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{plan.teacherId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          <div className="mt-6 text-sm text-gray-500 text-right">
            <p>Generated on: {new Date().toISOString().split('T')[0]}</p>
            <p>System: Pre-Primary Student Record-Keeping System</p>
          </div>
        </div>
        
        {data.length > 5 && (
          <div className="mt-3 text-sm text-gray-500 text-center">
            <p>Showing 5 of {data.length} records in preview. Download the report to see all records.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportPreview;
