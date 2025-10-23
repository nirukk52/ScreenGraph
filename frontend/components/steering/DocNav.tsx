import { FileText, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { Icon } from "./Icon";

interface DocFile {
  filename: string;
  title: string;
}

interface DocCategory {
  name: string;
  files: DocFile[];
}

interface CurrentDoc {
  category: string;
  filename: string;
  content: string;
}

interface DocNavProps {
  categories: DocCategory[];
  currentDoc: CurrentDoc | null;
  onSelectDoc: (category: string, filename: string) => void;
}

export function DocNav({ categories, currentDoc, onSelectDoc }: DocNavProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.name))
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const isCurrentDoc = (category: string, filename: string) => {
    return (
      currentDoc?.category === category && currentDoc?.filename === filename
    );
  };

  return (
    <nav className="w-64 border-r border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Documentation</h2>
      </div>

      <div className="p-2">
        {categories.map((category) => (
          <div key={category.name} className="mb-2">
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
            >
              <Icon
                icon={ChevronRight}
                className={`h-4 w-4 transition-transform ${
                  expandedCategories.has(category.name) ? "rotate-90" : ""
                }`}
              />
              <span className="font-medium capitalize">
                {category.name.replace(/-/g, " ")}
              </span>
            </button>

            {expandedCategories.has(category.name) && (
              <div className="ml-6 mt-1 space-y-1">
                {category.files.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => onSelectDoc(category.name, file.filename)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-left text-sm ${
                      isCurrentDoc(category.name, file.filename)
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Icon icon={FileText} className="h-3.5 w-3.5" />
                    <span className="capitalize">{file.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
