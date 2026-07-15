import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface BudgetPlannerProps {
  items: any[];
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ items }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.itemName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>₹{Number(item.estimatedAmount).toLocaleString()}</TableCell>
                <TableCell>₹{Number(item.actualAmount).toLocaleString()}</TableCell>
                <TableCell>₹{Number(item.paidAmount).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={item.status === 'PAID' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  No budget items added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
