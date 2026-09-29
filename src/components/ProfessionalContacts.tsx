/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Contact, Plus, X, Phone, Mail, User, Trash2, ShieldCheck, Globe } from 'lucide-react';

interface ProfContact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  notes?: string;
  residentId?: string;
  houseId: string;
  isPublic: boolean;
}

export const ProfessionalContacts = ({ houseId, residentId, isManager }: { houseId: string; residentId: string; isManager: boolean }) => {
  const [contacts, setContacts] = useState<ProfContact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    notes: '',
    isPublic: false
  });

  useEffect(() => {
    // If manager, see all house-wide + resident-specific.
    // If resident, see house-wide + only their own.
    const q = isManager 
      ? query(collection(db, `houses/${houseId}/professionalContacts`))
      : query(collection(db, `houses/${houseId}/professionalContacts`), 
          where('isPublic', '==', true));

    // For residents we also need their specific ones, so we combine in state
    const unsubPublic = onSnapshot(q, (snapshot) => {
      const publicData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfContact));
      setContacts(publicData);
      setLoading(false);
    });

    // If resident, also get their private ones
    let unsubPrivate = () => {};
    if (!isManager) {
      const qPrivate = query(collection(db, `houses/${houseId}/professionalContacts`), 
        where('residentId', '==', residentId),
        where('isPublic', '==', false));
      unsubPrivate = onSnapshot(qPrivate, (snapshot) => {
        const privateData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfContact));
        setContacts(prev => {
          const combined = [...prev, ...privateData];
          // Simple dedupe by id
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
      });
    }

    return () => { unsubPublic(); unsubPrivate(); };
  }, [houseId, residentId, isManager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `houses/${houseId}/professionalContacts`;
    try {
      await addDoc(collection(db, path), {
        ...formData,
        houseId,
        residentId: formData.isPublic ? null : residentId
      });
      setFormData({ name: '', role: '', phone: '', email: '', notes: '', isPublic: false });
      setShowAddForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteContact = async (id: string) => {
    if (!window.confirm('Delete this contact?')) return;
    const path = `houses/${houseId}/professionalContacts/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Contact size={24} />
          Professional Leads & Contacts
        </h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          {showAddForm ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <div className="p-4">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input 
                placeholder="Name" 
                className="p-2 text-sm border rounded-lg"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <input 
                placeholder="Role (e.g. PO, Doctor)" 
                className="p-2 text-sm border rounded-lg"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                placeholder="Phone" 
                className="p-2 text-sm border rounded-lg"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                placeholder="Email" 
                type="email"
                className="p-2 text-sm border rounded-lg"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <textarea 
              placeholder="Notes..." 
              className="w-full p-2 text-sm border rounded-lg"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
            {isManager && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input 
                  type="checkbox" 
                  checked={formData.isPublic}
                  onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                />
                Share house-wide (Lead/General Contact)
              </label>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
              Save Contact
            </button>
          </form>
        )}

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No professional contacts listed.</p>
          ) : (
            contacts.map(contact => (
              <div key={contact.id} className="p-4 border rounded-xl bg-white hover:shadow-md transition-shadow relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-800">{contact.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                        {contact.role}
                      </span>
                      {contact.isPublic && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase">
                          <Globe size={10} /> House Lead
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 mt-2">
                      {contact.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" /> {contact.phone}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" /> {contact.email}
                        </p>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="mt-3 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                        "{contact.notes}"
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteContact(contact.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-600 transition-opacity p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
