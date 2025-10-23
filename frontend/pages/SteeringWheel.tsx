import React, { useState, useEffect } from "react";
import { DocNav } from "../components/steering/DocNav";
import { DocViewer } from "../components/steering/DocViewer";
import { DocEditor } from "../components/steering/DocEditor";
import backend from "~backend/client";

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

export function SteeringWheel() {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [currentDoc, setCurrentDoc] = useState<CurrentDoc | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const response = await backend.steering.listDocs();
      setCategories(response.categories);

      if (
        response.categories.length > 0 &&
        response.categories[0].files.length > 0
      ) {
        const firstCategory = response.categories[0];
        const firstFile = firstCategory.files[0];
        await loadDoc(firstCategory.name, firstFile.filename);
      }
    } catch (error) {
      console.error("Failed to load docs:", error);
      alert("Failed to load documentation files");
    }
  };

  const loadDoc = async (category: string, filename: string) => {
    setIsLoading(true);
    try {
      const response = await backend.steering.getDoc({ category, filename });
      setCurrentDoc(response);
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to load doc:", error);
      alert("Failed to load document");
    } finally {
      setIsLoading(false);
    }
  };

  const saveDoc = async (content: string) => {
    if (!currentDoc) return;

    setIsSaving(true);
    try {
      await backend.steering.updateDoc({
        category: currentDoc.category,
        filename: currentDoc.filename,
        content,
      });

      setCurrentDoc({ ...currentDoc, content });
      setIsEditMode(false);
      alert("Document saved successfully");
    } catch (error) {
      console.error("Failed to save doc:", error);
      alert("Failed to save document");
    } finally{
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        <DocNav
          categories={categories}
          currentDoc={currentDoc}
          onSelectDoc={loadDoc}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b border-border bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Steering Wheel</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Living documentation for ScreenGraph
                </p>
              </div>

              {currentDoc && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    disabled={isSaving}
                  >
                    {isEditMode ? "View" : "Edit"}
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            )}

            {!isLoading && !currentDoc && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a document to view
                </p>
              </div>
            )}

            {!isLoading && currentDoc && (
              <>
                {isEditMode ? (
                  <DocEditor
                    content={currentDoc.content}
                    onSave={saveDoc}
                    isSaving={isSaving}
                  />
                ) : (
                  <DocViewer content={currentDoc.content} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
