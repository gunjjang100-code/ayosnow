import type { ProfessionalBadgeSummary } from "@/lib/types";

interface ProfessionalBadgesProps {
  badges?: ProfessionalBadgeSummary[];
  compact?: boolean;
}

const toneClassName: Record<ProfessionalBadgeSummary["tone"], string> = {
  verified: "border-teal-200 bg-teal-50 text-teal-800",
  top: "border-amber-200 bg-amber-50 text-amber-800",
};

const iconByTone: Record<ProfessionalBadgeSummary["tone"], string> = {
  verified: "✓",
  top: "★",
};

export function ProfessionalBadges({
  badges = [],
  compact = false,
}: ProfessionalBadgesProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Professional badges">
      {badges.map((badge) => (
        <span
          key={badge.code}
          title={badge.description}
          className={`inline-flex items-center gap-1.5 rounded-full border font-black shadow-sm ${
            compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
          } ${toneClassName[badge.tone]}`}
        >
          <span aria-hidden="true">{iconByTone[badge.tone]}</span>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
