import { Badge } from "@/components/ui/badge";

type ProgressLevel = "Excellent" | "Good" | "Needs Improvement" | string;

interface ProgressBadgeProps {
  level: ProgressLevel;
  className?: string;
}

export default function ProgressBadge({ level, className = "" }: ProgressBadgeProps) {
  const getColorClass = (level: string) => {
    switch (level.toLowerCase()) {
      case "excellent":
        return "progress-badge-excellent";
      case "good":
        return "progress-badge-good";
      case "needs improvement":
        return "progress-badge-needs-improvement";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Badge
      variant="outline"
      className={`${getColorClass(level)} ${className}`}
    >
      {level}
    </Badge>
  );
}
