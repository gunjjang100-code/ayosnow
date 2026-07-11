import Link from "next/link";

interface RoleAccessNoticeProps {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

export function RoleAccessNotice({
  title,
  description,
  actionHref,
  actionLabel,
}: RoleAccessNoticeProps) {
  return (
    <article className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-950">
      <p className="text-base font-bold text-amber-900">{title}</p>
      <p className="mt-3 text-sm leading-7 text-amber-800">{description}</p>
      <Link
        href={actionHref}
        className="mt-4 inline-flex items-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
