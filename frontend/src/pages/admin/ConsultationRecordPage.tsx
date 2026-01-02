import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { consultationRecordService } from '../../services/consultationRecordService';
import { reservationService } from '../../services/reservationService';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { format, parseISO } from 'date-fns';

export const ConsultationRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reservationData, recordData] = await Promise.all([
        reservationService.getById(Number(id)),
        consultationRecordService.getByReservation(Number(id)).catch(() => null),
      ]);
      setReservation(reservationData);
      if (recordData) {
        setContent(recordData.content);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 기록이 없으면 새로 생성할 수 있도록 함
        const reservationData = await reservationService.getById(Number(id));
        setReservation(reservationData);
      } else {
        console.error('Failed to load data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      await consultationRecordService.create(Number(id), { content });
      alert('상담 기록이 저장되었습니다.');
      navigate('/admin/schedules');
    } catch (error: any) {
      alert(error.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          ← 뒤로가기
        </button>
        <h2 className="text-2xl font-bold mt-4">상담 기록</h2>
      </div>

      {reservation && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">예약 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">신청자</p>
              <p className="font-medium">{reservation.applicantName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">이메일</p>
              <p className="font-medium">{reservation.applicantEmail}</p>
            </div>
            {reservation.schedule && (
              <>
                <div>
                  <p className="text-sm text-gray-500">상담 시간</p>
                  <p className="font-medium">
                    {format(parseISO(reservation.schedule.startTime), 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          상담 기록
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="상담 내용을 입력하세요..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button onClick={handleSave} loading={saving}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};

