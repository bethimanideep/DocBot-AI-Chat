# DocBot AI Chat

![DocBot Logo](https://via.placeholder.com/150)  
*An intelligent document chat application powered by AI*

## 📋 Overview

DocBot AI Chat is a sophisticated document interaction platform that leverages large language models to enable natural language conversations with your documents. Upload various file types, including PDFs, and get instant, intelligent responses by querying the content using everyday language.

## ✨ Features

- **Document Upload & Processing**: Upload and process multiple document formats
- **Natural Language Queries**: Ask questions about your documents in plain English
- **Real-time Chat Interface**: Interactive chat interface with streaming responses
- **Document Context Awareness**: Maintains context from your documents during conversations
- **User Authentication**: Secure user accounts with OAuth integration (Google)
- **File Management**: Organize and manage your uploaded documents
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Document Search**: Quickly find relevant information across all your documents

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js with TypeScript
- **UI Components**: Custom UI library with shadcn/ui
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Real-time Updates**: Socket.IO

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **AI/ML**: LangChain, Groq
- **Vector Database**: Weaviate
- **Authentication**: Passport.js with JWT
- **File Processing**: pdf-parse, multer
- **Caching**: Redis
- **Database**: MongoDB with Mongoose

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MongoDB instance
- Redis server
- Weaviate instance
- Groq API key
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DocBot-AI-Chat.git
   cd DocBot-AI-Chat
   ```

2. **Set up environment variables**
   Create `.env` files in both `Frontend` and `Backend` directories with the required configurations.

   **Backend (.env)**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CLIENT_URL=http://localhost:3000
   ```

   **Frontend (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd Backend
   npm install

   # Install frontend dependencies
   cd ../Frontend
   npm install
   ```

4. **Start the development servers**
   ```bash
   # Start backend server (from Backend directory)
   npm run dev

   # Start frontend development server (from Frontend directory)
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Usage

1. **Sign up / Log in** using your Google account
2. **Upload documents** through the intuitive interface
3. **Ask questions** about your documents using natural language
4. **Get instant, accurate responses** based on the document content
5. **Manage your files** through the document library

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Next.js and modern web technologies
- Powered by Groq's lightning-fast LLM inference
- Inspired by the need for better document interaction

## 📧 Contact

For any inquiries or support, please contact [your-email@example.com](mailto:your-email@example.com)

---

<div align="center">
  Made with ❤️
</div>
