import { useEffect, useRef, useState } from "react";

// Хэш пароля берётся из .env (VITE_CONSTRUCTOR_PASSWORD_HASH), сам пароль
// в код/сборку не попадает. Сгенерировать хэш: node scripts/hash-password.mjs "пароль"
const PASSWORD_HASH = import.meta.env.VITE_CONSTRUCTOR_PASSWORD_HASH;
const SESSION_KEY = "osnova-constructor-unlocked";

// Настройки Supabase/Cloudinary для самого конструктора (не для
// scripts/pull-vehicles.mjs — там свои, серверные переменные без
// префикса VITE_). Эти значения и так не секретные — anon-ключ
// Supabase умеет только INSERT (RLS), Cloudinary-пресет — только
// upload, так что их наличие в собранном JS не проблема.
const CONSTRUCTOR_CONFIG = {
  type: "osnova-constructor-config",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  cloudinaryCloud: import.meta.env.VITE_CLOUDINARY_CLOUD || "",
  cloudinaryPreset: import.meta.env.VITE_CLOUDINARY_PRESET || "",
};

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Constructor() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [html, setHtml] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    document.title = "Конструктор — OSNOVA";
  }, []);

  // Сам HTML/JS конструктора грузится отдельным JS-чанком и запрашивается
  // у сервера ТОЛЬКО после успешного пароля (import() ниже вызывается
  // не раньше unlocked === true). Пока пароль не введён верно, браузер
  // физически не скачивает код конструктора — в отличие от старого
  // варианта public/constructor.html, который был статикой и открывался
  // прямым URL в обход пароля.
  useEffect(() => {
    if (!unlocked || html) return;
    let cancelled = false;
    import("../constructor/constructor-source.html?raw").then((mod) => {
      if (!cancelled) setHtml(mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, html]);

  // Как только iframe с конструктором даёт знать, что готов слушать
  // (см. src/constructor/constructor-source.html), отправляем ему
  // настройки из .env.
  useEffect(() => {
    if (!unlocked || !html) return;
    function handleMessage(event) {
      if (event.data?.type === "osnova-constructor-ready") {
        iframeRef.current?.contentWindow?.postMessage(CONSTRUCTOR_CONFIG, "*");
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [unlocked, html]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!PASSWORD_HASH) {
      setError(
        "Пароль не настроен: добавь VITE_CONSTRUCTOR_PASSWORD_HASH в .env"
      );
      return;
    }

    setChecking(true);
    setError("");
    const hash = await sha256Hex(password);
    setChecking(false);

    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError("Неверный пароль");
      setPassword("");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base px-5">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm border border-hair bg-panel rounded-lg p-6"
        >
          <h1 className="font-display text-xl tracking-wide text-ink mb-1">
            Конструктор транспорта
          </h1>
          <p className="font-body text-xs text-mute mb-5">
            Доступ только по паролю.
          </p>

          <label
            htmlFor="constructor-password"
            className="font-body text-xs uppercase tracking-[0.15em] text-mute mb-2 block"
          >
            Пароль
          </label>
          <input
            id="constructor-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-raised border border-hair rounded-md px-3 py-2.5 font-body text-sm text-ink focus:outline-none focus:border-signal/50 transition-colors mb-3"
          />

          {error && (
            <p className="font-body text-xs text-amber mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={checking || !password}
            className="w-full rounded-md bg-signal text-[#06120d] font-body text-sm font-semibold py-2.5 hover:bg-signal-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? "Проверяю..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  if (!html) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <p className="font-body text-sm text-mute">Загружаю конструктор...</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Конструктор транспорта"
      className="w-full h-screen border-0 block"
    />
  );
}
