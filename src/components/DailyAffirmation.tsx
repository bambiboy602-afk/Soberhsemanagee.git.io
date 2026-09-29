/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Sparkles, Quote, Plus, Send, X } from 'lucide-react';

interface Affirmation {
  id: string;
  text: string;
  createdAt: any;
}

const FALLBACK_AFFIRMATIONS = [
  "One day at a time.",
  "Keep coming back, it works if you work it.",
  "Progress, not perfection.",
  "Live and let live.",
  "Easy does it.",
  "First things first.",
  "God grant me the serenity to accept the things I cannot change..."
];

interface DailyAffirmationProps {
  houseId: string;
  isManager: boolean;
}

export const DailyAffirmation = ({ houseId, isManager }: DailyAffirmationProps) => {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const affirmationsRef = collection(db, `houses/${houseId}/affirmations`);
    const q = query(affirmationsRef, orderBy('createdAt', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Affirmation[];
      setAffirmations(data);
    }, (error) => {
      // Don't crash if collection doesn't exist yet
      console.warn("Could not fetch affirmations:", error.message);
    });
    
    return unsubscribe;
  }, [houseId]);

  // Rotate fallback affirmations or use system ones
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % (affirmations.length > 0 ? affirmations.length : FALLBACK_AFFIRMATIONS.length));
    }, 10000); // Rotate every 10s
    return () => clearInterval(timer);
  }, [affirmations.length]);

  const addAffirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffirmation.trim()) return;
    
    const path = `houses/${houseId}/affirmations`;
    try {
      await addDoc(collection(db, path), {
        text: newAffirmation,
        houseId,
        createdAt: Timestamp.now()
      });
      setNewAffirmation('');
      setShowAddForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const currentAffirmation = affirmations.length > 0 
    ? affirmations[currentIndex % affirmations.length].text 
    : FALLBACK_AFFIRMATIONS[currentIndex % FALLBACK_AFFIRMATIONS.length];

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
            <Quote size={14} />
            Daily Affirmation
          </div>
          {isManager && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
            </button>
          )}
        </div>

        {showAddForm ? (
          <form onSubmit={addAffirmation} className="animate-in fade-in slide-in-from-top-2 duration-300">
            <textarea
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              placeholder="Share an inspirational quote with the house..."
              className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-white/40 outline-none mb-3"
              rows={3}
            />
            <button type="submit" className="w-full py-2 bg-white text-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg">
              <Send size={16} /> Share with House
            </button>
          </form>
        ) : (
          <div className="py-4 animate-in fade-in duration-1000">
            <p className="text-xl md:text-2xl font-serif italic leading-relaxed text-center">
              "{currentAffirmation}"
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-1">
        {(affirmations.length > 0 ? affirmations : FALLBACK_AFFIRMATIONS).map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`} 
          />
        ))}
      </div>
    </div>
  );
};
