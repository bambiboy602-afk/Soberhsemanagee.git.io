/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { LandingPage } from './components/LandingPage';
import { DashboardSummary } from './components/DashboardSummary';
import { HouseRules } from './components/HouseRules';
import { Chores } from './components/Chores';
import { Residents } from './components/Residents';
import { Meetings } from './components/Meetings';
import { DailyCheckIn } from './components/DailyCheckIn';
import { ResidentActivity } from './components/ResidentActivity';
import { Announcements } from './components/Announcements';
import { IncidentLog } from './components/IncidentLog';
import { ExportReports } from './components/ExportReports';
import { VideoLinks } from './components/VideoLinks';
import { Goals } from './components/Goals';
import { MoodTracker } from './components/MoodTracker';
import { SafetyPlan } from './components/SafetyPlan';
import { ComplianceForms } from './components/ComplianceForms';
import { DailyAffirmation } from './components/DailyAffirmation';
import { PolicyDocs } from './components/PolicyDocs';
import { Passes } from './components/Passes';

function AppContent() {
  const { user, userData, signIn, signOut } = useAuth();
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('houseConfig');
    return saved ? JSON.parse(saved) : null;
  });
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    if (userData) {
      setIsManager(userData.role === 'manager');
    }
  }, [userData]);

  useEffect(() => {
    if (config) localStorage.setItem('houseConfig', JSON.stringify(config));
  }, [config]);
  
  if (!user) {
    return <LandingPage onSignIn={signIn} />;
  }

  if (!config) {
    // ... setup form ...
    return (
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Configure House</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setConfig({ 
            name: formData.get('name') as string, 
            id: formData.get('id') as string 
          });
        }} className="space-y-4">
          <input name="name" placeholder="House Name" className="w-full p-2 border rounded" required />
          <input name="id" placeholder="House Unique ID (Address)" className="w-full p-2 border rounded" required />
          <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Setup House</button>
        </form>
      </div>
    );
  }

  const effectiveResidentId = userData?.residentId || user.uid;

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">{config.name}</h1>
          <p className="text-sm text-gray-500">{config.id}</p>
        </div>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isManager} onChange={e => setIsManager(e.target.checked)} />
            Manager Mode (Demo)
          </label>
          <button onClick={() => { setConfig(null); localStorage.removeItem('houseConfig'); }} className="text-sm text-blue-600">Switch House</button>
          <button onClick={signOut} className="text-sm text-red-600">Sign out</button>
        </div>
      </header>
      <DailyAffirmation houseId={config.id} isManager={isManager} />
      <DashboardSummary houseId={config.id} isManager={isManager} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manager-Only Sections */}
        <HouseRules houseId={config.id} isManager={isManager} />
        <Chores houseId={config.id} isManager={isManager} />
        {isManager && <Residents houseId={config.id} />}
        {isManager && <ExportReports houseId={config.id} />}
        {isManager && <IncidentLog houseId={config.id} />}

        {/* Member + Manager Sections (Visible to all) */}
        <Meetings houseId={config.id} isManager={isManager} />
        <DailyCheckIn houseId={config.id} residentId={effectiveResidentId} />
        <MoodTracker houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <SafetyPlan houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <ComplianceForms houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <Goals houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <PolicyDocs />
        <Passes houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <ResidentActivity houseId={config.id} residentId={effectiveResidentId} isManager={isManager} />
        <Announcements houseId={config.id} />
        <VideoLinks />
        <div className="bg-white p-4 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">Resources</h2>
          <a href="https://bambiboy602.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Visit Peer Support Resources</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
