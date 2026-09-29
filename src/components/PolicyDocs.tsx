/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { FileText, Folder, ExternalLink, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink: string;
}

export const PolicyDocs = () => {
  const { accessToken } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('name contains "Policy" or name contains "House" or name contains "Rule"');

  const fetchFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(searchQuery);
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink,iconLink)&pageSize=10`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please sign in again.');
        } else {
          throw new Error('Failed to fetch files from Google Drive');
        }
        return;
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Drive error:', err);
      setError('Unable to access Google Drive. Check your connection or permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchFiles();
    }
  }, [accessToken]);

  if (!accessToken) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
        <AlertCircle className="text-amber-500 mb-2" size={32} />
        <h3 className="font-bold text-gray-800">Workspace Not Connected</h3>
        <p className="text-sm text-gray-500 max-w-xs mt-1">
          Sign in with Google to access house policy documents and forms directly from Google Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Folder className="text-indigo-600" />
          House Policy & Docs
        </h2>
        <button 
          onClick={fetchFiles}
          disabled={loading}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="Refresh files"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4">
        {error ? (
          <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : loading && files.length === 0 ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 text-sm">No policy documents found in your Google Drive.</p>
            <p className="text-xs text-gray-400 mt-1 italic">Searching for files with "Policy", "House", or "Rule" in the name.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded group-hover:bg-white">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{file.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{file.mimeType.split('.').pop()}</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300 group-hover:text-indigo-600" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-inner">
          <Search size={14} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search Drive..."
            className="text-xs bg-transparent outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
          />
        </div>
      </div>
    </div>
  );
};
