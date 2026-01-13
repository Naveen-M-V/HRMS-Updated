import React from 'react';
import {
  ClipboardDocumentIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  const getIcon = (tabId) => {
    const icons = {
      'assigned': ClipboardDocumentIcon,
      'all-courses': BookOpenIcon,
      'assignment': DocumentTextIcon,
      'reporting': ChartBarIcon,
      'permissions': ShieldCheckIcon,
      'documents': DocumentTextIcon
    };
    return icons[tabId] || BookOpenIcon;
  };

  return (
    <div className="px-6 border-b border-gray-200">
      <div className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = getIcon(tab.id);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
