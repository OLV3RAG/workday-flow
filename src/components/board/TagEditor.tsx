"use client";

import { useState, type KeyboardEvent } from "react";
import { SUGGESTED_TAGS, normalizeTags } from "@/lib/tags";
import { fieldClass, tinyButtonClass } from "@/lib/ui";

type TagEditorProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
};

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const next = normalizeTags([...tags, ...raw.split(",")]);
    onChange(next);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (draft.trim()) add(draft);
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={tinyButtonClass}
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            aria-label={`Quitar etiqueta ${tag}`}
          >
            {tag} ×
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={fieldClass}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Etiqueta y Enter"
          aria-label="Nueva etiqueta"
          maxLength={32}
        />
        <button
          type="button"
          className={tinyButtonClass}
          onClick={() => {
            if (draft.trim()) add(draft);
          }}
        >
          Añadir
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTED_TAGS.filter((tag) => !tags.some((item) => item.toLowerCase() === tag.toLowerCase())).map(
          (tag) => (
            <button key={tag} type="button" className={tinyButtonClass} onClick={() => add(tag)}>
              + {tag}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
