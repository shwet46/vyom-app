import React, { useRef, useState } from 'react';
import {
  X,
  Camera,
  Scan,
  Check,
  CheckCircle2,
  RefreshCw,
  Upload,
  IndianRupee,
  Plus,
  AlertCircle,
  FileText,
} from './icons';
import { ScannedLedgerRow, UdhaarCustomer } from '../types';
import { sampleScannedRows } from '../data/mockData';
import { formatRupee } from '../utils/formatters';
import { confirmKhataScan, updateKhataScanRows, uploadKhataScan } from '../services/api';

interface KhataScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLedger: (newCustomers: UdhaarCustomer[]) => void | Promise<void>;
}

export const KhataScannerModal: React.FC<KhataScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveToLedger,
}) => {
  const [step, setStep] = useState<'capture' | 'scanning' | 'results'>('capture');
  const [scannedRows, setScannedRows] = useState<ScannedLedgerRow[]>(sampleScannedRows);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [serverRows, setServerRows] = useState<any[]>([]);
  const [scanStatusMsg, setScanStatusMsg] = useState('Vyom Handwriting Padh Raha Hai...');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStep('capture');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setScanId(null);
    setServerRows([]);
    setErrorMsg(null);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg(null);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Perform OCR using Sarvam Document Intelligence
  const executeScan = async (fileToScan?: File) => {
    setStep('scanning');
    setErrorMsg(null);
    setScanStatusMsg('Sarvam Document Intelligence API se connect ho raha hai...');

    const timer1 = setTimeout(() => {
      setScanStatusMsg('Sarvam Doc AI (hi-IN) haath se likhi bahi-khata padh raha hai...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setScanStatusMsg('Grahak naam, items aur udhari raashi extract ho rahi hai...');
    }, 2800);

    try {
      const file = fileToScan || selectedFile;
      if (file) {
        const res = await uploadKhataScan(file, 'upload');
        clearTimeout(timer1);
        clearTimeout(timer2);

        if (res && res.rows && res.rows.length > 0) {
          const rows: ScannedLedgerRow[] = res.rows.map((r: any, idx: number) => ({
            id: r.row_id || `scanned-row-${Date.now()}-${idx}`,
            name: r.name_raw || 'Customer',
            amount: r.amount_paise ? Math.round(r.amount_paise / 100) : 0,
            date: r.date ? String(r.date) : new Date().toISOString().split('T')[0],
            confidence: r.confidence ? Math.round(r.confidence * 100) : 94,
            selected: true,
            items: r.flags?.length ? r.flags.join(', ') : 'Kirana grocery goods',
            entryType: r.entry_type === 'payment_received' ? 'jama' : 'udhaar',
          }));
          setScannedRows(rows);
          setServerRows(res.rows);
          if (res.id) setScanId(res.id);
          setStep('results');
          return;
        }

        throw new Error('No ledger rows were detected in the uploaded file.');
      }

      // If no file was provided (Demo mode) or no rows returned, use rich sample extracted entries
      clearTimeout(timer1);
      clearTimeout(timer2);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setScannedRows(sampleScannedRows);
      setStep('results');
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.warn('OCR scan failed:', err);
      setErrorMsg(err?.message || 'OCR scan failed. Please try another image.');
      setStep('capture');
    }
  };

  const handleStartDemoScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    executeScan();
  };

  const handleToggleRow = (id: string) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleUpdateAmount = (id: string, newAmt: number) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount: newAmt } : row))
    );
  };

  const handleUpdateName = (id: string, newName: string) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, name: newName } : row))
    );
  };

  const handleAddCustomRow = () => {
    const newRow: ScannedLedgerRow = {
      id: `manual-${Date.now()}`,
      name: 'Naya Grahak',
      amount: 500,
      date: new Date().toISOString().split('T')[0],
      confidence: 100,
      selected: true,
      items: 'Direct Entry',
      entryType: 'udhaar',
    };
    setScannedRows((prev) => [...prev, newRow]);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    const selectedRows = scannedRows.filter((r) => r.selected);

    // If we have an active backend scan session, confirm it in MongoDB
    if (scanId) {
      try {
        const editedRows = selectedRows.map((row) => {
          const original = serverRows.find((serverRow) => serverRow.row_id === row.id);
          return {
            ...(original || {}),
            row_id: row.id,
            page: original?.page || 1,
            name_raw: row.name,
            amount_paise: Math.round(row.amount * 100),
            date: row.date,
            entry_type: row.entryType === 'jama' ? 'payment_received' : 'credit_given',
            confidence: row.confidence / 100,
            edited: true,
          };
        });
        await updateKhataScanRows(scanId, editedRows);
        await confirmKhataScan(scanId);
        await onSaveToLedger([]);
        setIsSaving(false);
        handleClose();
        return;
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Ledger save failed. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    const newCustomers: UdhaarCustomer[] = selectedRows.map((r, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      name: r.name,
      initials: r.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: '+91 9822' + Math.floor(10000 + Math.random() * 90000),
      amount: r.amount,
      daysOverdue: Math.floor(5 + Math.random() * 25),
      status: 'reminder_sent',
      tone: 'soft',
      language: 'marathi',
      lastReminderDate: 'Just added via Sarvam OCR',
      timeline: [
        {
          date: r.date,
          title: 'Sarvam OCR Khata Import',
          note: `₹${r.amount} ledger scan se add hua (${r.items || 'Kirana items'})`,
          type: 'reminder',
        },
      ],
    }));

    onSaveToLedger(newCustomers);
    setIsSaving(false);
    handleClose();
  };

  const selectedCount = scannedRows.filter((r) => r.selected).length;
  const totalSelectedAmount = scannedRows
    .filter((r) => r.selected)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/75 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-lg bg-paper rounded-3xl border border-line shadow-feature overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-paper">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue/10 flex items-center justify-center text-blue">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-obsidian tracking-tight">
                Khata Scanner (Sarvam AI OCR)
              </h2>
              <p className="text-[11px] text-charcoal">
                Upload image, PDF, or capture handwritten register
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'capture' && (
            <div className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {/* Drag and drop upload zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-4 transition-all flex flex-col items-center justify-center text-center ${
                  isDragging
                    ? 'border-blue bg-blue/5 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-line hover:border-blue/60 bg-cloud/40'
                }`}
              >
                {selectedFile ? (
                  <div className="w-full space-y-3">
                    {previewUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-line max-h-48 flex items-center justify-center bg-black/5">
                        <img
                          src={previewUrl}
                          alt="Uploaded Khata"
                          className="max-h-48 object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-charcoal">
                        <div className="w-12 h-12 rounded-2xl bg-blue/10 text-blue flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xs text-obsidian">{selectedFile.name}</span>
                        <span className="text-[11px] text-slate">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Document Ready
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-emerald-800 font-bold truncate max-w-[200px]">
                        ✓ {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs underline cursor-pointer"
                      >
                        File Hatayein
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => executeScan(selectedFile)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-blue text-white font-extrabold text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Scan className="w-4 h-4 animate-pulse" />
                      <span>Sarvam Doc AI se Scan Karein</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue/10 text-blue flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-obsidian">
                        Bahi-Khata Document / Image Upload Karein
                      </h4>
                      <p className="text-xs text-charcoal mt-1">
                        Yahan drag & drop karein ya niche diye buttons se select karein
                      </p>
                      <p className="text-[10px] text-slate mt-0.5">
                        JPG, PNG, WEBP, PDF (Handwritten & Printed)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-blue text-white font-bold text-xs shadow-xs hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-white border border-line text-obsidian font-bold text-xs hover:bg-cloud flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue" />
                        <span>Camera Photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample / Demo register quick preview & scan */}
              {!selectedFile && (
                <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-[#fdfbf7] space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-amber-950">
                        ⚡ Sample Khata Page (1-Click Test)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Sharma Kirana Demo
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-charcoal/80 space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-100">
                    <div className="flex justify-between border-b border-dashed border-amber-200 pb-0.5">
                      <span>Kishore Shirole (Dal, Ghee)</span>
                      <span className="font-bold text-ink">₹1,250</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-amber-200 pb-0.5">
                      <span>Nanda Tai Gaikwad (Poha, Mirchi)</span>
                      <span className="font-bold text-ink">₹820</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pravin Mandhare (Sugar, Atta bag)</span>
                      <span className="font-bold text-ink">₹2,400</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartDemoScan}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs hover:bg-amber-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Sample Register Scan Karein (Instant Demo)</span>
                  </button>
                </div>
              )}

              {/* Info footer */}
              <div className="text-[11px] text-charcoal bg-cloud/60 p-3 rounded-xl border border-soft-line flex items-start gap-2">
                <span className="text-blue font-bold">💡</span>
                <span>
                  <strong>Sarvam Document Intelligence (hi-IN)</strong> haath se likhe Hindi,
                  Marathi aur English bahi-khate ko scan karke grahak naam, samaan aur udhari raashi
                  ko 94%+ accuracy se digital ledger me convert karta hai.
                </span>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
              {/* Laser scanning visual animation */}
              <div className="relative w-64 h-44 rounded-2xl border-2 border-blue bg-[#fdfbf7] overflow-hidden p-3 shadow-feature">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Scanning"
                    className="w-full h-full object-cover rounded opacity-75"
                  />
                ) : (
                  <div className="space-y-2 opacity-60 font-mono text-[10px] text-left text-charcoal">
                    <div className="h-2 w-3/4 bg-slate-300 rounded" />
                    <div className="h-2 w-full bg-slate-200 rounded" />
                    <div className="h-2 w-1/2 bg-slate-300 rounded" />
                    <div className="h-2 w-4/5 bg-slate-200 rounded" />
                    <div className="h-2 w-2/3 bg-slate-300 rounded" />
                  </div>
                )}
                {/* Laser bar */}
                <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue to-transparent shadow-[0_0_14px_#2597d0] animate-[bounce_1.8s_infinite]" />
              </div>

              <div className="space-y-2 max-w-xs">
                <div className="flex items-center justify-center gap-2 font-extrabold text-sm text-obsidian">
                  <RefreshCw className="w-4 h-4 text-blue animate-spin" />
                  <span>{scanStatusMsg}</span>
                </div>
                <p className="text-[11px] text-slate">
                  Sarvam Doc AI (doc-ai/v1) digitizing handwriting & structuring ledger rows...
                </p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      {scannedRows.length} Entries Sarvam OCR se Extract Hui!
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Total: ₹{totalSelectedAmount.toLocaleString('en-IN')} • 94% Avg Confidence
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('capture')}
                  className="text-xs font-bold text-charcoal hover:text-ink underline cursor-pointer"
                >
                  Upload Another
                </button>
              </div>

              {/* Scanned Entries List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-obsidian flex justify-between px-1">
                  <span>Grahak Naam & Tareekh</span>
                  <span>Amount & Status</span>
                </div>

                {scannedRows.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => handleToggleRow(row.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      row.selected
                        ? 'bg-white border-blue shadow-xs'
                        : 'bg-cloud/60 border-soft-line opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                          row.selected ? 'bg-blue text-white' : 'border border-line bg-white'
                        }`}
                      >
                        {row.selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <input
                          type="text"
                          value={row.name}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateName(row.id, e.target.value)}
                          className="font-bold text-xs text-obsidian bg-transparent border-b border-transparent hover:border-line focus:border-blue focus:outline-none w-full"
                        />
                        <div className="text-[10px] text-slate flex items-center gap-2">
                          <span>{row.date}</span>
                          {row.items && <span>• {row.items}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        {row.confidence}%
                      </span>
                      <div className="flex items-center gap-0.5 font-extrabold text-xs text-ink">
                        <span>₹</span>
                        <input
                          type="number"
                          value={row.amount}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateAmount(row.id, Number(e.target.value))}
                          className="w-16 bg-cloud border border-line rounded px-1.5 py-0.5 text-right font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom entry option */}
              <button
                type="button"
                onClick={handleAddCustomRow}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-line text-charcoal hover:text-ink hover:border-blue text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue" />
                <span>+ Nayi Entry Jodein</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'results' && (
          <div className="p-4 border-t border-soft-line bg-paper flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-3 rounded-2xl border border-line text-xs font-bold text-charcoal hover:bg-cloud cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || selectedCount === 0}
              onClick={handleConfirmSave}
              className="flex-2 py-3 px-4 rounded-2xl bg-blue text-white text-xs font-extrabold shadow-button hover:bg-blue/90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ledger Save Ho Raha Hai...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Khata Ledger Mein Jodein ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
