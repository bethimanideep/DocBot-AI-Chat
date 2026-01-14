import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";

dotenv.config();

export function llm(opts?: { streaming?: boolean; callbacks?: any[] }) {
  const provider = (process.env.LLM_PROVIDER || "groq").toLowerCase();

  if (provider === "google" || provider === "gemini") {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY (or GEMINI_API_KEY) is not set");
    }
    return new ChatGoogleGenerativeAI({
      apiKey,
     model: process.env.GOOGLE_MODEL || "gemini-2.5-flash",
      streaming: opts?.streaming,
      callbacks: opts?.callbacks,
    });
  }

  // Default to Groq
  if (provider === "groq") {
    const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }
    if (!GROQ_MODEL) {
      throw new Error(
        "Environment variable GROQ_MODEL is required. Set GROQ_MODEL to a supported Groq model (see your Groq console or docs). Example: GROQ_MODEL=groq-<version>"
      );
    }

    return new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: GROQ_MODEL,
      temperature: 0,
      streaming: opts?.streaming,
      callbacks: opts?.callbacks,
    });
  }

  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}
