import { useEffect, useState } from "react";

// Хэш пароля берётся из .env (VITE_CONSTRUCTOR_PASSWORD_HASH), сам пароль
// в код/сборку не попадает. Сгенерировать хэш: node scripts/hash-password.mjs "пароль"
const PASSWORD_HASH = import.meta.env.VITE_CONSTRUCTOR_PASSWORD_HASH;
const SESSION_KEY = "osnova-constructor-unlocked";

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

  useEffect(() => {
    document.title = "Конструктор — OSNOVA";
  }, []);

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

  return (
    <iframe
      src="/constructor.html"
      title="Конструктор транспорта"
      className="w-full h-screen border-0 block"
    />
  );
}
