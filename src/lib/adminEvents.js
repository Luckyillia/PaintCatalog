// Событие «очередь репортов изменилась» — по нему AdminLayout обновляет
// счётчик новых репортов в меню.
export const REPORTS_CHANGED_EVENT = "osnova-reports-changed";

export function notifyReportsChanged() {
  window.dispatchEvent(new Event(REPORTS_CHANGED_EVENT));
}
