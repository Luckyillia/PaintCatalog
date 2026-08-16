import { Link } from "react-router-dom";
import { ExternalLink, ChevronRight } from "lucide-react";
import { getProviderNote } from "../data/credits";

export default function CreditCard({ entry }) {
  const initials = entry.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const hasProviderPage = Boolean(entry.providerId);
  const hasLink = Boolean(entry.link);
  const clickable = hasProviderPage || hasLink;
  const note = getProviderNote(entry);

  const Wrapper = hasProviderPage ? Link : hasLink ? "a" : "div";
  const wrapperProps = hasProviderPage
    ? { to: `/provider/${entry.providerId}` }
    : hasLink
    ? { href: entry.link, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`group relative rounded-lg border border-hair bg-panel p-5 flex items-center gap-4 overflow-hidden transition-colors ${
        clickable
          ? "hover:border-signal/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
          : ""
      }`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-signal/5 to-transparent pointer-events-none" />

      {entry.avatar ? (
        <img
          src={entry.avatar}
          alt={entry.name}
          className="w-14 h-14 rounded-full object-cover border border-hair shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-raised2 border border-hair flex items-center justify-center shrink-0">
          <span className="font-display text-lg tracking-wide text-signal">
            {initials || "?"}
          </span>
        </div>
      )}

      <div className="min-w-0 relative z-10 flex-1">
        <h3 className="font-display text-lg tracking-wide text-ink truncate group-hover:text-signal transition-colors">
          {entry.name}
        </h3>
        <p className="font-mono text-xs text-signal uppercase tracking-[0.1em] mt-0.5">
          {entry.role}
        </p>
        {note && (
          <p className="font-body text-xs text-mute mt-1.5 leading-snug">
            {note}
          </p>
        )}
      </div>

      {hasProviderPage ? (
        <ChevronRight
          size={18}
          strokeWidth={1.75}
          className="text-mute group-hover:text-signal transition-colors shrink-0 relative z-10"
        />
      ) : hasLink ? (
        <ExternalLink
          size={16}
          strokeWidth={1.75}
          className="text-mute group-hover:text-signal transition-colors shrink-0 relative z-10"
        />
      ) : null}
    </Wrapper>
  );
}
