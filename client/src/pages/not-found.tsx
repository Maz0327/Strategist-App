import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation('/dashboard');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPath && currentPath !== '/' && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-500">Requested path:</p>
              <code className="text-sm font-mono text-gray-700 break-all">
                {currentPath}
              </code>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Try one of these options:
            </p>
            <ul className="text-xs text-gray-500 space-y-1 ml-4">
              <li>• Return to the dashboard</li>
              <li>• Go back to the previous page</li>
              <li>• Check if the URL is correct</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-400 text-center">
              If this error persists, please contact support
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}