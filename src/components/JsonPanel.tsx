"use client";

import { useState } from "react";
import { parseJsonObject, pretty, type JsonRecord } from "@/lib/format";

export function JsonPanel({
  value,
  onUse,
}: {
  value: JsonRecord;
  onUse: (value: JsonRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="stack">
      <button
        className="btn secondary"
        type="button"
        onClick={() => {
          setText(pretty(value));
          setError("");
          setOpen((current) => !current);
        }}
      >
        {open ? "Hide advanced JSON" : "Advanced JSON"}
      </button>
      {open ? (
        <label className="field">
          <span>Request body</span>
          <textarea value={text} spellCheck={false} onChange={(event) => setText(event.target.value)} />
          {error ? <span className="small" style={{ color: "var(--drop)" }}>{error}</span> : null}
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              try {
                onUse(parseJsonObject(text));
                setError("");
                setOpen(false);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : "That JSON could not be read.");
              }
            }}
          >
            Use this JSON
          </button>
        </label>
      ) : null}
    </div>
  );
}
