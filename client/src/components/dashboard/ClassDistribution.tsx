import { useMemo } from "react";

interface ClassDistributionProps {
  nurseryCount: number;
  lkgCount: number;
  ukgCount: number;
}

const ClassDistribution = ({ nurseryCount, lkgCount, ukgCount }: ClassDistributionProps) => {
  const totalStudents = nurseryCount + lkgCount + ukgCount;
  
  const distribution = useMemo(() => {
    if (totalStudents === 0) return [0, 0, 0];
    
    return [
      (nurseryCount / totalStudents) * 100,
      (lkgCount / totalStudents) * 100,
      (ukgCount / totalStudents) * 100
    ];
  }, [nurseryCount, lkgCount, ukgCount, totalStudents]);
  
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
            <span className="text-sm font-medium text-gray-700">Nursery</span>
          </div>
          <span className="text-sm text-gray-500">{nurseryCount} students</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full"
            style={{ width: `${distribution[0]}%` }}
          ></div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm font-medium text-gray-700">LKG</span>
          </div>
          <span className="text-sm text-gray-500">{lkgCount} students</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${distribution[1]}%` }}
          ></div>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm font-medium text-gray-700">UKG</span>
          </div>
          <span className="text-sm text-gray-500">{ukgCount} students</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${distribution[2]}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ClassDistribution;
