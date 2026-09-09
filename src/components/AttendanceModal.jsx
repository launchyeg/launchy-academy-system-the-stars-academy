import { useEffect, useRef, useState } from "react";
import {
  Trash2,
  CalendarCheck,
  Calendar,
  Banknote,
  CreditCard,
  Smartphone,
  ClipboardCheck,
  GraduationCap,
  StickyNote,
  Save,
  Plus,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import {
  buildReceiptWhatsAppLink,
  buildMonthlyReportWhatsAppLink,
} from "../utils/whatsapp";
import { RECORD_SLOTS } from "../constants";

const PAYMENT_METHODS = [
  { value: "كاش", icon: Banknote },
  { value: "إنستا باي", icon: CreditCard },
  { value: "فودافون كاش", icon: Smartphone },
];
const SUBSCRIPTION_DAYS = 30;

function addDays(dateString, days) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Styled date input: native `<input type="date">` with a custom calendar
 * icon and a click-anywhere-to-open picker, instead of the plain browser box. */
function DateField({ label, value, onChange, disabled, hint }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.showPicker?.()}
        className={`relative flex items-center rounded-xl border transition ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100"
            : "cursor-pointer border-slate-200 bg-white focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100"
        }`}
      >
        <Calendar
          size={16}
          className={`pointer-events-none ms-3.5 shrink-0 ${
            disabled ? "text-slate-400" : "text-slate-400"
          }`}
        />
        <div className="relative w-full">
          {!value && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400">
              اختر التاريخ
            </span>
          )}
          <input
            ref={inputRef}
            type="date"
            value={value}
            disabled={disabled}
            readOnly={disabled}
            title={hint}
            onChange={onChange}
            className="w-full appearance-none bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:text-slate-500 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

/** Payment method picker as an icon + label segmented control, instead of a
 * plain native `<select>`. */
function PaymentMethodField({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        طريقة الدفع
      </label>
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map(({ value: method, icon: Icon }) => {
          const active = value === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => onChange(method)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                active
                  ? "border-primary-400 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-primary-600" : "text-slate-400"}
              />
              {method}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Pill-shaped paid/unpaid switch shown under a subscription's payment
 * method, turned on automatically when the subscription is created. Forced
 * `dir="ltr"` so the knob always slides the same physical way regardless of
 * the page's RTL direction. */
function PaidToggle({ paid, onChange }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2">
      <span
        className={`text-xs font-semibold ${paid ? "text-green-600" : "text-slate-400"}`}
      >
        {paid ? "تم الدفع" : "لم يتم الدفع"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={paid}
        dir="ltr"
        onClick={() => onChange(!paid)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 ${
          paid ? "bg-green-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            paid ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

/** Attendance toggles + quiz/final-exam grade/note inputs for one subscription
 * (one month), committed together via a single "save" action (mirrors the
 * explicit-submit pattern used by the subscription form above it). */
function AttendanceGradesSection({
  attendance,
  quizzes,
  finalExam,
  note,
  onToggleAttendance,
  onQuizChange,
  onFinalExamChange,
  onNoteChange,
  onSave,
  onSendReport,
  saved,
}) {
  const presentCount = attendance.filter(Boolean).length;

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">الحضور والدرجات</h3>
        {saved && (
          <span className="text-xs font-medium text-green-600">تم الحفظ ✓</span>
        )}
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <ClipboardCheck size={15} className="text-slate-400" />
          الحضور ({presentCount} من {attendance.length})
        </label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {attendance.map((present, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onToggleAttendance(index)}
              title={`الحصة ${index + 1}: ${present ? "حاضر" : "غائب"}`}
              className={`rounded-lg border py-2 text-xs font-semibold transition ${
                present
                  ? "border-green-400 bg-green-50 text-green-700"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-600">
          درجات الكويزات
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quizzes.map((grade, index) => (
            <div key={index}>
              <label className="mb-1 block text-[11px] font-medium text-slate-400">
                كويز {index + 1}
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => onQuizChange(index, e.target.value)}
                placeholder="-"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <GraduationCap size={15} className="text-slate-400" />
          درجة الاختبار النهائي
        </label>
        <input
          type="text"
          value={finalExam}
          onChange={(e) => onFinalExamChange(e.target.value)}
          placeholder="أدخل الدرجة"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <StickyNote size={15} className="text-slate-400" />
          ملاحظات
        </label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="أدخل ملاحظاتك هنا"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Save size={15} />
          حفظ
        </button>
        <button
          type="button"
          onClick={onSendReport}
          className="flex items-center gap-1.5 rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <WhatsAppIcon size={15} />
          إرسال التقرير الشهري
        </button>
      </div>
    </div>
  );
}

/**
 * Card/modal for managing a single student's attendance/subscription records.
 * Supports adding a new monthly subscription (start date → auto end date +30 days,
 * plus payment method) and deleting an existing record. No edit functionality,
 * per product requirements — subscriptions are add/delete only.
 *
 * Attendance/quiz/final-exam/note records live on each subscription (one record
 * set per month), so a fresh, empty AttendanceGradesSection appears for every
 * new subscription — there is no single shared attendance section.
 */
export default function AttendanceModal({
  open,
  onClose,
  student,
  groupName,
  onAdd,
  onDelete,
  onUpdateSubscriptionRecords,
}) {
  const [startDate, setStartDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0].value);
  const [error, setError] = useState("");
  const [deletingSubscription, setDeletingSubscription] = useState(null);
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState(null);
  const [draftAttendance, setDraftAttendance] = useState(
    Array(RECORD_SLOTS).fill(false),
  );
  const [draftQuizzes, setDraftQuizzes] = useState(
    Array(RECORD_SLOTS).fill(""),
  );
  const [draftFinalExam, setDraftFinalExam] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [recordsSaved, setRecordsSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate("");
      setPaymentMethod(PAYMENT_METHODS[0].value);
      setError("");
      setDeletingSubscription(null);
      setExpandedSubscriptionId(null);
      setRecordsSaved(false);
    }
  }, [open, student]);

  const endDate = startDate ? addDays(startDate, SUBSCRIPTION_DAYS) : "";

  function openRecordsFor(sub) {
    setExpandedSubscriptionId(sub.id);
    setDraftAttendance(
      sub.attendance?.length
        ? [...sub.attendance]
        : Array(RECORD_SLOTS).fill(false),
    );
    setDraftQuizzes(
      sub.quizzes?.length ? [...sub.quizzes] : Array(RECORD_SLOTS).fill(""),
    );
    setDraftFinalExam(sub.finalExam ?? "");
    setDraftNote(sub.note ?? "");
    setRecordsSaved(false);
  }

  async function handleAdd(e) {
    e.preventDefault();

    if (!startDate) {
      setError("من فضلك اختر تاريخ البداية");
      return;
    }

    try {
      const newSubscriptionId = await onAdd({
        startDate,
        endDate,
        paymentMethod,
      });
      setStartDate("");
      setPaymentMethod(PAYMENT_METHODS[0].value);
      setError("");

      // Immediately open the new month's attendance/grades section so the
      // admin can start recording it without hunting for it in the list.
      if (newSubscriptionId != null) {
        openRecordsFor({
          id: newSubscriptionId,
          attendance: [],
          quizzes: [],
          finalExam: "",
          note: "",
        });
      }
    } catch {
      setError("حدث خطأ أثناء إضافة الاشتراك، حاول مرة أخرى");
    }
  }

  if (!student) return null;

  const subscriptions = student.subscriptions || [];

  function handleSendReceipt(sub) {
    const link = buildReceiptWhatsAppLink({
      studentName: student.name,
      groupName,
      price: student.price,
      startDate: sub.startDate,
      endDate: sub.endDate,
      paymentMethod: sub.paymentMethod,
      parentPhone: student.parentPhone,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  }

  function handleTogglePaid(sub) {
    // Committed immediately (unlike attendance/grades, which are staged in a
    // draft and saved explicitly) since it's a single, self-contained flag.
    onUpdateSubscriptionRecords(sub.id, { paid: !sub.paid });
  }

  function toggleExpandSubscription(sub) {
    if (expandedSubscriptionId === sub.id) {
      setExpandedSubscriptionId(null);
      return;
    }
    openRecordsFor(sub);
  }

  function toggleAttendance(index) {
    setDraftAttendance((prev) =>
      prev.map((present, i) => (i === index ? !present : present)),
    );
    setRecordsSaved(false);
  }

  function updateQuizGrade(index, value) {
    setDraftQuizzes((prev) =>
      prev.map((grade, i) => (i === index ? value : grade)),
    );
    setRecordsSaved(false);
  }

  function handleFinalExamChange(value) {
    setDraftFinalExam(value);
    setRecordsSaved(false);
  }

  function handleNoteChange(value) {
    setDraftNote(value);
    setRecordsSaved(false);
  }

  async function handleSaveRecords() {
    try {
      await onUpdateSubscriptionRecords(expandedSubscriptionId, {
        attendance: draftAttendance,
        quizzes: draftQuizzes,
        finalExam: draftFinalExam,
        note: draftNote,
      });
      setRecordsSaved(true);
    } catch {
      setRecordsSaved(false);
    }
  }

  async function handleSendMonthlyReport(sub) {
    // Persist whatever is currently entered before sending, so the report
    // always reflects what the parent is about to be told.
    try {
      await onUpdateSubscriptionRecords(sub.id, {
        attendance: draftAttendance,
        quizzes: draftQuizzes,
        finalExam: draftFinalExam,
        note: draftNote,
      });
      setRecordsSaved(true);
    } catch {
      setRecordsSaved(false);
    }

    const link = buildMonthlyReportWhatsAppLink({
      studentName: student.name,
      groupName,
      subscriptions: [sub],
      attendance: draftAttendance,
      quizzes: draftQuizzes,
      finalExam: draftFinalExam,
      note: draftNote,
      parentPhone: student.parentPhone,
    });
    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`الحضور - ${student.name}`}
        maxWidth="max-w-lg"
      >
        <div className="scrollbar-thin max-h-[70vh] space-y-6 overflow-y-auto pe-1">
          <form
            onSubmit={handleAdd}
            className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
          >
            <h3 className="text-sm font-bold text-slate-700">
              إضافة اشتراك شهر جديد
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                label="تاريخ البداية"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <DateField
                label="تاريخ الانتهاء"
                value={endDate}
                disabled
                hint="يتم حسابه تلقائيًا بعد 30 يومًا من تاريخ البداية"
              />
            </div>

            <PaymentMethodField
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                <Plus size={14} />
                إضافة
              </button>
            </div>
          </form>

          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              سجل الاشتراكات
            </h3>

            {subscriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <CalendarCheck size={22} className="text-slate-300" />
                <p className="text-sm text-slate-400">
                  لا يوجد اشتراكات مسجلة بعد
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {subscriptions.map((sub) => {
                  const expanded = expandedSubscriptionId === sub.id;
                  return (
                    <li
                      key={sub.id}
                      className="rounded-xl border border-slate-100 p-3 text-sm"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                          <span>
                            <span className="text-slate-400">
                              تاريخ البداية:{" "}
                            </span>
                            {sub.startDate}
                          </span>
                          <span>
                            <span className="text-slate-400">
                              تاريخ الانتهاء:{" "}
                            </span>
                            {sub.endDate}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => toggleExpandSubscription(sub)}
                            aria-expanded={expanded}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50"
                          >
                            <ClipboardCheck size={14} />
                            الحضور والدرجات
                            <ChevronDown
                              size={14}
                              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReceipt(sub)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50"
                          >
                            <WhatsAppIcon size={14} />
                            ايصال
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingSubscription(sub)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                        <span className="text-slate-600">
                          <span className="text-slate-400">طريقة الدفع: </span>
                          {sub.paymentMethod}
                        </span>
                        <PaidToggle
                          paid={sub.paid}
                          onChange={() => handleTogglePaid(sub)}
                        />
                      </div>

                      {!sub.paid && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                          <AlertTriangle size={14} />
                          لم يتم الدفع بعد
                        </div>
                      )}

                      {expanded && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <AttendanceGradesSection
                            attendance={draftAttendance}
                            quizzes={draftQuizzes}
                            finalExam={draftFinalExam}
                            note={draftNote}
                            onToggleAttendance={toggleAttendance}
                            onQuizChange={updateQuizGrade}
                            onFinalExamChange={handleFinalExamChange}
                            onNoteChange={handleNoteChange}
                            onSave={handleSaveRecords}
                            onSendReport={() => handleSendMonthlyReport(sub)}
                            saved={recordsSaved}
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingSubscription)}
        onClose={() => setDeletingSubscription(null)}
        onConfirm={() => onDelete(deletingSubscription.id)}
        title="حذف الاشتراك"
        message="هل أنت متأكد من حذف هذا الاشتراك؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </>
  );
}
