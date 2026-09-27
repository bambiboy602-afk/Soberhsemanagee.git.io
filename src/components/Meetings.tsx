import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus } from 'lucide-react';

interface Resident {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  name: string;
  date: string;
}

export const Meetings = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const unsubscribeMeetings = onSnapshot(collection(db, `houses/${houseId}/meetings`), (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting)));
    });
    const unsubscribeResidents = onSnapshot(collection(db, `houses/${houseId}/residents`), (snapshot) => {
      setResidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident)));
    });
    return () => { unsubscribeMeetings(); unsubscribeResidents(); };
  }, [houseId]);

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `houses/${houseId}/meetings`), { name, date, houseId });
    setName('');
    setDate('');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Meetings</h2>
      {isManager && (
        <form onSubmit={addMeeting} className="flex gap-2 mb-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Meeting Name" className="p-2 border rounded" required />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded" required />
          <button type="submit" className="p-2 bg-blue-600 text-white rounded"><Plus /></button>
        </form>
      )}
      <div className="space-y-4">
        {meetings.map(meeting => (
          <div key={meeting.id} className="p-2 border rounded">
            <h3 className="font-bold">{meeting.name} - {meeting.date}</h3>
            <p className="text-sm text-gray-500">Attendance tracking for: {residents.map(r => r.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
