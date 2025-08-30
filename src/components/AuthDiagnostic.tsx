import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

/**
 * This component provides diagnostic information about the Supabase connection and authentication.
 * It's helpful for troubleshooting login/signup issues.
 */
const AuthDiagnostic = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setShowResults(true);
    const diagnosticResults: Record<string, any> = {};

    // Check environment variables
    try {
      diagnosticResults.envVars = {
        SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
        SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
        keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
      };
    } catch (error: any) {
      diagnosticResults.envVars = { error: error.message };
    }

    // Check network connectivity to Supabase
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const endTime = Date.now();
      
      diagnosticResults.connection = {
        success: !error,
        latency: `${endTime - startTime}ms`,
        error: error ? error.message : null,
        session: !!data.session,
      };
    } catch (error: any) {
      diagnosticResults.connection = { 
        success: false, 
        error: error.message 
      };
    }

    // Check browser storage
    try {
      diagnosticResults.storage = {
        localStorage: typeof localStorage !== 'undefined',
        cookiesEnabled: navigator.cookieEnabled,
      };
      
      // Test localStorage
      try {
        localStorage.setItem('test_storage', 'test');
        localStorage.removeItem('test_storage');
        diagnosticResults.storage.localStorageWorks = true;
      } catch (e) {
        diagnosticResults.storage.localStorageWorks = false;
      }
    } catch (error: any) {
      diagnosticResults.storage = { error: error.message };
    }

    // Get Supabase health
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      diagnosticResults.databaseConnectivity = {
        success: !error,
        error: error ? error.message : null,
        result: data,
      };
    } catch (error: any) {
      diagnosticResults.databaseConnectivity = { 
        success: false, 
        error: error.message 
      };
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Authentication Diagnostics</CardTitle>
        <CardDescription>
          Use this tool to check if your authentication environment is correctly set up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showResults ? (
          <div className="text-center p-4">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              This will check your Supabase connection and authentication configuration.
              No personal data will be affected.
            </p>
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center">
                <p>Running diagnostics...</p>
                <div className="mt-2 w-8 h-8 border-4 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-medium">Environment Variables</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 text-sm">
                    <pre>{JSON.stringify(results.envVars, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Supabase Connection</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 text-sm">
                    <pre>{JSON.stringify(results.connection, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Browser Storage</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 text-sm">
                    <pre>{JSON.stringify(results.storage, null, 2)}</pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Database Connectivity</h3>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded mt-2 text-sm">
                    <pre>{JSON.stringify(results.databaseConnectivity, null, 2)}</pre>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {showResults && (
          <>
            <Button variant="outline" onClick={() => setShowResults(false)}>
              Hide Results
            </Button>
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Run Again'}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default AuthDiagnostic;