import { useState } from "react";
import { Flag, Plus } from "lucide-react";
import ReportDialog from "./ReportDialog";

// Кнопка + окно отправки репорта. kind: "color_error" | "new_vehicle".
export default function ReportButton({ kind, vehicle, color, label, className = "" }) {
  const [open, setOpen] = useState(false);
  const Icon = kind === "new_vehicle" ? Plus : Flag;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 rounded-md border border-hair bg-raised px-3 py-2 font-body text-xs text-mute hover:border-signal/50 hover:text-signal transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2 ${className}`}
      >
        <Icon size={13} />
        {label}
      </button>
      {open && <ReportDialog kind={kind} vehicle={vehicle} color={color} onClose={() => setOpen(false)} />}
    </>
  );
}
