/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, query, orderBy, limit, onSnapshot, Timestamp, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Smile, Frown, Meh, Laugh, Angry, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MoodLog {
  id: string;
  residentId: string;
  houseId: string;
  score: number;
  note?: string;
  timestamp: any;
}

interface MoodTrackerProps {
  houseId: string;
  residentId: string;
  isManager: boolean;
}

const moodIcons = [
  { score: 1, icon: Angry, color: 'text-red-500', label: 'Terrible' },
  { score: 2, icon: Frown, color: 'text-orange-500', label: 'Bad' },
  { score: 3, icon: Meh, color: 'text-yellow-500', label: 'Okay' },
  { score: 4, icon: Smile, color: 'text-green-500', label: 'Good' },
  { score: 5, icon: Laugh, color: 'text-emerald-500', label: 'Great' },
];

export const MoodTracker = ({ houseId, residentId, isManager }: MoodTrackerProps) => {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [note, setNote] = useState('');
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const logsRef = collection(db, `houses/${houseId}/moodLogs`);
    // Managers see trend for house (or can be filtered), residents see their own
    const q = isManager 
      ? query(logsRef, orderBy('timestamp', 'asc'), limit(30))
      : query(logsRef, where('residentId', '==', residentId), orderBy('timestamp', 'asc'), limit(30));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MoodLog[];
      setLogs(logsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `houses/${houseId}/moodLogs`);
    });
    
    return unsubscribe;
  }, [houseId, residentId, isManager]);

  const submitMood = async () => {
    if (selectedScore === null) return;
    setLoading(true);
    const path = `houses/${houseId}/moodLogs`;
    try {
      await addDoc(collection(db, path), {
        residentId,
        houseId,
        score: selectedScore,
        note: note.trim() || null,
        timestamp: Timestamp.now(),
      });
      setSelectedScore(null);
      setNote('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const chartData = logs.map(log => ({
    date: new Date(log.timestamp?.toDate()).toLocaleDateString(),
    score: log.score,
  }));

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-purple-600" />
          Mood Tracker
        </h2>
        {isManager && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">House Trends</span>}
      </div>

      {!isManager && (
        <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">How are you feeling right now?</h3>
          <div className="flex justify-around mb-6">
            {moodIcons.map(({ score, icon: Icon, color, label }) => (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                className={`flex flex-col items-center gap-2 transition-all duration-200 ${
                  selectedScore === score ? 'scale-125' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Icon className={`${color} w-8 h-8`} />
                <span className="text-[10px] font-medium text-gray-500">{label}</span>
              </button>
            ))}
          </div>
          {selectedScore !== null && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any thoughts or notes? (optional)"
                className="w-full p-3 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                rows={2}
              />
              <button
                onClick={submitMood}
                disabled={loading}
                className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Log Mood'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="h-64 w-full">
        <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
          <Calendar size={12} />
          Recent Trends
        </h3>
        {logs.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                fontSize={10} 
                tickMargin={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                domain={[1, 5]} 
                ticks={[1, 2, 3, 4, 5]} 
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#9333ea" 
                strokeWidth={3} 
                dot={{ fill: '#9333ea', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-lg">
            <p className="text-gray-400 text-sm">Need more data to show trends</p>
          </div>
        )}
      </div>

      {isManager && logs.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400">Recent Notes</h3>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {logs.slice().reverse().map(log => log.note && (
              <div key={log.id} className="p-2 bg-gray-50 rounded text-xs border-l-2 border-purple-400">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Resident: {log.residentId.slice(0, 8)}...</span>
                  <span>{new Date(log.timestamp?.toDate()).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 italic">"{log.note}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
