import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocViewerProps {
  content: string;
}

export function DocViewer({ content }: DocViewerProps) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="prose prose-invert prose-slate max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }: { children: React.ReactNode }) => (
              <h1 className="text-4xl font-bold mb-6 mt-8 border-b border-border pb-2">
                {children}
              </h1>
            ),
            h2: ({ children }: { children: React.ReactNode }) => (
              <h2 className="text-3xl font-semibold mb-4 mt-8">{children}</h2>
            ),
            h3: ({ children }: { children: React.ReactNode }) => (
              <h3 className="text-2xl font-semibold mb-3 mt-6">{children}</h3>
            ),
            h4: ({ children }: { children: React.ReactNode }) => (
              <h4 className="text-xl font-semibold mb-2 mt-4">{children}</h4>
            ),
            p: ({ children }: { children: React.ReactNode }) => (
              <p className="text-base leading-7 mb-4">{children}</p>
            ),
            ul: ({ children }: { children: React.ReactNode }) => (
              <ul className="list-disc list-inside mb-4 space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }: { children: React.ReactNode }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2">
                {children}
              </ol>
            ),
            li: ({ children }: { children: React.ReactNode }) => (
              <li className="text-base leading-7">{children}</li>
            ),
            code: ({ className, children }: { className?: string; children: React.ReactNode }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono mb-4">
                  {children}
                </code>
              );
            },
            pre: ({ children }: { children: React.ReactNode }) => <>{children}</>,
            blockquote: ({ children }: { children: React.ReactNode }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                {children}
              </blockquote>
            ),
            a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
              <a
                href={href}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            table: ({ children }: { children: React.ReactNode }) => (
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-border">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }: { children: React.ReactNode }) => (
              <thead className="bg-muted">{children}</thead>
            ),
            tbody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
            tr: ({ children }: { children: React.ReactNode }) => (
              <tr className="border-b border-border">{children}</tr>
            ),
            th: ({ children }: { children: React.ReactNode }) => (
              <th className="px-4 py-2 text-left font-semibold">
                {children}
              </th>
            ),
            td: ({ children }: { children: React.ReactNode }) => <td className="px-4 py-2">{children}</td>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
