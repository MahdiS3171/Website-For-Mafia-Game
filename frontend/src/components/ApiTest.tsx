import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { testAPI } from '../test-api';

const ApiTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<{
    games?: any;
    players?: any;
    roles?: any;
    error?: string;
  }>({});

  const handleTest = async () => {
    setIsTesting(true);
    setResults({});
    
    try {
      const success = await testAPI();
      if (success) {
        // The testAPI function logs the results, so we'll just show success
        setResults({ games: 'Success', players: 'Success', roles: 'Success' });
      }
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          API Connection Test
          {results.error ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : results.games ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : null}
        </CardTitle>
        <CardDescription>
          Test the connection between frontend and Django backend
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test API Connection'
          )}
        </Button>

        {results.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm font-medium">Error:</p>
            <p className="text-red-600 text-sm">{results.error}</p>
          </div>
        )}

        {results.games && !results.error && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Games API:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Players API:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Roles API:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Connected
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Backend URL: http://localhost:8000</p>
          <p>Frontend URL: http://localhost:5173</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiTest; 