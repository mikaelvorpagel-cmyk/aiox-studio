import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";

interface Props {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: Props) {
  return (
    <div className={`prose-chat ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Open external links in new tab
        a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        ),
        // Code blocks — distinguish inline vs block via absence of className
        code: ({ className: cls, children, ...props }: ComponentPropsWithoutRef<"code">) => {
          const isBlock = !!cls?.startsWith("language-");
          const lang = cls?.replace("language-", "") ?? "";
          if (isBlock) {
            return (
              <pre>
                {lang && (
                  <div style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "8px",
                    fontFamily: "var(--font-geist-mono, monospace)",
                  }}>
                    {lang}
                  </div>
                )}
                <code className={cls} {...props}>{children}</code>
              </pre>
            );
          }
          return <code {...props}>{children}</code>;
        },
        // Remove default pre wrapper — handled inside code above
        pre: ({ children }: ComponentPropsWithoutRef<"pre">) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
