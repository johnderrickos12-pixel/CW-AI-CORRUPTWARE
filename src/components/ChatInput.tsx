import { useState, useRef } from "react";
import { Send, Loader2, Paperclip, X, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface FileAttachment {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export const ChatInput = ({ onSend, isLoading, onStop }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input, attachments.map(a => a.file));
      setInput("");
      setAttachments([]);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const attachment: FileAttachment = {
        file,
        type: isImage ? 'image' : 'document',
      };

      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        newAttachments.push(attachment);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-border bg-card/50 backdrop-blur-lg p-4 relative">
      {/* Glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      
      <div className="max-w-4xl mx-auto">
        {/* File attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-background/80 rounded-lg p-2 border border-primary/20"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-20 w-20 object-cover rounded"
                  />
                ) : (
                  <div className="h-20 w-20 flex items-center justify-center">
                    <File className="w-8 h-8 text-primary" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 bg-destructive rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-muted-foreground mt-1 max-w-[80px] truncate">
                  {attachment.file.name}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 items-end">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-[60px] w-[60px] hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... Upload files, code, create, reason, solve..."
            className="min-h-[60px] max-h-[200px] bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
            disabled={isLoading}
          />
          <Button
            type={isLoading && onStop ? "button" : "submit"}
            size="icon"
            className="h-[60px] w-[60px] bg-gradient-to-br from-primary to-secondary hover:opacity-90 hover:scale-105 glow-effect transition-all duration-300"
            disabled={!isLoading && !input.trim() && attachments.length === 0}
            onClick={isLoading && onStop ? onStop : undefined}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Gemini 2.5 Pro • Smarter than GPT-5
        </span>
        <span>Created by Yanna • Press Enter to send</span>
      </div>
    </form>
  );
};
