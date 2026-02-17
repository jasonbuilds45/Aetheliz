
import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-background-light dark:bg-background-dark flex flex-col items-center justify-center gap-4 z-[9999]">
      <div className="bg-primary text-white size-12 rounded-xl flex items-center justify-center shadow-xl shadow-primary/20 animate-bounce">
        <span className="material-symbols-outlined text-3xl">analytics</span>
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-bold text-primary italic uppercase tracking-widest">Aetheliz</h2>
        <div className="flex items-center gap-2 mt-4">
          <div className="size-2 bg-primary rounded-full animate-pulse"></div>
          <div className="size-2 bg-primary rounded-full animate-pulse [animation-delay:200ms]"></div>
          <div className="size-2 bg-primary rounded-full animate-pulse [animation-delay:400ms]"></div>
        </div>
      </div>
    </div>
  );
};
