interface ClassCount {
  nursery: number;
  lkg: number;
  ukg: number;
}

interface ClassDistributionProps {
  classCounts: ClassCount;
  totalStudents: number;
}

export function ClassDistribution({ classCounts, totalStudents }: ClassDistributionProps) {
  const calculatePercentage = (count: number) => {
    return totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
  };

  return (
    <div className="bg-white shadow rounded-lg col-span-2">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Students by Class</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Nursery</span>
              </div>
              <span className="text-sm text-gray-500">{classCounts.nursery} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(classCounts.nursery)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">LKG</span>
              </div>
              <span className="text-sm text-gray-500">{classCounts.lkg} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(classCounts.lkg)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">UKG</span>
              </div>
              <span className="text-sm text-gray-500">{classCounts.ukg} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${calculatePercentage(classCounts.ukg)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
