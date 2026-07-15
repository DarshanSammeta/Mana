'use client';

import React from 'react';
import { useUserWorkspaces } from '@/hooks/use-event-planning';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function PlanningOverviewPage() {
  const { data: workspaces } = useUserWorkspaces();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Event Planning</h1>
          <p className="text-muted-foreground">Manage and collaborate on your upcoming events.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces?.map((workspace: any) => (
          <Card key={workspace.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant={workspace.status === 'PLANNING' ? 'default' : 'secondary'}>
                  {workspace.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="mt-2">{workspace.title}</CardTitle>
              <CardDescription>{workspace.eventType}</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-4">
              <div className="grid grid-cols-3 w-full text-center text-sm">
                <div>
                  <CheckSquare className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <span>{workspace._count.checklist_items} Tasks</span>
                </div>
                <div>
                  <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <span>{workspace._count.guests} Guests</span>
                </div>
                <div>
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <span>{workspace.eventDate ? new Date(workspace.eventDate).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>
              <Link href={`/planning/${workspace.id}`} className="w-full">
                <Button variant="outline" className="w-full">Open Workspace</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
