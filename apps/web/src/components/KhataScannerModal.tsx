import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Trash2,
} from './icons';
import { ScannedLedgerRow, UdhaarCustomer, Language } from '../types';
import { sampleScannedRows } from '../data/mockData';
import { formatRupee } from '../utils/formatters';
import { translations, translateHindiText } from '../utils/i18n';
import { confirmKhataScan, updateKhataScanRows, uploadKhataScan } from '../services/api';

interface KhataScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLedger: (newCustomers: UdhaarCustomer[]) => void | Promise<void>;
  lang: Language;
}

export const KhataScannerModal: React.FC<KhataScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveToLedger,
  lang,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [step, setStep] = useState<'capture' | 'scanning' | 'results'>('capture');
  const [scannedRows, setScannedRows] = useState<ScannedLedgerRow[]>(sampleScannedRows);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [serverRows, setServerRows] = useState<any[]>([]);
  const [scanStatusMsg, setScanStatusMsg] = useState('AI Vision Khata Padh Raha Hai...');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showLiveCamera, setShowLiveCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset file input values when the modal opens so the same file can be re-selected
  useEffect(() => {
    if (isOpen) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
    return () => {
      // Cleanup camera stream when modal closes
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setShowLiveCamera(false);
    };
  }, [isOpen]);

  // Attach video stream as soon as videoRef mounts
  useEffect(() => {
    if (showLiveCamera && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.warn('Video play error:', err));
    }
  }, [showLiveCamera, cameraStream]);

  // Start live camera stream with fallback to native capture
  const startLiveCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      // In non-secure contexts or legacy browsers, trigger native camera input
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
        cameraInputRef.current.click();
      }
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }
      setCameraStream(stream);
      setShowLiveCamera(true);
      setErrorMsg(null);
    } catch (err: any) {
      console.warn('Live camera access failed, falling back to native capture input:', err);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
        cameraInputRef.current.click();
      } else {
        setErrorMsg(
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Browser settings mein camera allow karein ya "Upload Photo" use karein.'
            : 'Camera chalu nahi ho paaya. "Upload Photo" button use karein.'
        );
      }
    }
  }, []);

  // Capture photo from live camera stream
  const captureFromLiveCamera = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `khata-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        processSelectedFile(file);
        // Stop camera
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
          setCameraStream(null);
        }
        setShowLiveCamera(false);
      },
      'image/jpeg',
      0.92
    );
  }, [cameraStream]);

  // Handle native camera input click - try live camera first, auto-fallbacks to native
  const handleCameraClick = useCallback(() => {
    startLiveCamera();
  }, [startLiveCamera]);

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
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowLiveCamera(false);
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
    // Reset the input value so the same file can be selected again
    if (e.target) e.target.value = '';
  };

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Sirf image ya PDF khata file upload karein.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File 15 MB se chhoti honi chahiye.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
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

  // Perform OCR using Multimodal Vision & Document AI
  const executeScan = async (fileToScan?: File) => {
    setStep('scanning');
    setErrorMsg(null);
    setScanStatusMsg(t.scanProgress1);

    const timer1 = setTimeout(() => {
      setScanStatusMsg('Handwritten bahi-khata, Devanagari akshar aur ank padhe ja rahe hain...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setScanStatusMsg('Grahak naam, udhari aur jama rashi extract ho rahi hai...');
    }, 2800);

    const timer3 = setTimeout(() => {
      setScanStatusMsg('Sarvam Doc AI processing... Thoda aur wait karein...');
    }, 8000);

    try {
      const file = fileToScan || selectedFile;
      if (file) {
        const res = await uploadKhataScan(file, showLiveCamera ? 'camera' : 'upload');
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);

        if (res && res.rows && res.rows.length > 0) {
          const rows: ScannedLedgerRow[] = res.rows.map((r: any, idx: number) => {
            const isPayment = r.entry_type === 'payment_received' || String(r.entry_type).toLowerCase().includes('jama');
            const itemsRaw = r.items_summary || (r.flags?.length ? r.flags.join(', ') : (isPayment ? 'नकद जमा' : 'किराना'));
            const translatedItems = translateHindiText(itemsRaw, lang);
            return {
              id: r.row_id || `scanned-row-${Date.now()}-${idx}`,
              name: r.name_raw || 'Customer',
              amount: r.amount_paise ? Math.round(r.amount_paise / 100) : 0,
              date: r.date ? String(r.date).slice(0, 10) : new Date().toISOString().split('T')[0],
              confidence: r.confidence ? Math.round(r.confidence * 100) : 95,
              selected: true,
              items: translatedItems,
              entryType: isPayment ? 'jama' : 'udhaar',
            };
          });
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
      clearTimeout(timer3);
      await new Promise((resolve) => setTimeout(resolve, 800));
      const translatedSample = sampleScannedRows.map(row => ({
        ...row,
        items: row.items ? translateHindiText(row.items, lang) : row.items
      }));
      setScannedRows(translatedSample);
      setStep('results');
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      console.error('OCR scan failed:', err);
      setStep('capture');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'OCR scan nahi ho paaya. Photo saaf karke dobara try karein.'
      );
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

  const handleToggleEntryType = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScannedRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? { ...row, entryType: row.entryType === 'jama' ? 'udhaar' : 'jama' }
          : row
      )
    );
  };

  const handleUpdateAmount = (id: string, newAmt: number) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, amount: Math.max(0, newAmt) } : row))
    );
  };

  const handleUpdateName = (id: string, newName: string) => {
    setScannedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, name: newName } : row))
    );
  };

  const handleRemoveRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScannedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddCustomRow = () => {
    const newRow: ScannedLedgerRow = {
      id: `manual-${Date.now()}`,
      name: 'Naya Grahak',
      amount: 500,
      date: new Date().toISOString().split('T')[0],
      confidence: 100,
      selected: true,
      items: 'Direct Entry (Udhar)',
      entryType: 'udhaar',
    };
    setScannedRows((prev) => [...prev, newRow]);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    const selectedRows = scannedRows.filter((r) => r.selected);

    const newCustomers: UdhaarCustomer[] = selectedRows.map((r, idx) => ({
      id: `scanned-${Date.now()}-${idx}`,
      name: r.name,
      initials: r.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'GK',
      phone: '+91 9822' + Math.floor(10000 + Math.random() * 90000),
      amount: r.entryType === 'jama' ? 0 : r.amount,
      daysOverdue: 0,
      status: r.entryType === 'jama' ? 'paid' : 'reminder_sent',
      tone: 'soft',
      language: 'hinglish',
      lastReminderDate: 'Just added via OCR',
      totalUdhaarEver: r.entryType === 'udhaar' ? r.amount : 0,
      totalJamaEver: r.entryType === 'jama' ? r.amount : 0,
      timeline: [
        {
          date: r.date,
          title: r.entryType === 'jama' ? 'Khata Jama (OCR)' : 'Khata Udhaar (OCR)',
          note: `₹${r.amount} ledger scan se jud gaya (${r.items || (r.entryType === 'jama' ? 'Cash Jama' : 'Kirana items')})`,
          type: r.entryType === 'jama' ? 'payment' : 'reminder',
        },
      ],
    }));

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
            items_summary: row.items,
            amount_paise: Math.round(row.amount * 100),
            date: row.date,
            entry_type: row.entryType === 'jama' ? 'payment_received' : 'credit_given',
            confidence: row.confidence / 100,
            edited: true,
          };
        });
        await updateKhataScanRows(scanId, editedRows);
        await confirmKhataScan(scanId);
        await onSaveToLedger(newCustomers);
        setIsSaving(false);
        handleClose();
        return;
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Ledger save failed. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    await onSaveToLedger(newCustomers);
    setIsSaving(false);
    handleClose();
  };

  const selectedCount = scannedRows.filter((r) => r.selected).length;
  const totalUdhaarAmount = scannedRows
    .filter((r) => r.selected && r.entryType !== 'jama')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalJamaAmount = scannedRows
    .filter((r) => r.selected && r.entryType === 'jama')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="khata-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 backdrop-blur-xs p-2">
      <div
        className="w-full max-w-[420px] bg-surface rounded-2xl border-2 border-ink overflow-hidden flex flex-col max-h-[92%] animate-fade-slide-up"
        style={{ boxShadow: '2px 2px 0px var(--shadow-color)' }}
      >
        {/* Screen-reader only accessible inputs — never blocked by click policies */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        {/* Hidden canvas for capturing camera frames */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-ink bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue/10 flex items-center justify-center text-blue shadow-xs">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-obsidian tracking-tight">
                {t.khataScannerTitle}
              </h2>
              <p className="text-[11px] text-charcoal">
                {t.khataScannerHelp}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer transition"
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

              {/* Live Camera View */}
              {showLiveCamera && (
                <div className="rounded-2xl border-2 border-blue overflow-hidden bg-black relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                  {/* Scanner overlay guide */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div className="w-full h-36 border-2 border-dashed border-white/80 rounded-xl relative">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue animate-pulse" />
                    </div>
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full mt-2 backdrop-blur-xs">
                      Bahi-Khate ka page frame ke andar rakhein
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraInputRef.current) {
                          cameraInputRef.current.value = '';
                          cameraInputRef.current.click();
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/20 text-white text-[11px] font-bold cursor-pointer hover:bg-white/30 transition"
                      title="Use System Camera"
                    >
                      System Camera
                    </button>
                    <button
                      type="button"
                      onClick={captureFromLiveCamera}
                      className="w-14 h-14 rounded-full bg-white border-4 border-blue flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      title="Capture Photo"
                    >
                      <Camera className="w-6 h-6 text-blue" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraStream) {
                          cameraStream.getTracks().forEach((track) => track.stop());
                          setCameraStream(null);
                        }
                        setShowLiveCamera(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-[11px] font-bold cursor-pointer hover:bg-white/30 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Drag and drop upload zone */}
              {!showLiveCamera && (
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
                      <div className="relative rounded-xl overflow-hidden border border-line max-h-52 flex items-center justify-center bg-black/5">
                        <img
                          src={previewUrl}
                          alt="Uploaded Khata"
                          className="max-h-52 object-contain rounded-lg shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center gap-2 text-charcoal">
                        <div className="w-12 h-12 rounded-2xl bg-blue/10 text-blue flex items-center justify-center shadow-xs">
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
                      className="w-full py-3 px-4 rounded-2xl bg-blue text-white font-extrabold text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Scan className="w-4 h-4 animate-pulse" />
                      <span>OCR se Khata Scan Karein (Extract Udhar)</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue/10 text-blue flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-obsidian">
                        {t.uploadDocument}
                      </h4>
                      <p className="text-xs text-charcoal mt-1">
                        {t.dragDropHelp}
                      </p>
                      <p className="text-[10px] text-slate mt-0.5">
                        {t.fileFormats}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                            fileInputRef.current.click();
                          }
                        }}
                        className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-blue text-white font-bold text-xs shadow-xs hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo / PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCameraClick}
                        className="flex-1 min-w-[130px] py-2.5 px-3 rounded-xl bg-white border border-line text-obsidian font-bold text-xs hover:bg-cloud flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue" />
                        <span>Camera Photo</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              )}

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
                      Instant Demo
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-charcoal/80 space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-100">
                    <div className="flex justify-between border-b border-dashed border-amber-200 pb-0.5">
                      <span>Ramesh Kumar (Udhar)</span>
                      <span className="font-bold text-rose-700">₹750 [Udhar]</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-amber-200 pb-0.5">
                      <span>Suresh Patil (Udhar)</span>
                      <span className="font-bold text-rose-700">₹420 [Udhar]</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Anita Sharma (Cash Jama)</span>
                      <span className="font-bold text-emerald-700">₹500 [Jama]</span>
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

              <div className="text-[11px] text-charcoal bg-cloud/60 p-3 rounded-xl border border-soft-line flex items-start gap-2">
                <span className="text-blue font-bold">💡</span>
                <span>
                  <strong>AI Khata OCR:</strong> {t.ocrInfo}
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
                <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-blue to-transparent shadow-[0_0_14px_#6366F1] animate-[bounce_1.8s_infinite]" />
              </div>

              <div className="space-y-2 max-w-xs">
                <div className="flex items-center justify-center gap-2 font-extrabold text-sm text-obsidian">
                  <RefreshCw className="w-4 h-4 text-blue animate-spin" />
                  <span>{scanStatusMsg}</span>
                </div>
                <p className="text-[11px] text-slate">
                  {t.scanProcessing}
                </p>
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs font-bold text-emerald-950">
                      {scannedRows.length} {t.extractSuccess}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('capture')}
                    className="text-xs font-bold text-charcoal hover:text-ink underline cursor-pointer"
                  >
                    {t.uploadAnother}
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] pt-1 border-t border-emerald-200/60">
                  <span className="font-bold text-rose-800">
                    🔴 {t.totalUdhaar}: {formatRupee(totalUdhaarAmount)}
                  </span>
                  <span className="text-charcoal/40">•</span>
                  <span className="font-bold text-emerald-800">
                    🟢 {t.totalJama}: {formatRupee(totalJamaAmount)}
                  </span>
                  <span className="text-charcoal/40">•</span>
                  <span className="text-emerald-700">
                    {selectedCount} {t.selected}
                  </span>
                </div>
              </div>

              {/* Scanned Entries List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-obsidian flex justify-between px-1">
                  <span>Grahak Naam & Type</span>
                  <span>Amount & Status</span>
                </div>

                {scannedRows.map((row) => (
                  <div
                    key={row.id}
                    onClick={() => handleToggleRow(row.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      row.selected
                        ? 'bg-white border-blue shadow-xs'
                        : 'bg-cloud/60 border-soft-line opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                            row.selected ? 'bg-blue text-white' : 'border border-line bg-white'
                          }`}
                        >
                          {row.selected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <input
                            type="text"
                            value={row.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateName(row.id, e.target.value)}
                            placeholder="Grahak Naam"
                            className="font-bold text-xs text-obsidian bg-transparent border-b border-transparent hover:border-line focus:border-blue focus:outline-none w-full"
                          />
                        </div>
                      </div>

                      {/* Right Amount & Type */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Entry Type Toggle Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleEntryType(row.id, e)}
                          title="Click to switch between Udhaar and Jama"
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition ${
                            row.entryType === 'jama'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {row.entryType === 'jama' ? '🟢 Jama' : '🔴 Udhaar'}
                        </button>

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

                        <button
                          type="button"
                          onClick={(e) => handleRemoveRow(row.id, e)}
                          title="Delete entry"
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Line: Date and confidence */}
                    <div className="flex items-center justify-end text-[10px] text-slate pl-7 pr-1">
                      <span className="shrink-0 text-slate-400">{row.date} • {row.confidence}% {t.confidence}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom entry option */}
              <button
                type="button"
                onClick={handleAddCustomRow}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-line text-charcoal hover:text-ink hover:border-blue text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue" />
                <span>{t.addManualEntry}</span>
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
              {t.cancel}
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
                  <span>{t.saving}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.saveToLedger} ({selectedCount})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
