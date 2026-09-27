import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, ClipboardList, CalendarDays } from 'lucide-react';

export const DashboardSummary = ({ houseId }: { houseId: string }) => {
  const [stats, setStats] = useState({ residents: 0, chores: 0, meetings: 0 });

  useEffect(() => {
    const unsubResidents = onSnapshot(collection(db, `houses/${houseId}/residents`), snapshot =>
      setStats(prev => ({ ...prev, residents: snapshot.size })));
    const unsubChores = onSnapshot(collection(db, `houses/${houseId}/chores`), snapshot =>
      setStats(prev => ({ ...prev, chores: snapshot.docs.filter(d => !d.data().isCompleted).length })));
    const unsubMeetings = onSnapshot(collection(db, `houses/${houseId}/meetings`), snapshot =>
      setStats(prev => ({ ...prev, meetings: snapshot.size })));
    
    return () => { unsubResidents(); unsubChores(); unsubMeetings(); };
  }, [houseId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <Users className="text-blue-600" size={32} />
        <div>
          <p className="text-sm text-gray-500">Total Residents</p>
          <p className="text-2xl font-bold">{stats.residents}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <ClipboardList className="text-orange-600" size={32} />
        <div>
          <p className="text-sm text-gray-500">Pending Chores</p>
          <p className="text-2xl font-bold">{stats.chores}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex items-center gap-4">
        <CalendarDays className="text-green-600" size={32} />
        <div>
          <p className="text-sm text-gray-500">Upcoming Meetings</p>
          <p className="text-2xl font-bold">{stats.meetings}</p>
        </div>
      </div>
    </div>
  );
};
