/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, setDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Shield, Phone, AlertTriangle, Lightbulb, Send, ListPlus, X } from 'lucide-react';

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

interface SafetyPlanData {
  emergencyContacts: Contact[];
  triggers: string[];
  copingStrategies: string[];
  updatedAt: any;
}

interface SupportRequest {
  id: string;
  residentId: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: any;
}

interface SafetyPlanProps {
  houseId: string;
  residentId: string;
  isManager: boolean;
}

export const SafetyPlan = ({ houseId, residentId, isManager }: SafetyPlanProps) => {
  const [plan, setPlan] = useState<SafetyPlanData | null>(null);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlan, setEditPlan] = useState<SafetyPlanData>({
    emergencyContacts: [],
    triggers: [],
    copingStrategies: [],
    updatedAt: null
  });
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    const planRef = doc(db, `houses/${houseId}/safetyPlans`, residentId);
    const unsubscribePlan = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SafetyPlanData;
        setPlan(data);
        setEditPlan(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `houses/${houseId}/safetyPlans/${residentId}`);
    });

    const requestsRef = collection(db, `houses/${houseId}/supportRequests`);
    const q = query(requestsRef, orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportRequest[];
      setSupportRequests(requests);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `houses/${houseId}/supportRequests`);
    });

    return () => {
      unsubscribePlan();
      unsubscribeRequests();
    };
  }, [houseId, residentId]);

  const savePlan = async () => {
    const path = `houses/${houseId}/safetyPlans/${residentId}`;
    try {
      await setDoc(doc(db, path), {
        ...editPlan,
        residentId,
        houseId,
        updatedAt: Timestamp.now()
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const requestSupport = async () => {
    const path = `houses/${houseId}/supportRequests`;
    try {
      await addDoc(collection(db, path), {
        residentId,
        houseId,
        message: supportMessage,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setIsRequestingSupport(false);
      setSupportMessage('');
      alert('Support request sent to manager.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const resolveRequest = async (requestId: string) => {
    const path = `houses/${houseId}/supportRequests/${requestId}`;
    try {
      await updateDoc(doc(db, path), { status: 'resolved' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addItem = (listName: 'triggers' | 'copingStrategies', value: string) => {
    if (!value.trim()) return;
    setEditPlan(prev => ({
      ...prev,
      [listName]: [...(prev[listName] || []), value]
    }));
  };

  const removeItem = (listName: 'triggers' | 'copingStrategies', index: number) => {
    setEditPlan(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const addContact = (name: string, phone: string, rel: string) => {
    if (!name || !phone) return;
    setEditPlan(prev => ({
      ...prev,
      emergencyContacts: [...(prev.emergencyContacts || []), { name, phone, relationship: rel }]
    }));
  };

  const removeContact = (index: number) => {
    setEditPlan(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-red-600" />
          Crisis Safety Plan
        </h2>
        {!isManager && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Plan'}
            </button>
            <button 
              onClick={() => setIsRequestingSupport(true)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1"
            >
              <Send size={14} /> Request Support
            </button>
          </div>
        )}
      </div>

      {isRequestingSupport && (
        <div className="mb-6 p-4 border-2 border-red-100 bg-red-50 rounded-lg animate-in fade-in zoom-in duration-200">
          <h3 className="font-bold text-red-800 mb-2">Request Immediate Support</h3>
          <p className="text-sm text-red-700 mb-3">Your manager will be notified that you need support. Optional message below:</p>
          <textarea 
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="How can we help right now?"
            className="w-full p-2 border rounded text-sm mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button onClick={requestSupport} className="flex-grow py-2 bg-red-600 text-white rounded font-bold">Send Request</button>
            <button onClick={() => setIsRequestingSupport(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded font-bold">Cancel</button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><AlertTriangle size={16} className="text-orange-500" /> Triggers</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editPlan.triggers.map((t, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs">
                  {t} <button onClick={() => removeItem('triggers', i)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="trigger-input" 
                type="text" 
                placeholder="Add trigger..." 
                className="flex-grow p-1 border rounded text-sm" 
                onKeyDown={(e) => { if(e.key === 'Enter') { addItem('triggers', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
              />
              <button onClick={() => { const input = document.getElementById('trigger-input') as HTMLInputElement; addItem('triggers', input.value); input.value = ''; }} className="p-1 bg-gray-100 rounded text-gray-600"><ListPlus size={16} /></button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Lightbulb size={16} className="text-yellow-500" /> Coping Strategies</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {editPlan.copingStrategies.map((s, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                  {s} <button onClick={() => removeItem('copingStrategies', i)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                id="strategy-input" 
                type="text" 
                placeholder="Add strategy..." 
                className="flex-grow p-1 border rounded text-sm" 
                onKeyDown={(e) => { if(e.key === 'Enter') { addItem('copingStrategies', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
              />
              <button onClick={() => { const input = document.getElementById('strategy-input') as HTMLInputElement; addItem('copingStrategies', input.value); input.value = ''; }} className="p-1 bg-gray-100 rounded text-gray-600"><ListPlus size={16} /></button>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1"><Phone size={16} className="text-blue-500" /> Emergency Contacts</h3>
            <div className="space-y-2 mb-2">
              {editPlan.emergencyContacts.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-blue-50 text-blue-700 rounded text-xs">
                  <span>{c.name} ({c.relationship}) - {c.phone}</span>
                  <button onClick={() => removeContact(i)}><X size={12} /></button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1">
              <input id="contact-name" placeholder="Name" className="p-1 border rounded text-xs" />
              <input id="contact-phone" placeholder="Phone" className="p-1 border rounded text-xs" />
              <input id="contact-rel" placeholder="Relationship" className="p-1 border rounded text-xs" />
            </div>
            <button 
              onClick={() => {
                const n = document.getElementById('contact-name') as HTMLInputElement;
                const p = document.getElementById('contact-phone') as HTMLInputElement;
                const r = document.getElementById('contact-rel') as HTMLInputElement;
                addContact(n.value, p.value, r.value);
                n.value = ''; p.value = ''; r.value = '';
              }}
              className="mt-2 w-full py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold"
            >
              Add Contact
            </button>
          </section>

          <button onClick={savePlan} className="w-full py-2 bg-green-600 text-white rounded font-bold">Save Safety Plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <section className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1"><AlertTriangle size={14} /> My Triggers</h3>
              <ul className="list-disc list-inside text-xs text-orange-700 space-y-1">
                {plan?.triggers?.map((t, i) => <li key={i}>{t}</li>) || <li className="italic">No triggers listed</li>}
              </ul>
            </section>
            <section className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
              <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-1"><Lightbulb size={14} /> Coping Strategies</h3>
              <ul className="list-disc list-inside text-xs text-yellow-700 space-y-1">
                {plan?.copingStrategies?.map((s, i) => <li key={i}>{s}</li>) || <li className="italic">No strategies listed</li>}
              </ul>
            </section>
          </div>
          <div className="space-y-4">
            <section className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1"><Phone size={14} /> Emergency Contacts</h3>
              <div className="space-y-2">
                {plan?.emergencyContacts?.map((c, i) => (
                  <div key={i} className="text-xs text-blue-700 border-b border-blue-200 pb-1 last:border-0">
                    <div className="font-bold">{c.name} ({c.relationship})</div>
                    <div>{c.phone}</div>
                  </div>
                )) || <div className="text-xs italic text-blue-700">No contacts listed</div>}
              </div>
            </section>
            
            {isManager && (
              <section className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1"><Send size={14} /> Support Requests</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {supportRequests.length === 0 ? (
                    <p className="text-[10px] text-red-700 italic">No active requests</p>
                  ) : (
                    supportRequests.map(req => (
                      <div key={req.id} className={`p-2 rounded border ${req.status === 'pending' ? 'bg-white border-red-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-gray-500">Resident: {req.residentId.slice(0,8)}...</span>
                          {req.status === 'pending' && (
                            <button onClick={() => resolveRequest(req.id)} className="text-[10px] text-green-600 font-bold hover:underline">Mark Resolved</button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-700">{req.message || "No message provided"}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
