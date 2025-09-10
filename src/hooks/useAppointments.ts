// src/hooks/useAppointments.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Appointment, CreateAppointmentDTO } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

const transformAppointmentData = (data: any[]): Appointment[] => {
  return data.map(apt => ({
    ...apt,
    appointment_date: apt.datetime.split('T')[0],
    appointment_time: new Date(apt.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  }));
};

// Hook para buscar agendamentos do ADMIN
export const useAppointments = () => {
  const { user, token } = useAuth(); // Pegamos o token aqui
  const isAdmin = user?.role === 'ADMIN';

  return useQuery<Appointment[]>({
    // A queryKey agora depende do token. Se o token for nulo, a query não roda.
    // Quando o token mudar (após o login), o react-query refaz a busca automaticamente.
    queryKey: ['appointments', token], 
    queryFn: async () => {
      const data = await api.getAppointments();
      return transformAppointmentData(data);
    },
    // A query só é ativada se o usuário for um admin E o token existir.
    enabled: !!isAdmin && !!token,
  });
};

// Hook para buscar agendamentos do BARBEIRO
export const useBarberAppointments = (enabled = true) => {
  const { user, token } = useAuth();
  const isBarber = user?.role === 'BARBER';

  return useQuery<Appointment[]>({
    queryKey: ['barberAppointments', user?.id, token],
    queryFn: async () => {
      const data = await api.getBarberAppointments();
      return transformAppointmentData(data);
    },
    enabled: isBarber && !!token && enabled,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDTO) => api.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Agendamento criado!", {
        description: "Seu agendamento foi confirmado com sucesso."
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao agendar", {
        description: error.message,
      });
    }
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      let action;
      switch (status) {
        case 'APPROVED': action = 'approve'; break;
        case 'REJECTED': action = 'reject'; break;
        case 'CANCELLED': action = 'cancel'; break;
        default: throw new Error('Status inválido para atualização');
      }
      return api.updateAppointmentStatus(id, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar", { description: error.message });
    }
  });
};