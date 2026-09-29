/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FileText, CheckCircle, Clock, ChevronRight, PenTool } from 'lucide-react';

interface ComplianceForm {
  id: string;
  type: 'program-terms' | 'house-rules' | 'treatment-plan';
  signedByName: string;
  signedAt: any;
  formData: any;
}

interface ComplianceFormsProps {
  houseId: string;
  residentId: string;
  isManager: boolean;
}

export const ComplianceForms = ({ houseId, residentId, isManager }: ComplianceFormsProps) => {
  const [signedForms, setSignedForms] = useState<ComplianceForm[]>([]);
  const [activeTab, setActiveTab] = useState<'program-terms' | 'house-rules' | 'treatment-plan'>('program-terms');
  const [showForm, setShowForm] = useState(false);
  const [signingName, setSigningName] = useState('');

  // Form State
  const [programTerms, setProgramTerms] = useState({
    facilityName: '',
    residentLegalName: '',
    moveInDate: '',
    duration: '',
    rentAmount: '',
    intakeFee: '',
    securityDeposit: '',
    paymentMethods: '',
    lateFeeAmount: '',
    noticeDays: ''
  });

  const [houseRules, setHouseRules] = useState({
    curfewWeek: '10:00 PM',
    curfewWeekend: '11:00 PM',
    minMeetings: '3',
    quietHours: '10:00 PM - 6:00 AM'
  });

  const [treatmentPlan, setTreatmentPlan] = useState({
    insuranceProvider: '',
    policyId: '',
    groupId: '',
    policyHolderName: '',
    policyHolderDob: '',
    medicationLogged: false
  });

  useEffect(() => {
    const formsRef = collection(db, `houses/${houseId}/complianceForms`);
    const q = isManager 
      ? query(formsRef)
      : query(formsRef, where('residentId', '==', residentId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ComplianceForm[];
      setSignedForms(forms);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `houses/${houseId}/complianceForms`);
    });

    return unsubscribe;
  }, [houseId, residentId, isManager]);

  const signForm = async () => {
    if (!signingName.trim()) return;
    
    let formData = {};
    if (activeTab === 'program-terms') formData = programTerms;
    else if (activeTab === 'house-rules') formData = houseRules;
    else if (activeTab === 'treatment-plan') formData = treatmentPlan;

    const path = `houses/${houseId}/complianceForms`;
    try {
      await addDoc(collection(db, path), {
        residentId,
        houseId,
        type: activeTab,
        formData,
        signedByName: signingName,
        signedAt: Timestamp.now()
      });
      setShowForm(false);
      setSigningName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const isSigned = (type: string) => signedForms.some(f => f.type === type);

  return (
    <div className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <FileText className="text-blue-600" />
        Compliance Documents
      </h2>

      {isManager ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500">Recently Signed Documents</h3>
          {signedForms.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No documents signed yet.</p>
          ) : (
            signedForms.map(form => (
              <div key={form.id} className="p-3 border rounded-lg flex justify-between items-center bg-gray-50">
                <div>
                  <div className="text-sm font-bold capitalize">{form.type.replace('-', ' ')}</div>
                  <div className="text-xs text-gray-500">Signed by: {form.signedByName} on {new Date(form.signedAt?.toDate()).toLocaleDateString()}</div>
                </div>
                <CheckCircle className="text-green-500" size={20} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {(['program-terms', 'house-rules', 'treatment-plan'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setActiveTab(type); setShowForm(false); }}
                className={`p-2 text-xs font-bold rounded-lg border transition-all ${
                  activeTab === type 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="mb-1">
                  {isSigned(type) ? <CheckCircle size={14} className="mx-auto" /> : <Clock size={14} className="mx-auto" />}
                </div>
                {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          {!showForm ? (
            <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                {activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isSigned(activeTab) 
                  ? "This document has been successfully signed and submitted."
                  : "Please review and sign this compliance document to proceed."}
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${
                  isSigned(activeTab)
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                }`}
              >
                {isSigned(activeTab) ? 'View Document' : 'Start Review'}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="prose prose-sm max-w-none mb-8 p-6 bg-gray-50 rounded-xl border max-h-96 overflow-y-auto">
                {activeTab === 'program-terms' && (
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-2">1. Program Terms</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Facility Name" className="p-2 border rounded" value={programTerms.facilityName} onChange={e => setProgramTerms({...programTerms, facilityName: e.target.value})} />
                      <input placeholder="Resident Legal Name" className="p-2 border rounded" value={programTerms.residentLegalName} onChange={e => setProgramTerms({...programTerms, residentLegalName: e.target.value})} />
                      <input type="date" placeholder="Move-In Date" className="p-2 border rounded text-xs" value={programTerms.moveInDate} onChange={e => setProgramTerms({...programTerms, moveInDate: e.target.value})} />
                      <input placeholder="Stay Duration (e.g. 90 days)" className="p-2 border rounded" value={programTerms.duration} onChange={e => setProgramTerms({...programTerms, duration: e.target.value})} />
                    </div>
                    <h4 className="font-bold border-b pb-2">2. Financial Obligations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Rent Amount ($)" className="p-2 border rounded" value={programTerms.rentAmount} onChange={e => setProgramTerms({...programTerms, rentAmount: e.target.value})} />
                      <input placeholder="Intake Fee ($)" className="p-2 border rounded" value={programTerms.intakeFee} onChange={e => setProgramTerms({...programTerms, intakeFee: e.target.value})} />
                      <input placeholder="Security Deposit ($)" className="p-2 border rounded" value={programTerms.securityDeposit} onChange={e => setProgramTerms({...programTerms, securityDeposit: e.target.value})} />
                      <input placeholder="Accepted Methods" className="p-2 border rounded" value={programTerms.paymentMethods} onChange={e => setProgramTerms({...programTerms, paymentMethods: e.target.value})} />
                    </div>
                    <p className="text-[10px] text-gray-500">Fees paid are non-refundable except for the security deposit. Immediate discharge for active substance use forfeits remaining fees.</p>
                  </div>
                )}

                {activeTab === 'house-rules' && (
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-2">1. Zero-Tolerance Core Rules</h4>
                    <p className="text-xs">Absolute Abstinence: Zero tolerance for alcohol or illicit drugs. Refusal to test within 1 hour counts as a positive test and immediate discharge.</p>
                    <h4 className="font-bold border-b pb-2">2. Daily Expectations</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="text-xs font-bold">Curfew (Sun-Thu) <input className="w-full p-2 border rounded font-normal" value={houseRules.curfewWeek} onChange={e => setHouseRules({...houseRules, curfewWeek: e.target.value})} /></label>
                      <label className="text-xs font-bold">Curfew (Fri-Sat) <input className="w-full p-2 border rounded font-normal" value={houseRules.curfewWeekend} onChange={e => setHouseRules({...houseRules, curfewWeekend: e.target.value})} /></label>
                      <label className="text-xs font-bold">Min Meetings/Week <input className="w-full p-2 border rounded font-normal" value={houseRules.minMeetings} onChange={e => setHouseRules({...houseRules, minMeetings: e.target.value})} /></label>
                      <label className="text-xs font-bold">Quiet Hours <input className="w-full p-2 border rounded font-normal" value={houseRules.quietHours} onChange={e => setHouseRules({...houseRules, quietHours: e.target.value})} /></label>
                    </div>
                  </div>
                )}

                {activeTab === 'treatment-plan' && (
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-2">1. Insurance Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input placeholder="Insurance Provider" className="p-2 border rounded" value={treatmentPlan.insuranceProvider} onChange={e => setTreatmentPlan({...treatmentPlan, insuranceProvider: e.target.value})} />
                      <input placeholder="Member ID" className="p-2 border rounded" value={treatmentPlan.policyId} onChange={e => setTreatmentPlan({...treatmentPlan, policyId: e.target.value})} />
                      <input placeholder="Group Number" className="p-2 border rounded" value={treatmentPlan.groupId} onChange={e => setTreatmentPlan({...treatmentPlan, groupId: e.target.value})} />
                      <input placeholder="Policy Holder Name" className="p-2 border rounded" value={treatmentPlan.policyHolderName} onChange={e => setTreatmentPlan({...treatmentPlan, policyHolderName: e.target.value})} />
                    </div>
                    <h4 className="font-bold border-b pb-2">2. Clinical Expectations</h4>
                    <p className="text-xs">Active Participation: Resident agrees to actively engage in their personalized care plan. Medication Compliance: All prescription medications must be logged with management.</p>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={treatmentPlan.medicationLogged} onChange={e => setTreatmentPlan({...treatmentPlan, medicationLogged: e.target.checked})} />
                      I have logged all my medications with house management.
                    </label>
                  </div>
                )}
              </div>

              {!isSigned(activeTab) && (
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                  <h4 className="text-sm font-bold text-blue-800 mb-4 flex items-center gap-2"><PenTool size={16} /> Digital Signature</h4>
                  <div className="flex gap-4">
                    <div className="flex-grow">
                      <input 
                        type="text" 
                        placeholder="Type your full legal name" 
                        value={signingName}
                        onChange={(e) => setSigningName(e.target.value)}
                        className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                      />
                      <p className="text-[10px] text-blue-600 mt-2 italic">By typing your name, you agree that this constitutes a legal signature.</p>
                    </div>
                    <button 
                      onClick={signForm}
                      disabled={!signingName.trim()}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg disabled:bg-gray-300 disabled:shadow-none transition-all"
                    >
                      Sign & Submit
                    </button>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setShowForm(false)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
              >
                <ChevronRight size={14} className="rotate-180" /> Back to Overview
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
