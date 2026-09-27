import React, { useEffect, useState } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface Resident {
  id: string;
  name: string;
  moveInDate: string;
  sobrietyStatus: 'sober' | 'relapsed' | 'unknown';
}

export const Residents = ({ houseId }: { houseId: string }) => {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [name, setName] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [sobrietyStatus, setSobrietyStatus] = useState<Resident['sobrietyStatus']>('sober');

  useEffect(() => {
    const residentsRef = collection(db, `houses/${houseId}/residents`);
    const q = query(residentsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const residentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resident[];
      setResidents(residentsData);
    });
    
    return unsubscribe;
  }, [houseId]);

  const addResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !moveInDate) return;
    
    await addDoc(collection(db, `houses/${houseId}/residents`), {
      name,
      houseId,
      moveInDate,
      sobrietyStatus
    });
    setName('');
    setMoveInDate('');
  };

  const deleteResident = async (residentId: string) => {
    await deleteDoc(doc(db, `houses/${houseId}/residents`, residentId));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Residents</h2>
      <form onSubmit={addResident} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="p-2 border rounded" required />
        <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className="p-2 border rounded" required />
        <select value={sobrietyStatus} onChange={(e) => setSobrietyStatus(e.target.value as Resident['sobrietyStatus'])} className="p-2 border rounded">
          <option value="sober">Sober</option>
          <option value="relapsed">Relapsed</option>
          <option value="unknown">Unknown</option>
        </select>
        <button type="submit" className="p-2 bg-blue-600 text-white rounded flex items-center justify-center"><Plus /></button>
      </form>
      <ul className="space-y-2">
        {residents.map(resident => (
          <li key={resident.id} className="flex justify-between items-center p-2 border rounded">
            <div>
              <p className="font-bold">{resident.name}</p>
              <p className="text-sm text-gray-500">Moved in: {resident.moveInDate} | Status: {resident.sobrietyStatus}</p>
            </div>
            <button onClick={() => deleteResident(resident.id)} className="text-red-500"><Trash2 /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};
