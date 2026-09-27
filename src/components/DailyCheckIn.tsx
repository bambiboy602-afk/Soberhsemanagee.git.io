import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const DailyCheckIn = ({ houseId, residentId }: { houseId: string; residentId: string }) => {
  const [mood, setMood] = useState('');
  const [sobrietyStatus, setSobrietyStatus] = useState<'sober' | 'struggling'>('sober');
  const [comments, setComments] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `houses/${houseId}/checkins`), {
      residentId,
      mood,
      sobrietyStatus,
      comments,
      date: new Date().toISOString().split('T')[0]
    });
    setMood('');
    setComments('');
    alert('Check-in submitted!');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Daily Check-In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" value={mood} onChange={e => setMood(e.target.value)} placeholder="How are you feeling today?" className="w-full p-2 border rounded" required />
        <select value={sobrietyStatus} onChange={e => setSobrietyStatus(e.target.value as 'sober' | 'struggling')} className="w-full p-2 border rounded">
          <option value="sober">Sober</option>
          <option value="struggling">Struggling</option>
        </select>
        <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Additional comments..." className="w-full p-2 border rounded" />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit Check-In</button>
      </form>
    </div>
  );
};
