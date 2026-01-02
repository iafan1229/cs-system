import apiClient from './api';

export interface Schedule {
  id: number;
  userId: number;
  startTime: string;
  endTime: string;
  maxReservations: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reservations: number;
  };
  reservations?: Reservation[];
}

export interface Reservation {
  id: number;
  scheduleId: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
}

export interface CreateScheduleDto {
  startTime: string;
  endTime: string;
  maxReservations?: number;
}

export interface UpdateScheduleDto {
  startTime?: string;
  endTime?: string;
  maxReservations?: number;
}

export const scheduleService = {
  getAll: async (startDate?: string, endDate?: string): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await apiClient.get<Schedule[]>(
      `/admin/schedules?${params.toString()}`
    );
    return response.data;
  },

  getById: async (id: number): Promise<Schedule> => {
    const response = await apiClient.get<Schedule>(`/admin/schedules/${id}`);
    return response.data;
  },

  create: async (data: CreateScheduleDto): Promise<Schedule> => {
    const response = await apiClient.post<Schedule>('/admin/schedules', data);
    return response.data;
  },

  update: async (id: number, data: UpdateScheduleDto): Promise<Schedule> => {
    const response = await apiClient.patch<Schedule>(
      `/admin/schedules/${id}`,
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/schedules/${id}`);
  },

  generateLink: async (
    id: number,
    email?: string
  ): Promise<{ token: string; expiresAt: string; bookingUrl: string }> => {
    const response = await apiClient.post<{
      token: string;
      expiresAt: string;
      bookingUrl: string;
    }>(`/admin/schedules/${id}/generate-link`, { email });
    return response.data;
  },
};

