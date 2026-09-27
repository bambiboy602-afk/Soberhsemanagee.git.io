import React from 'react';
import { getAccessToken } from './AuthProvider';

export const ExportReports = ({ houseId }: { houseId: string }) => {
  const exportToSheets = async () => {
    const token = await getAccessToken();
    if (!token) return alert('Please sign in to export reports.');

    // 1. Create a spreadsheet
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ properties: { title: `House Report - ${new Date().toLocaleDateString()}` } })
    });
    const sheet = await response.json();
    
    // In a real app, you would now fetch data from Firestore and populate this sheet.
    alert(`Spreadsheet created: ${sheet.spreadsheetUrl}`);
  };

  return (
    <button onClick={exportToSheets} className="bg-green-600 text-white px-4 py-2 rounded mt-6">
      Export Data to Google Sheets
    </button>
  );
};
