import { Bot, Code, Sparkles } from "lucide-react";

export const AboutFooter = () => {
  return (
    <div className="border-t border-border bg-card/20 backdrop-blur-lg p-6 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* About */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-foreground">Corrupt-Ware-AI</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              The most advanced AI assistant ever created. Infinite conversations, unlimited capabilities, zero restrictions.
            </p>
          </div>

          {/* Technology */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Code className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-foreground">Technology</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Powered by Gemini 2.5 Pro</li>
              <li>• Smarter than GPT-5 & Claude</li>
              <li>• Real-time streaming responses</li>
              <li>• Infinite context memory</li>
            </ul>
          </div>

          {/* Credits */}
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-foreground">Created By</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              This entire project was developed by{" "}
              <span className="text-primary font-semibold gradient-text">Yanna</span>
            </p>
            <p className="text-xs text-muted-foreground/70">
              © 2025 Yanna. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
