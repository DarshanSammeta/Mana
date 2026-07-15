'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an observability service
    console.error('[Global UI Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="p-4 mb-4 rounded-full bg-destructive/10">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="max-w-md mb-8 text-muted-foreground">
        An unexpected error occurred in the application. We&apos;ve been notified and are working on it.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try again
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          Go back home
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="p-4 mt-8 overflow-auto text-left rounded bg-muted max-w-2xl text-xs">
          {error.stack}
        </pre>
      )}
    </div>
  );
}
