import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupportTickets } from '@/hooks/use-operations';
import { format } from 'date-fns';
import { MessageSquare, Clock, AlertCircle } from 'lucide-react';

export const SupportTicketList: React.FC = () => {
  const { data: tickets, isLoading } = useSupportTickets();

  if (isLoading) return <div>Loading tickets...</div>;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'ESCALATED': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {tickets?.map((ticket: any) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base">{ticket.subject}</CardTitle>
                <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                  {ticket.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {ticket.description}
              </p>
            </div>
            <Badge className={getStatusColor(ticket.status)}>
              {ticket.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-muted-foreground space-x-4">
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {format(new Date(ticket.createdAt), 'MMM d, p')}
              </div>
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {ticket.category}
              </div>
              {ticket.slaDeadline && (
                <div className={`flex items-center ${new Date(ticket.slaDeadline) < new Date() ? 'text-red-500' : ''}`}>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  SLA: {format(new Date(ticket.slaDeadline), 'MMM d, p')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {tickets?.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
          No support tickets found.
        </div>
      )}
    </div>
  );
};
