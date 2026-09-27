import React from 'react';
import { Home, ShieldCheck, Users } from 'lucide-react';

export const LandingPage = ({ onSignIn }: { onSignIn: () => void }) => {
  return (
    <div className="min-h-screen bg-white">
      <header className="p-6 flex justify-between items-center border-b">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          <Home /> SoberHouse Template
        </h1>
        <button onClick={onSignIn} className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">Sign In</button>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl font-extrabold text-slate-900 mb-6">Manage Your Recovery Home with Ease.</h2>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">A structured, role-based dashboard template designed for sober living houses to coordinate, communicate, and support recovery.</p>
        <div className="grid md:grid-cols-2 gap-8 text-left mb-16">
          <div className="p-6 border rounded-xl bg-slate-50">
            <ShieldCheck className="text-blue-600 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Structured Accountability</h3>
            <p className="text-slate-600">Track chores, house rules, and daily check-ins to foster responsibility.</p>
          </div>
          <div className="p-6 border rounded-xl bg-slate-50">
            <Users className="text-blue-600 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Community Support</h3>
            <p className="text-slate-600">Keep everyone connected with announcements, meeting schedules, and resource links.</p>
          </div>
        </div>
        <button onClick={onSignIn} className="px-10 py-4 bg-blue-900 text-white rounded-full text-lg font-semibold hover:bg-black">Get Started</button>
      </main>
    </div>
  );
};
