import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const activities = [
  {
    id: 1,
    type: 'add',
    text: 'New student <strong>Anjali Sharma</strong> added to <strong>LKG</strong>',
    time: '1h ago',
    icon: 'fa-plus',
    iconColor: 'bg-green-100 text-green-600'
  },
  {
    id: 2,
    type: 'update',
    text: 'Progress updated for <strong>Nursery</strong> students',
    time: '2h ago',
    icon: 'fa-edit',
    iconColor: 'bg-blue-100 text-blue-600'
  },
  {
    id: 3,
    type: 'create',
    text: 'New weekly plan created for <strong>UKG</strong>',
    time: '3h ago',
    icon: 'fa-file-alt',
    iconColor: 'bg-purple-100 text-purple-600'
  }
];

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, index) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {index !== activities.length - 1 && (
                    <span
                      className="absolute top-5 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full ${activity.iconColor} flex items-center justify-center ring-8 ring-white`}>
                        <i className={`fas ${activity.icon}`}></i>
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p 
                          className="text-sm text-gray-500"
                          dangerouslySetInnerHTML={{ __html: activity.text }}
                        />
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime="2023-10-01T13:45:00">{activity.time}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <Button variant="outline" className="w-full">
          View all
        </Button>
      </CardFooter>
    </Card>
  );
}
