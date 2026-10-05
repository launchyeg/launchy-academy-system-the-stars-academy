import { Users2, GraduationCap, Wallet, Banknote } from "lucide-react";
import { useAcademy } from "../context/AcademyContext";
import StatCard from "../components/StatCard";

/**
 * Overview page: quick statistics computed from the current groups/students state.
 */
export default function DashboardOverview() {
  const { groups, totals } = useAcademy();

  const topGroups = [...groups]
    .sort((a, b) => b.students.length - a.students.length)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users2}
          label="إجمالي المجموعات"
          value={totals.totalGroups}
          accent="primary"
        />
        <StatCard
          icon={GraduationCap}
          label="إجمالي الطلاب"
          value={totals.totalStudents}
          accent="emerald"
        />
        <StatCard
          icon={Wallet}
          label="إجمالي الاشتراكات الشهرية"
          value={`${totals.totalRevenue} ج.م`}
          accent="amber"
        />
        <StatCard
          icon={Banknote}
          label="إجمالي المحصّل"
          value={`${totals.totalCollected} ج.م`}
          accent="emerald"
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-slate-800">
          المجموعات الأكثر عددًا
        </h2>

        {topGroups.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            لا توجد مجموعات بعد
          </p>
        ) : (
          <div className="space-y-3">
            {topGroups.map((group) => {
              const max = Math.max(
                ...topGroups.map((g) => g.students.length),
                1,
              );
              const percent = Math.max((group.students.length / max) * 100, 4);
              return (
                <div key={group.id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">
                      {group.name}
                    </span>
                    <span className="text-slate-400">
                      {group.students.length} طالب
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
