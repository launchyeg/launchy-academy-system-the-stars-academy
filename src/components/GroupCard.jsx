import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users2, ChevronLeft, Pencil, Trash2 } from "lucide-react";

/**
 * Clickable card representing a single group, used on the Groups grid.
 * The card itself navigates to the group's details page; the edit/delete
 * buttons stop that click from bubbling so they act on the card instead.
 */
export default function GroupCard({ group, onEdit, onDelete }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="group relative flex flex-col items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 text-right shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/dashboard/groups/${group.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/dashboard/groups/${group.id}`);
          }
        }}
        className="flex w-full cursor-pointer flex-col items-start gap-4 text-right"
      >
        <div className="flex w-full items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Users2 size={20} />
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(group);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="تعديل المجموعة"
              title="تعديل المجموعة"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(group);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="حذف المجموعة"
              title="حذف المجموعة"
            >
              <Trash2 size={15} />
            </button>
            <ChevronLeft size={18} className="mt-2 text-slate-300" />
          </div>
        </div>

        <div className="w-full">
          <h3 className="line-clamp-2 text-base font-bold text-slate-800">
            {group.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            عدد الطلاب:{" "}
            <span className="font-semibold text-slate-600">
              {group.students.length}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
