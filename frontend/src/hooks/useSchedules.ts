import { useState, useCallback } from 'react';
import { scheduleService, type Schedule, type CreateScheduleDto, type UpdateScheduleDto } from '../services/scheduleService';

interface UseSchedulesReturn {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  loadSchedules: (startDate?: string, endDate?: string) => Promise<void>;
  createSchedule: (data: CreateScheduleDto) => Promise<Schedule>;
  updateSchedule: (id: number, data: UpdateScheduleDto) => Promise<Schedule>;
  deleteSchedule: (id: number) => Promise<void>;
  generateLink: (id: number, email: string) => Promise<{ token: string; expiresAt: string; bookingUrl: string }>;
  generateLinkBatch: (scheduleIds: number[], email: string) => Promise<{ token: string; expiresAt: string; bookingUrl: string; scheduleCount: number }>;
}

export const useSchedules = (): UseSchedulesReturn => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSchedules = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await scheduleService.getAll(startDate, endDate);
      setSchedules(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '스케줄을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (data: CreateScheduleDto): Promise<Schedule> => {
    try {
      setError(null);
      const newSchedule = await scheduleService.create(data);
      setSchedules((prev) => [...prev, newSchedule]);
      return newSchedule;
    } catch (err: any) {
      setError(err.response?.data?.message || '스케줄 생성에 실패했습니다.');
      throw err;
    }
  }, []);

  const updateSchedule = useCallback(async (id: number, data: UpdateScheduleDto): Promise<Schedule> => {
    try {
      setError(null);
      const updatedSchedule = await scheduleService.update(id, data);
      setSchedules((prev) =>
        prev.map((schedule) => (schedule.id === id ? updatedSchedule : schedule))
      );
      return updatedSchedule;
    } catch (err: any) {
      setError(err.response?.data?.message || '스케줄 수정에 실패했습니다.');
      throw err;
    }
  }, []);

  const deleteSchedule = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await scheduleService.delete(id);
      setSchedules((prev) => prev.filter((schedule) => schedule.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || '스케줄 삭제에 실패했습니다.');
      throw err;
    }
  }, []);

  const generateLink = useCallback(async (id: number, email: string) => {
    try {
      setError(null);
      return await scheduleService.generateLink(id, email);
    } catch (err: any) {
      setError(err.response?.data?.message || '링크 생성에 실패했습니다.');
      throw err;
    }
  }, []);

  const generateLinkBatch = useCallback(async (scheduleIds: number[], email: string) => {
    try {
      setError(null);
      return await scheduleService.generateLinkBatch(scheduleIds, email);
    } catch (err: any) {
      setError(err.response?.data?.message || '일괄 링크 생성에 실패했습니다.');
      throw err;
    }
  }, []);

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    generateLink,
    generateLinkBatch,
  };
};

