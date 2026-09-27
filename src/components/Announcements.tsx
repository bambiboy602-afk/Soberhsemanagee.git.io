import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus } from 'lucide-react';

export const Announcements = ({ houseId }: { houseId: string }) => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, `houses/${houseId}/announcements`), orderBy('date', 'desc')), snapshot =>
      setAnnouncements(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [houseId]);

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `houses/${houseId}/announcements`), {
      content, houseId, date: new Date().toISOString()
    });
    setContent('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Announcements</h2>
      <form onSubmit={addAnnouncement} className="flex gap-2 mb-4">
        <input type="text" value={content} onChange={e => setContent(e.target.value)} placeholder="New announcement..." className="flex-grow p-2 border rounded" required />
        <button type="submit" className="p-2 bg-blue-600 text-white rounded"><Plus /></button>
      </form>
      <ul className="space-y-2">
        {announcements.map(a => <li key={a.id} className="p-2 border rounded text-sm">{a.content} ({new Date(a.date).toLocaleDateString()})</li>)}
      </ul>
    </div>
  );
};
