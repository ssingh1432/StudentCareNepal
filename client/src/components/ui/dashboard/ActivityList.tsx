import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus as IconPlus, 
  Edit as IconEdit, 
  FileText as IconFile 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Activity {
  id: number;
  type: 'new_student' | 'progress_update' | 'new_plan';
  title: string;
  description: string;
  time: string;
  date: string;
}

export function ActivityList() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_student':
        return (
          <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
            <IconPlus className="h-5 w-5 text-green-600" />
          </span>
        );
      case 'progress_update':
        return (
          <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
            <IconEdit className="h-5 w-5 text-blue-600" />
          </span>
        );
      case 'new_plan':
        return (
          <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
            <IconFile className="h-5 w-5 text-purple-600" />
          </span>
        );
      default:
        return (
          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
            <IconPlus className="h-5 w-5 text-gray-600" />
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-full h-24 rounded animate-pulse bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities && activities.length > 0 ? (
              activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== activities.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>{getActivityIcon(activity.type)}</div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.title} <span className="font-medium text-gray-900">{activity.description}</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.date}>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activities</p>
            )}
          </ul>
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
