import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ChecklistProps {
  items: any[];
  onToggle: (itemId: string, status: string) => void;
}

export const Checklist: React.FC<ChecklistProps> = ({ items, onToggle }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={item.status === 'COMPLETED'}
                  onCheckedChange={(checked) => onToggle(item.id, checked ? 'COMPLETED' : 'PENDING')}
                />
                <div>
                  <p className={`font-medium ${item.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
              </div>
              <Badge variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                {item.priority}
              </Badge>
            </div>
          ))}
          {(!items || items.length === 0) && (
            <p className="text-center text-muted-foreground py-4">Your checklist is empty.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
