import { useState, useCallback } from 'react';
import { reservationService, type Reservation, type CreateReservationDto } from '../services/reservationService';

interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  loadReservations: (scheduleId: number) => Promise<void>;
  createReservation: (token: string, data: CreateReservationDto) => Promise<Reservation>;
  getReservation: (id: number) => Promise<Reservation>;
}

export const useReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async (scheduleId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservationService.getBySchedule(scheduleId);
      setReservations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '예약을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReservation = useCallback(async (token: string, data: CreateReservationDto): Promise<Reservation> => {
    try {
      setError(null);
      const newReservation = await reservationService.create(token, data);
      setReservations((prev) => [...prev, newReservation]);
      return newReservation;
    } catch (err: any) {
      setError(err.response?.data?.message || '예약 생성에 실패했습니다.');
      throw err;
    }
  }, []);

  const getReservation = useCallback(async (id: number): Promise<Reservation> => {
    try {
      setLoading(true);
      setError(null);
      const reservation = await reservationService.getById(id);
      return reservation;
    } catch (err: any) {
      setError(err.response?.data?.message || '예약을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    reservations,
    loading,
    error,
    loadReservations,
    createReservation,
    getReservation,
  };
};

