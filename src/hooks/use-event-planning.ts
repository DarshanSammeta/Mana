import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function useEventWorkspace(workspaceId?: string) {
  const queryClient = useQueryClient();

  const workspace = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/event-planning/workspace/${workspaceId}`);
      return data;
    },
    enabled: !!workspaceId,
  });

  const createWorkspace = useMutation({
    mutationFn: async (newData: any) => {
      const { data } = await axios.post('/api/event-planning/workspace', newData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const updateChecklist = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { data } = await axios.patch(`/api/event-planning/checklist/${itemId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const addGuest = useMutation({
    mutationFn: async (guestData: any) => {
      const { data } = await axios.post(`/api/event-planning/workspace/${workspaceId}/guests`, guestData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const addBudgetItem = useMutation({
    mutationFn: async (budgetData: any) => {
      const { data } = await axios.post(`/api/event-planning/workspace/${workspaceId}/budget`, budgetData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const getSuggestions = useQuery({
    queryKey: ['workspace-suggestions', workspaceId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/event-planning/workspace/${workspaceId}/suggestions`);
      return data;
    },
    enabled: !!workspaceId,
  });

  return {
    workspace: workspace.data,
    isLoading: workspace.isLoading,
    createWorkspace,
    updateChecklist,
    addGuest,
    addBudgetItem,
    suggestions: getSuggestions.data,
  };
}

export function useUserWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await axios.get('/api/event-planning/workspaces');
      return data;
    },
  });
}
