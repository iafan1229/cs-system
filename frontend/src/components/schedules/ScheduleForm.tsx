import { useState, useEffect } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { Input } from "../Input";
import { Button } from "../Button";
import type {
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto,
} from "../../services/scheduleService";

interface ScheduleFormProps {
  schedule?: Schedule | null;
  onSubmit: (data: CreateScheduleDto | UpdateScheduleDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ScheduleForm = ({
  schedule,
  onSubmit,
  onCancel,
  loading,
}: ScheduleFormProps) => {
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    maxReservations: 3,
  });

  // schedule prop이 변경될 때 formData 초기화
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (schedule) {
      setFormData({
        startTime: format(parseISO(schedule.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(parseISO(schedule.endTime), "yyyy-MM-dd'T'HH:mm"),
        maxReservations: schedule.maxReservations,
      });
    } else {
      setFormData({
        startTime: "",
        endTime: "",
        maxReservations: 3,
      });
    }
  }, [
    schedule?.id,
    schedule?.startTime,
    schedule?.endTime,
    schedule?.maxReservations,
  ]);

  const handleStartTimeChange = (startTime: string) => {
    if (startTime) {
      const startDate = new Date(startTime);
      const endDate = addMinutes(startDate, 30);
      const endTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, startTime, endTime });
    } else {
      setFormData({ ...formData, startTime, endTime: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // datetime-local 값을 ISO 8601 형식으로 변환 (시간대 정보 포함)
    const startTimeISO = formData.startTime
      ? new Date(formData.startTime).toISOString()
      : "";
    const endTimeISO = formData.endTime
      ? new Date(formData.endTime).toISOString()
      : "";

    await onSubmit({
      ...formData,
      startTime: startTimeISO,
      endTime: endTimeISO,
    });
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Input
        label='시작 시간'
        type='datetime-local'
        value={formData.startTime}
        onChange={(e) => handleStartTimeChange(e.target.value)}
        required
      />
      <Input
        label='종료 시간'
        type='datetime-local'
        value={formData.endTime}
        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
        required
        disabled
      />
      <Input
        label='최대 예약 인원'
        type='number'
        min='1'
        value={formData.maxReservations}
        onChange={(e) =>
          setFormData({
            ...formData,
            maxReservations: parseInt(e.target.value) || 3,
          })
        }
        required
      />
      <div className='flex gap-2 justify-end'>
        <Button type='button' variant='secondary' onClick={onCancel}>
          취소
        </Button>
        <Button type='submit' loading={loading}>
          {schedule ? "수정" : "생성"}
        </Button>
      </div>
    </form>
  );
};
