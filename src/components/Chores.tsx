import React, { useEffect, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CheckCircle, Circle, Plus, Trash2 } from 'lucide-react';

interface Chore {
  id: string;
  description: string;
  isCompleted: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export const Chores = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChore, setNewChore] = useState('');

  useEffect(() => {
    const choresRef = collection(db, `houses/${houseId}/chores`);
    const q = query(choresRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const choresData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chore[];
      setChores(choresData);
    });
    
    return unsubscribe;
  }, [houseId]);

  const addChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChore.trim()) return;
    
    await addDoc(collection(db, `houses/${houseId}/chores`), {
      description: newChore,
      houseId,
      isCompleted: false
    });
    setNewChore('');
  };

  const toggleChore = async (choreId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, `houses/${houseId}/chores`, choreId), {
      isCompleted: !currentStatus
    });
  };

  const deleteChore = async (choreId: string) => {
    await deleteDoc(doc(db, `houses/${houseId}/chores`, choreId));
  };

  const loadTemplate = async () => {
    const template = [
      "Kitchen: Empty dishwasher & wipe counters",
      "Common Area: Vacuum living room",
      "Bathroom: Clean sink & mirror",
      "Trash: Empty all indoor trash bins",
    ];
    for (const chore of template) {
      await addDoc(collection(db, `houses/${houseId}/chores`), {
        description: chore,
        houseId,
        isCompleted: false
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold mb-4">House Chores</h2>
      {isManager && (
        <>
          <form onSubmit={addChore} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newChore}
              onChange={(e) => setNewChore(e.target.value)}
              placeholder="New chore..."
              className="flex-grow p-2 border rounded"
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded"><Plus /></button>
          </form>
          <button onClick={loadTemplate} className="text-sm text-blue-600 mb-4 underline">Load Chores Template</button>
        </>
      )}
      <ul className="space-y-2">
        {chores.map(chore => (
          <li key={chore.id} className="flex justify-between items-center p-2 border rounded">
            <div className="flex items-center gap-2">
              <button onClick={() => toggleChore(chore.id, chore.isCompleted)}>
                {chore.isCompleted ? <CheckCircle className="text-green-500" /> : <Circle />}
              </button>
              <span className={chore.isCompleted ? 'line-through text-gray-500' : ''}>{chore.description}</span>
            </div>
            {isManager && <button onClick={() => deleteChore(chore.id)} className="text-red-500"><Trash2 /></button>}
          </li>
        ))}
      </ul>
    </div>
  );
};
