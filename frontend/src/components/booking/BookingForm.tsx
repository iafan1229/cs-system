import { useState, useEffect } from 'react';
import { Input } from '../Input';
import { Button } from '../Button';
import type { CreateReservationDto } from '../../services/reservationService';

interface BookingFormProps {
  scheduleId: number;
  defaultEmail?: string;
  onSubmit: (data: CreateReservationDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const BookingForm = ({
  scheduleId,
  defaultEmail,
  onSubmit,
  onCancel,
  loading,
}: BookingFormProps) => {
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: defaultEmail || '',
  });

  useEffect(() => {
    if (defaultEmail) {
      setFormData((prev) => ({ ...prev, applicantEmail: defaultEmail }));
    }
  }, [defaultEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      scheduleId,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="이름"
        value={formData.applicantName}
        onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
        required
      />
      <Input
        label="이메일"
        type="email"
        value={formData.applicantEmail}
        onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
        required
        disabled={!!defaultEmail}
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" loading={loading}>
          예약하기
        </Button>
      </div>
    </form>
  );
};

