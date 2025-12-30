import { useState, useEffect, useRef } from "react";
import { Send, Sparkles,ExternalLink } from "lucide-react";
import { RootState } from "./reduxtoolkit/store";
import { useSelector } from "react-redux";
import { showToast } from "@/lib/toast";
import Linkify from 'linkify-react';
import { useMemo } from 'react';
import { Check, ChevronRight, Award, Target, Zap, Users, Clock, Briefcase, Code, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: string;
  sourceDocuments?: any[];
}

interface StreamingMessage extends Message {
  isStreaming?: boolean;
}

export const Chat = () => {
  const [mounted, setMounted] = useState(false);
  const { userId, socketId, fileId, currentChatingFile } = useSelector(
    (state: RootState) => state.socket
  );
  const [messages, setMessages] = useState<StreamingMessage[]>([
    {
      id: 1,
      text: "Hello! Ask me anything about your document.",
      sender: "other",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
  }, [messages, isLoading]);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Clean up any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset messages when the selected file changes so previous conversation
  // doesn't persist when switching to a new file
  useEffect(() => {
    // If no file selected, keep default welcome message
    if (!currentChatingFile) {
      setMessages([
        {
          id: 1,
          text: "Hello! Ask me anything about your document.",
          sender: "other",
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
      return;
    }

    // Reset to welcome message when file changes
    setMessages([
      {
        id: Date.now(),
        text: `Ready to chat about ${currentChatingFile}. Ask me anything!`,
        sender: "other",
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
    // Abort any ongoing request tied to previous file
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [currentChatingFile]);

  const handleStreamingResponse = async (query: string) => {
    if (currentChatingFile == null) {
      showToast("warning", "", "Select Any File To Chat");
      return;
    }

    let url: string;
    let body: any;
    if (!userId) {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`;
      body = {
        query,
        file_name: currentChatingFile || "Local Files",
        socketId,
      };
    } else {
      if (currentChatingFile === "Local Files" || currentChatingFile === "Gdrive") {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/userlocalfiles`;
        body = {
          query,
          userId,
          sourceType: currentChatingFile
        };
      } else {
        url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/userfilechat`;
        body = {
          query,
          userId,
          fileId: fileId,
        };
      }
    }

    abortControllerRef.current = new AbortController();
    const botMessageId = Date.now() + 1;
    let fullText = "";
    let sourceDocuments: any[] = [];

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported in this browser");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Add initial streaming message
      setMessages(prev => [...prev, {
        id: botMessageId,
        text: "",
        sender: "other",
        timestamp: new Date().toISOString(),
        isStreaming: true
      }]);

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));

              if (data.token) {
                fullText += data.token;
                setMessages(prev => prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: fullText }
                    : msg
                ));
              }

              if (data.done) {
                setIsLoading(false);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            }
          }
        }
      }

      // Finalize the message
      setMessages(prev => prev.map(msg =>
        msg.id === botMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Streaming error:", error);
        showToast("error", "Error", error.message || "Failed to get response");

        // Update the message with error state
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId
            ? {
              ...msg,
              text: msg.text || "Error: Could not get response",
              isStreaming: false
            }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentChatingFile == null) {
      showToast("warning", "", "Select Or Upload Any File To Chat");
      return;
    }
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: newMessage,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);

    try {
      await handleStreamingResponse(newMessage);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#1a1a1a] p-3 sm:p-4 md:p-6">
      {currentChatingFile && (
        <div className="flex flex-col max-w-2xl mx-auto justify-center items-center p-2 sm:p-3 md:p-4 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/20 dark:to-gray-800/10 border border-white/20 dark:border-white/5 rounded-xl sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-float">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent font-bold text-sm sm:text-base md:text-lg animate-shimmer">
            {currentChatingFile}
          </span>
        </div>
      )}
      <div className="flex flex-col h-[80vh] max-w-2xl mx-auto p-3 sm:p-4 md:p-6 bg-white/80 dark:bg-[#121212]/50 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] mt-3 sm:mt-4 md:mt-5 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 p-2 sm:p-3 md:p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"
                } transform transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className={`max-w-[85%] p-3 sm:p-4 md:p-3 ${message.sender === "user"
                     ? "bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white ml-auto rounded-xl sm:rounded-2xl rounded-tr-sm border border-white/10 shadow-[0_4px_14px_rgba(124,58,237,0.25)]"
                    : "bg-transparent dark:bg-transparent text-gray-800 dark:text-gray-200 p-0 shadow-none border-0 rounded-none max-w-full break-words overflow-hidden"


                  }`}
              >
                {message.sender === "user" ? (
                  <p className="text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed tracking-wide font-medium text-white/95">
                    {message.text}
                  </p>
                ) : (
                  <DynamicStyledBlock text={message.text} />
                )}

                {message.sourceDocuments && (
                  <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 ${message.sender === "user"
                      ? "border-t border-white/10"
                      : "border-t border-gray-100 dark:border-gray-800"
                    }`}>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2 sm:mb-3 ${message.sender === "user"
                        ? "text-white/90"
                        : "text-gray-600 dark:text-gray-400"
                      }`}>
                      Sources <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                    </p>
                    {message.sourceDocuments.map((doc, index) => (
                      <p key={index} className={`text-[11px] sm:text-[12px] md:text-[13px] ${message.sender === "user"
                          ? "text-white/80"
                          : "text-gray-600 dark:text-gray-400"
                        } leading-relaxed`}>
                        {doc.pageContent?.substring(0, 100)}...
                      </p>
                    ))}
                  </div>
                )}
                <div className={`flex items-center justify-end mt-2 sm:mt-3 gap-1.5 sm:gap-2 ${message.sender === "user"
                    ? "text-white/70"
                    : "text-gray-500 dark:text-gray-500"
                  }`}>
                  <span className="text-[10px] sm:text-[11px] font-medium tracking-wider">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {message.sender === "user" && (
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white">
                      U
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1a1a1a] p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] rounded-tl-sm border border-gray-100 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                <div className="flex space-x-1.5 sm:space-x-2 items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-violet-500 dark:bg-violet-400 rounded-full animate-bounce" />
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-4 p-2 sm:p-4 border-t border-gray-200 dark:border-gray-800"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm sm:text-base border-0 focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600"
          />
          <button
            type="submit"
            className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};


const DynamicStyledBlock = ({ text }: { text: string }) => {
  if (!text) return null;

  const linkifyOptions = useMemo(
    () => ({
      target: "_blank",
      rel: "noopener noreferrer",
      className:
        "text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 break-all",
    }),
    []
  );

  const normalizeValue = (label: string, value: string) => {
    const key = label.toLowerCase();

    if (key.includes("email")) return `mailto:${value}`;
    if (key.includes("linkedin"))
      return `https://www.linkedin.com/in/${value}`;
    if (key.includes("portfolio")) return `https://${value}`;

    return value;
  };

  const blocks = text
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 break-words max-w-full">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

        // Strip simple markdown emphasis markers from the first line for heading detection
        const first = lines[0] || "";
        const firstStripped = first.replace(/\*\*/g, "").replace(/\*/g, "").replace(/`/g, "");

        const isHeading =
          /^[A-Z].*:$/i.test(firstStripped) || // Title:
          /^#+\s/.test(first) || // Markdown #
          /^\*\*(.+)\*\*$/.test(first); // **Title**

        const rest = isHeading ? lines.slice(1) : lines;

        return (
          <div
            key={i}
            className="p-1 sm:p-1 bg-white dark:bg-[#121212]"
          >
                {isHeading && (
              <>
                <h3
                  className="
                    text-base sm:text-lg font-bold
                    bg-clip-text text-transparent
                    bg-gradient-to-r from-violet-500 to-indigo-500
                    mb-2
                  "
                >
                  {firstStripped.replace(/#+\s/, "")}
                </h3>
                <div className="h-px bg-gradient-to-r from-violet-500 to-indigo-500 opacity-30 mb-3" />
              </>
            )}

                <div className="space-y-2 text-gray-800 dark:text-gray-300 text-[13px] sm:text-[14px] leading-relaxed">
              {rest.map((line, idx) => {
                /* LABEL: VALUE (Phone, Email, Location, etc.) */
                const labelMatch = line.match(/^([^:]+):\s*(.+)$/);
                if (labelMatch) {
                  const [, labelRaw, valueRaw] = labelMatch;
                  const label = labelRaw.replace(/\*\*/g, "").replace(/\*/g, "").trim();
                  const value = valueRaw.replace(/\*\*/g, "").replace(/\*/g, "").trim();
                  const normalized = normalizeValue(label, value);

                  return (
                    <p key={idx} className="flex gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {label}:
                      </span>
                      <Linkify options={linkifyOptions}>
                        {normalized}
                      </Linkify>
                    </p>
                  );
                }

                /* PROJECT TITLE (1. **Title**) */
                if (/^\d+\.\s*\*\*/.test(line)) {
                  return (
                    <div
                      key={idx}
                      className="mt-4 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181818]"
                    >
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {line
                          .replace(/^\d+\.\s*/, "")
                          .replace(/\*\*/g, "")
                          .replace(/\*/g, "")}
                      </p>
                    </div>
                  );
                }

                /* BULLET POINTS (*, -, +) */
                if (/^[-*+]\s/.test(line))
                  return (
                    <p key={idx} className="flex items-start gap-2 ml-2">
                      <span className="mt-1 text-indigo-500">•</span>
                      <Linkify options={linkifyOptions}>
                        {line.replace(/^[-*+]\s/, "").replace(/\*\*/g, "").replace(/\*/g, "").trim()}
                      </Linkify>
                    </p>
                  );

                /* NUMBERED LIST */
                if (/^\d+\./.test(line))
                  return (
                    <p key={idx}>
                      <Linkify options={linkifyOptions}>
                        {line.replace(/\*\*/g, "").replace(/\*/g, "")}
                      </Linkify>
                    </p>
                  );

                /* NORMAL TEXT */
                return (
                  <p key={idx}>
                    <Linkify options={linkifyOptions}>
                      {line.replace(/\*\*/g, "").replace(/\*/g, "")}
                    </Linkify>
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};