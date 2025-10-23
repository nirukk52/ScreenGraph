import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Icon } from "./Icon";

interface DocEditorProps {
  content: string;
  onSave: (content: string) => void;
  isSaving: boolean;
}

export function DocEditor({ content, onSave, isSaving }: DocEditorProps) {
  const [editedContent, setEditedContent] = useState(content);

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleSave = () => {
    onSave(editedContent);
  };

  const hasChanges = editedContent !== content;

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {hasChanges ? "Unsaved changes" : "No changes"}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Icon icon={Save} className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent((e.target as HTMLTextAreaElement).value)}
          className="w-full h-full p-8 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
          placeholder="Write your documentation here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
