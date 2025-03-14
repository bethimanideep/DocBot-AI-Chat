import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquare, Sparkles } from 'lucide-react';

interface WelcomeProps {
  onGetStarted: () => void;
}

export const Welcome = () => {
  return (
    <div className="relative min-h-screen pb-4">
      <div className="overflow-y-auto h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
        <div className="flex flex-col items-center justify-start text-center max-w-3xl mx-auto p-4 sm:p-6 md:p-8 mt-4 sm:mt-6 min-h-full">
          <div className="mb-4 sm:mb-6 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
              <div className="relative bg-white p-3 sm:p-4 rounded-full shadow-xl">
                <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Welcome to Drive Chat
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-700 mb-4 sm:mb-6 leading-relaxed px-2 sm:px-4">
            Your smart file companion that makes document conversations simple and productive.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 w-full px-2 sm:px-4">
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2" />
              <h3 className="text-base sm:text-lg font-semibold mb-1">Access Documents</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Easily find and interact with all your important files</p>
            </div>
            
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-2" />
              <h3 className="text-base sm:text-lg font-semibold mb-1">Chat with Files</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Ask questions and discuss any part of your documents</p>
            </div>
            
            <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-2" />
              <h3 className="text-base sm:text-lg font-semibold mb-1">Smart Insights</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Get summaries and key information automatically</p>
            </div>
          </div>
          
          <Button 
            className="px-5 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm sm:text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Upload Files
          </Button>
          
          <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-3 sm:mt-4 px-2 sm:px-4">
            Select any file from the sidebar to begin your document conversation
          </p>
        </div>
      </div>
    </div>
  );
};