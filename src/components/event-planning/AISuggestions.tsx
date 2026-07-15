import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';

interface AISuggestionsProps {
  suggestions: any[];
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Planning Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex gap-3 items-start bg-white p-3 rounded-lg shadow-sm">
              {suggestion.type === 'BUDGET_OVERFLOW' ? (
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              ) : (
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-sm">{suggestion.message}</p>
                <p className="text-sm text-muted-foreground">{suggestion.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
