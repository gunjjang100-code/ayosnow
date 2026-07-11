"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface BookingChatButtonProps {
  bookingId: string;
  label: string;
  pendingLabel: string;
  errorLabel: string;
}

export function BookingChatButton({
  bookingId,
  label,
  pendingLabel,
  errorLabel,
}: BookingChatButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/conversations/from-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { conversationId?: string; error?: string }
        | null;

      if (!response.ok || !result?.conversationId) {
        setFeedback(result?.error ?? errorLabel);
        return;
      }

      router.push(`/chat?conversationId=${result.conversationId}`);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? pendingLabel : label}
      </button>
      {feedback ? <p className="text-xs text-rose-600">{feedback}</p> : null}
    </div>
  );
}
