import React from 'react';

interface ContentAreaProps {
  activeFeature: string;
}

const ContentArea: React.FC<ContentAreaProps> = ({ activeFeature }) => {
  return (
    <div className="flex-1 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {activeFeature.charAt(0).toUpperCase() + activeFeature.slice(1)}
      </h1>
      {/* 在这里添加各个功能的组件 */}
    </div>
  );
};

export default ContentArea;