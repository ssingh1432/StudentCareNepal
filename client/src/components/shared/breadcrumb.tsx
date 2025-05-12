import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link href="/">
            <a className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-purple-600">
              <Home className="w-4 h-4 mr-2" />
              Home
            </a>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {item.href ? (
                <Link href={item.href}>
                  <a className="ml-1 text-sm font-medium text-gray-700 hover:text-purple-600 md:ml-2">
                    {item.label}
                  </a>
                </Link>
              ) : (
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {item.label}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
