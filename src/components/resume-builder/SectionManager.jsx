'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useResumeStore } from '@/lib/resume/store';
import SectionListItem from './SectionListItem';
import AddSectionModal from './AddSectionModal';

export default function SectionManager() {
  const sections = useResumeStore((s) => s.sections);
  const addSection = useResumeStore((s) => s.addSection);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const activeSectionId = useResumeStore((s) => s.activeSectionId);
  const setActiveSectionId = useResumeStore((s) => s.setActiveSectionId);
  const deleteSection = useResumeStore((s) => s.deleteSection);
  const renameSection = useResumeStore((s) => s.renameSection);
  const toggleSectionVisibility = useResumeStore((s) => s.toggleSectionVisibility);

  const [newSectionTitle, setNewSectionTitle] = useState('');

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sortedSections.findIndex((s) => s.id === active.id);
    const toIndex = sortedSections.findIndex((s) => s.id === over.id);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSections(fromIndex, toIndex);
    }
  }

  function handleAddSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    addSection(title);
    setNewSectionTitle('');
  }

  function handleInputKeyDown(e) {
    if (e.key === 'Enter') handleAddSection();
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">Sections</h2>
          <p className="text-[11px] text-zinc-400">Click a section to edit its content</p>
        </div>
        <span className="text-xs text-zinc-500 font-mono tabular-nums">
          {sections.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {sortedSections.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center mt-6 px-4">
            No sections yet. Add one below.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedSections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedSections.map((section) => (
                <SectionListItem
                  key={section.id}
                  section={section}
                  isActive={activeSectionId === section.id}
                  onSelect={(id) => setActiveSectionId(id)}
                  onDelete={(id) => deleteSection(id)}
                  onRename={(id, title) => renameSection(id, title)}
                  onToggleVisibility={(id) => toggleSectionVisibility(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Section</span>
        </button>
      </div>

      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
