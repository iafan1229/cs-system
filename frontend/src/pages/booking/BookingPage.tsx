import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { reservationService, type AvailableSchedulesResponse } from '../../services/reservationService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Loading } from '../../components/Loading';

export const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [schedules, setSchedules] = useState<AvailableSchedulesResponse['schedules']>({});
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadSchedules();
    } else {
      setError('유효하지 않은 링크입니다.');
      setLoading(false);
    }
  }, [token]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAvailableSchedules(token!);
      setSchedules(data.schedules);
      // 상담희망자 이메일이 있으면 자동으로 채우기
      if (data.recipientEmail) {
        setRecipientEmail(data.recipientEmail);
        setFormData((prev) => ({
          ...prev,
          applicantEmail: data.recipientEmail || '',
        }));
      }
    } catch (error: any) {
      setError(error.response?.data?.message || '스케줄을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (scheduleId: number) => {
    setSelectedSchedule(scheduleId);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSchedule) return;

    try {
      setSubmitting(true);
      await reservationService.createPublic(token, {
        scheduleId: selectedSchedule,
        ...formData,
      });
      setSuccess(true);
      setIsFormOpen(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '예약에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">예약 완료!</h2>
          <p className="text-gray-700 mb-6">예약이 성공적으로 완료되었습니다.</p>
        </div>
      </div>
    );
  }

  const dates = Object.keys(schedules).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">상담 예약</h1>

        {dates.length === 0 ? (
          <div className="text-center text-gray-500">
            예약 가능한 스케줄이 없습니다.
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {format(parseISO(date), 'yyyy년 MM월 dd일')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {schedules[date].map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => handleSlotClick(schedule.id)}
                      disabled={schedule.availableSlots === 0}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        schedule.availableSlots === 0
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-blue-200 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                      }`}
                    >
                      <div className="font-medium">
                        {format(parseISO(schedule.startTime), 'HH:mm')} -{' '}
                        {format(parseISO(schedule.endTime), 'HH:mm')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        잔여: {schedule.availableSlots}명
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="예약 신청"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleSubmit} loading={submitting}>
                예약하기
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="이름"
              value={formData.applicantName}
              onChange={(e) =>
                setFormData({ ...formData, applicantName: e.target.value })
              }
              required
            />
            <Input
              label="이메일"
              type="email"
              value={formData.applicantEmail}
              onChange={(e) =>
                setFormData({ ...formData, applicantEmail: e.target.value })
              }
              required
              disabled={!!recipientEmail}
              placeholder={recipientEmail ? '이메일이 자동으로 입력되었습니다' : ''}
            />
          </form>
        </Modal>
      </div>
    </div>
  );
};

