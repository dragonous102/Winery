import React, { useState } from 'react';
// import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
// import { InventorySnapshot, ProductionHistory, SalesData } from '@/api/entities';
import DataUploadCard from '../components/upload/DataUploadCard';
import { Package, Warehouse, BarChart, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { parseCSV, parseCSVWithPapa } from '@/lib/utils';

export default function UploadDataPage() {
  const [statuses, setStatuses] = useState({
    cin7: { status: 'idle', message: '', progress: 0 },
    manhattan: { status: 'idle', message: '', progress: 0 },
    sales: { status: 'idle', message: '', progress: 0 }
  });
  const [globalError, setGlobalError] = useState(null);

  const updateStatus = (key, status, message, progress = 0) => {
    setStatuses(prev => ({
      ...prev,
      [key]: { status, message, progress }
    }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Accept by extension too because some CSVs from Windows may have different mime
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      updateStatus(type, 'error', 'Invalid file type. Please upload a CSV.');
      return;
    }

    setGlobalError(null);
    updateStatus(type, 'processing', 'Uploading file...', 10);

    try {
      updateStatus(type, 'processing', 'Reading file...', 30);
      const text = await file.text();
      updateStatus(type, 'processing', 'Parsing CSV...', 50);

      // Use parseCSV util to get array of objects
      let records = ""
      if (type === "sales") {
        records = parseCSVWithPapa(text).totalsByYear
      } else {
        records = parseCSV(text);
      }

      if (!records || records.length === 0) {
        throw new Error('Parsed CSV contains no records.');
      }

      updateStatus(type, 'processing', `Saving ${records.length} records...`, 80);

      // Persist to localStorage under different keys depending on type
      const keyMap = {
        cin7: 'vc_cin7_data',
        manhattan: 'vc_manhattan_data',
        sales: 'vc_sales_data'
      };
      const storageKey = keyMap[type] || `vc_upload_${type}`;
      localStorage.setItem(storageKey, JSON.stringify(records));

      // Notify other parts of app that new data is available
      try {
        window.dispatchEvent(new CustomEvent('vc:data:uploaded', { detail: { type, storageKey, count: records.length } }));
      } catch (e) {
        // ignore if CustomEvent not supported
      }

      updateStatus(type, 'success', `${records.length} records imported successfully.`, 100);
      setTimeout(() => updateStatus(type, 'idle', ''), 3000);

    } catch (error) {
      console.error(`Upload error for ${type}:`, error);
      updateStatus(type, 'error', error.message || 'An unknown error occurred.');
      setGlobalError(`Failed to process ${type} data. Please check the file format and try again.`);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-white min-h-[calc(100vh-80px)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" size="icon">
            <Link to={createPageUrl('Dashboard')}>
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
            <p className="text-slate-500">Upload CSV files from your various data sources.</p>
          </div>
        </div>

        {globalError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DataUploadCard
            title="Stock & Inventory"
            description="From CIN7"
            Icon={Package}
            onFileUpload={(file) => handleFileUpload(file, 'cin7')}
            processingStatus={statuses.cin7}
          />
          <DataUploadCard
            title="Warehousing & Production"
            description="From Manhattan (Wineworks)"
            Icon={Warehouse}
            onFileUpload={(file) => handleFileUpload(file, 'manhattan')}
            processingStatus={statuses.manhattan}
          />
          <DataUploadCard
            title="Distributor Sales"
            description="From iDig or Manual Reports"
            Icon={BarChart}
            onFileUpload={(file) => handleFileUpload(file, 'sales')}
            processingStatus={statuses.sales}
          />
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Ensure your CSV files have headers that match the expected data structure.</li>
            <li>Supported date formats include YYYY-MM-DD and MM/DD/YYYY.</li>
            <li>Large files may take a few moments to process. Please do not navigate away from the page during processing.</li>
            <li>If an error occurs, please verify your CSV file's columns and data types before trying again.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}