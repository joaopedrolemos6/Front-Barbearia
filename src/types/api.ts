// src/types/api.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  BARBER = 'BARBER',
  CLIENT = 'CLIENT'
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface BarberProfile {
  id: number;
  specialties?: string[];
  bio?: string;
  active: boolean;
  avatar_url?: string; // ADICIONADO
}

export interface Barber {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile: BarberProfile;
  specialty?: string; // Campo transformado no front-end
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  duration?: number; // Campo transformado no front-end
  active: boolean;
}

export interface Appointment {
  id: number;
  client_id: number;
  barber_id: number;
  service_id: number;
  datetime: string; // ISO String
  status: AppointmentStatus;
  notes?: string;
  client_name: string;
  client_phone?: string;
  barber_name: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  appointment_date?: string; // Campo transformado
  appointment_time?: string; // Campo transformado
}

export type CreateAppointmentDTO = {
  client: {
    name: string;
    phone: string;
    email?: string;
  };
  appointment: {
    barberId: number;
    serviceId: number;
    datetime: string;
    notes?: string;
  };
};