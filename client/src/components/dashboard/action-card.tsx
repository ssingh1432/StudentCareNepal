import { Link } from "wouter";
import { LucideIcon } from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  iconBgColor = "bg-purple-100",
  iconColor = "text-purple-600",
}: ActionCardProps) {
  return (
    <Link href={href}>
      <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="absolute inset-0" aria-hidden="true"></span>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </a>
    </Link>
  );
}
