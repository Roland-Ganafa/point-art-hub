import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuthTroubleshooter } from '@/utils/authTroubleshooter';
import { useToast } from '@/hooks/use-toast';

const EnhancedAuthDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        const results = await AuthTroubleshooter.runDiagnostics();
        setDiagnostics(results);
      } catch (error: any) {
        toast({
          title: "Diagnostics Error",
          description: error.message || "Failed to run diagnostics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    runDiagnostics();
  }, []);

  const handleRecovery = async () => {
    setRecovering(true);
    try {
      const recoveryResults = await AuthTroubleshooter.attemptRecovery();
      
      // Add recovery results to diagnostics
      setDiagnostics(prev => [...prev, ...recoveryResults]);
      
      toast({
        title: "Recovery Attempt Complete",
        description: "Check the results below for recovery status",
      });
    } catch (error: any) {
      toast({
        title: "Recovery Error",
        description: error.message || "Failed to attempt recovery",
        variant: "destructive",
      });
    } finally {
      setRecovering(false);
    }
  };

  const enableDevelopmentMode = () => {
    localStorage.setItem('mock_auth_active', 'true');
    window.location.reload();
  };

  const disableDevelopmentMode = () => {
    localStorage.removeItem('mock_auth_active');
    localStorage.removeItem('mock_user');
    window.location.reload();
  };

  const isDevelopmentMode = localStorage.getItem('mock_auth_active') === 'true';

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Enhanced Authentication Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span>Running diagnostics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;
  const allPassed = errorCount === 0;

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Authentication Diagnostics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Summary:</h3>
            <div className="flex gap-4">
              <div className="flex items-center">
                <span className="mr-2">Errors:</span>
                <Badge variant={errorCount > 0 ? "destructive" : "secondary"}>{errorCount}</Badge>
              </div>
              <div className="flex items-center">
                <span className="mr-2">Warnings:</span>
                <Badge variant={warningCount > 0 ? "secondary" : "secondary"} className={warningCount > 0 ? "bg-yellow-100 text-yellow-800" : ""}>{warningCount}</Badge>
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            <h3 className="font-medium mb-2">Diagnostic Results:</h3>
            <div className="space-y-3">
              {diagnostics.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(result.severity)}
                      <span className="font-medium">{result.message}</span>
                    </div>
                  </div>
                  {result.fix && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Suggested fix:</span> {result.fix}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          {allPassed ? (
            <Alert className="border-green-200 bg-green-50">
              <AlertTitle className="text-green-800">✅ All checks passed!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your authentication setup appears to be correct.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle className="text-red-800">⚠️ Issues detected</AlertTitle>
              <AlertDescription className="text-red-700">
                Please review the diagnostic results above and address any errors.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Separator />
            <h3 className="font-medium">Troubleshooting Actions:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Reload Page
              </Button>
              
              <Button 
                onClick={handleRecovery}
                disabled={recovering}
                variant="outline"
              >
                {recovering ? "Attempting Recovery..." : "Attempt Recovery"}
              </Button>
              
              {!isDevelopmentMode ? (
                <Button 
                  onClick={enableDevelopmentMode} 
                  variant="secondary"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800"
                >
                  Enable Development Mode
                </Button>
              ) : (
                <Button 
                  onClick={disableDevelopmentMode} 
                  variant="secondary"
                  className="bg-green-100 hover:bg-green-200 text-green-800"
                >
                  Disable Development Mode
                </Button>
              )}
            </div>
          </div>

          {/* Troubleshooting Guide */}
          <div className="space-y-3">
            <Separator />
            <h3 className="font-medium">Troubleshooting Guide:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {AuthTroubleshooter.getTroubleshootingGuide().map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>

          {/* Development Mode Warning */}
          {isDevelopmentMode && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-800">
              <AlertTitle>Development Mode Active</AlertTitle>
              <AlertDescription>
                You are currently using mock authentication. This mode should only be used for development 
                and testing purposes. Data operations will be performed using mock data.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAuthDiagnostic;