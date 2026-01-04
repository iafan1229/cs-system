import { useState, useEffect } from 'react';
import { format, parseISO, addMinutes } from 'date-fns';
import { Input } from '../Input';
import { Button } from '../Button';
import type { Schedule, CreateScheduleDto, UpdateScheduleDto } from '../../services/scheduleService';

interface ScheduleFormProps {
  schedule?: Schedule | null;
  onSubmit: (data: CreateScheduleDto | UpdateScheduleDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ScheduleForm = ({ schedule, onSubmit, onCancel, loading }: ScheduleFormProps) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    maxReservations: 3,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        startTime: format(parseISO(schedule.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(parseISO(schedule.endTime), "yyyy-MM-dd'T'HH:mm"),
        maxReservations: schedule.maxReservations,
      });
    } else {
      setFormData({
        startTime: '',
        endTime: '',
        maxReservations: 3,
      });
    }
  }, [schedule]);

  const handleStartTimeChange = (startTime: string) => {
    if (startTime) {
      const startDate = new Date(startTime);
      const endDate = addMinutes(startDate, 30);
      const endTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, startTime, endTime });
    } else {
      setFormData({ ...formData, startTime, endTime: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="시작 시간"
        type="datetime-local"
        value={formData.startTime}
        onChange={(e) => handleStartTimeChange(e.target.value)}
        required
      />
      <Input
        label="종료 시간"
        type="datetime-local"
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        required
        disabled
      />
      <Input
        label="최대 예약 인원"
        type="number"
        min="1"
        value={formData.maxReservations}
        onChange={(e) =>
          setFormData({ ...formData, maxReservations: parseInt(e.target.value) || 3 })
        }
        required
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" loading={loading}>
          {schedule ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
};

