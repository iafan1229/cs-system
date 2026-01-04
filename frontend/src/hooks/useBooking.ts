import { useState, useCallback } from 'react';
import { reservationService, type AvailableSchedulesResponse } from '../services/reservationService';
import { CreateReservationDto } from '../services/reservationService';

interface UseBookingReturn {
  schedules: AvailableSchedulesResponse['schedules'];
  recipientEmail: string | null;
  loading: boolean;
  error: string | null;
  loadAvailableSchedules: (token: string) => Promise<void>;
  submitReservation: (token: string, data: CreateReservationDto) => Promise<void>;
}

export const useBooking = (): UseBookingReturn => {
  const [schedules, setSchedules] = useState<AvailableSchedulesResponse['schedules']>({});
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableSchedules = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservationService.getAvailableSchedules(token);
      setSchedules(data.schedules);
      setRecipientEmail(data.recipientEmail || null);
    } catch (err: any) {
      setError(err.response?.data?.message || '스케줄을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReservation = useCallback(async (token: string, data: CreateReservationDto) => {
    try {
      setError(null);
      await reservationService.create(token, data);
      // 예약 성공 후 스케줄 다시 로드
      await loadAvailableSchedules(token);
    } catch (err: any) {
      setError(err.response?.data?.message || '예약에 실패했습니다.');
      throw err;
    }
  }, [loadAvailableSchedules]);

  return {
    schedules,
    recipientEmail,
    loading,
    error,
    loadAvailableSchedules,
    submitReservation,
  };
};

