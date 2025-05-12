import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const isMobile = useMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();

  // Update the document title when the page title changes
  useEffect(() => {
    document.title = `${title} | Nepal Central High School`;
  }, [title]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - hidden on mobile */}
      <div className={cn("hidden md:block", sidebarCollapsed ? "w-16" : "w-64")}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
