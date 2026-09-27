import React, { useEffect, useState } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trash2, Plus } from 'lucide-react';

interface Rule {
  id: string;
  description: string;
  createdAt: Timestamp;
}

export const HouseRules = ({ houseId, isManager }: { houseId: string; isManager: boolean }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    const rulesRef = collection(db, `houses/${houseId}/rules`);
    const q = query(rulesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Rule[];
      setRules(rulesData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });
    
    return unsubscribe;
  }, [houseId]);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    
    await addDoc(collection(db, `houses/${houseId}/rules`), {
      description: newRule,
      houseId,
      createdAt: Timestamp.now()
    });
    setNewRule('');
  };

  const deleteRule = async (ruleId: string) => {
    await deleteDoc(doc(db, `houses/${houseId}/rules`, ruleId));
  };

  const loadTemplate = async () => {
    const template = [
      "Zero Tolerance for Substances.",
      "Attend weekly house meetings.",
      "Complete all assigned chores by 8 PM.",
      "Quiet hours: 10 PM - 5 AM.",
    ];
    for (const rule of template) {
      await addDoc(collection(db, `houses/${houseId}/rules`), {
        description: rule,
        houseId,
        createdAt: Timestamp.now()
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">House Rules</h2>
      {isManager && (
        <>
          <form onSubmit={addRule} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="New rule..."
              className="flex-grow p-2 border rounded"
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded"><Plus /></button>
          </form>
          <button onClick={loadTemplate} className="text-sm text-blue-600 mb-4 underline">Load Rules Template</button>
        </>
      )}
      <ul className="space-y-2">
        {rules.map(rule => (
          <li key={rule.id} className="flex justify-between items-center p-2 border rounded">
            <span>{rule.description}</span>
            {isManager && <button onClick={() => deleteRule(rule.id)} className="text-red-500"><Trash2 /></button>}
          </li>
        ))}
      </ul>
    </div>
  );
};
