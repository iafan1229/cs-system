import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '../Button';
import type { Schedule } from '../../services/scheduleService';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: number) => void;
  onGenerateLink: (schedule: Schedule) => void;
  onSelect: (id: number, selected: boolean) => void;
  selectedIds: number[];
}

export const ScheduleList = ({
  schedules,
  onEdit,
  onDelete,
  onGenerateLink,
  onSelect,
  selectedIds,
}: ScheduleListProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">
              <input
                type="checkbox"
                checked={schedules.length > 0 && selectedIds.length === schedules.length}
                onChange={(e) => {
                  schedules.forEach((schedule) => {
                    onSelect(schedule.id, e.target.checked);
                  });
                }}
              />
            </th>
            <th className="px-4 py-2 border-b text-left">시작 시간</th>
            <th className="px-4 py-2 border-b text-left">종료 시간</th>
            <th className="px-4 py-2 border-b text-left">최대 인원</th>
            <th className="px-4 py-2 border-b text-left">현재 예약</th>
            <th className="px-4 py-2 border-b text-left">작업</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(schedule.id)}
                  onChange={(e) => onSelect(schedule.id, e.target.checked)}
                />
              </td>
              <td className="px-4 py-2 border-b">
                {format(parseISO(schedule.startTime), 'yyyy-MM-dd HH:mm')}
              </td>
              <td className="px-4 py-2 border-b">
                {format(parseISO(schedule.endTime), 'yyyy-MM-dd HH:mm')}
              </td>
              <td className="px-4 py-2 border-b">{schedule.maxReservations}</td>
              <td className="px-4 py-2 border-b">
                {schedule._count?.reservations || 0}
              </td>
              <td className="px-4 py-2 border-b">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => onEdit(schedule)}
                    disabled={schedule._count?.reservations && schedule._count.reservations > 0}
                  >
                    수정
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => onDelete(schedule.id)}
                    disabled={schedule._count?.reservations && schedule._count.reservations > 0}
                  >
                    삭제
                  </Button>
                  <Button variant="secondary" onClick={() => onGenerateLink(schedule)}>
                    링크 생성
                  </Button>
                  <Link to={`/admin/schedules/${schedule.id}/reservations`}>
                    <Button variant="secondary">예약 내역</Button>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

