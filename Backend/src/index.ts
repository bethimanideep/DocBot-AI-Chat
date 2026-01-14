import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { llm } from "./config/llm";
import multer from "multer";
import { TokenTextSplitter } from "@langchain/textsplitters";
import mongoose from "mongoose";
import { RetrievalQAChain } from "@langchain/classic/chains";
import cors from "cors";
// import weaviate from "weaviate-ts-client";
import router from "./routes/auth";
import passport from "passport";
import cookieParser from "cookie-parser";
import { GoogleDriveFile, User, UserFile } from "./models/schema";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { Document } from "@langchain/core/documents";
import { BaseRetriever } from "@langchain/core/retrievers";
import { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
// Endpoint to handle multiple file uploads
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import mammoth from "mammoth";
import { PineconeStore } from "@langchain/pinecone";

import { Pinecone } from '@pinecone-database/pinecone'
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})


const INDEX_NAME = "cwd"
const DIMENSION = 768
const METRIC = "cosine"

const app = express();
app.use(
  cors({
    origin: true, // Explicitly allow frontend URL
    credentials: true, // Allow cookies and authentication headers
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());


app.use("/auth", router);

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

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  model: "text-embedding-004", // Updated to newer model
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

// Validate embeddings configuration
const validateEmbeddings = async () => {
  try {
    const testEmbedding = await embeddings.embedQuery("test");

    return true;
  } catch (error) {
    console.error("Embeddings configuration error:", error);
    return false;
  }
};








app.post("/visit", async (req, res) => {
  try {
    // Upsert single VisitStat doc with key 'site' and increment atomically
    const result = await (await import("./models/schema")).VisitStat.findOneAndUpdate(
      { key: "site" },
      { $inc: { totalVisits: 1 } },
      { upsert: true, new: true }
    ).exec();

    // return new count and set active users to 0 since Socket.IO is removed
    const activeCount = 0;
    res.json({ totalVisits: result.totalVisits, activeUsers: activeCount });
  } catch (error) {
    console.error("/visit error:", error);
    res.status(500).json({ error: "Failed to record visit" });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const VisitStat = (await import("./models/schema")).VisitStat;
    const stat = await VisitStat.findOne({ key: "site" }).lean().exec();
    const total = stat ? stat.totalVisits : 0;
    res.json({ totalVisits: total });
  } catch (error) {
    console.error("/stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Use an environment-configurable model name to avoid hardcoding a model that may be
// decommissioned. Set GROQ_MODEL in your environment to a supported model name.
// NOTE: We require an explicit GROQ_MODEL to avoid accidental use of an invalid
// default that may not exist or be accessible for your account.
// Moved to src/config/llm.ts


// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to process PDFs: extract text and chunk it
async function processPdf(fileBuffer: Buffer): Promise<string[]> {
  const parser = new PDFParse({ data: fileBuffer });
  let text = "";

  try {
    // First attempt: Extract text directly from PDF
    const result = await parser.getText();
    text = result.text || "";
  } catch (err) {

  }

  // Fallback to OCR if text extraction failed or text is too short
  if (!text || text.trim().length < 20) {


    try {
      const screenshot = await parser.getScreenshot({
        scale: 1.5,
        imageBuffer: true,
        imageDataUrl: false
      });

      text = "";

      for (const page of screenshot.pages) {
        // Convert Uint8Array to Buffer if needed
        const img = Buffer.isBuffer(page.data)
          ? page.data
          : Buffer.from(page.data);

        const result = await Tesseract.recognize(img, "eng");
        text += result.data.text + "\n\n";
      }
    } catch (ocrError) {
      console.error("OCR processing failed:", ocrError);
      throw new Error("Failed to extract text from PDF using OCR");
    }
  }

  await parser.destroy();

  // Validate extracted text
  if (!text || text.trim().length < 20) {
    throw new Error("Extracted text is empty or too short");
  }
  // Split text into chunks
  const splitter = new TokenTextSplitter({
    encodingName: "gpt2",
    chunkSize: 1000, // Reduced from 7500 to stay within Pinecone metadata limit
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}

// Function to process images: perform OCR using Tesseract and chunk the resulting text
async function processImage(fileBuffer: Buffer): Promise<string[]> {
  try {
    // Run Tesseract OCR on the image buffer
    const result = await Tesseract.recognize(fileBuffer, "eng");
    const text = result.data?.text || "";

    if (!text || text.trim().length < 20) {
      throw new Error("Extracted text is empty or too short from image");
    }

    // Use the same token splitter as PDFs to create chunks
    const splitter = new TokenTextSplitter({
      encodingName: "gpt2",
      chunkSize: 1000, // Reduced from 7500 to stay within Pinecone metadata limit
      chunkOverlap: 100,
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((d) => d.pageContent);
  } catch (err) {
    console.error("Error processing image with OCR:", err);
    throw new Error("Failed to extract text from image using OCR");
  }
}

// Function to process Word documents (DOCX/DOC) using mammoth
async function processDocx(fileBuffer: Buffer): Promise<string[]> {
  try {
    // Validate file size
    if (fileBuffer.length < 100) {
      throw new Error("File is too small to be a valid document");
    }

    // mammoth.extractRawText accepts {buffer: <Buffer>}
    const result = await mammoth.extractRawText({ buffer: fileBuffer as any });
    const text = result.value || "";

    if (!text || text.trim().length < 20) {
      throw new Error("Extracted text is empty or too short from docx");
    }

    const splitter = new TokenTextSplitter({
      encodingName: "gpt2",
      chunkSize: 1000, // Reduced from 7500 to stay within Pinecone metadata limit
      chunkOverlap: 100,
    });

    const docs = await splitter.createDocuments([text]);
    return docs.map((d) => d.pageContent);
  } catch (err: any) {
    console.error("Error processing docx with mammoth:", err);

    // Provide more specific error messages
    if (err.message && err.message.includes("end of central directory")) {
      throw new Error("Invalid or corrupted DOCX file. Please ensure the file is a valid Microsoft Word document.");
    } else if (err.message && err.message.includes("zip file")) {
      throw new Error("The uploaded file is not a valid DOCX file. DOCX files are ZIP archives - this file appears to be corrupted or in the wrong format.");
    } else {
      throw new Error(`Failed to extract text from document: ${err.message || 'Unknown error'}`);
    }
  }
}

app.get('/gdrive/sync', async (req: any, res: any) => {
  try {
    const { fileId, userId } = req.query as { fileId: string; userId: string };
    const DriveAccessToken = req.cookies.DriveAccessToken as string;

    // Initialize Google Drive client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
    oauth2Client.setCredentials({ access_token: DriveAccessToken });
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

    // Choose processor according to mime type
    const mimeType = fileMetadata.mimeType || "";
    let chunks: string[];

    if (mimeType === "application/pdf") {
      // Process PDF and generate embeddings
      chunks = await processPdf(fileBuffer);
    } else if (mimeType.startsWith("image/")) {
      // Process image using OCR
      chunks = await processImage(fileBuffer);
    } else if (
      // Word mime types (uploaded .docx/.doc)
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType === "application/msword" ||
      // Some drives may not set mimeType consistently; fall back to filename extension
      (fileMetadata.name && fileMetadata.name.toLowerCase().endsWith('.docx')) ||
      (fileMetadata.name && fileMetadata.name.toLowerCase().endsWith('.doc'))
    ) {
      // Process Word document (DOCX/DOC) using mammoth
      chunks = await processDocx(fileBuffer);
    } else if (mimeType === 'application/vnd.google-apps.document') {
      // Google Docs: export to a supported format (try DOCX first, fallback to plain text)
      try {
        const exportRes = await drive.files.export({ fileId, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, { responseType: 'arraybuffer' });
        const exportBuf = Buffer.from(exportRes.data as ArrayBuffer);
        chunks = await processDocx(exportBuf);
      } catch (exportErr) {
        console.warn('DOCS export to DOCX failed, falling back to plain text export:', exportErr);
        try {
          const exportTxtRes = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'arraybuffer' });
          const textBuf = Buffer.from(exportTxtRes.data as ArrayBuffer);
          const text = textBuf.toString('utf8');

          if (!text || text.trim().length < 20) {
            throw new Error('Exported text from Google Doc is empty or too short');
          }

          const splitter = new TokenTextSplitter({
            encodingName: 'gpt2',
            chunkSize: 1000, // Reduced from 7500 to stay within Pinecone metadata limit
            chunkOverlap: 100,
          });
          const docs = await splitter.createDocuments([text]);
          chunks = docs.map((d) => d.pageContent);
        } catch (txtErr) {
          console.error('Failed to export Google Doc as text:', txtErr);
          return res.status(400).json({ message: `Unsupported or empty Google Doc export for fileId: ${fileId}` });
        }
      }
    } else {
      return res.status(400).json({ message: `Unsupported mime type: ${mimeType}` });
    }

    const embeddingsArray = await embeddings.embedDocuments(chunks);

    // Validate embeddings array
    if (!embeddingsArray || embeddingsArray.length === 0) {
      throw new Error(`Failed to generate embeddings for Google Drive file: ${fileMetadata.name}`);
    }

    // Check if embeddings have correct dimensions
    const embeddingDimension = embeddingsArray[0].length;
    if (embeddingDimension === 0) {
      throw new Error(`Embeddings have zero dimension for Google Drive file: ${fileMetadata.name}. Check API configuration.`);
    }



    // Initialize Pinecone index
    const index = pinecone.Index(INDEX_NAME);

    // Delete existing Pinecone vectors for this file
    try {
      // Query to find vectors with matching metadata
      const queryResponse = await index.query({
        vector: embeddingsArray[0], // Use first embedding as query
        topK: 1000, // Set high enough to get all vectors
        filter: {
          fileId: { $eq: existingFile._id.toString() }
        },
        includeMetadata: true
      });

      // Delete the found vectors
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const idsToDelete = queryResponse.matches.map(match => match.id);
        await index.deleteMany(idsToDelete);
      }
    } catch (deleteError) {
      console.warn("Error deleting existing vectors, may be first sync:", deleteError);
    }

    // Prepare vectors for upsert to Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${existingFile._id.toString()}-${i}-${Date.now()}`,
      values: embeddingsArray[i],
      metadata: {
        fileId: fileId,
        file_name: fileMetadata.name || 'unknown', // Ensure not null/undefined
        timestamp: new Date().toISOString(),
        chunk_index: i,
        text: chunk,
        userId: userId,
        sourceType: "Gdrive",
      }
    }));

    // Upsert vectors to Pinecone
    await index.upsert(vectors);

    // Mark as synced after successful processing
    const updatedFile: any = await GoogleDriveFile.findByIdAndUpdate(
      existingFile._id,
      { synced: true },
      { new: true }
    );


    res.json({
      success: true,
      message: "File synced successfully",
      chunksProcessed: chunks.length,
      pineconeVectorsUpserted: vectors.length,
      fileData: {
        id: fileId,
        filename: fileMetadata.name,
        synced: true,
        chunkCount: chunks.length
      }
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


  req.files.forEach((file: any, index: number) => {

  });

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



    // Validate embeddings configuration before processing

    const embeddingsValid = await validateEmbeddings();
    if (!embeddingsValid) {

      return res.status(500).json({
        message: "Embeddings service configuration error. Please check your API keys."
      });
    }



    // Initialize Pinecone index
    const index = pinecone.Index(INDEX_NAME);


    // Store all vectors to upsert in a single array
    const allVectors: any[] = [];
    const processedFiles: any[] = [];

    for (let file of req.files) {


      // Save file metadata to MongoDB
      const fileMetadata = await UserFile.create({
        userId,
        filename: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      const fileId = fileMetadata._id.toString();


      let chunks: string[] = [];

      // Process files based on type

      if (file.mimetype === "application/pdf") {

        chunks = await processPdf(file.buffer);
      } else if (file.mimetype.startsWith("image/")) {

        chunks = await processImage(file.buffer);
      } else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword" ||
        file.originalname.toLowerCase().endsWith('.docx') ||
        file.originalname.toLowerCase().endsWith('.doc')
      ) {

        chunks = await processDocx(file.buffer);
      } else {

        // Unsupported file type
        return res.status(400).json({
          message: `Unsupported file type for ${file.originalname}. Only PDFs, images and Word documents are allowed.`
        });
      }



      // Generate embeddings for all chunks

      const embeddingsArray = await embeddings.embedDocuments(chunks);

      // Validate embeddings array
      if (!embeddingsArray || embeddingsArray.length === 0) {

        throw new Error(`Failed to generate embeddings for ${file.originalname}`);
      }

      // Check if embeddings have correct dimensions
      const embeddingDimension = embeddingsArray[0].length;
      if (embeddingDimension === 0) {

        throw new Error(`Embeddings have zero dimension for ${file.originalname}. Check API configuration.`);
      }



      // Create Pinecone vectors

      const fileVectors = chunks.map((chunk, i) => ({
        id: `${fileId}-${i}-${Date.now()}`,
        values: embeddingsArray[i],
        metadata: {
          fileId: fileId,
          file_name: file.originalname,
          timestamp: new Date().toISOString(),
          chunk_index: i,
          text: chunk,
          userId: userId,
          sourceType: "Local Files",
        }
      }));

      // Add to our collection of vectors
      allVectors.push(...fileVectors);
      processedFiles.push({
        fileId,
        filename: file.originalname,
        chunksProcessed: chunks.length
      });

    }

    // Upsert all vectors to Pinecone in batches (if there are any)
    if (allVectors.length > 0) {

      // Batch upsert to handle large numbers of vectors
      const batchSize = 100;
      const totalBatches = Math.ceil(allVectors.length / batchSize);

      for (let i = 0; i < allVectors.length; i += batchSize) {
        const batch = allVectors.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        await index.upsert(batch);
      }



      // Update file metadata to mark as processed

      for (const file of processedFiles) {
        await UserFile.findByIdAndUpdate(
          file.fileId,
          { processed: true, synced: true }
        );

      }
    } else {

    }


    const fileList = await UserFile.find({ userId });



    res.json({
      message: "Files processed and embeddings stored successfully in Pinecone",
      fileList,
      summary: {
        totalVectorsStored: allVectors.length,
        filesProcessed: processedFiles.length,
        processedFiles: processedFiles.map(f => ({
          filename: f.filename,
          chunks: f.chunksProcessed
        }))
      }
    });
  } catch (error: any) {
    console.error("❌ Error processing files:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      message: "Error processing files",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint to delete all data in the pineconeIndex
app.delete("/delete", async (req, res) => {
  const className = "Cwd"; // Replace with your actual class name

  try {
    // Check if index exists
    const existing = await pinecone.listIndexes()
    // Delete the whole index
    await pinecone.deleteIndex(INDEX_NAME)


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

app.post("/userlocalfiles", async (req: any, res: any) => {
  try {
    const { query, userId, sourceType } = req.body;

    if (!query || !userId || !sourceType) {
      return res.status(400).json({ message: "Query, userId, and sourceType are required" });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initialize Pinecone index
    const index = pinecone.Index(INDEX_NAME);

    // Create a custom retriever with Pinecone
    const retriever = new FunctionalRetriever(async (queryText: string) => {
      const queryEmbedding = await embeddings.embedQuery(queryText);

      // Query Pinecone with metadata filter
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true,
        filter: {
          $and: [
            { userId: { $eq: userId } },
            { sourceType: { $eq: sourceType } }
          ]
        }
      });

      const documents = queryResponse.matches || [];
      return documents.map((match: any) => new Document({
        pageContent: match.metadata?.text || "",
        metadata: {
          file_name: match.metadata?.file_name,
          fileId: match.metadata?.fileId,
          timestamp: match.metadata?.timestamp,
          score: match.score,
        },
      }));
    });

    // Create a streaming LLM instance
    const streamingLLM = llm({
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
    await chain.call({
      query: query,
    });

  } catch (error) {
    console.error("Search error:", error);

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: "Error processing your request" })}\n\n`
      );
      res.end();
    }
  }
});

app.post("/userfilechat", async (req: any, res: any) => {
  try {
    const { query, fileId, userId } = req.body;

    if (!query || !fileId) {
      return res.status(400).json({ message: "Query and fileId are required" });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initialize Pinecone index
    const index = pinecone.Index(INDEX_NAME);

    // Create vector store from Pinecone
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "text",
    });

    // Create retriever with fileId filter
    const retriever = vectorStore.asRetriever({
      k: 2,
      filter: { fileId: { $eq: fileId }, userId: { $eq: userId } }
    });

    // Create a streaming LLM instance
    const streamingLLM = llm({
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
    await chain.call({
      query: query,
    });

  } catch (error) {
    console.error("Search error:", error);

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ error: "Error processing your request" })}\n\n`
      );
      res.end();
    }
  }

});


app.get("/createIndex", async (req: any, res: any) => {
  try {
    const existing = await pinecone.listIndexes()

    const indexExists = existing.indexes?.some(
      (idx) => idx.name === INDEX_NAME
    )

    if (!indexExists) {
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: DIMENSION,
        metric: METRIC,
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      })

      res.status(201).json({
        message: "Index created successfully",
        index: INDEX_NAME,
        dimension: DIMENSION,
        metric: METRIC,
      })


    } else {

      res.status(201).json({
        message: "Index already exists",
        index: INDEX_NAME,
      })
    }
  } catch (error) {
    console.error("Error creating Pinecone index:", error)
    res.status(500).json("Error creating Pinecone index:", error)

  }
});

app.get("/getAllData", async (req: any, res: any) => {
  try {
    const index = pinecone.Index(INDEX_NAME);
    const result = await index.query({
      vector: new Array(DIMENSION).fill(0),
      topK: 1000,                      // max records you want back
      includeMetadata: true,
      includeValues: true,             // this returns the vector
    });

    // Normalize response similar to Weaviate output
    const formatted = result.matches?.map(match => ({
      id: match.id,
      ...match.metadata,
      vector: match.values,
      score: match.score,
    }));

    res.send(formatted);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).send("Failed to retrieve data");
  }
});


app.post(
  "/myuserupload",
  upload.array("files", 10),
  async (req: any, res: any) => {
    try {
      const socketId = req.query.socketId;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded." });
      }





      const index = pinecone.Index(INDEX_NAME);

      // ❌ No namespace here
      const store = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        textKey: "text",
      });

      for (const file of files) {


        let chunks: string[] = [];

        if (file.mimetype === "application/pdf") {
          chunks = await processPdf(file.buffer);
        } else if (file.mimetype.startsWith("image/")) {
          chunks = await processImage(file.buffer);
        } else if (
          file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.mimetype === "application/msword" ||
          file.originalname.toLowerCase().endsWith(".docx") ||
          file.originalname.toLowerCase().endsWith(".doc")
        ) {
          chunks = await processDocx(file.buffer);
        } else {
          return res.status(400).json({
            message: `Unsupported file type for ${file.originalname}`,
          });
        }

        if (!chunks || chunks.length === 0) {
          return res.status(400).json({
            message: `The file ${file.originalname} is empty or unreadable.`,
          });
        }


        const vectors = await embeddings.embedDocuments(chunks);

        const documents = chunks.map((chunk, i) => ({
          pageContent: chunk,
          metadata: {
            FileId: socketId,
            sourceType: "upload",
            file_name: file.originalname,
            chunk_index: i,
            mimeType: file.mimetype,
            fileSize: file.size,
          },
        }));

        await store.addVectors(vectors, documents);

      }

      // Alternative: Using similaritySearch if your PineconeStore supports it
      const filter = { FileId: socketId, sourceType: "upload" };
      const userDocs = await store.similaritySearch("", 10000, filter); // Empty string to get all

      const fileMap = new Map();
      userDocs.forEach((doc: any) => {
        const fileName = doc.metadata.file_name;
        if (!fileMap.has(fileName)) {
          fileMap.set(fileName, {
            filename: fileName,
            _id: doc.metadata._id,
            mimeType: doc.metadata.mimeType,
            fileSize: doc.metadata.fileSize,
          });
        }
      });
      const fileList = Array.from(fileMap.values());
      console.log(fileList);

      res.status(200).json({
        message: "Files uploaded and processed successfully.",
        fileList,
      });
    } catch (error: any) {
      console.error("❌ Error in MyUserUpload:", error);
      res.status(500).json({ message: "Error processing files." });
    }
  }
);



app.post("/chat", async (req: any, res: any) => {
  try {
    const { query, file_name, socketId } = req.body;

    if (!query || !file_name) {
      return res
        .status(400)
        .json({ error: "Query and file_name are required." });
    }

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const index = pinecone.Index(INDEX_NAME);

    // ❌ No namespace here
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "text",
    });

    const retriever =
      file_name === "Local Files"
        ? vectorStore.asRetriever({
          k: 3,
          filter: {
            sourceType: { $eq: "upload" },
            FileId: { $eq: socketId },
          },
        })
        : vectorStore.asRetriever({
          k: 3,
          filter: {
            $and: [
              { sourceType: { $eq: "upload" } },
              { file_name: { $eq: file_name } },
              { FileId: { $eq: socketId } },
            ],
          },
        });

    const streamingLLM = llm({
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
    console.error("❌ Chat error:", error);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "Server error." })}\n\n`);
      res.end();
    }
  }
});



app.get("/", (req, res) => {

  res.send("hi");
});


app.get("/files", async (req: any, res: any) => {
  try {
    // 1. Check if token cookie exists
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: Token not provided",
      });
    }

    let decoded: any;
    try {
      // 2. Verify token
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err: any) {
      // Token exists but is invalid / expired
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Session expired. Please login again.",
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "Invalid token. Please login again.",
        });
      }

      return res.status(401).json({
        error: "Unauthorized",
      });
    }


    // 3. Validate decoded payload
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: "Unauthorized: Invalid token payload",
      });
    }

    // 4. Fetch files
    const files = await UserFile.find({ userId: decoded.userId });

    res.json({ files });
  } catch (error) {
    console.error("Error in /files:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});




// Start server
app.listen(process.env.SERVERPORT ?? 4000, async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log(`Server is running on http://localhost:${process.env.SERVERPORT ?? 4000}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
});

// Properly handle process exit
process.on("SIGINT", async () => {

  await mongoose.disconnect(); // Close MongoDB connection

  process.exit(0);
});
