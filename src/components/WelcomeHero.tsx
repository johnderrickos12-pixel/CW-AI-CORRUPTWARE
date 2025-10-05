import { Bot, Code, Brain, Zap, Sparkles, FileCode } from "lucide-react";
import heroImage from "@/assets/hero-ai.jpg";

const capabilities = [
  {
    icon: Code,
    title: "Code Master",
    description: "Write, debug, and optimize code in any language",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Brain,
    title: "Deep Reasoning",
    description: "Solve complex problems with advanced logic",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Creative Genius",
    description: "Generate ideas, content, and solutions",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: FileCode,
    title: "Multi-Modal",
    description: "Understand text, code, and context deeply",
    color: "from-green-500 to-emerald-500",
  },
];

const examplePrompts = [
  "Build a full-stack web app with authentication",
  "Explain quantum computing like I'm 5",
  "Debug this Python code and optimize it",
  "Create a business plan for a startup",
  "Write a complex SQL query with joins",
  "Design a REST API architecture",
];

export const WelcomeHero = () => {
  return (
    <div className="relative h-full flex items-center justify-center overflow-hidden">
      {/* Hero Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-16 text-center space-y-12">
        {/* Main Hero */}
        <div className="space-y-6 animate-fade-up">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-accent glow-effect-lg animate-pulse-glow">
            <Bot className="w-12 h-12" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="gradient-text">Corrupt-Ware-AI</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-foreground/80 font-light max-w-3xl mx-auto">
            The <span className="text-primary font-semibold">Infinite</span>, <span className="text-secondary font-semibold">Free</span>, <span className="text-accent font-semibold">All-Knowing</span> Assistant
          </p>
          
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg">Powered by Gemini 2.5 Flash • Unlimited Conversations • Zero Restrictions</span>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {capabilities.map((cap, idx) => (
            <div
              key={cap.title}
              className="glass-effect rounded-xl p-6 space-y-3 hover:scale-105 transition-transform duration-300 group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${cap.color} flex items-center justify-center group-hover:animate-pulse-glow`}>
                <cap.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{cap.title}</h3>
              <p className="text-sm text-muted-foreground">{cap.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "600ms" }}>
          <h2 className="text-xl font-semibold text-foreground/70">Try asking me to...</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {examplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="glass-effect rounded-lg px-4 py-3 text-sm text-left hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 group"
              >
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {prompt}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Features Banner */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "800ms" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>No Message Limits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span>Infinite Context Memory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Gemini 2.5 Pro Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span>Smarter Than GPT-5</span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-8 animate-fade-in" style={{ animationDelay: "1000ms" }}>
          <p className="text-lg text-foreground/60">
            Start typing below to unlock infinite possibilities...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Created by Yanna
          </p>
        </div>
      </div>
    </div>
  );
};
