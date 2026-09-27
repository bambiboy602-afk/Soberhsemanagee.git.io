import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertTriangle } from 'lucide-react';

export const IncidentLog = ({ houseId }: { houseId: string }) => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('low');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, `houses/${houseId}/incidents`), orderBy('date', 'desc')), snapshot =>
      setIncidents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [houseId]);

  const addIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `houses/${houseId}/incidents`), {
      description, severity, residentId: 'unknown', houseId, date: new Date().toISOString()
    });
    setDescription('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="text-red-500" /> Incident Log</h2>
      <form onSubmit={addIncident} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Incident details" className="col-span-2 p-2 border rounded" required />
        <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="p-2 border rounded">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="col-span-3 p-2 bg-red-600 text-white rounded">Log Incident</button>
      </form>
      <ul className="space-y-2">
        {incidents.map(i => <li key={i.id} className="p-2 border rounded text-sm">{i.severity.toUpperCase()}: {i.description}</li>)}
      </ul>
    </div>
  );
};
