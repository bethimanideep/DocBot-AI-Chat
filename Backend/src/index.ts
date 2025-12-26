import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { ChatGroq } from "@langchain/groq";
import multer from "multer";
import pdfParse from "pdf-parse";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import session from "express-session";
import mongoose from "mongoose";
import { RetrievalQAChain } from "@langchain/classic/chains";
import { createClient } from "redis";
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { WeaviateStore } from "@langchain/weaviate";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import weaviate from "weaviate-ts-client";
import router from "./routes/auth";
import passport from "passport";
import cookieParser from "cookie-parser";
import { GoogleDriveFile, User, UserFile } from "./models/schema";
import { google } from "googleapis";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Document } from "@langchain/core/documents";
import { BaseRetriever } from "@langchain/core/retrievers";
import * as cookie from 'cookie';
import { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";

const userRetrievers: any = {};

// Minimal retriever wrapper to satisfy LangChain's BaseRetriever interface
class FunctionalRetriever extends BaseRetriever {
  lc_namespace = ["docbot", "functional_retriever"];

  constructor(
    private fetcher: (
      query: string,
      runManager?: CallbackManagerForRetrieverRun
    ) => Promise<Document[]>
  ) {
    super();
  }

  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    return this.fetcher(query, runManager);
  }
}

// Initialize OpenAI embeddings model
// const embeddings = new OpenAIEmbeddings({
//   apiKey: process.env.OPENAI_API_KEY,
//   model: "text-embedding-3-small",
// });


import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  model: "gemini-embedding-001", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});


// The Weaviate SDK has an issue with types
// const weaviateClient = weaviate.client({
//   scheme: "http",
//   host: "localhost:8080",
// });

const weaviateApiKey = process.env.WEAVIATE_API_KEY;
if (!weaviateApiKey) {
  throw new Error("WEAVIATE_API_KEY environment variable is required");
}

const weaviateClient = weaviate.client({
  scheme: "https",
  host: "xnc212pktecl2ed0bohvig.c0.asia-southeast1.gcp.weaviate.cloud",
  apiKey: new weaviate.ApiKey(weaviateApiKey),
});

const client = createClient({
  username: process.env.REDISNAME,
  password: process.env.REDISPASSWORD,
  socket: {
    host: process.env.REDISHOST,
    port: Number(process.env.REDISPORT),
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

const app = express();
const allowedOrigins = process.env.CORS?.split(",");
app.use(
  cors({
    origin: allowedOrigins, // Explicitly allow frontend URL
    credentials: true, // Allow cookies and authentication headers
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: `${process.env.JWT_SECRET}`,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", router);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
io.on("connection", async (socket) => {
  console.log("New client connected");

  // Handle room joining first
  socket.on('joinRoom', (userId: string) => {
    if (!userId) {
      console.error('No userId provided for joinRoom');
      return;
    }
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);
  });

  // Extract cookies manually from socket handshake headers
   const cookies :any= socket.handshake.headers.cookie;
  let DriveAccessToken = null;
  let userToken = null;
  const parsedCookies = cookie.parse(cookies);
  console.log(parsedCookies);
  
  

  if (parsedCookies) {
    DriveAccessToken = parsedCookies.DriveAccessToken; // Google Drive Access Token
    userToken = parsedCookies.token; // User JWT Token
    console.log({ DriveAccessToken, userToken });
  }

  if (!userToken) {
    console.log("No user token found, not sending file list");
    return socket.emit("initialFileList", {
      error: "Unauthorized: No access token",
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET!
    ) as JwtPayload;
    console.log({decoded});
    

    const userId = decoded.userId;
    console.log({userId});
    

    // Fetch the file list for the logged-in user
    const fileList = await UserFile.find({ userId });
    console.log({fileList});
    
    // Emit the file list to the frontend upon connection
    socket.emit("initialFileList", { fileList });
    console.log("File list sent to client:", fileList);
  } catch (error: any) {
    console.error("Invalid user token:", error.message);
    socket.emit("initialFileList", { error: "Invalid or expired token" });
  }

  // Fetch Drive files if DriveAccessToken exists
  if (DriveAccessToken) {
    try {
      // Verify JWT token again to get userId
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET!) as JwtPayload;
      const userId = decoded.userId;

      // Initialize OAuth2 client with access token
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: DriveAccessToken });

      // Create Google Drive API client
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Fetch PDF files
      const response = await drive.files.list({
        q: "mimeType='application/pdf'",
        fields: "files(id, name, webViewLink, size, mimeType, thumbnailLink)",
      });

      // Get all file IDs from the response
      const fileIds = response.data.files?.map(file => file.id) || [];

      // Find all synced files from MongoDB
      const syncedFiles = await GoogleDriveFile.find({
        userId,
        fileId: { $in: fileIds }
      });
      console.log({syncedFiles});
      


      // Create a map of fileId to sync status
      const syncStatusMap = new Map();
      syncedFiles.forEach(file => {
        syncStatusMap.set(file.fileId, file.synced);
      });
      const sync_idMap = new Map();
      syncedFiles.forEach(file => {
        sync_idMap.set(file.fileId, file._id);
      });

      const pdfFiles = response.data.files?.map((file) => ({
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
        thumbnailLink: file.thumbnailLink,
        fileSize: file.size ? parseInt(file.size) : 0,
        mimeType: file.mimeType || "application/pdf",
        synced: syncStatusMap.get(file.id) || false, // Add sync status
        _id: sync_idMap.get(file.id) || false // Add sync status
      }));

      // Emit the response to the frontend
      socket.emit("driveFilesResponse", { pdfFiles });
    } catch (error) {
      console.error("Error fetching Google Drive files:", error);
      if (error instanceof Error) {
        socket.emit("driveFilesResponse", {
          error: "Failed to fetch Google Drive files",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      } else {
        socket.emit("driveFilesResponse", {
          error: "Failed to fetch Google Drive files",
          details: "An unknown error occurred"
        });
      }
    }
  } else {
    console.log("No Google Drive access token found");
    socket.emit("driveFilesResponse", {
      error: "Google Drive not connected",
      actionRequired: "connect"
    });
  }

  // Handle file sync completion events
  socket.on('fileSyncComplete', async ({ fileId }) => {
    try {
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET!) as JwtPayload;
      const userId = decoded.userId;

      // Update the file's sync status in MongoDB
      await GoogleDriveFile.findOneAndUpdate(
        { userId, fileId },
        { synced: true, lastSynced: new Date() },
        { new: true }
      );

      // Notify all clients about the sync status update
      io.emit('fileSyncStatusUpdate', { fileId, synced: true });
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Use an environment-configurable model name to avoid hardcoding a model that may be
// decommissioned. Set GROQ_MODEL in your environment to a supported model name.
// NOTE: We require an explicit GROQ_MODEL to avoid accidental use of an invalid
// default that may not exist or be accessible for your account.
const GROQ_MODEL = process.env.GROQ_MODEL;
if (!GROQ_MODEL) {
  throw new Error(
    "Environment variable GROQ_MODEL is required. Set GROQ_MODEL to a supported Groq model (see your Groq console or docs). Example: GROQ_MODEL=groq-<version>"
  );
}

function createChatGroq(opts?: { streaming?: boolean; callbacks?: any[] }) {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: GROQ_MODEL!,
    temperature: 0,
    streaming: opts?.streaming,
    callbacks: opts?.callbacks,
  });
}

const llm = createChatGroq();

// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to process PDFs: extract text and chunk it
async function processPdf(fileBuffer: Buffer) {
  const data = await pdfParse(fileBuffer);
  const text = data.text;

  const splitter = new TokenTextSplitter({
    encodingName: "gpt2",
    chunkSize: 7500,
    chunkOverlap: 0,
  });

  const chunks = await splitter.createDocuments([text]);
  return chunks.map((chunk) => chunk.pageContent);
}

app.get('/gdrive/sync', async (req: any, res: any) => {
  try {
    const { fileId, userId } = req.query as { fileId: string; userId: string };
    const driveAccessToken = req.cookies.driveAccessToken as string;

    // Initialize Google Drive client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
    oauth2Client.setCredentials({ access_token: driveAccessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get file metadata
    const { data: fileMetadata } = await drive.files.get({
      fileId,
      fields: 'id,name,size,mimeType,webViewLink,webContentLink,thumbnailLink'
    });

    // Download file content
    const { data: fileContent } = await drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });
    const fileBuffer = Buffer.from(fileContent as ArrayBuffer);

    // Update or create file record
    const fileData = {
      userId,
      fileId: fileMetadata.id,
      filename: fileMetadata.name,
      fileSize: parseInt(fileMetadata.size || '0'),
      mimeType: fileMetadata.mimeType,
      webViewLink: fileMetadata.webViewLink,
      webContentLink: fileMetadata.webContentLink,
      thumbnailLink: fileMetadata.thumbnailLink,
      lastSynced: new Date()
    };

    const existingFile = await GoogleDriveFile.findOneAndUpdate(
      { userId, fileId: fileMetadata.id },
      fileData,
      { upsert: true, new: true }
    );

    // Process PDF and generate embeddings
    const chunks = await processPdf(fileBuffer);
    const embeddingsArray = await embeddings.embedDocuments(chunks);

    // Delete existing Weaviate objects
    const result = await weaviateClient.graphql.get()
      .withClassName('Cwd')
      .withFields('_additional { id }')
      .withWhere({
        path: ['fileId'],
        operator: 'Equal',
        valueString: existingFile._id.toString()
      })
      .do();

    const idsToDelete = result.data?.Get?.Cwd?.map((item: any) => item._additional.id) || [];
    for (const id of idsToDelete) {
      await weaviateClient.data.deleter()
        .withClassName('Cwd')
        .withId(id)
        .do();
    }

    // Create new batch in Weaviate
    const batcher = weaviateClient.batch.objectsBatcher();
    chunks.forEach((chunk, i) => {
      batcher.withObject({
        class: "Cwd",
        properties: {
          fileId: existingFile._id.toString(),
          file_name: fileMetadata.name,
          timestamp: new Date().toISOString(),
          chunk_index: i,
          text: chunk,
          userId,
          sourceType: "Gdrive",
        },
        vector: embeddingsArray[i],
      });
    });
    await batcher.do();

    // Mark as synced after successful processing
    const updatedFile :any= await GoogleDriveFile.findByIdAndUpdate(
      existingFile._id,
      { synced: true },
      { new: true }
    );

    io.to(userId).emit('fileSyncStatusUpdate', {
      _id:updatedFile._id,
      fileId: fileMetadata.id,
      synced: true
    });

    res.json({
      success: true,
      message: "File synced successfully",
      chunksProcessed: chunks.length
    });

  } catch (error: unknown) {
    console.error("Error syncing Google Drive file:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: "Error syncing file",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Endpoint for uploading PDFs and storing embeddings in Pinecone

app.post("/upload", upload.array("files"), async (req: any, res: any) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded." });
  }

  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }
    // Check if user exists in the database
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }

    const batcher = weaviateClient.batch.objectsBatcher();

    for (let file of req.files) {
      // Save file metadata to MongoDB
      const fileMetadata = await UserFile.create({
        userId,
        filename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      const fileId = fileMetadata._id.toString(); // Use MongoDB's _id as fileId
      console.log("MongoDB _id used as fileId:", fileId);

      // Process PDF and generate embeddings
      const chunks = await processPdf(file.buffer);
      console.log({ FileName: file.originalname, Chunks: chunks.length });

      // Embed all chunks in one API call
      const embeddingsArray = await embeddings.embedDocuments(chunks);

      // Store embeddings in Weaviate with a reference to the MongoDB _id
      for (let i = 0; i < chunks.length; i++) {
        batcher.withObject({
          class: "Cwd", // Use the correct class name from your schema
          properties: {
            fileId, // MongoDB _id as reference
            file_name: file.originalname,
            timestamp: new Date().toISOString(),
            chunk_index: i,
            text: chunks[i],
            userId,
            sourceType: "Local Files",
          },
          vector: embeddingsArray[i],
        });
      }
    }

    // Send batch request to Weaviate (if batcher has objects)
    if (batcher.objects.length > 0) {
      await batcher.do();
    }

    const fileList = await UserFile.find({ userId });

    res.json({
      message: "Files processed and embeddings stored successfully in Weaviate",
      fileList,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    res.status(500).json({ message: "Error processing files" });
  }
});

// Endpoint to delete all data in the pineconeIndex
app.delete("/delete", async (req, res) => {
  const className = "Cwd"; // Replace with your actual class name

  try {
    // Step 1: Delete the entire class (index) including its schema and data
    await weaviateClient.schema.classDeleter().withClassName(className).do();
    // Send success response
    res.status(200).json({
      message: `Class "${className}" and all its data have been deleted.`,
    });
  } catch (error) {
    console.error("Error deleting class:", error);

    // Send error response
    res
      .status(500)
      .json({ error: "An error occurred while deleting the class" });
  }
});

// 🚀 Search Endpoint
app.post("/search", async (req: any, res: any) => {
  try {
    const { query } = req.body; // Get user query

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const vectorStore = await WeaviateStore.fromExistingIndex(embeddings, {
      client: weaviateClient as any, // Weaviate client instance
      indexName: "Cwd", // Replace with your Weaviate class name
      metadataKeys: ["file_name"], // Include metadata fields you want to retrieve
      textKey: "text", // The property in Weaviate that contains the text
    });

    const retriever = vectorStore.asRetriever({
      k: 2, // Set the number of documents to return
    });

    // Create RetrievalQAChain
    const chain = RetrievalQAChain.fromLLM(llm, retriever, {
      returnSourceDocuments: true,
    });

    // Ask the question and get a response
    const response = await chain.call({
      query: query,
    });
    res.send(response.text);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Error searching Pinecone" });
  }
});

app.post("/userlocalfiles", async (req: any, res: any) => {
  try {
    const { query, userId, sourceType } = req.body;
    console.log({ query, userId, sourceType });
    
    if (!query || !userId || !sourceType) {
      return res.status(400).json({ message: "Query, userId, and sourceType are required" });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const vectorStore = await WeaviateStore.fromExistingIndex(embeddings, {
      client: weaviateClient as any,
      indexName: "Cwd",
      metadataKeys: ["file_name", "fileId", "timestamp"],
      textKey: "text",
    });

    // Create a custom retriever with filter support
    const retriever = new FunctionalRetriever(async (query: string) => {
      const queryEmbedding = await embeddings.embedQuery(query);
      const whereFilter = {
        operator: "And" as const,
        operands: [
          { path: ["userId"], operator: "Equal" as const, valueText: userId },
          { path: ["sourceType"], operator: "Equal" as const, valueText: `${sourceType}` },
        ],
      };
      // Query Weaviate directly with filter and vector search
      const result = await weaviateClient.graphql
        .get()
        .withClassName("Cwd")
        .withFields("text file_name fileId timestamp _additional { id distance }")
        .withWhere(whereFilter)
        .withNearVector({ vector: queryEmbedding })
        .withLimit(1)
        .do();
      
      const documents = result.data?.Get?.Cwd || [];
      return documents.map((doc: any) => new Document({
        pageContent: doc.text,
        metadata: {
          file_name: doc.file_name,
          fileId: doc.fileId,
          timestamp: doc.timestamp,
        },
      }));
    });

    // Create a streaming LLM instance using the centralized helper
    const streamingLLM = createChatGroq({
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          },
          handleLLMEnd() {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          },
          handleLLMError(error: Error) {
            console.error("LLM Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          },
        },
      ],
    });

    // Create RetrievalQAChain with streaming LLM
    const chain = RetrievalQAChain.fromLLM(streamingLLM, retriever, {
      returnSourceDocuments: true,
    });

    // Process the query
    const data=await chain.call({
      query: query,
    });
    console.log({data:data.sourceDocuments});

  } catch (error) {
    console.error("Search error:", error);
    res.write(`data: ${JSON.stringify({ error: "Error processing your request" })}\n\n`);
    res.end();
  }
});

app.post("/userfilechat", async (req: any, res: any) => {
  try {
    const { query, fileId } = req.body;
    console.log(query, fileId);
    
    if (!query || !fileId) {
      return res.status(400).json({ message: "Query and fileId are required" });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Important for SSE

    const vectorStore = await WeaviateStore.fromExistingIndex(embeddings, {
      client: weaviateClient as any,
      indexName: "Cwd",
      metadataKeys: ["file_name", "fileId", "timestamp"],
      textKey: "text",
    });

    // Create a custom retriever with filter support
    const retriever = new FunctionalRetriever(async (query: string) => {
      const queryEmbedding = await embeddings.embedQuery(query);
      const whereFilter = {
        path: ["fileId"],
        operator: "Equal" as const,
        valueText: fileId,
      };
      // Query Weaviate directly with filter and vector search
      const result = await weaviateClient.graphql
        .get()
        .withClassName("Cwd")
        .withFields("text file_name fileId timestamp _additional { id distance }")
        .withWhere(whereFilter)
        .withNearVector({ vector: queryEmbedding })
        .withLimit(1)
        .do();
      
      const documents = result.data?.Get?.Cwd || [];
      return documents.map((doc: any) => new Document({
        pageContent: doc.text,
        metadata: {
          file_name: doc.file_name,
          fileId: doc.fileId,
          timestamp: doc.timestamp,
        },
      }));
    });

    // Create a streaming LLM instance using the centralized helper
    const streamingLLM = createChatGroq({
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          },
          handleLLMEnd() {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          },
          handleLLMError(error: Error) {
            console.error("LLM Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          },
        },
      ],
    });

    // Create RetrievalQAChain with streaming LLM
    const chain = RetrievalQAChain.fromLLM(streamingLLM, retriever, {
      returnSourceDocuments: true,
    });

    // Process the query
    const data=await chain.call({
      query: query,
    });
    console.log({data:data.sourceDocuments});
    

  } catch (error) {
    console.error("Search error:", error);
    res.write(`data: ${JSON.stringify({ error: "Error processing your request" })}\n\n`);
    res.end();
  }
});

const userFileChatMemory: any = {}; // Store user files in memory

app.post("/userfilechatmemory", async (req: any, res: any) => {
  try {
    const { userId, fileId, query } = req.body;

    if (!userId || !fileId || !query) {
      return res
        .status(400)
        .json({ error: "userId, fileId, and query are required." });
    }

    // Initialize user storage if not present
    if (!userRetrievers[userId]) {
      userRetrievers[userId] = {};
    }

    // Check if vector store exists for the given fileId
    if (!userRetrievers[userId][fileId]) {
      console.log(`Fetching embeddings from Weaviate for fileId: ${fileId}`);

      // Fetch embeddings for the specific fileId from Weaviate
      const result = await weaviateClient.graphql
        .get()
        .withClassName("Cwd") // Replace with your actual class name
        .withFields(
          `
          userId
          file_name
          fileId
          chunk_index
          text
          _additional { vector }
        `
        )
        .withWhere({
          path: ["fileId"],
          operator: "Equal",
          valueText: fileId,
        })
        .do();

      const documents = result.data.Get.Cwd;
      if (!documents || documents.length === 0) {
        return res
          .status(404)
          .json({ error: "No embeddings found for this fileId." });
      }

      // Prepare documents with metadata
      const fileName = documents[0].file_name;
      const vectors = documents.map((doc: any) => ({
        pageContent: doc.text,
        metadata: { file_name: doc.file_name, chunk_index: doc.chunk_index },
      }));
      const embeddingsArray = documents.map(
        (doc: any) => doc._additional.vector
      );

      // Initialize or update the vector store
      if (!userRetrievers[userId][fileId]) {
        userRetrievers[userId][fileId] = {
          vectorStore: new MemoryVectorStore(embeddings),
          fileName: fileName, // Store fileName
          fileId: fileId, // Store fileId
        };
      }

      // Add documents to the vector store
      await userRetrievers[userId][fileId].vectorStore.addVectors(
        embeddingsArray,
        vectors
      );
    }

    // Retrieve stored vector store
    const retriever = userRetrievers[userId][fileId].vectorStore.asRetriever({
      k: 1,
    });

    console.log("Running query on vector store...");
    const chain = RetrievalQAChain.fromLLM(llm, retriever);
    const response = await chain.call({ query });

    console.log("Response:", response);
    res.status(200).json({ answer: response.text || "No answer found." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.post("/searchbyfile", async (req: any, res: any) => {
  try {
    const { query, file_name } = req.body;

    if (!query || !file_name) {
      return res
        .status(400)
        .json({ message: "Both query and file_name are required" });
    }

    if (!userRetrievers[file_name]) {
      console.log("No Data Exists");

      // Query Weaviate with metadata filter
      const response = await weaviateClient.graphql
        .get()
        .withClassName("Cwd") // Replace with your actual Weaviate class name
        .withFields("text file_name _additional { vector }")
        .withWhere({
          path: ["file_name"],
          operator: "Equal",
          valueText: file_name,
        })
        .withLimit(10000)
        .do();

      const queryResponse = response.data.Get?.Cwd || [];

      if (queryResponse.length === 0) {
        return res.status(500).json({
          message: "Files are processing, wait sometime and try again",
        });
      }

      // Initialize the vector store
      let vectorStore = new MemoryVectorStore(embeddings);

      // Store retrieved data into MemoryVectorStore
      await Promise.all(
        queryResponse.map(async (doc: any) => {
          if (doc._additional?.vector && doc.text) {
            await vectorStore.addVectors(
              [doc._additional.vector],
              [
                new Document({
                  pageContent: String(doc.text),
                  metadata: { file_name: doc.file_name },
                }),
              ]
            );
          }
        })
      );

      userRetrievers[file_name] = vectorStore;
    }

    // Create a chain
    const chain = RetrievalQAChain.fromLLM(
      llm,
      userRetrievers[file_name].asRetriever({ k: 2 }),
      { returnSourceDocuments: true }
    );

    // Query the chain
    const responseData = await chain.call({ query });

    res.send(responseData.text);
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ message: "Error searching Weaviate for the specific file" });
  }
});

app.get("/createIndex", async (req: any, res: any) => {
  try {
    const existingClasses = await weaviateClient.schema.getter().do();

    // Check if the "cwd" class already exists
    const cwdClassExists = existingClasses.classes?.some(
      (cls) => cls.class === "cwd"
    );

    if (!cwdClassExists) {
      // Create the "cwd" class with the updated schema
      await weaviateClient.schema
        .classCreator()
        .withClass({
          class: "Cwd",
          description: "Stores extracted text chunks from PDFs with embeddings",
          vectorizer: "none", // Since we use precomputed embeddings
          vectorIndexType: "hnsw",
          properties: [
            { name: "sourceType", dataType: ["string"] },
            { name: "userId", dataType: ["string"] },
            { name: "fileId", dataType: ["string"] }, // Add fileId to link with MongoDB
            { name: "file_name", dataType: ["string"] },
            { name: "timestamp", dataType: ["date"] },
            { name: "chunk_index", dataType: ["int"] },
            { name: "text", dataType: ["text"] },
          ],
        })
        .do();
      console.log("✅ Weaviate schema created successfully.");
    } else {
      console.log("⚡ Weaviate schema already exists.");
    }

    res.send(existingClasses.classes);
  } catch (error) {
    console.error("Error creating Weaviate schema:", error);
    res.status(500).json({ message: "Error creating Weaviate schema" });
  }
});

app.get("/getAllData", async (req: any, res: any) => {
  try {
    const result = await weaviateClient.graphql
      .get()
      .withClassName("Cwd") // Replace with your actual class name
      .withFields(
        `
    sourceType
    userId
    file_name 
    fileId
    timestamp 
    chunk_index 
    text 
    _additional { vector }
  `
      ) // Requesting vectors explicitly
      .do();
    res.send(result);
  } catch (error) {
    console.error("Error retrieving data:", error);
  }
});

// Endpoint to handle multiple file uploads
app.post(
  "/myuserupload",
  upload.array("files", 10),
  async (req: any, res: any) => {
    try {
      const { socketId } = req.query; // Get socketId from query params
      const files = req.files;

      if (!socketId) {
        return res.status(400).json({ message: "Socket ID is required." });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }

      io.emit("progressbar", 50);

      // Initialize the user's retriever storage if not present
      if (!userRetrievers[socketId]) {
        userRetrievers[socketId] = {};
      }

      for (const file of files) {
        if (file.mimetype !== "application/pdf") {
          console.log(`Skipping non-PDF file: ${file.originalname}`);
          continue;
        }
        console.log(file.originalname);

        // Process the PDF and split into chunks
        const chunks = await processPdf(file.buffer);
        console.log({ FileName: file.originalname, Chunks: chunks.length });

        io.emit("progressbar", 75);

        // Embed all chunks in one API call
        const embeddingsArray = await embeddings.embedDocuments(chunks);

        // Create documents with metadata
        const documents = chunks.map((chunk, index) => ({
          pageContent: chunk,
          metadata: { file_name: file.originalname, chunk_index: index },
        }));

        // Initialize or update the vector store for the file
        if (!userRetrievers[socketId][file.originalname]) {
          userRetrievers[socketId][file.originalname] = {
            vectorStore: new MemoryVectorStore(embeddings),
            mimeType: file.mimetype, // Store mimeType
            fileSize: file.size, // Store fileSize
          };
        }

        // Add documents to the vector store
        await userRetrievers[socketId][
          file.originalname
        ].vectorStore.addVectors(embeddingsArray, documents);
      }

      io.emit("progressbar", 100);

      // Retrieve stored files related to the user (socketId) with mimeType and fileSize
      const userFiles = Object.keys(userRetrievers[socketId]).map(
        (filename, index) => ({
          _id: index,
          filename,
          mimeType: userRetrievers[socketId][filename].mimeType,
          fileSize: userRetrievers[socketId][filename].fileSize,
        })
      );

      res.status(200).json({
        message: "Files uploaded and processed successfully.",
        fileList: userFiles,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      res.status(500).json({ message: "Error processing files." });
    }
  }
);

app.post("/chat", async (req: any, res: any) => {
  try {
    const { query, file_name, socketId } = req.body;

    console.log("Received request:", { query, file_name, socketId });

    if (!query || !file_name || !socketId) {
      return res
        .status(400)
        .json({ error: "Query, file_name, and socketId are required." });
    }

    if (!userRetrievers[socketId]) {
      console.log(`No retriever found for socketId: ${socketId}`);
      return res.status(400).json({ error: "Upload files first." });
    }

    const userFiles = userRetrievers[socketId];

    if (file_name !== "Local Files" && !userFiles[file_name]) {
      console.log(
        `File not found for socketId: ${socketId}, file: ${file_name}`
      );
      return res.status(400).json({ error: "File not found." });
    }

    let retriever;

    if (file_name === "Local Files") {
      console.log("Querying all retrievers...");

      const vectorStores = Object.values(userFiles)
        .map((fileData: any) => fileData.vectorStore)
        .filter((store) => store);

      if (vectorStores.length === 0) {
        return res.status(400).json({ error: "No stored vector files found." });
      }

      retriever = new FunctionalRetriever(async (query: string) => {
        const results = await Promise.all(
          vectorStores.map((store: any) =>
            store.asRetriever({ k: 1 }).invoke(query)
          )
        );
        return results.flat();
      });
    } else {
      retriever = userFiles[file_name].vectorStore.asRetriever({ k: 1 });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Streaming LLM with callbacks (centralized helper)
    const streamingLLM = createChatGroq({
      streaming: true,
      callbacks: [
        {
          handleLLMNewToken(token: string) {
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          },
          handleLLMEnd() {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
          },
          handleLLMError(error: Error) {
            console.error("LLM Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
          },
        },
      ],
    });

    const chain = RetrievalQAChain.fromLLM(streamingLLM, retriever, {
      returnSourceDocuments: true,
    });

    await chain.call({ query });

  } catch (error) {
    console.error("Chat error:", error);
    res.write(`data: ${JSON.stringify({ error: "Server error." })}\n\n`);
    res.end();
  }
});


app.get("/", (req, res) => {
  console.log("hi");

  res.send("hi");
});


// Start server
server.listen(process.env.SERVERPORT ?? 4000, async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log("Connected to MongoDB");
    // await client.connect();
    console.log("connected to redis");
    console.log(
      `Server is running on http://localhost:${process.env.SERVERPORT ?? 4000}`
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
});

// Properly handle process exit
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Cleaning up...");
  await mongoose.disconnect(); // Close MongoDB connection
  await client.disconnect();
  console.log("Database connection closed");
  process.exit(0);
});
