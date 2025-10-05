import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { WelcomeHero } from "@/components/WelcomeHero";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Loader2 } from "lucide-react";
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

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    await supabase
      .from("conversations")
      .update({ title })
      .eq("id", conversationId);
  };

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    let conversationId = currentConversationId;
    let isNewConversation = false;

    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
      setCurrentConversationId(conversationId);
      isNewConversation = true;
    }

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(conversationId, "user", content);

    if (isNewConversation) {
      await updateConversationTitle(conversationId, content);
    }

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

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive",
          });
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Usage Limit",
            description: "AI credits exhausted. Please add more credits.",
            variant: "destructive",
          });
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        throw new Error("Failed to get response");
      }

      if (!response.body) throw new Error("No response body");

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
        description: "Failed to get AI response. Please try again.",
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
    <div className="flex h-screen bg-background relative">
      <ParticleBackground />
      
      <ConversationSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={(id) => {
          setCurrentConversationId(id);
          loadMessages(id);
        }}
        onNewConversation={handleNewConversation}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 flex flex-col relative z-10">
        <div className="border-b border-border bg-card/30 backdrop-blur-lg p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary glow-effect flex items-center justify-center animate-pulse-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Corrupt-Ware-AI</h1>
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Thinking...
                  </span>
                ) : (
                  "Infinite • Free • Unlimited"
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeHero />
          ) : (
            <div className="max-w-4xl mx-auto py-8">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "assistant" && (
                <div className="flex items-center gap-2 px-6 py-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
}
