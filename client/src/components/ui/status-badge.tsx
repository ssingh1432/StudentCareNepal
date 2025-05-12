import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  type: "class" | "learningAbility" | "writingSpeed" | "progressRating" | "planType";
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let colorClass = "";
  
  switch (type) {
    case "class":
      switch (status) {
        case "Nursery":
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          break;
        case "LKG":
          colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
          break;
        case "UKG":
          colorClass = "bg-green-100 text-green-800 hover:bg-green-100";
          break;
        default:
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
      }
      break;
      
    case "learningAbility":
      switch (status) {
        case "Talented":
          colorClass = "bg-green-100 text-green-800 hover:bg-green-100";
          break;
        case "Average":
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          break;
        case "Slow Learner":
          colorClass = "bg-red-100 text-red-800 hover:bg-red-100";
          break;
        default:
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
      }
      break;
      
    case "writingSpeed":
      switch (status) {
        case "Speed Writing":
          colorClass = "bg-blue-100 text-blue-800 hover:bg-blue-100";
          break;
        case "Slow Writing":
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          break;
        case "N/A":
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
          break;
        default:
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
      }
      break;
      
    case "progressRating":
      switch (status) {
        case "Excellent":
          colorClass = "bg-green-100 text-green-800 hover:bg-green-100";
          break;
        case "Good":
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          break;
        case "Needs Improvement":
          colorClass = "bg-red-100 text-red-800 hover:bg-red-100";
          break;
        default:
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
      }
      break;
      
    case "planType":
      switch (status) {
        case "Annual":
          colorClass = "bg-green-100 text-green-800 hover:bg-green-100";
          break;
        case "Monthly":
          colorClass = "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
          break;
        case "Weekly":
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
          break;
        default:
          colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
      }
      break;
      
    default:
      colorClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(colorClass, className)}
    >
      {status}
    </Badge>
  );
}
