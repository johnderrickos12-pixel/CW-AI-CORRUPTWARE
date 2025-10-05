import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSend, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput("");
    }
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
      
      <div className="max-w-4xl mx-auto flex gap-3 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything... Code, create, reason, solve..."
          className="min-h-[60px] max-h-[200px] bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none transition-all"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-[60px] w-[60px] bg-gradient-to-br from-primary to-secondary hover:opacity-90 hover:scale-105 glow-effect transition-all duration-300"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Status indicator */}
      <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connected to Gemini 2.5 Flash
        </span>
        <span>Press Enter to send • Shift+Enter for new line</span>
      </div>
    </form>
  );
};
