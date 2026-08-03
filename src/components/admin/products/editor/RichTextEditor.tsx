"use client";

import { useRef } from "react";

const COMMANDS: { label: string; command: string; arg?: string }[] = [
  { label: "B", command: "bold" },
  { label: "I", command: "italic" },
  { label: "U", command: "underline" },
  { label: "H2", command: "formatBlock", arg: "h2" },
  { label: "P", command: "formatBlock", arg: "p" },
  { label: "• List", command: "insertUnorderedList" },
  { label: "1. List", command: "insertOrderedList" },
  { label: "Link", command: "createLink" },
];

/** Only shown when `allowImages` is set (long-form journal articles, not product
 * descriptions) — inserts by URL rather than a full upload flow, kept deliberately
 * simple like the rest of this editor. Paired with `sanitizeJournalBody`'s `img`
 * allowlist entry, not `sanitizeProductDescription`'s. */
const IMAGE_COMMAND: { label: string; command: string; arg?: string } = { label: "Image", command: "insertImage" };

/**
 * Minimal contentEditable rich text editor — no editor dependency (tiptap/
 * draft-js etc), just document.execCommand + a hidden input synced on every
 * change so the surrounding <form> picks up the HTML on submit like any other
 * field. Deliberately basic (bold/italic/underline/headings/lists/links) —
 * enough for wholesale product copy, not a general-purpose CMS editor.
 */
export function RichTextEditor({
  name,
  label,
  defaultValue,
  disabled,
  allowImages = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled?: boolean;
  allowImages?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const commands = allowImages ? [...COMMANDS, IMAGE_COMMAND] : COMMANDS;

  function sync() {
    if (editorRef.current && hiddenRef.current) hiddenRef.current.value = editorRef.current.innerHTML;
  }

  function exec(command: string, arg?: string) {
    if (disabled) return;
    editorRef.current?.focus();
    if (command === "createLink") {
      const url = window.prompt("Link URL");
      if (!url) return;
      document.execCommand(command, false, url);
    } else if (command === "insertImage") {
      const url = window.prompt("Image URL");
      if (!url) return;
      document.execCommand(command, false, url);
    } else {
      document.execCommand(command, false, arg);
    }
    sync();
  }

  return (
    <div className="border border-stone-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-stone-300 bg-stone-100 p-1.5">
        {commands.map((c) => (
          <button
            key={c.label}
            type="button"
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(c.command, c.arg)}
            className="min-w-[28px] border border-transparent px-2 py-1 text-xs font-semibold text-ink hover:border-stone-300 hover:bg-white disabled:opacity-40"
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        onInput={sync}
        onBlur={sync}
        dangerouslySetInnerHTML={{ __html: defaultValue || "<p></p>" }}
        className="prose min-h-[160px] max-w-none px-3 py-2 text-sm text-ink outline-none [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-signal [&_a]:underline"
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
