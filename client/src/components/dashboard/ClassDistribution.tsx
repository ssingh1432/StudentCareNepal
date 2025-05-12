import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassDistributionProps {
  data: {
    Nursery: number;
    LKG: number;
    UKG: number;
  } | null;
  loading: boolean;
  className?: string;
}

export default function ClassDistribution({ data, loading, className = "" }: ClassDistributionProps) {
  // Calculate percentages if data is available
  const total = data ? data.Nursery + data.LKG + data.UKG : 0;
  
  const getPercentage = (value: number) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Students by Class</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">Nursery</span>
                </div>
                <span className="text-sm text-gray-500">{data?.Nursery || 0} students</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${getPercentage(data?.Nursery || 0)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">LKG</span>
                </div>
                <span className="text-sm text-gray-500">{data?.LKG || 0} students</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(data?.LKG || 0)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm font-medium text-gray-700">UKG</span>
                </div>
                <span className="text-sm text-gray-500">{data?.UKG || 0} students</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${getPercentage(data?.UKG || 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
