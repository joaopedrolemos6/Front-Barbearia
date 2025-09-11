// src/hooks/useBarbers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Barber } from '@/types/api';
import { toast } from 'sonner';

// ADICIONADO: URL base do seu backend para servir as imagens
const API_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:3000';

// ADICIONADO: Função auxiliar para transformar os dados do barbeiro
const transformBarberData = (barber: Barber): Barber => {
  const profile = barber.profile || {};
  
  // Se o perfil e a URL do avatar existirem e não for uma URL completa, constrói a URL
  if (profile.avatar_url && !profile.avatar_url.startsWith('http')) {
    return {
      ...barber,
      profile: {
        ...profile,
        avatar_url: `${API_URL}${profile.avatar_url}`,
      },
      specialty: profile.specialties?.join(', ') || 'Especialista',
    };
  }
  
  // Caso contrário, apenas processa as especialidades
  return {
    ...barber,
    specialty: profile.specialties?.join(', ') || 'Especialista',
  };
};

export const useBarbers = () => {
  return useQuery<Barber[]>({
    queryKey: ['barbers'],
    queryFn: async () => {
      const data = await api.getBarbers();
      // MODIFICADO: Aplica a transformação para cada barbeiro
      return data.map(transformBarberData);
    }
  });
};

export const useCreateBarber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newBarberData: any) => api.createBarber(newBarberData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success("Barbeiro adicionado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar barbeiro", {
        description: error.message
      });
    }
  });
};

export const useUpdateBarber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => api.updateBarber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success("Barbeiro atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar barbeiro", {
        description: error.message,
      });
    }
  });
};

export const useDeleteBarber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (barberId: number) => api.deleteBarber(barberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbers'] });
      toast.success("Barbeiro removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover barbeiro", {
        description: error.message
      });
    }
  });
};

export const useAvailableBarbers = (datetime: string, serviceId: number) => {
  return useQuery<Barber[]>({
    queryKey: ['availableBarbers', datetime, serviceId],
    queryFn: async () => {
      const data = await api.getAvailableBarbers(datetime, serviceId);
      // MODIFICADO: Usa a mesma função de transformação aqui
      return data.map(transformBarberData);
    },
    enabled: !!datetime && !!serviceId, 
  });
};
