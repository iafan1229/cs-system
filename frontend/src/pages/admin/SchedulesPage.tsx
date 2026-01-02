import { useState, useEffect } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { scheduleService, type Schedule } from '../../services/scheduleService';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [, setSelectedSchedule] = useState<Schedule | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [startDate, setStartDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );

  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    maxReservations: 3,
  });

  useEffect(() => {
    loadSchedules();
  }, [startDate, endDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAll(startDate, endDate);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({ startTime: '', endTime: '', maxReservations: 3 });
      loadSchedules();
    } catch (error: any) {
      alert(error.response?.data?.message || '스케줄 생성에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await scheduleService.delete(id);
      loadSchedules();
    } catch (error: any) {
      alert(error.response?.data?.message || '스케줄 삭제에 실패했습니다.');
    }
  };

  const handleGenerateLink = async (schedule: Schedule) => {
    try {
      const result = await scheduleService.generateLink(schedule.id);
      setGeneratedLink(result.bookingUrl);
      setSelectedSchedule(schedule);
      setIsLinkModalOpen(true);
    } catch (error: any) {
      alert(error.response?.data?.message || '링크 생성에 실패했습니다.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('링크가 클립보드에 복사되었습니다.');
  };

  if (loading) return <Loading />;

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">스케줄 관리</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>스케줄 생성</Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          type="date"
          label="시작 날짜"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          type="date"
          label="종료 날짜"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                날짜/시간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                예약 현황
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {format(parseISO(schedule.startTime), 'yyyy-MM-dd HH:mm')}
                  </div>
                  <div className="text-sm text-gray-500">
                    ~ {format(parseISO(schedule.endTime), 'HH:mm')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schedule._count?.reservations || 0} / {schedule.maxReservations}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleGenerateLink(schedule)}
                    >
                      링크 생성
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="스케줄 생성"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            type="datetime-local"
            label="시작 시간"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
          <Input
            type="datetime-local"
            label="종료 시간"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
          <Input
            type="number"
            label="최대 예약 인원"
            value={formData.maxReservations}
            onChange={(e) =>
              setFormData({ ...formData, maxReservations: parseInt(e.target.value) })
            }
            min={1}
            max={10}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="상담 신청 링크"
        footer={
          <Button onClick={() => setIsLinkModalOpen(false)}>닫기</Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            아래 링크를 복사하여 신청자에게 전달하세요.
          </p>
          <div className="flex gap-2">
            <Input value={generatedLink} readOnly />
            <Button
              variant="secondary"
              onClick={() => copyToClipboard(generatedLink)}
            >
              복사
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

