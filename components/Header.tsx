
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-sky-400">
          AI News Summarizer Dashboard
        </h1>
        <p className="text-sm text-gray-400">Automated News Aggregation & Analysis</p>
      </div>
    </header>
  );
};

export default Header;
