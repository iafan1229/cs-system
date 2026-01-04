import { useState, useEffect } from 'react';
import { useSchedules } from '../../hooks/useSchedules';
import { ScheduleForm } from '../../components/schedules/ScheduleForm';
import { ScheduleList } from '../../components/schedules/ScheduleList';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import type { Schedule } from '../../services/scheduleService';

export const SchedulesPage = () => {
  const {
    schedules,
    loading,
    error,
    loadSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    generateLink,
    generateLinkBatch,
  } = useSchedules();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBatchEmailModalOpen, setIsBatchEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [pendingSchedule, setPendingSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = async (data: any) => {
    try {
      setSubmitting(true);
      await createSchedule(data);
      setIsCreateModalOpen(false);
    } catch (err) {
      // Error is handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingSchedule) return;
    try {
      setSubmitting(true);
      await updateSchedule(editingSchedule.id, data);
      setIsEditModalOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      // Error is handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteSchedule(id);
    } catch (err) {
      // Error is handled by hook
    }
  };

  const handleEdit = (schedule: Schedule) => {
    if (schedule._count?.reservations && schedule._count.reservations > 0) {
      alert('예약이 있는 스케줄은 수정할 수 없습니다.');
      return;
    }
    setEditingSchedule(schedule);
    setIsEditModalOpen(true);
  };

  const handleGenerateLink = (schedule: Schedule) => {
    setPendingSchedule(schedule);
    setIsEmailModalOpen(true);
  };

  const handleConfirmEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    if (!pendingSchedule) return;

    try {
      setSubmitting(true);
      const result = await generateLink(pendingSchedule.id, emailInput);
      setGeneratedLink(result.bookingUrl);
      setIsLinkModalOpen(true);
      setIsEmailModalOpen(false);
      setEmailInput('');
      setPendingSchedule(null);
    } catch (err) {
      // Error is handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleScheduleSelection = (scheduleId: number, selected: boolean) => {
    setSelectedScheduleIds((prev) =>
      selected
        ? [...prev, scheduleId]
        : prev.filter((id) => id !== scheduleId)
    );
  };

  const handleBatchEmail = () => {
    if (selectedScheduleIds.length === 0) {
      alert('이메일을 보낼 스케줄을 선택해주세요.');
      return;
    }
    setIsBatchEmailModalOpen(true);
  };

  const handleConfirmBatchEmail = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }
    if (selectedScheduleIds.length === 0) return;

    try {
      setSubmitting(true);
      const result = await generateLinkBatch(selectedScheduleIds, emailInput);
      setGeneratedLink(result.bookingUrl);
      setIsLinkModalOpen(true);
      setIsBatchEmailModalOpen(false);
      setEmailInput('');
      setSelectedScheduleIds([]);
      alert(`${result.scheduleCount}개의 스케줄에 대한 링크가 생성되었습니다.`);
    } catch (err) {
      // Error is handled by hook
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && schedules.length === 0) {
    return <Loading />;
  }

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">스케줄 관리</h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleBatchEmail}
            disabled={selectedScheduleIds.length === 0}
          >
            선택한 스케줄 일괄 발송
            {selectedScheduleIds.length > 0 && ` (${selectedScheduleIds.length})`}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>스케줄 생성</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <ScheduleList
        schedules={schedules}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onGenerateLink={handleGenerateLink}
        onSelect={handleToggleScheduleSelection}
        selectedIds={selectedScheduleIds}
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="스케줄 생성"
      >
        <ScheduleForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          loading={submitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSchedule(null);
        }}
        title="스케줄 수정"
      >
        <ScheduleForm
          schedule={editingSchedule}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingSchedule(null);
          }}
          loading={submitting}
        />
      </Modal>

      {/* Email Input Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setPendingSchedule(null);
          setEmailInput('');
        }}
        title="이메일 입력"
      >
        <div className="space-y-4">
          <Input
            label="상담희망자 이메일"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="example@email.com"
            required
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEmailModalOpen(false);
                setPendingSchedule(null);
                setEmailInput('');
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmEmail} loading={submitting}>
              확인
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Email Modal */}
      <Modal
        isOpen={isBatchEmailModalOpen}
        onClose={() => {
          setIsBatchEmailModalOpen(false);
          setEmailInput('');
        }}
        title="일괄 이메일 발송"
      >
        <div className="space-y-4">
          <Input
            label="상담희망자 이메일"
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="example@email.com"
            required
          />
          <p className="text-sm text-gray-600">
            선택한 {selectedScheduleIds.length}개의 스케줄에 대한 링크를 발송합니다.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsBatchEmailModalOpen(false);
                setEmailInput('');
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmBatchEmail} loading={submitting}>
              발송
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Display Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="예약 링크"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">생성된 예약 링크:</p>
          <div className="p-4 bg-gray-100 rounded break-all">{generatedLink}</div>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              alert('링크가 클립보드에 복사되었습니다.');
            }}
          >
            링크 복사
          </Button>
        </div>
      </Modal>
    </div>
  );
};

