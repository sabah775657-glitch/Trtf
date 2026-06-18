import React, { useState } from "react";
import { BackupRestoreConfig } from "../types";
import { Cloud, CloudUpload, CloudLightning, RefreshCw, Calendar, CheckCircle2, DownloadCloud, AlertTriangle } from "lucide-react";

interface BackupDriveManagerProps {
  backupConfig: BackupRestoreConfig;
  onUpdateBackupConfig: (updates: Partial<BackupRestoreConfig>) => void;
  onTriggerBackup: () => void;
  onTriggerRestore: (backupId: string) => void;
}

export default function BackupDriveManager({
  backupConfig,
  onUpdateBackupConfig,
  onTriggerBackup,
  onTriggerRestore
}: BackupDriveManagerProps) {
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCloudBackup = () => {
    setSyncing(true);
    setSuccessMsg(null);
    setTimeout(() => {
      onTriggerBackup();
      setSyncing(false);
      setSuccessMsg("تم رفع نسخة احتياطية مشفرة بالكامل بنجاح إلى حسابك في Google Drive ☁️.");
    }, 1500);
  };

  const handleCloudRestore = (backupId: string) => {
    setSyncing(true);
    setTimeout(() => {
      onTriggerRestore(backupId);
      setSyncing(false);
      setSuccessMsg("تمت استعادة البيانات والدفاتر بدقة مذهلة بنفس الهيكلية لضمان سلامة التعديلات.");
    }, 1200);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm font-sansArabic text-right space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 justify-end">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <span>النسخ الاحتياطي والأمان التكاملي (Google Drive)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">تشفير الملاحظات ورفعها بشكل آمن لمنع الضياع واستعادتها على أي آيفون أو أندرويد جديد</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold leading-relaxed text-right flex items-center gap-2 justify-end">
          <span>{successMsg}</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        </div>
      )}

      {/* Main Configurations Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
        
        {/* Set Auto Backup Frequency */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 justify-end">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>جدولة الرفع التلقائي</span>
          </h4>
          <p className="text-[11px] text-slate-400">حدد مواعيد سحب ورفع النسخ المجدولة خلف الكواليس</p>
          
          <div className="grid grid-cols-4 gap-2">
            {(['daily', 'weekly', 'monthly', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onUpdateBackupConfig({ schedule: mode })}
                className={`py-2 px-1 text-center rounded-lg text-xs font-medium border transition ${
                  backupConfig.schedule === mode 
                    ? 'bg-indigo-600 border-indigo-600 text-white font-semibold' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {mode === 'daily' ? 'يومي' :
                 mode === 'weekly' ? 'أسبوعي' :
                 mode === 'monthly' ? 'شهري' : 'يدوي'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 justify-end mt-2">
            <label className="text-xs text-slate-600 font-medium">تفعيل التزامن مع غوغل درايف</label>
            <input
              type="checkbox"
              checked={backupConfig.isAutoBackupEnabled}
              onChange={(e) => onUpdateBackupConfig({ isAutoBackupEnabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 accent-indigo-600 rounded"
            />
          </div>
        </div>

        {/* Start Instant manual backup action */}
        <div className="flex flex-col justify-center items-end space-y-3 border-r border-slate-200/50 pr-6">
          <span className="text-xs font-bold text-slate-700">تزامن يدوي عاجل الآن</span>
          <p className="text-[10px] text-slate-400">يقوم بتشفير محلي شامل للضربات والنصوص ورفعها على درايف</p>
          
          <button
            onClick={handleCloudBackup}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow transition"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>مزامنة تامة فورية</span>
          </button>
        </div>
      </div>

      {/* History Restoration List Options */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-xs text-indigo-800 border-r-2 border-indigo-600 pr-2">تاريخ النسخ المتاحة للاستعادة على درايف</h4>
        
        {backupConfig.backupsList.length > 0 ? (
          <div className="space-y-2">
            {backupConfig.backupsList.map((backup) => (
              <div 
                key={backup.id}
                className="p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                {/* Restore button */}
                <button
                  onClick={() => handleCloudRestore(backup.id)}
                  disabled={syncing}
                  className="flex items-center gap-1.5 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-100 transition"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>استعادة هذه النسخة</span>
                </button>

                {/* Details info */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{backup.sizeKb} KB</span>
                    <h5 className="font-bold text-slate-800">نسخة درايف المرفوعة: {backup.lecturesCount} محاضرات</h5>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(backup.timestamp).toLocaleString('ar-EG')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">لا توجد نسخ احتياطية مسجلة بعد على الحساب الصحفي.</p>
        )}
      </div>

      {/* Secure Cryptographic notice */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex gap-2 justify-end">
        <div className="text-right">
          <strong>تشفير AES-256 للخصوصية:</strong> جميع النسخ الاحتياطية المرفوعة تمر بعملية تشفير تامة بمفتاح حماية مستقل على جهازك قبل خروجها للإنترنت لضمان سرية دفاتر ومذكرات محاضراتك.
        </div>
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      </div>

    </div>
  );
}
