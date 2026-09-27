import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Check, X } from 'lucide-react';

export const ResidentActivity = ({ houseId, residentId }: { houseId: string; residentId: string }) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [passRequests, setPassRequests] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  useEffect(() => {
    const unsubSchedule = onSnapshot(collection(db, `houses/${houseId}/schedule`), snapshot => 
      setSchedule(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPasses = onSnapshot(collection(db, `houses/${houseId}/passRequests`), snapshot => 
      setPassRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMovements = onSnapshot(collection(db, `houses/${houseId}/movements`), snapshot => 
      setMovements(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubSchedule(); unsubPasses(); unsubMovements(); };
  }, [houseId]);

  const addPassRequest = async (reason: string, start: string, end: string) => {
    await addDoc(collection(db, `houses/${houseId}/passRequests`), {
      residentId, reason, startTime: start, endTime: end, status: 'pending'
    });
  };

  const recordMovement = async (type: 'sign-in' | 'sign-out') => {
    await addDoc(collection(db, `houses/${houseId}/movements`), {
      residentId, type, timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Resident Activity</h2>
      
      <div className="mb-6">
        <h3 className="font-bold">Weekly Schedule</h3>
        {/* Simplified display */}
        <p className="text-sm text-gray-500">Scheduled: {schedule.length} entries</p>
      </div>

      <div className="mb-6">
        <h3 className="font-bold">Pass Requests</h3>
        <button onClick={() => addPassRequest('Grocery', '2026-09-27T10:00', '2026-09-27T12:00')} className="bg-blue-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"><Plus size={16}/> Request Pass</button>
        <ul className="text-sm mt-2">
            {passRequests.map(p => <li key={p.id}>{p.reason} - {p.status}</li>)}
        </ul>
      </div>

      <div>
        <h3 className="font-bold">Sign In/Out</h3>
        <div className="flex gap-2 mt-2">
          <button onClick={() => recordMovement('sign-in')} className="bg-green-600 text-white px-2 py-1 rounded text-sm">Sign In</button>
          <button onClick={() => recordMovement('sign-out')} className="bg-red-600 text-white px-2 py-1 rounded text-sm">Sign Out</button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Last movement: {movements[0]?.timestamp}</p>
      </div>
    </div>
  );
};
