import { useState } from "react";
import VehicleForm from "../../components/admin/VehicleForm";

export default function VehicleConstructor() {
  const [formKey, setFormKey] = useState(0);

  function handleSaved() {
    // Форма пересоздаётся с чистого листа — можно сразу вносить
    // следующую машину, не перезагружая страницу.
    setTimeout(() => setFormKey((k) => k + 1), 900);
  }

  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-ink mb-1">Добавить машину</h1>
      <p className="font-body text-xs text-mute mb-6">
        После публикации форма очистится — можно сразу добавлять следующую.
      </p>
      <VehicleForm key={formKey} initial={null} onSaved={handleSaved} />
    </div>
  );
}
