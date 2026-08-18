"use client";

import { useActionState, useEffect } from "react";
import { resendActivationEmail } from "@/lib/adminActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import type { FormState } from "@/lib/actions";

const initialState: FormState = {};

/**
 * Its own component purely so the action-state hook has somewhere to live — the
 * button is rendered inside a `.map()` over applications, where a hook can't go.
 * Mirrors `ApproveApplicationForm`, which sits next to it in the same row.
 *
 * The point of it is the feedback: sending an email is invisible by definition,
 * so a button that silently re-renders the same list gives the admin no way to
 * tell a sent mail from a dead click, and the honest response to that is to
 * press it again. Every branch of the action now returns a message.
 */
export function ResendActivationButton({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(
    resendActivationEmail.bind(null, applicationId),
    initialState,
  );
  const showResult = useToastResult();

  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="border border-stone-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending…" : "Resend activation email"}
      </button>
    </form>
  );
}
