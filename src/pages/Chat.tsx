import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { useToast } from "@/components/ui/use-toast";
import { Bot } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentConversationId) return;

    loadMessages(currentConversationId);

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        () => {
          loadMessages(currentConversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const formattedMessages: Message[] = (data || []).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    setMessages(formattedMessages);
  };

  const createConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user?.id })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }

    return data.id;
  };

  const saveMessage = async (conversationId: string, role: string, content: string) => {
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let conversationId = currentConversationId;

    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
      setCurrentConversationId(conversationId);
    }

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(conversationId, "user", content);

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      await saveMessage(conversationId, "assistant", assistantContent);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          setCurrentConversationId(id);
          loadMessages(id);
        }}
        onNewConversation={handleNewConversation}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card/30 backdrop-blur-lg p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Corrupt-Ware-AI</h1>
              <p className="text-xs text-muted-foreground">Infinite • Free • Unlimited</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-2xl">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary glow-effect-lg flex items-center justify-center animate-pulse-glow">
                  <Bot className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold gradient-text">
                  Welcome to Corrupt-Ware-AI
                </h2>
                <p className="text-muted-foreground text-lg">
                  Your infinite, free AI assistant ready to code, create, and solve anything.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="glass-effect rounded-lg p-4 space-y-2">
                    <div className="text-primary font-bold">💻 Code Anything</div>
                    <p className="text-sm text-muted-foreground">
                      Master of all languages from Python to Assembly
                    </p>
                  </div>
                  <div className="glass-effect rounded-lg p-4 space-y-2">
                    <div className="text-primary font-bold">🧠 Infinite Reasoning</div>
                    <p className="text-sm text-muted-foreground">
                      Solve complex problems with unlimited context
                    </p>
                  </div>
                  <div className="glass-effect rounded-lg p-4 space-y-2">
                    <div className="text-primary font-bold">⚡ Always Free</div>
                    <p className="text-sm text-muted-foreground">
                      No limits, no paywalls, forever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
