import apiClient from './api';

export interface AvailableSchedule {
  id: number;
  startTime: string;
  endTime: string;
  maxReservations: number;
  currentReservations: number;
  availableSlots: number;
}

export interface AvailableSchedulesByDate {
  [date: string]: AvailableSchedule[];
}

export interface CreateReservationDto {
  scheduleId: number;
  applicantName: string;
  applicantEmail: string;
}

export interface Reservation {
  id: number;
  scheduleId: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
  schedule?: {
    id: number;
    startTime: string;
    endTime: string;
  };
  consultationRecord?: ConsultationRecord;
}

export interface ConsultationRecord {
  id: number;
  reservationId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const reservationService = {
  getAvailableSchedules: async (
    token: string
  ): Promise<AvailableSchedulesByDate> => {
    const response = await apiClient.get<AvailableSchedulesByDate>(
      `/public/schedules?token=${token}`
    );
    return response.data;
  },

  createPublic: async (
    token: string,
    data: CreateReservationDto
  ): Promise<Reservation> => {
    const response = await apiClient.post<Reservation>(
      `/public/reservations?token=${token}`,
      data
    );
    return response.data;
  },

  getBySchedule: async (scheduleId: number): Promise<Reservation[]> => {
    const response = await apiClient.get<Reservation[]>(
      `/admin/schedules/${scheduleId}/reservations`
    );
    return response.data;
  },

  getById: async (id: number): Promise<Reservation> => {
    const response = await apiClient.get<Reservation>(
      `/admin/reservations/${id}`
    );
    return response.data;
  },
};

