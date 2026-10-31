"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useResumeStore } from "@/lib/resume/store";

const inputClass =
  "bg-[#1a1d28] border border-white/10 text-white rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:border-accent transition-colors";

const invalidInputClass =
  "bg-[#1a1d28] border border-red-500/70 text-white rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:border-red-500 transition-colors";

function isValidUrl(value) {
  if (!value) return true; // empty is OK until filled
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function LinkManager({ sectionId }) {
  const sections = useResumeStore((s) => s.sections);
  const addLink = useResumeStore((s) => s.addLink);
  const updateLink = useResumeStore((s) => s.updateLink);
  const removeLink = useResumeStore((s) => s.removeLink);

  const section = sections.find((s) => s.id === sectionId);
  const links = section?.links ?? [];

  // Track which link URLs have been blurred and found invalid
  const [invalidUrls, setInvalidUrls] = useState({});

  const handleUrlBlur = (linkId, value) => {
    setInvalidUrls((prev) => ({
      ...prev,
      [linkId]: !isValidUrl(value),
    }));
  };

  const handleAdd = () => {
    addLink(sectionId, { label: "Link", url: "" });
  };

  if (!section) {
    return (
      <div className="bg-[#0f1117] p-4 rounded-xl text-zinc-500 text-sm">
        Section not found.
      </div>
    );
  }

  return (
    <div className="bg-[#0f1117] p-4 rounded-xl space-y-3">
      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-3">
        Links
      </h3>

      {links.length === 0 && (
        <p className="text-xs text-zinc-600 italic">No links added yet.</p>
      )}

      <div className="space-y-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-start gap-2 p-2 rounded-lg bg-[#1a1d28] border border-white/5"
          >
            <div className="flex-1 space-y-1.5 min-w-0">
              {/* Label */}
              <input
                type="text"
                className={inputClass}
                value={link.label ?? ""}
                onChange={(e) =>
                  updateLink(sectionId, link.id, { label: e.target.value })
                }
                placeholder="Label"
              />
              {/* URL */}
              <input
                type="text"
                className={
                  invalidUrls[link.id] ? invalidInputClass : inputClass
                }
                value={link.url ?? ""}
                onChange={(e) =>
                  updateLink(sectionId, link.id, { url: e.target.value })
                }
                onBlur={(e) => handleUrlBlur(link.id, e.target.value)}
                placeholder="https://..."
              />
              {invalidUrls[link.id] && (
                <p className="text-xs text-red-400">Invalid URL</p>
              )}
            </div>
            {/* Delete */}
            <button
              onClick={() => removeLink(sectionId, link.id)}
              className="mt-1 p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
              title="Remove link"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors w-full justify-center bg-[#1a1d28]"
      >
        <Plus size={13} />
        Add Link
      </button>
    </div>
  );
}
