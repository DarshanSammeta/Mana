import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, Wallet, CheckSquare } from 'lucide-react';

interface WorkspaceOverviewProps {
  workspace: any;
  analytics: any;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({ workspace, analytics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Checklist Progress</CardTitle>
          <CheckSquare className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.checklistProgress.toFixed(0)}%</div>
          <Progress value={analytics?.checklistProgress} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Guest RSVP Rate</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics?.rsvpRate.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">
            {analytics?.confirmedGuests} of {analytics?.guestCount} confirmed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
          <Wallet className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{analytics?.totalBudget.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            of ₹{Number(workspace?.budget).toLocaleString()} planned
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Countdown</CardTitle>
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {workspace?.eventDate ? Math.ceil((new Date(workspace.eventDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : '--'}
          </div>
          <p className="text-xs text-muted-foreground">Days remaining</p>
        </CardContent>
      </Card>
    </div>
  );
};
