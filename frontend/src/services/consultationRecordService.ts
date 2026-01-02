import apiClient from './api';

export interface ConsultationRecord {
  id: number;
  reservationId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationRecordDto {
  content: string;
}

export interface UpdateConsultationRecordDto {
  content?: string;
}

export const consultationRecordService = {
  create: async (
    reservationId: number,
    data: CreateConsultationRecordDto
  ): Promise<ConsultationRecord> => {
    const response = await apiClient.post<ConsultationRecord>(
      `/admin/reservations/${reservationId}/consultation-record`,
      data
    );
    return response.data;
  },

  getByReservation: async (
    reservationId: number
  ): Promise<ConsultationRecord> => {
    const response = await apiClient.get<ConsultationRecord>(
      `/admin/reservations/${reservationId}/consultation-record`
    );
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateConsultationRecordDto
  ): Promise<ConsultationRecord> => {
    const response = await apiClient.patch<ConsultationRecord>(
      `/admin/consultation-records/${id}`,
      data
    );
    return response.data;
  },
};

