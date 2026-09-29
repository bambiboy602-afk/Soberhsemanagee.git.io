import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Plus, Bell, BellRing, Calendar, Clock } from 'lucide-react';

interface Resident {
  id: string;
  name: string;
}

interface Meeting {
  id: string;
  name: string;
  date: string;
  time?: string;
}

export const Meetings = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('meetingReminders');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('meetingReminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const meetingsRef = collection(db, `houses/${houseId}/meetings`);
    const q = query(meetingsRef, orderBy('date', 'asc'));
    
    const unsubscribeMeetings = onSnapshot(q, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `houses/${houseId}/meetings`);
    });

    const unsubscribeResidents = onSnapshot(collection(db, `houses/${houseId}/residents`), (snapshot) => {
      setResidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resident)));
    });

    return () => { unsubscribeMeetings(); unsubscribeResidents(); };
  }, [houseId]);

  const addMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `houses/${houseId}/meetings`;
    try {
      await addDoc(collection(db, path), { 
        name, 
        date, 
        time: time || '12:00', // Default time if not provided
        houseId 
      });
      setName('');
      setDate('');
      setTime('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return false;
    }
    if (Notification.permission === "granted") return true;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  const toggleReminder = async (meeting: Meeting) => {
    const isSetting = !reminders[meeting.id];
    
    if (isSetting) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("Notifications must be enabled to set reminders.");
        return;
      }

      // Schedule a notification if the meeting is today
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time || '12:00'}`);
      const now = new Date();
      const diff = meetingDateTime.getTime() - now.getTime();

      if (diff > 0) {
        // In a real app, this would be handled by a service worker or backend
        // For this demo, we'll use a local timeout if the app stays open
        setTimeout(() => {
          new Notification("Upcoming Meeting", {
            body: `${meeting.name} starts now!`,
            icon: "/pwa-192x192.png"
          });
        }, diff);
        
        // Also show a confirmation notification immediately
        new Notification("Reminder Set", {
          body: `We'll remind you about ${meeting.name} on ${meeting.date} at ${meeting.time}`,
          icon: "/pwa-192x192.png"
        });
      } else {
        alert("This meeting has already passed or is happening now.");
        return;
      }
    }

    setReminders(prev => ({ ...prev, [meeting.id]: isSetting }));
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Meetings
        </h2>
      </div>

      {isManager && (
        <form onSubmit={addMeeting} className="space-y-2 mb-6 p-3 bg-gray-50 rounded-lg border">
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Meeting Name (e.g., AA Open Discussion)" 
            className="w-full p-2 border rounded text-sm" 
            required 
          />
          <div className="flex gap-2">
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="flex-grow p-2 border rounded text-sm" 
              required 
            />
            <input 
              type="time" 
              value={time} 
              onChange={e => setTime(e.target.value)} 
              className="w-32 p-2 border rounded text-sm" 
              required 
            />
            <button type="submit" className="px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {meetings.length === 0 ? (
          <p className="text-center text-gray-500 py-4 text-sm italic">No meetings scheduled.</p>
        ) : (
          meetings.map(meeting => (
            <div key={meeting.id} className="p-3 border rounded-lg hover:border-blue-200 transition-colors flex justify-between items-center">
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900">{meeting.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {meeting.date}
                  </span>
                  {meeting.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {meeting.time}
                    </span>
                  )}
                </div>
                {isManager && residents.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    Tracking: {residents.slice(0, 3).map(r => r.name).join(', ')}{residents.length > 3 ? '...' : ''}
                  </p>
                )}
              </div>
              <button 
                onClick={() => toggleReminder(meeting)}
                className={`p-2 rounded-full transition-all ${
                  reminders[meeting.id] 
                    ? 'bg-blue-100 text-blue-600 shadow-inner' 
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                }`}
                title={reminders[meeting.id] ? "Reminder active" : "Set reminder"}
              >
                {reminders[meeting.id] ? <BellRing size={18} /> : <Bell size={18} />}
              </button>
            </div>
          ))
        )}
      </div>

      {Object.values(reminders).some(v => v) && (
        <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700 flex items-center gap-2">
          <BellRing size={12} />
          <span>Reminders are active. Keep the app open to receive browser notifications.</span>
        </div>
      )}
    </div>
  );
};
