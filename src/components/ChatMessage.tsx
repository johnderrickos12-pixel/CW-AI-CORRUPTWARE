import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Bot, Copy, RotateCcw, Check, FileText, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
  onRegenerate?: () => void;
}

export const ChatMessage = ({ role, content, attachments, onRegenerate }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Message content copied successfully",
    });
  };

  return (
    <div className={`group flex gap-4 p-6 ${role === "assistant" ? "bg-card/20" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        role === "assistant" 
          ? "bg-gradient-to-br from-primary to-secondary glow-effect" 
          : "bg-muted"
      }`}>
        {role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {/* File attachments */}
        {attachments && attachments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {attachments.map((file, index) => (
              <div key={index} className="bg-background/60 rounded-lg p-3 border border-primary/20">
                {file.type.startsWith('image/') ? (
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-w-xs max-h-48 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </a>
                ) : (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">{file.name}</span>
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <ReactMarkdown
          components={{
            code(props) {
              const { children, className } = props;
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-muted px-2 py-1 rounded text-primary font-mono text-sm">
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-7 px-2 text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          {role === "assistant" && onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRegenerate}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
