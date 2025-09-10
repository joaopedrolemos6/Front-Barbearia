// src/lib/api.ts

import { toast } from 'sonner'; // ADICIONADO: Importar o toast aqui

const API_BASE_URL = "http://localhost:3000/api";

// Função auxiliar para fazer requisições
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("authToken");

  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    const errorMessage = errorData.message || errorData.error?.message || "Ocorreu um erro na API";
    
    // CORRIGIDO: A lógica de logout/reload agora acontece sem chamar o toast diretamente daqui.
    if (response.status === 401 || (errorMessage as string).toLowerCase().includes('token')) {
      localStorage.removeItem("authToken");
      // Lançamos o erro para que o AuthContext possa mostrar o toast antes de recarregar.
      window.location.reload(); 
      throw new Error("Sessão expirada. A página será recarregada.");
    }
    
    throw new Error(errorMessage);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return null as T;
  }

  const result = await response.json();
  return result.data;
}

// Funções específicas para cada endpoint
export const api = {
  // Auth
  login: (credentials: any) =>
    request<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  // Barbers
  getBarbers: () => request<any[]>("/barbers"),
  getAvailableBarbers: (datetime: string, serviceId: number) =>
    request<any[]>(
      `/barbers/available?datetime=${datetime}&serviceId=${serviceId}`
    ),

  createBarber: (data: any) =>
    request<any>("/barbers", {
      method: "POST",
      body: data,
    }),

  updateBarber: (id: number, data: any) =>
    request<any>(`/barbers/${id}`, {
      method: "PUT",
      body: data,
    }),

  deleteBarber: (id: number) =>
    request<void>(`/barbers/${id}`, {
      method: "DELETE",
    }),

  // Services
  getServices: () => request<any[]>("/services"),
  createService: (data: any) =>
    request<any>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateService: (id: number, data: any) =>
    request<any>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteService: (id: number) =>
    request<void>(`/services/${id}`, {
      method: "DELETE",
    }),

  // Appointments
  getAppointments: () => request<any[]>("/admin/appointments"),
  getBarberAppointments: () => request<any[]>("/barber/appointments"),
  createAppointment: (data: any) =>
    request<any>("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAppointmentStatus: (id: number, statusAction: string) =>
    request<any>(`/appointments/${id}/${statusAction.toLowerCase()}`, {
      method: "PATCH",
    }),
};