import { useEffect, useRef, useState } from "react";

// Портирован 1:1 по логике из старого src/constructor/constructor-source.html
// (canvas + перетаскивание рамки), но как обычный React-компонент —
// без window.parent/postMessage и без чистого DOM-манипулирования.

const OUTPUT_SIZES = {
  "4:3": { w: 800, h: 600 },
  "16:9": { w: 800, h: 450 },
  "1:1": { w: 700, h: 700 },
};

const MAX_W = 760;
const MAX_H = 480;
const HANDLE_SIZE = 14;

const RATIO_OPTIONS = [
  { value: "4:3", label: "Карточка машины / категории (4:3)" },
  { value: "16:9", label: "Фото в игре, деталь (16:9)" },
  { value: "1:1", label: "Квадрат (1:1)" },
  { value: "free", label: "Свободно, без ограничений" },
];

function ratioNumber(r) {
  if (r === "free") return null;
  const [w, h] = r.split(":").map(Number);
  return w / h;
}

export default function ImageCropperModal({ file, defaultRatio = "4:3", onConfirm, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const scaleRef = useRef(1);
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [ready, setReady] = useState(false);

  function clampBox() {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    box.w = Math.min(box.w, canvas.width);
    box.h = Math.min(box.h, canvas.height);
    box.x = Math.max(0, Math.min(box.x, canvas.width - box.w));
    box.y = Math.max(0, Math.min(box.y, canvas.height - box.h));
  }

  function initBox() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = ratioNumber(ratio);
    let w, h;
    if (r) {
      if (canvas.width / canvas.height > r) {
        h = canvas.height * 0.85;
        w = h * r;
      } else {
        w = canvas.width * 0.85;
        h = w / r;
      }
    } else {
      w = canvas.width * 0.85;
      h = canvas.height * 0.85;
    }
    boxRef.current = { x: (canvas.width - w) / 2, y: (canvas.height - h) / 2, w, h };
    clampBox();
  }

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const box = boxRef.current;
    if (!canvas || !img || !box) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(6,8,10,0.6)";
    ctx.fillRect(0, 0, canvas.width, box.y);
    ctx.fillRect(0, box.y + box.h, canvas.width, canvas.height - box.y - box.h);
    ctx.fillRect(0, box.y, box.x, box.h);
    ctx.fillRect(box.x + box.w, box.y, canvas.width - box.x - box.w, box.h);
    ctx.strokeStyle = "#39c98f";
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = "#39c98f";
    ctx.fillRect(box.x + box.w - HANDLE_SIZE / 2, box.y + box.h - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }

  useEffect(() => {
    if (!file) return;
    setReady(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = new Image();
      image.onload = () => {
        imgRef.current = image;
        const scale = Math.min(MAX_W / image.width, MAX_H / image.height, 1);
        scaleRef.current = scale;
        const canvas = canvasRef.current;
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        initBox();
        setReady(true);
      };
      image.src = e.target.result;
    };
    reader.readAsDataURL(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (ready) draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    initBox();
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  function pointerPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function onHandle(pos) {
    const box = boxRef.current;
    return (
      pos.x >= box.x + box.w - HANDLE_SIZE &&
      pos.x <= box.x + box.w + HANDLE_SIZE &&
      pos.y >= box.y + box.h - HANDLE_SIZE &&
      pos.y <= box.y + box.h + HANDLE_SIZE
    );
  }
  function inside(pos) {
    const box = boxRef.current;
    return pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h;
  }

  function handlePointerDown(e) {
    if (!ready) return;
    const pos = pointerPos(e);
    let mode = null;
    if (onHandle(pos)) mode = "resize";
    else if (inside(pos)) mode = "move";
    if (!mode) return;
    dragRef.current = { mode, start: pos, box: { ...boxRef.current } };
    e.target.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag || !ready) return;
    const pos = pointerPos(e);
    const dx = pos.x - drag.start.x;
    const dy = pos.y - drag.start.y;
    const canvas = canvasRef.current;
    if (drag.mode === "move") {
      boxRef.current = { ...drag.box, x: drag.box.x + dx, y: drag.box.y + dy };
      clampBox();
    } else {
      const r = ratioNumber(ratio);
      let newW = Math.max(24, drag.box.w + dx);
      let newH = r ? newW / r : Math.max(24, drag.box.h + dy);
      newW = Math.min(newW, canvas.width - boxRef.current.x);
      newH = Math.min(newH, canvas.height - boxRef.current.y);
      if (r && newW / r > canvas.height - boxRef.current.y) {
        newH = canvas.height - boxRef.current.y;
        newW = newH * r;
      }
      boxRef.current = { ...boxRef.current, w: newW, h: newH };
    }
    draw();
    e.preventDefault();
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleConfirm() {
    const img = imgRef.current;
    const box = boxRef.current;
    const scale = scaleRef.current;
    const sx = box.x / scale;
    const sy = box.y / scale;
    const sw = box.w / scale;
    const sh = box.h / scale;
    const out = OUTPUT_SIZES[ratio] || { w: Math.round(sw), h: Math.round(sh) };
    const outCanvas = document.createElement("canvas");
    outCanvas.width = out.w;
    outCanvas.height = out.h;
    const ctx = outCanvas.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out.w, out.h);
    outCanvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        onConfirm(blob, url);
      },
      "image/jpeg",
      0.9
    );
  }

  if (!file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-3xl bg-panel border border-hair rounded-lg p-5">
        <div className="mb-3">
          <label className="font-body text-xs uppercase tracking-[0.1em] text-mute mb-1 block">
            Формат под сайт
          </label>
          <select
            value={ratio}
            onChange={(e) => setRatio(e.target.value)}
            className="bg-raised border border-hair rounded px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-signal/50"
          >
            {RATIO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex justify-center border border-hair rounded-md p-3 overflow-auto"
          style={{
            background: "repeating-conic-gradient(#20252b 0% 25%, #191d23 0% 50%) 50%/20px 20px",
            maxHeight: "60vh",
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: "move", maxWidth: "100%", display: "block", touchAction: "none" }}
          />
        </div>

        <p className="font-body text-xs text-mute mt-3">
          Тяни рамку за середину — двигаешь. Тяни за квадратик в правом нижнем углу — меняешь
          размер (пропорции держатся, если формат не «Свободно»).
        </p>

        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-hair bg-raised text-ink font-body text-sm px-4 py-2 hover:border-mute transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!ready}
            className="rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold px-4 py-2 hover:bg-signal-bright transition-colors disabled:opacity-50"
          >
            Применить обрезку
          </button>
        </div>
      </div>
    </div>
  );
}
