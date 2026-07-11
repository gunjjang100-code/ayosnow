"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface SelectQuoteButtonProps {
  quoteId: string;
  label: string;
  pendingLabel: string;
  successLabel: string;
  errorLabel: string;
  rejectLabel: string;
  rejectPendingLabel: string;
  rejectSuccessLabel: string;
  rejectErrorLabel: string;
  rejectConfirmLabel: string;
  selectConfirmLabel: string;
}

export function SelectQuoteButton({
  quoteId,
  label,
  pendingLabel,
  successLabel,
  errorLabel,
  rejectLabel,
  rejectPendingLabel,
  rejectSuccessLabel,
  rejectErrorLabel,
  rejectConfirmLabel,
  selectConfirmLabel,
}: SelectQuoteButtonProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"select" | "reject" | null>(null);

  function handleSelect() {
    setFeedback(null);

    const accepted = window.confirm(selectConfirmLabel);
    if (!accepted) {
      return;
    }

    setPendingAction("select");

    startTransition(async () => {
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

      setPendingAction(null);

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

  function handleReject() {
    setFeedback(null);

    const accepted = window.confirm(rejectConfirmLabel);
    if (!accepted) {
      return;
    }

    setPendingAction("reject");

    startTransition(async () => {
      const response = await fetch("/api/quotes/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { quoteId?: string; status?: string; error?: string }
        | null;

      setPendingAction(null);

      if (!response.ok || !result?.quoteId) {
        setFeedback(result?.error ?? rejectErrorLabel);
        return;
      }

      setFeedback(rejectSuccessLabel);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-2 md:w-auto md:items-end">
      <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto">
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="mobile-secondary-button w-full md:w-auto"
        >
          {pendingAction === "reject" ? rejectPendingLabel : rejectLabel}
        </button>
        <button
          type="button"
          onClick={handleSelect}
          disabled={isPending}
          className="mobile-primary-button w-full md:w-auto"
        >
          {pendingAction === "select" ? pendingLabel : label}
        </button>
      </div>
      {feedback ? <p className="text-xs text-teal-700">{feedback}</p> : null}
    </div>
  );
}
