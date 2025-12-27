
import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
} | null>(null);

export const Tabs: React.FC<{ defaultValue: string; children: React.ReactNode; className?: string }> = ({ defaultValue, children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`flex p-1 rounded-md ${className}`}>{children}</div>;
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  const isActive = context?.activeTab === value;
  return (
    <button
      onClick={() => context?.setActiveTab(value)}
      className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all rounded ${
        isActive ? 'bg-[#ccff00] text-black' : 'text-neutral-400 hover:text-white'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (context?.activeTab !== value) return null;
  return <div className={className}>{children}</div>;
};
