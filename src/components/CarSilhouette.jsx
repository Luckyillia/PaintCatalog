// Заглушка вместо реального фото автомобиля.
// Рисует силуэт машины сбоку, залитый переданным цветом.
export default function CarSilhouette({ hex = "#8b95a1", className = "" }) {
  return (
    <svg
      viewBox="0 0 320 140"
      className={className}
      role="img"
      aria-label={`Автомобиль, цвет ${hex}`}
    >
      <ellipse cx="160" cy="122" rx="140" ry="8" fill="#000" opacity="0.35" />
      <path
        d="M28 98
           C 28 78, 46 66, 70 62
           L 100 40
           C 112 32, 128 28, 146 28
           L 200 28
           C 218 28, 232 34, 242 46
           L 262 62
           C 288 66, 300 78, 300 98
           L 300 104
           C 300 110, 296 114, 290 114
           L 40 114
           C 34 114, 28 110, 28 104
           Z"
        fill={hex}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M108 62 L 128 42 C 136 36 146 34 156 34 L 196 34
           C 206 34 214 38 220 46 L 236 62 Z"
        fill="rgba(255,255,255,0.18)"
      />
      <line x1="180" y1="34" x2="180" y2="62" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
      <circle cx="92" cy="112" r="18" fill="#111318" stroke="#050608" strokeWidth="3" />
      <circle cx="92" cy="112" r="7" fill="#3a3f47" />
      <circle cx="248" cy="112" r="18" fill="#111318" stroke="#050608" strokeWidth="3" />
      <circle cx="248" cy="112" r="7" fill="#3a3f47" />
      <rect x="34" y="80" width="10" height="6" rx="2" fill="#fff8dd" opacity="0.85" />
      <rect x="278" y="80" width="10" height="6" rx="2" fill="#b3160f" opacity="0.85" />
    </svg>
  );
}
