import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { 
  Plus, 
  Edit, 
  FileText,
  Activity as ActivityIcon 
} from "lucide-react";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  // Determine icon based on activity type
  const getActivityIcon = (action: string) => {
    if (action.includes('Created') || action.includes('Added')) {
      return (
        <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
          <Plus className="h-5 w-5 text-green-600" />
        </span>
      );
    } else if (action.includes('Updated') || action.includes('Edited')) {
      return (
        <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
          <Edit className="h-5 w-5 text-blue-600" />
        </span>
      );
    } else if (action.includes('Plan')) {
      return (
        <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
          <FileText className="h-5 w-5 text-purple-600" />
        </span>
      );
    } else {
      return (
        <span className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center ring-8 ring-white">
          <ActivityIcon className="h-5 w-5 text-yellow-600" />
        </span>
      );
    }
  };

  // Format relative time
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
      </div>
      <div className="p-4">
        <div className="flow-root">
          {isLoading ? (
            <div className="py-4 text-center text-sm text-gray-500">Loading recent activities...</div>
          ) : !activities || activities.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-500">No recent activities found.</div>
          ) : (
            <ul className="-mb-8">
              {activities.slice(0, 3).map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < activities.length - 1 && (
                      <span 
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                        aria-hidden="true"
                      ></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>{getActivityIcon(activity.action)}</div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">{activity.details}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.createdAt.toString()}>
                            {getRelativeTime(activity.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6">
          <a href="#" className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            View all
          </a>
        </div>
      </div>
    </div>
  );
}
