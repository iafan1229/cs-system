import { useState, useEffect } from "react";
import { format, parseISO, addMinutes } from "date-fns";
import { Link } from "react-router-dom";
import { scheduleService, type Schedule } from "../../services/scheduleService";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Input } from "../../components/Input";
import { Loading } from "../../components/Loading";

export const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBatchEmailModalOpen, setIsBatchEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<number[]>([]);
  const [pendingSchedule, setPendingSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [, setSelectedSchedule] = useState<Schedule | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    maxReservations: 3,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAll();
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    if (startTime) {
      // 시작 시간이 선택되면 종료 시간을 자동으로 30분 후로 설정
      const startDate = new Date(startTime);
      const endDate = addMinutes(startDate, 30);
      // datetime-local 형식으로 변환 (YYYY-MM-DDTHH:mm)
      const endTime = format(endDate, "yyyy-MM-dd'T'HH:mm");
      setFormData({ ...formData, startTime, endTime });
    } else {
      setFormData({ ...formData, startTime, endTime: "" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.create(formData);
      setIsCreateModalOpen(false);
      setFormData({ startTime: "", endTime: "", maxReservations: 3 });
      loadSchedules();
    } catch (error: any) {
      alert(error.response?.data?.message || "스케줄 생성에 실패했습니다.");
    }
  };

  const handleEdit = (schedule: Schedule) => {
    // 예약이 있는 경우 수정 불가
    if (schedule._count?.reservations && schedule._count.reservations > 0) {
      alert("예약이 있는 스케줄은 수정할 수 없습니다.");
      return;
    }
    setEditingSchedule(schedule);
    setFormData({
      startTime: format(parseISO(schedule.startTime), "yyyy-MM-dd'T'HH:mm"),
      endTime: format(parseISO(schedule.endTime), "yyyy-MM-dd'T'HH:mm"),
      maxReservations: schedule.maxReservations,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      await scheduleService.update(editingSchedule.id, formData);
      setIsEditModalOpen(false);
      setEditingSchedule(null);
      setFormData({ startTime: "", endTime: "", maxReservations: 3 });
      loadSchedules();
    } catch (error: any) {
      alert(error.response?.data?.message || "스케줄 수정에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await scheduleService.delete(id);
      loadSchedules();
    } catch (error: any) {
      alert(error.response?.data?.message || "스케줄 삭제에 실패했습니다.");
    }
  };

  const handleGenerateLink = async (schedule: Schedule) => {
    setPendingSchedule(schedule);
    setIsEmailModalOpen(true);
  };

  const handleConfirmEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      alert("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    if (!pendingSchedule) return;

    try {
      const result = await scheduleService.generateLink(
        pendingSchedule.id,
        emailInput
      );
      setGeneratedLink(result.bookingUrl);
      setSelectedSchedule(pendingSchedule);
      setIsLinkModalOpen(true);
      setIsEmailModalOpen(false);
      setEmailInput("");
      setPendingSchedule(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "링크 생성에 실패했습니다.");
    }
  };

  const handleToggleScheduleSelection = (scheduleId: number) => {
    setSelectedScheduleIds((prev) =>
      prev.includes(scheduleId)
        ? prev.filter((id) => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleBatchEmail = () => {
    if (selectedScheduleIds.length === 0) {
      alert("이메일을 보낼 스케줄을 선택해주세요.");
      return;
    }
    setIsBatchEmailModalOpen(true);
  };

  const handleConfirmBatchEmail = async () => {
    if (!emailInput || !emailInput.includes("@")) {
      alert("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    if (selectedScheduleIds.length === 0) return;

    try {
      const result = await scheduleService.generateLinkBatch(
        selectedScheduleIds,
        emailInput
      );
      setGeneratedLink(result.bookingUrl);
      setIsLinkModalOpen(true);
      setIsBatchEmailModalOpen(false);
      setEmailInput("");
      setSelectedScheduleIds([]);
      alert(`${result.scheduleCount}개의 스케줄에 대한 링크가 생성되었습니다.`);
    } catch (error: any) {
      alert(error.response?.data?.message || "링크 생성에 실패했습니다.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("링크가 클립보드에 복사되었습니다.");
  };

  if (loading) return <Loading />;

  return (
    <div className='px-4 py-6'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold'>스케줄 관리</h2>
        <div className='flex gap-2'>
          <Button
            variant='secondary'
            onClick={handleBatchEmail}
            disabled={selectedScheduleIds.length === 0}
          >
            선택한 스케줄 일괄 발송
            {selectedScheduleIds.length > 0 &&
              ` (${selectedScheduleIds.length})`}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            스케줄 생성
          </Button>
        </div>
      </div>

      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12'>
                <input
                  type='checkbox'
                  checked={
                    schedules.length > 0 &&
                    selectedScheduleIds.length === schedules.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedScheduleIds(schedules.map((s) => s.id));
                    } else {
                      setSelectedScheduleIds([]);
                    }
                  }}
                  className='rounded border-gray-300'
                />
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                날짜/시간
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                예약 현황
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                작업
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <input
                    type='checkbox'
                    checked={selectedScheduleIds.includes(schedule.id)}
                    onChange={() => handleToggleScheduleSelection(schedule.id)}
                    className='rounded border-gray-300'
                  />
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {format(parseISO(schedule.startTime), "yyyy-MM-dd HH:mm")}
                  </div>
                  <div className='text-sm text-gray-500'>
                    ~ {format(parseISO(schedule.endTime), "HH:mm")}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm text-gray-900'>
                    {schedule._count?.reservations || 0} /{" "}
                    {schedule.maxReservations}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                  <div className='flex gap-2 flex-wrap'>
                    <Link
                      to={`/admin/schedules/${schedule.id}/reservations`}
                      className='inline-block'
                    >
                      <Button variant='secondary' className='text-xs px-3 py-1'>
                        예약 내역
                      </Button>
                    </Link>
                    <Button
                      variant='secondary'
                      className='text-xs px-3 py-1'
                      onClick={() => handleEdit(schedule)}
                      disabled={
                        schedule._count?.reservations
                          ? schedule._count.reservations > 0
                          : false
                      }
                    >
                      수정
                    </Button>
                    <Button
                      variant='secondary'
                      className='text-xs px-3 py-1'
                      onClick={() => handleGenerateLink(schedule)}
                    >
                      이메일 보내기
                    </Button>
                    <Button
                      variant='danger'
                      className='text-xs px-3 py-1'
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
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ startTime: "", endTime: "", maxReservations: 3 });
        }}
        title='스케줄 생성'
        footer={
          <>
            <Button
              variant='secondary'
              onClick={() => {
                setIsCreateModalOpen(false);
                setFormData({ startTime: "", endTime: "", maxReservations: 3 });
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </>
        }
      >
        <div className='space-y-4'>
          <Input
            type='datetime-local'
            label='시작 시간'
            value={formData.startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            required
          />
          <Input
            type='datetime-local'
            label='종료 시간 (자동 계산: 시작 시간 + 30분)'
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            required
            disabled={!formData.startTime}
          />
          <Input
            type='number'
            label='최대 예약 인원'
            value={formData.maxReservations}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxReservations: parseInt(e.target.value),
              })
            }
            min={1}
            max={10}
            required
          />
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingSchedule(null);
          setFormData({ startTime: "", endTime: "", maxReservations: 3 });
        }}
        title='스케줄 수정'
        footer={
          <>
            <Button
              variant='secondary'
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingSchedule(null);
                setFormData({ startTime: "", endTime: "", maxReservations: 3 });
              }}
            >
              취소
            </Button>
            <Button onClick={handleUpdate}>수정</Button>
          </>
        }
      >
        <div className='space-y-4'>
          <Input
            type='datetime-local'
            label='시작 시간'
            value={formData.startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            required
          />
          <Input
            type='datetime-local'
            label='종료 시간 (자동 계산: 시작 시간 + 30분)'
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            required
            disabled={!formData.startTime}
          />
          <Input
            type='number'
            label='최대 예약 인원'
            value={formData.maxReservations}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxReservations: parseInt(e.target.value),
              })
            }
            min={1}
            max={10}
            required
          />
          {editingSchedule?._count?.reservations &&
            editingSchedule._count.reservations > 0 && (
              <p className='text-sm text-red-600'>
                ⚠️ 예약이 있는 스케줄은 수정할 수 없습니다.
              </p>
            )}
        </div>
      </Modal>

      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailInput("");
          setPendingSchedule(null);
        }}
        title='상담희망자 이메일 입력'
        footer={
          <>
            <Button
              variant='secondary'
              onClick={() => {
                setIsEmailModalOpen(false);
                setEmailInput("");
                setPendingSchedule(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmEmail}>확인</Button>
          </>
        }
      >
        <div className='space-y-4'>
          <Input
            type='email'
            label='상담희망자 이메일'
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder='example@email.com'
            required
          />
          <p className='text-sm text-gray-500'>
            입력하신 이메일로 상담 신청 링크가 발송됩니다.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isBatchEmailModalOpen}
        onClose={() => {
          setIsBatchEmailModalOpen(false);
          setEmailInput("");
        }}
        title='여러 스케줄 일괄 이메일 발송'
        footer={
          <>
            <Button
              variant='secondary'
              onClick={() => {
                setIsBatchEmailModalOpen(false);
                setEmailInput("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleConfirmBatchEmail}>확인</Button>
          </>
        }
      >
        <div className='space-y-4'>
          <Input
            type='email'
            label='상담희망자 이메일'
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder='example@email.com'
            required
          />
          <p className='text-sm text-gray-500'>
            선택한 {selectedScheduleIds.length}개의 스케줄에 대한 링크가 하나의
            이메일로 발송됩니다.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title='상담 신청 링크'
        footer={<Button onClick={() => setIsLinkModalOpen(false)}>닫기</Button>}
      >
        <div className='space-y-4'>
          <p className='text-sm text-gray-600'>
            상담희망자에게 이메일이 발송되었습니다. 아래 링크를 복사하여 추가로
            전달할 수도 있습니다.
          </p>
          <div className='flex gap-2'>
            <Input value={generatedLink} readOnly />
            <Button
              variant='secondary'
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
