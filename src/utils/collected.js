/** Most recent subscription by start date (falls back to array order when
 * dates are missing/equal). Mirrors the paid indicator in StudentTable. */
function getLatestSubscription(student) {
  const subscriptions = student.subscriptions || [];
  if (subscriptions.length === 0) return null;
  return [...subscriptions].sort((a, b) =>
    (b.startDate || "").localeCompare(a.startDate || ""),
  )[0];
}

/** Sum of `price` for students whose latest subscription is marked paid. */
export function getTotalCollected(students) {
  return students.reduce((sum, student) => {
    const latest = getLatestSubscription(student);
    return latest?.paid ? sum + Number(student.price || 0) : sum;
  }, 0);
}
