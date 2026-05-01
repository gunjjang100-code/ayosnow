"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface SelectQuoteButtonProps {
  quoteId: string;
  label: string;
  pendingLabel: string;
  successLabel: string;
  errorLabel: string;
  demoConversationId?: string;
}

export function SelectQuoteButton({
  quoteId,
  label,
  pendingLabel,
  successLabel,
  errorLabel,
  demoConversationId,
}: SelectQuoteButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect() {
    setFeedback(null);

    startTransition(async () => {
      // 데모 견적은 실제 DB 예약을 만들 수 없을 수 있다.
      // 이때는 "선택 후 작업 채팅으로 들어가는 흐름"만 먼저 확인할 수 있게
      // 준비된 데모 채팅방으로 바로 이동시킨다.
      if (demoConversationId) {
        setFeedback(successLabel);
        router.push(`/chat?conversationId=${demoConversationId}`);
        router.refresh();
        return;
      }

      const response = await fetch("/api/quotes/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { bookingId?: string; conversationId?: string; error?: string }
        | null;

      if (!response.ok || !result?.bookingId || !result?.conversationId) {
        setFeedback(result?.error ?? errorLabel);
        return;
      }

      setFeedback(successLabel);
      // 견적 선택이 끝나면 실제 예약과 실제 채팅방이 함께 준비된다.
      // 그래서 사용자는 바로 작업 채팅으로 이동해 다음 대화를 이어갈 수 있다.
      router.push(`/chat?conversationId=${result.conversationId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSelect}
        disabled={isPending}
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isPending ? pendingLabel : label}
      </button>
      {feedback ? <p className="text-xs text-teal-700">{feedback}</p> : null}
    </div>
  );
}
