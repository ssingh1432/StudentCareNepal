import LoginForm from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { School } from "lucide-react";

interface LoginPageProps {
  onLogin: (user: any, token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-purple-600 text-white p-3 rounded-full mb-4">
            <School className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nepal Central High School</h1>
          <p className="text-gray-500 mt-1">Pre-Primary Student Record System</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={onLogin} />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t pt-4">
            <div className="text-xs text-gray-500 text-center">
              <p>Default credentials:</p>
              <p><strong>Admin:</strong> admin@school.com / lkg123</p>
              <p><strong>Teacher:</strong> teacher1@school.com / lkg123</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
