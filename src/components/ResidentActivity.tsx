/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc, orderBy, limit, Timestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { Plus, Clock, MapPin, FileText, Send, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';

interface MovementRecord {
  id: string;
  residentId: string;
  type: 'sign-in' | 'sign-out';
  timestamp: string;
}

interface ScheduleEntry {
  id: string;
  residentId: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface SpecialNote {
  id: string;
  residentId: string;
  content: string;
  createdBy: string;
  createdAt: any;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ResidentActivity = ({ houseId, residentId, isManager }: { houseId: string; residentId: string; isManager: boolean }) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'movements' | 'notes'>('schedule');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [notes, setNotes] = useState<SpecialNote[]>([]);

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newSchedule, setNewSchedule] = useState({ type: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });

  useEffect(() => {
    const qBase = where('residentId', '==', residentId);
    
    const unsubSchedule = onSnapshot(query(collection(db, `houses/${houseId}/schedule`), qBase), snapshot => 
      setSchedule(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry))));
    
    const unsubMovements = onSnapshot(query(collection(db, `houses/${houseId}/movements`), qBase, orderBy('timestamp', 'desc'), limit(50)), snapshot => 
      setMovements(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MovementRecord))));
    
    const unsubNotes = onSnapshot(query(collection(db, `houses/${houseId}/specialNotes`), qBase, orderBy('createdAt', 'desc')), snapshot => 
      setNotes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SpecialNote))));

    return () => { unsubSchedule(); unsubMovements(); unsubNotes(); };
  }, [houseId, residentId]);

  const recordMovement = async (type: 'sign-in' | 'sign-out') => {
    const path = `houses/${houseId}/movements`;
    try {
      await addDoc(collection(db, path), {
        residentId,
        houseId,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const path = `houses/${houseId}/specialNotes`;
    try {
      await addDoc(collection(db, path), {
        residentId,
        houseId,
        content: newNote,
        createdBy: auth.currentUser?.uid,
        createdAt: Timestamp.now()
      });
      setNewNote('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const addSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `houses/${houseId}/schedule`;
    try {
      await addDoc(collection(db, path), {
        ...newSchedule,
        residentId,
        houseId
      });
      setNewSchedule({ type: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const deleteEntry = async (collectionName: string, id: string) => {
    const path = `houses/${houseId}/${collectionName}/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mt-6 overflow-hidden border border-gray-100">
      <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="text-indigo-600" />
          Resident Activity Log
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b overflow-x-auto bg-white sticky top-0 z-10">
        {(['schedule', 'movements', 'notes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 px-4 text-sm font-bold border-b-2 transition-all capitalize whitespace-nowrap ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' 
                : 'border-transparent text-gray-500 hover:text-indigo-400 hover:bg-gray-50'
            }`}
          >
            {tab === 'notes' ? 'Special Notes' : tab}
          </button>
        ))}
      </div>

      <div className="p-4 min-h-[400px]">
        {/* Schedule */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {isManager && (
              <form onSubmit={addSchedule} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Plus size={16} /> Add Schedule Entry
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input 
                    placeholder="Type (Work, IOP, etc.)" 
                    className="p-2 text-sm border rounded" 
                    value={newSchedule.type}
                    onChange={e => setNewSchedule({...newSchedule, type: e.target.value})}
                    required
                  />
                  <select 
                    className="p-2 text-sm border rounded"
                    value={newSchedule.dayOfWeek}
                    onChange={e => setNewSchedule({...newSchedule, dayOfWeek: parseInt(e.target.value)})}
                  >
                    {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                  </select>
                  <input 
                    type="time" 
                    className="p-2 text-sm border rounded" 
                    value={newSchedule.startTime}
                    onChange={e => setNewSchedule({...newSchedule, startTime: e.target.value})}
                    required
                  />
                  <input 
                    type="time" 
                    className="p-2 text-sm border rounded" 
                    value={newSchedule.endTime}
                    onChange={e => setNewSchedule({...newSchedule, endTime: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Add Entry
                </button>
              </form>
            )}

            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                const dayEntries = schedule.filter(s => s.dayOfWeek === dayIdx);
                if (dayEntries.length === 0) return null;
                return (
                  <div key={day} className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-500 uppercase">{day}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dayEntries.map(entry => (
                        <div key={entry.id} className="p-2 border rounded-lg flex justify-between items-center bg-gray-50">
                          <div className="text-sm">
                            <span className="font-bold">{entry.type}</span>
                            <span className="text-gray-500 ml-2">{entry.startTime} - {entry.endTime}</span>
                          </div>
                          {isManager && (
                            <button onClick={() => deleteEntry('schedule', entry.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {schedule.length === 0 && (
                <p className="text-sm text-gray-500 italic py-8 text-center">No schedule entries defined.</p>
              )}
            </div>
          </div>
        )}

        {/* Movements */}
        {activeTab === 'movements' && (
          <div className="space-y-6">
            <div className="flex gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100 justify-center">
              <button 
                onClick={() => recordMovement('sign-out')}
                className="flex-1 flex flex-col items-center gap-2 p-4 bg-white border-2 border-red-200 text-red-600 rounded-2xl hover:bg-red-50 transition-all shadow-sm"
              >
                <div className="p-3 bg-red-100 rounded-full"><ShieldAlert size={24} /></div>
                <span className="font-bold">Sign Out</span>
                <span className="text-[10px] text-gray-500 uppercase">Leaving Facility</span>
              </button>
              <button 
                onClick={() => recordMovement('sign-in')}
                className="flex-1 flex flex-col items-center gap-2 p-4 bg-white border-2 border-green-200 text-green-600 rounded-2xl hover:bg-green-50 transition-all shadow-sm"
              >
                <div className="p-3 bg-green-100 rounded-full"><ShieldCheck size={24} /></div>
                <span className="font-bold">Sign In</span>
                <span className="text-[10px] text-gray-500 uppercase">Returning Home</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h4>
              <div className="border rounded-lg divide-y bg-white">
                {movements.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-8 text-center">No movement logs recorded.</p>
                ) : (
                  movements.map(m => (
                    <div key={m.id} className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${m.type === 'sign-in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          <MapPin size={14} />
                        </div>
                        <span className="text-sm font-medium capitalize">{m.type.replace('-', ' ')}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(m.timestamp).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Special Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {isManager && (
              <form onSubmit={addNote} className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  <FileText size={16} /> Add Special Note
                </h4>
                <textarea 
                  placeholder="Private instructions or observations for this resident..." 
                  className="w-full p-3 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none" 
                  rows={3}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  required
                />
                <button type="submit" className="mt-3 w-full bg-yellow-600 text-white py-2 rounded-lg font-bold hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2">
                  <Send size={16} /> Save Note
                </button>
              </form>
            )}

            <div className="space-y-4">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-8 text-center">No special notes for this resident.</p>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-4 border-l-4 border-yellow-400 bg-gray-50 rounded-r-lg relative group">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 text-[10px] text-gray-400 flex justify-between items-center">
                      <span>Posted on {new Date(note.createdAt?.toDate()).toLocaleString()}</span>
                      {isManager && (
                        <button onClick={() => deleteEntry('specialNotes', note.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
