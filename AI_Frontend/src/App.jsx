import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const [user] = useState({
    id: 'agent_user_001',
    email: 'user@example.com'
  });

  return (
    <ErrorBoundary>
      <div className="dark">
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#334155',
              color: '#e2e8f0',
            },
          }}
        />
        <div className="h-screen w-screen bg-gray-900 text-white flex overflow-hidden">
          <Sidebar user={user} />
          
          <div className="flex-1 flex flex-col">
            <header className="border-b border-gray-700 bg-gray-800/50 px-6 py-4">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                🗳️ Voter Registration AI
              </h1>
            </header>
            <ChatWindow user={user} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;