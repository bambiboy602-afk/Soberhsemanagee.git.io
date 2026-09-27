import React from 'react';
import { Video } from 'lucide-react';

export const VideoLinks = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Video className="text-blue-600" /> Video/Telehealth Links
      </h2>
      <div className="space-y-2">
        <a href="#" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Zoom Meeting (Placeholder)</a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Teams Meeting (Placeholder)</a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">Telehealth Portal (Placeholder)</a>
      </div>
    </div>
  );
};
