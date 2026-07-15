import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuestListProps {
  guests: any[];
}

export const GuestList: React.FC<GuestListProps> = ({ guests }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Guest List</CardTitle>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search guests..." className="pl-8 w-[200px]" />
          </div>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>RSVP Status</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>VIP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests?.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-medium">
                  {guest.name}
                  <div className="text-xs text-muted-foreground">{guest.email || guest.phone}</div>
                </TableCell>
                <TableCell>{guest.group || 'General'}</TableCell>
                <TableCell>
                  <Badge variant={
                    guest.rsvpStatus === 'CONFIRMED' ? 'default' :
                    guest.rsvpStatus === 'DECLINED' ? 'destructive' : 'secondary'
                  }>
                    {guest.rsvpStatus}
                  </Badge>
                </TableCell>
                <TableCell>{guest.mealPreference || '-'}</TableCell>
                <TableCell>{guest.isVip ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
            {(!guests || guests.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  No guests added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
