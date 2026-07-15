'use client';

import React, { use } from 'react';
import { useEventWorkspace } from '@/hooks/use-event-planning';
import { WorkspaceOverview } from '@/components/event-planning/WorkspaceOverview';
import { Checklist } from '@/components/event-planning/Checklist';
import { BudgetPlanner } from '@/components/event-planning/BudgetPlanner';
import { AISuggestions } from '@/components/event-planning/AISuggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { GuestList } from '@/components/event-planning/GuestList';

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { workspace, isLoading, updateChecklist, suggestions } = useEventWorkspace(id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!workspace) return <div className="container mx-auto p-6">Workspace not found.</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{workspace.title}</h1>
          <p className="text-muted-foreground">{workspace.eventType} • {new Date(workspace.eventDate).toLocaleDateString()}</p>
        </div>
      </div>

      <WorkspaceOverview workspace={workspace} analytics={workspace.analytics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="checklist">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="guests">Guests</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="checklist" className="mt-6">
              <Checklist
                items={workspace.checklist_items}
                onToggle={(itemId, status) => updateChecklist.mutate({ itemId, status })}
              />
            </TabsContent>
            <TabsContent value="budget" className="mt-6">
              <BudgetPlanner items={workspace.budget_items} />
            </TabsContent>
            <TabsContent value="guests" className="mt-6">
              <GuestList guests={workspace.guests} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-6">
              {/* Timeline component would go here */}
              <div className="p-4 border rounded-lg text-center text-muted-foreground">
                Event Timeline Module
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <AISuggestions suggestions={suggestions} />
          {/* Recent Activity / Notes would go here */}
        </div>
      </div>
    </div>
  );
}
