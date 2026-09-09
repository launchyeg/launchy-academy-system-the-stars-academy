import { CalendarPlus, Pencil, Trash2, UserRound } from "lucide-react";

/** Most recent subscription by start date (falls back to array order when
 * dates are missing/equal), used to reflect that month's payment status on
 * the "سجل التفاصيل" button. */
function getLatestSubscription(student) {
  const subscriptions = student.subscriptions || [];
  if (subscriptions.length === 0) return null;
  return [...subscriptions].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  )[0];
}

/**
 * Responsive table listing the students of a group, with edit/delete actions
 * and an "الحضور" action that opens the attendance/subscription card.
 */
export default function StudentTable({
  students,
  onEdit,
  onDelete,
  onAttendance,
  emptyMessage = "لا يوجد طلاب في هذه المجموعة بعد",
}) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
          <UserRound size={24} />
        </div>
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-right">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-sm text-slate-500">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">اسم الطالب</th>
              <th className="px-5 py-3 font-medium">رقم هاتف الطالب</th>
              <th className="px-5 py-3 font-medium">رقم هاتف ولي الأمر</th>
              <th className="px-5 py-3 font-medium">سعر الاشتراك</th>
              <th className="px-5 py-3 font-medium">الاشتراكات والحضور</th>
              <th className="px-5 py-3 font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student, index) => (
              <tr
                key={student.id}
                className="text-sm text-slate-700 transition-colors hover:bg-slate-50/60"
              >
                <td className="px-5 py-3.5 text-slate-500">{index + 1}</td>
                <td className="px-5 py-3.5 font-medium">{student.name}</td>
                <td className="px-5 py-3.5 text-slate-500" dir="ltr">
                  {student.phone}
                </td>
                <td className="px-5 py-3.5 text-slate-500" dir="ltr">
                  {student.parentPhone}
                </td>
                <td className="px-5 py-3.5">{student.price} ج.م</td>
                <td className="px-5 py-3.5">
                  {(() => {
                    const latestSubscription = getLatestSubscription(student);
                    const unpaid = latestSubscription && !latestSubscription.paid;
                    return (
                      <button
                        type="button"
                        onClick={() => onAttendance(student)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                          unpaid
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <CalendarPlus size={14} />
                        سجل التفاصيل
                        {student.subscriptions?.length > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                              unpaid
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {student.subscriptions.length}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(student)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      <Pencil size={14} />
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(student)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
