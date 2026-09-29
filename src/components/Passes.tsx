/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Ticket, Plus, Check, X, Clock, Calendar, MessageSquare, AlertCircle } from 'lucide-react';

interface PassRequest {
  id: string;
  residentId: string;
  houseId: string;
  type: 'local' | 'overnight' | 'travel';
  reason: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'denied';
  managerNote?: string;
  createdAt: any;
}

interface PassesProps {
  houseId: string;
  residentId: string;
  isManager: boolean;
}

export const Passes = ({ houseId, residentId, isManager }: PassesProps) => {
  const [passes, setPasses] = useState<PassRequest[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'local' as const,
    reason: '',
    startTime: '',
    endTime: ''
  });
  
  // Manager Response State
  const [responseNote, setResponseNote] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const passesRef = collection(db, `houses/${houseId}/passRequests`);
    // If manager, see all for the house. If resident, see only their own.
    const q = isManager 
      ? query(passesRef, orderBy('createdAt', 'desc'))
      : query(passesRef, where('residentId', '==', residentId), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PassRequest)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching passes:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [houseId, residentId, isManager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `houses/${houseId}/passRequests`;
    try {
      await addDoc(collection(db, path), {
        ...formData,
        residentId,
        houseId,
        status: 'pending',
        createdAt: Timestamp.now().toDate().toISOString()
      });
      setShowAddForm(false);
      setFormData({ type: 'local', reason: '', startTime: '', endTime: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDecide = async (passId: string, status: 'approved' | 'denied') => {
    const path = `houses/${houseId}/passRequests/${passId}`;
    try {
      await updateDoc(doc(db, path), {
        status,
        managerNote: responseNote[passId] || ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Ticket size={24} />
          Overnight & Travel Passes
        </h2>
        {!isManager && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
          >
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
            {showAddForm ? 'Cancel' : 'Request Pass'}
          </button>
        )}
      </div>

      <div className="p-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
              <Plus size={18} /> New Pass Request
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pass Type</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-white"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  required
                >
                  <option value="local">Local (Day Pass)</option>
                  <option value="overnight">Overnight Stay</option>
                  <option value="travel">Out-of-Town Travel</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason</label>
                <input 
                  type="text"
                  placeholder="e.g. Visiting family, work trip"
                  className="w-full p-2 border rounded-lg"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Departure Date & Time</label>
                <input 
                  type="datetime-local"
                  className="w-full p-2 border rounded-lg"
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Return Date & Time</label>
                <input 
                  type="datetime-local"
                  className="w-full p-2 border rounded-lg"
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-md">
              Submit Request for Review
            </button>
          </form>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading passes...</div>
          ) : passes.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <Ticket size={48} className="text-gray-200 mb-2" />
              <p className="text-gray-500">No pass requests found.</p>
            </div>
          ) : (
            passes.map((pass) => (
              <div key={pass.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white relative group">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pass.type === 'overnight' ? 'bg-purple-100 text-purple-700' :
                        pass.type === 'travel' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {pass.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pass.status === 'approved' ? 'bg-green-100 text-green-700' :
                        pass.status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pass.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg">{pass.reason}</h4>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-indigo-400" />
                        <span>Out: {new Date(pass.startTime).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-indigo-400" />
                        <span>In: {new Date(pass.endTime).toLocaleString()}</span>
                      </div>
                    </div>
                    {pass.managerNote && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-indigo-400 flex items-start gap-2">
                        <MessageSquare size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-indigo-900 uppercase">Manager Note</p>
                          <p className="text-sm text-gray-700 italic">"{pass.managerNote}"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isManager && pass.status === 'pending' && (
                    <div className="shrink-0 flex flex-col gap-2 min-w-[200px]">
                      <textarea 
                        placeholder="Add a note (optional)..."
                        className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                        rows={2}
                        value={responseNote[pass.id] || ''}
                        onChange={e => setResponseNote({...responseNote, [pass.id]: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDecide(pass.id, 'approved')}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-700 transition-colors"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleDecide(pass.id, 'denied')}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-700 transition-colors"
                        >
                          <X size={14} /> Deny
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 border-t flex items-start gap-2">
        <AlertCircle size={16} className="text-gray-400 mt-0.5" />
        <p className="text-[10px] text-gray-400 leading-tight uppercase font-bold tracking-wider">
          Overnight and travel passes require at least 24-hour notice and manager approval. 
          Unapproved travel is a violation of house terms.
        </p>
      </div>
    </div>
  );
};
