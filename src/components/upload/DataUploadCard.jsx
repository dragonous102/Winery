import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function DataUploadCard({
  title,
  description,
  Icon,
  onFileUpload,
  processingStatus
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const statusContent = () => {
    switch (processingStatus.status) {
      case 'processing':
        return (
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="text-sm text-slate-600 font-medium">{processingStatus.message}</p>
            <Progress value={processingStatus.progress} className="w-full" />
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500" />
            <p className="text-sm text-slate-600 font-medium">{processingStatus.message}</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
            <p className="text-sm text-red-600 font-medium">{processingStatus.message}</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <div
            className={`p-6 border-2 border-dashed rounded-lg transition-colors ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"}`}
            onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500 mb-3">
                Drag & drop a CSV file here or
              </p>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse File
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="glass-effect shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="gold-accent p-2 rounded-lg">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {statusContent()}
      </CardContent>
    </Card>
  );
}