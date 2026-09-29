/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Target, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  residentId: string;
  houseId: string;
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  targetDate: string;
  createdAt: any;
  lastUpdated?: any;
}

interface GoalsProps {
  houseId: string;
  residentId: string;
  isManager: boolean;
}

export const Goals = ({ houseId, residentId, isManager }: GoalsProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
  });

  useEffect(() => {
    const goalsRef = collection(db, `houses/${houseId}/goals`);
    // Managers see all, residents see only their own
    const q = isManager 
      ? query(goalsRef, orderBy('createdAt', 'desc'))
      : query(goalsRef, where('residentId', '==', residentId), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(goalsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `houses/${houseId}/goals`);
    });
    
    return unsubscribe;
  }, [houseId, residentId, isManager]);

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    
    const path = `houses/${houseId}/goals`;
    try {
      await addDoc(collection(db, path), {
        ...newGoal,
        residentId,
        houseId,
        status: 'active',
        progress: 0,
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
      });
      setNewGoal({ title: '', description: '', targetDate: '' });
      setShowAddForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateProgress = async (goalId: string, newProgress: number) => {
    const path = `houses/${houseId}/goals/${goalId}`;
    try {
      const status = newProgress >= 100 ? 'completed' : 'active';
      await updateDoc(doc(db, path), {
        progress: newProgress,
        status,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteGoal = async (goalId: string) => {
    const path = `houses/${houseId}/goals/${goalId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="text-blue-600" />
          Recovery Goals
        </h2>
        {!isManager && (
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={addGoal} className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3">
          <input
            type="text"
            value={newGoal.title}
            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
            placeholder="Goal Title (e.g., Attend 3 meetings this week)"
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            value={newGoal.description}
            onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
            placeholder="Description / Action Steps"
            className="w-full p-2 border rounded text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
              className="flex-grow p-2 border rounded text-sm"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold">
              Save Goal
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No goals set yet.</p>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="p-3 border rounded-lg hover:border-blue-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                  <p className="text-xs text-gray-500 mb-1">{goal.description}</p>
                </div>
                {!isManager && (
                  <button onClick={() => deleteGoal(goal.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-grow bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{goal.progress}%</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 ${goal.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {goal.status === 'completed' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </span>
                  {goal.targetDate && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <AlertCircle size={14} />
                      Due: {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {!isManager && (
                  <div className="flex gap-1">
                    {[0, 25, 50, 75, 100].map(p => (
                      <button
                        key={p}
                        onClick={() => updateProgress(goal.id, p)}
                        className={`px-1.5 py-0.5 rounded border ${goal.progress === p ? 'bg-blue-50 border-blue-600 text-blue-600' : 'text-gray-400 border-gray-200 hover:border-gray-400'}`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                )}
                {isManager && (
                  <span className="text-gray-400 italic">Resident: {goal.residentId.slice(0, 8)}...</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
