/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BookOpen, Plus, X, ExternalLink, Trash2, Briefcase, HeartPulse, Scale, Info } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'job' | 'medical' | 'legal' | 'recovery' | 'other';
  url: string;
  createdAt: any;
}

export const HouseResources = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other' as const,
    url: ''
  });

  useEffect(() => {
    const q = query(collection(db, `houses/${houseId}/resources`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
      setLoading(false);
    });
    return unsubscribe;
  }, [houseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `houses/${houseId}/resources`;
    try {
      await addDoc(collection(db, path), {
        ...formData,
        houseId,
        createdAt: Timestamp.now()
      });
      setFormData({ title: '', description: '', category: 'other', url: '' });
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteResource = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    const path = `houses/${houseId}/resources/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'job': return <Briefcase size={18} className="text-blue-500" />;
      case 'medical': return <HeartPulse size={18} className="text-red-500" />;
      case 'legal': return <Scale size={18} className="text-purple-500" />;
      case 'recovery': return <Info size={18} className="text-green-500" />;
      default: return <BookOpen size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-green-600 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen size={24} />
          Community Resources
        </h2>
        {isManager && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>

      <div className="p-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100 space-y-3">
            <input 
              placeholder="Title (e.g., Local Health Clinic)" 
              className="w-full p-2 text-sm border rounded-lg"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
            />
            <textarea 
              placeholder="Brief description..." 
              className="w-full p-2 text-sm border rounded-lg"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-3">
              <select 
                className="p-2 text-sm border rounded-lg bg-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
              >
                <option value="job">Employment</option>
                <option value="medical">Medical/Mental Health</option>
                <option value="legal">Legal/Probation</option>
                <option value="recovery">Recovery Support</option>
                <option value="other">Other</option>
              </select>
              <input 
                placeholder="URL (optional)" 
                className="p-2 text-sm border rounded-lg"
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
              Add Resource
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-gray-400">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <BookOpen size={48} className="mx-auto mb-2 opacity-20" />
            <p>No resources shared yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {resources.map((res) => (
              <div key={res.id} className="p-3 border rounded-lg flex items-start gap-3 hover:bg-gray-50 transition-colors relative group">
                <div className="mt-1">{getCategoryIcon(res.category)}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800">{res.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{res.description}</p>
                  {res.url && (
                    <a 
                      href={res.url.startsWith('http') ? res.url : `https://${res.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-green-600 hover:underline flex items-center gap-1 mt-2 font-bold"
                    >
                      <ExternalLink size={10} /> Visit Website
                    </a>
                  )}
                </div>
                {isManager && (
                  <button 
                    onClick={() => deleteResource(res.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
