import { useState, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { RootState } from "./reduxtoolkit/store";
import { useSelector } from "react-redux";
import { showToast } from "@/lib/toast";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  timestamp: string;
  sourceDocuments?: any[];
}

export const Chat = () => {
  const [mounted, setMounted] = useState(false);
  // const socketId = useSelector((state: RootState) => state.socket.socketId);
  // const fileId = useSelector((state: RootState) => state.socket.fileId); // Add fileId from Redux
  // const userId = useSelector((state: RootState) => state.socket.userId); // Add userId from Redux
  const { userId, socketId, fileId, currentChatingFile } = useSelector(
    (state: RootState) => state.socket
  );
  // const currentChatingFile = useSelector(
  //   (state: RootState) => state.socket.currentChatingFile
  // );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! Ask me anything about your document.",
      sender: "other",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sendMessageToBackend = async (query: string) => {
    try {
      let url: string;
      let body: any;

      if (!userId) {
        // Case 1: userId is null
        url = "http://localhost:4000/chat";
        body = {
          query,
          file_name: currentChatingFile || "Local Files",
          socketId,
        };
      } else {
        // Case 2: userId is not null
        if (currentChatingFile === "local"||currentChatingFile === "gdrive") {
          url = "http://localhost:4000/userlocalfiles";
          body = {
            query,
            userId,
            sourceType:currentChatingFile
          };
        }else{
          url = "http://localhost:4000/userfilechat";
          body = {
            query,
            userId,
            fileId: fileId, // Assuming currentChatingFile is the fileId
          };
        }
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("Backend Response:", data);

      if (response.ok) {
        return data;
      } else {
        showToast("warning", "", data.error);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      showToast("error", "", error.message);
      throw error;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: Date.now(),
        text: newMessage,
        sender: "user",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");
      setIsLoading(true);

      try {
        console.log({ newMessage });
        const response = await sendMessageToBackend(newMessage);
        console.log({ response });
        if (response) {
          const botMessage: Message = {
            id: Date.now() + 1,
            text: response.answer,
            sender: "other",
            timestamp: new Date().toISOString(),
            sourceDocuments: response.sourceDocuments,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } catch (error: any) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-100 via-white to-purple-100 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-[#1a1a1a] p-3 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none"></div>
      {currentChatingFile && (
        <div className="flex flex-col h-[5vh] max-w-2xl mx-auto justify-center items-center p-2 sm:p-3 md:p-4 bg-gradient-to-r from-white/80 to-white/60 dark:from-gray-800/20 dark:to-gray-800/10 border border-white/20 dark:border-white/5 rounded-xl sm:rounded-2xl backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-float">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent font-bold text-sm sm:text-base md:text-lg animate-shimmer">
            {currentChatingFile}
          </span>
        </div>
      )}
      <div className="flex flex-col h-[80vh] max-w-2xl mx-auto p-3 sm:p-4 md:p-6 bg-white/80 dark:bg-[#121212]/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] mt-3 sm:mt-4 md:mt-5 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300">
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 p-2 sm:p-3 md:p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              } transform transition-all duration-300 hover:-translate-y-1`}
            >
              <div
                className={`max-w-[85%] p-3 sm:p-4 md:p-6 ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white ml-auto rounded-[1rem] sm:rounded-[1.5rem] rounded-tr-sm border border-white/10 shadow-[0_8px_30px_rgb(124,58,237,0.2)] dark:shadow-[0_8px_30px_rgba(124,58,237,0.15)]"
                    : "bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-[1rem] sm:rounded-[1.5rem] rounded-tl-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
                }`}
              >
                <p className={`text-[13px] sm:text-[14px] md:text-[15px] leading-relaxed tracking-wide font-medium ${
                  message.sender === "user" ? "text-white/95" : "text-gray-700 dark:text-gray-300"
                }`}>{message.text}</p>
                {message.sourceDocuments && (
                  <div className={`mt-3 sm:mt-4 pt-3 sm:pt-4 ${
                    message.sender === "user" 
                      ? "border-t border-white/10" 
                      : "border-t border-gray-100 dark:border-gray-800"
                  }`}>
                    <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2 sm:mb-3 ${
                      message.sender === "user" 
                        ? "text-white/90" 
                        : "text-gray-600 dark:text-gray-400"
                    }`}>
                      Sources <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse" />
                    </p>
                    {message.sourceDocuments.map((doc, index) => (
                      <p key={index} className={`text-[11px] sm:text-[12px] md:text-[13px] ${
                        message.sender === "user" 
                          ? "text-white/80" 
                          : "text-gray-600 dark:text-gray-400"
                        } leading-relaxed`}>
                        {doc.pageContent?.substring(0, 100)}...
                      </p>
                    ))}
                  </div>
                )}
                <div className={`flex items-center justify-end mt-2 sm:mt-3 gap-1.5 sm:gap-2 ${
                  message.sender === "user" 
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