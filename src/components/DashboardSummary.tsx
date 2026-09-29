/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Users, ClipboardList, CalendarDays, Ticket, MapPin } from 'lucide-react';

export const DashboardSummary = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [stats, setStats] = useState({ 
    residents: 0, 
    chores: 0, 
    meetings: 0,
    pendingPasses: 0,
    residentsOut: 0
  });

  useEffect(() => {
    const unsubResidents = onSnapshot(collection(db, `houses/${houseId}/residents`), snapshot =>
      setStats(prev => ({ ...prev, residents: snapshot.size })));
    
    const unsubChores = onSnapshot(collection(db, `houses/${houseId}/chores`), snapshot =>
      setStats(prev => ({ ...prev, chores: snapshot.docs.filter(d => !d.data().isCompleted).length })));
    
    const unsubMeetings = onSnapshot(collection(db, `houses/${houseId}/meetings`), snapshot =>
      setStats(prev => ({ ...prev, meetings: snapshot.size })));

    const unsubPasses = onSnapshot(query(collection(db, `houses/${houseId}/passRequests`), where('status', '==', 'pending')), snapshot =>
      setStats(prev => ({ ...prev, pendingPasses: snapshot.size })));

    // For "residents out", we'd ideally need a more complex query or a separate counter.
    // For now, we'll just track if any movements exist today or just use a placeholder.
    // Let's at least show the count of pending passes as it's highly relevant.

    return () => { 
      unsubResidents(); 
      unsubChores(); 
      unsubMeetings(); 
      unsubPasses();
    };
  }, [houseId]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-2 bg-blue-50 rounded-lg"><Users className="text-blue-600" size={24} /></div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">Residents</p>
          <p className="text-xl font-bold">{stats.residents}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-2 bg-orange-50 rounded-lg"><ClipboardList className="text-orange-600" size={24} /></div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">Chores</p>
          <p className="text-xl font-bold">{stats.chores}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-2 bg-green-50 rounded-lg"><CalendarDays className="text-green-600" size={24} /></div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">Meetings</p>
          <p className="text-xl font-bold">{stats.meetings}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-2 bg-indigo-50 rounded-lg"><Ticket className="text-indigo-600" size={24} /></div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400">Passes</p>
          <p className="text-xl font-bold">{stats.pendingPasses}</p>
        </div>
      </div>

      {isManager && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-2 bg-red-50 rounded-lg"><MapPin className="text-red-600" size={24} /></div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Alerts</p>
            <p className="text-xl font-bold">Live</p>
          </div>
        </div>
      )}
    </div>
  );
};
