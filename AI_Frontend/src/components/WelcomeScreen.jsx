import React from 'react';
import { UserCheck, Search, FileText, HelpCircle } from 'lucide-react';

const WelcomeScreen = ({ onSendMessage }) => {
  const suggestions = [
    {
      icon: UserCheck,
      title: 'Register as Voter',
      desc: 'Start voter registration',
      msg: 'I want to register as a voter'
    },
    {
      icon: FileText,
      title: 'Check Status',
      desc: 'Track your application',
      msg: 'Check my registration status'
    },
    {
      icon: Search,
      title: 'Search Voter ID',
      desc: 'Find your information',
      msg: 'Search my voter ID'
    },
    {
      icon: HelpCircle,
      title: 'Get Help',
      desc: 'Ask for assistance',
      msg: 'I need help with registration'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Welcome to Bharat Voter Portal
      </h1>
      <p className="text-gray-400 text-center max-w-2xl mb-12">
        I'm here to help you with voter registration, checking status, and answering questions!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(s.msg)}
            className="p-4 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg border border-slate-600 text-left transition-all hover:scale-105"
          >
            <div className="flex gap-3">
              <s.icon className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;