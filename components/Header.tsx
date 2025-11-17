
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center border-b-2 border-slate-700 pb-6">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
        Circular Bias Detection
      </h1>
      <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
        This tool analyzes text to identify circular reasoning, where a conclusion is drawn from a premise that itself relies on the conclusion. Paste generated and reference texts below to get a circularity score and explanation.
      </p>
    </header>
  );
};

export default Header;
