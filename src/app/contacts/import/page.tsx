'use client'

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Upload, FileText, Download, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export default function ImportContactsPage() {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setUploadedFile(file);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const downloadSampleCSV = () => {
    const csv = 'First Name,Last Name,Email,Job Title,Phone,Mobile\nJohn,Doe,john@example.com,CEO,+1234567890,+0987654321\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleXLSX = () => {
    // For simplicity, download CSV with xlsx extension
    downloadSampleCSV();
  };

  const handleCRMImport = () => {
    if (!selectedCRM) return;
    setUploadProgress(0);
    
    // Simulate CRM import progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/contacts">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Import Contacts</h1>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <span className="mr-1">📘</span> Help
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Two-card layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Card 1: From File */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">From File</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">Drag and drop your file here</p>
            <p className="text-xs text-slate-500 mb-4">- or -</p>

            {/* Drag & Drop Area */}
            <div
              ref={dragRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 transition cursor-pointer mb-4"
            >
              <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition cursor-pointer">
                  Browse
                </span>
              </label>
            </div>

            {/* Upload Progress */}
            {uploadedFile && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">{uploadedFile.name}</p>
                  <p className="text-sm text-slate-500">{uploadProgress}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {uploadedFile && uploadProgress === 100 && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                  <p className="text-xs text-green-700">Ready to import</p>
                </div>
              </div>
            )}

            {/* File Type Info */}
            <div className="text-xs text-slate-500 space-y-1 mb-4">
              <p>You can import up to 5000 records through an .xls, .xlsx, .vcf or .csv file. To import more than 5000 records at a time, use a .csv file.</p>
            </div>

            {/* Download Sample */}
            <div className="space-y-2">
              <p className="text-xs text-slate-600 mb-2">Download sample file</p>
              <div className="flex gap-2">
                <button
                  onClick={downloadSampleCSV}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
                >
                  CSV
                </button>
                <button
                  onClick={downloadSampleXLSX}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
                >
                  XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: From Other CRMs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">From other CRMs</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">Which CRM are you coming from?</p>

            {/* CRM Dropdown */}
            <div className="mb-4">
              <select
                value={selectedCRM || ""}
                onChange={(e) => setSelectedCRM(e.target.value || null)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Choose a CRM...</option>
                <option value="zoho">Zoho CRM</option>
                <option value="salesforce">Salesforce</option>
                <option value="hubspot">HubSpot</option>
                <option value="pipedrive">Pipedrive</option>
                <option value="freshsales">Freshsales</option>
              </select>
            </div>

            {/* CRM Info Box */}
            {selectedCRM && (
              <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  {selectedCRM === "zoho" && "Importing data from other CRMs is made easy. It is just a click away."}
                  {selectedCRM === "salesforce" && "Importing data from other CRMs is made easy. It is just a click away."}
                  {selectedCRM === "hubspot" && "Importing data from other CRMs is made easy. It is just a click away."}
                  {selectedCRM === "pipedrive" && "Importing data from other CRMs is made easy. It is just a click away."}
                  {selectedCRM === "freshsales" && "Importing data from other CRMs is made easy. It is just a click away."}
                </p>
              </div>
            )}

            {/* Import Progress for CRM */}
            {selectedCRM && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-700">Importing from {selectedCRM}...</p>
                  <p className="text-sm text-slate-500">{uploadProgress}%</p>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleCRMImport}
              disabled={!selectedCRM || uploadProgress > 0}
              className={`w-full px-4 py-3 rounded-lg font-medium text-white transition ${
                selectedCRM && uploadProgress === 0
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              {uploadProgress > 0 && uploadProgress < 100 ? `Importing... ${uploadProgress}%` : "Start Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
