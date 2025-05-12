import { useEffect } from "react";
import { useLocation } from "wouter";

// This is just a redirect page to the dashboard
export default function HomePage() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>
  );
}
