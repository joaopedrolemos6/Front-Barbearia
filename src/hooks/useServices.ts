// src/hooks/useServices.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Service } from '@/types/api';
import { toast } from 'sonner';

// Hook para buscar todos os serviços
export const useServices = () => {
  return useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: api.getServices,
  });
};

// Hook (Mutation) para criar um novo serviço
export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newServiceData: Omit<Service, 'id' | 'active'>) => api.createService(newServiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Serviço adicionado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar serviço", {
        description: error.message,
      });
    },
  });
};

// Hook (Mutation) para atualizar um serviço existente
export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<Omit<Service, 'id' | 'active'>> }) => 
      api.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar serviço", {
        description: error.message,
      });
    },
  });
};

// Hook (Mutation) para remover um serviço
export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: number) => api.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success("Serviço removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover serviço", {
        description: error.message,
      });
    },
  });
};