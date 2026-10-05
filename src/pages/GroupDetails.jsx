import { useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { UserPlus, Users2, ChevronRight, Search, Wallet, Banknote } from "lucide-react";
import { getTotalCollected } from "../utils/collected";
import { useAcademy } from "../context/AcademyContext";
import StudentTable from "../components/StudentTable";
import StatCard from "../components/StatCard";
import AddStudentModal from "../components/AddStudentModal";
import AttendanceModal from "../components/AttendanceModal";
import ConfirmDialog from "../components/ConfirmDialog";

/**
 * Single group page: group info, "Add student" action, and the students table.
 */
export default function GroupDetails() {
  const { id } = useParams();
  const {
    getGroup,
    addStudent,
    updateStudent,
    deleteStudent,
    addSubscription,
    deleteSubscription,
    updateSubscriptionRecords,
  } = useAcademy();
  const group = getGroup(id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [attendanceStudentId, setAttendanceStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !group) return group?.students ?? [];
    return group.students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        String(student.id ?? "")
          .toLowerCase()
          .includes(query) ||
        student.phone?.toLowerCase().includes(query),
    );
  }, [group, searchQuery]);

  if (!group) {
    return <Navigate to="/dashboard/groups" replace />;
  }

  const totalMonthlySubscriptions = group.students.reduce(
    (sum, student) => sum + Number(student.price || 0),
    0,
  );

  const attendanceStudent =
    group.students.find((s) => String(s.id) === String(attendanceStudentId)) ||
    null;

  async function handleAddStudent(studentData) {
    await addStudent(group.id, studentData);
  }

  function handleEditStudent(studentData) {
    updateStudent(group.id, editingStudent.id, studentData);
    setEditingStudent(null);
  }

  return (
    <div className="space-y-6">
      <Link
        to="/dashboard/groups"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
      >
        <ChevronRight size={16} />
        العودة إلى المجموعات
      </Link>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Wallet}
          label="إجمالي الاشتراكات الشهرية"
          value={`${totalMonthlySubscriptions} ج.م`}
          accent="amber"
        />
        <StatCard
          icon={Banknote}
          label="إجمالي المحصّل"
          value={`${getTotalCollected(group.students)} ج.م`}
          accent="emerald"
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Users2 size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{group.name}</h2>
            <p className="mt-1 text-sm text-slate-400">
              عدد الطلاب: {group.students.length}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <UserPlus size={17} />
          إضافة طالب
        </button>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم الطالب أو رقم هاتف الطالب..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-11 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <StudentTable
        students={filteredStudents}
        onEdit={(student) => setEditingStudent(student)}
        onDelete={(student) => setDeletingStudent(student)}
        onAttendance={(student) => setAttendanceStudentId(student.id)}
        emptyMessage={
          searchQuery.trim() ? "لا يوجد طلاب مطابقين لبحثك" : undefined
        }
      />

      <AddStudentModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddStudent}
      />

      <AddStudentModal
        open={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        onSubmit={handleEditStudent}
        initialData={editingStudent}
      />

      <ConfirmDialog
        open={Boolean(deletingStudent)}
        onClose={() => setDeletingStudent(null)}
        onConfirm={() => deleteStudent(group.id, deletingStudent.id)}
        title="حذف الطالب"
        message={`هل أنت متأكد من حذف الطالب "${deletingStudent?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />

      <AttendanceModal
        open={Boolean(attendanceStudentId)}
        onClose={() => setAttendanceStudentId(null)}
        student={attendanceStudent}
        groupName={group.name}
        onAdd={(subscription) =>
          addSubscription(group.id, attendanceStudentId, subscription)
        }
        onDelete={(subscriptionId) =>
          deleteSubscription(group.id, attendanceStudentId, subscriptionId)
        }
        onUpdateSubscriptionRecords={(subscriptionId, records) =>
          updateSubscriptionRecords(
            group.id,
            attendanceStudentId,
            subscriptionId,
            records,
          )
        }
      />
    </div>
  );
}
