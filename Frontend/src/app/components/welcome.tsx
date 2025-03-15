import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Sparkles } from 'lucide-react';

interface WelcomeProps {
  onGetStarted: () => void;
}

export const Welcome = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto p-8">
      <div className="mb-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
          <div className="relative bg-white p-4 rounded-full shadow-xl">
            <MessageSquare className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Welcome to Drive Chat
      </h1>
      
      <p className="text-xl text-gray-700 mb-8 leading-relaxed">
        Your smart file companion that makes document conversations simple and productive.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <FileText className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Access Documents</h3>
          <p className="text-gray-600">Easily find and interact with all your important files</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <MessageSquare className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Chat with Files</h3>
          <p className="text-gray-600">Ask questions and discuss any part of your documents</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <Sparkles className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Smart Insights</h3>
          <p className="text-gray-600">Get summaries and key information automatically</p>
        </div>
      </div>
      
      <Button 
        className="px-8 py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Upload Files
      </Button>
      
      <p className="text-gray-500 mt-6">
        Select any file from the sidebar to begin your document conversation
      </p>
    </div>
  );
};