"use client";

import { useState, useRef, useEffect } from "react";
import { GripVertical, Eye, EyeOff, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useModal } from "@/lib/modal-context";

export default function SectionListItem({
  section,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onToggleVisibility,
}) {
  const modal = useModal();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(section.title ?? "");
  const inputRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== section.title) {
      onRename(section.id, trimmed);
    } else {
      setDraftName(section.title ?? "");
    }
    setIsEditing(false);
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setDraftName(section.title ?? "");
    setIsEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") {
      setDraftName(section.title ?? "");
      setIsEditing(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const ok = await modal.confirm({
      title: 'Delete Section?',
      message: `Delete section "${section.title}"? This cannot be undone.`,
      confirmText: 'Delete Section',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (ok) {
      onDelete(section.id);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleVisibility(section.id);
  };

  const isHidden = section.visible === false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => !isEditing && onSelect?.(section.id)}
      className={`
        group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer
        border transition-all select-none
        ${
          isActive
            ? "bg-white/[0.08] border-accent/50"
            : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/10"
        }
      `}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing transition-colors touch-none"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        title="Drag to reorder"
      >
        <GripVertical size={15} />
      </button>

      <div className="flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input
            ref={inputRef}
            className="bg-[#1a1d28] border border-accent/50 text-white rounded px-1.5 py-0.5 text-sm w-full focus:outline-none focus:border-accent"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`text-sm truncate block transition-colors ${
              isHidden
                ? "text-zinc-500 line-through"
                : isActive
                ? "text-white"
                : "text-zinc-300"
            }`}
            title={`${section.title}${isHidden ? " (hidden)" : ""}`}
          >
            {section.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleToggle}
          className={`p-1 rounded transition-colors ${
            isHidden
              ? "text-zinc-600 hover:text-zinc-300"
              : "text-zinc-400 hover:text-white"
          }`}
          title={isHidden ? "Show section" : "Hide section"}
        >
          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>

        <button
          onClick={handleDelete}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Delete section"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
