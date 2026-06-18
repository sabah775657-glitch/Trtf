import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, HelpCircle } from "lucide-react";

interface PINActivationBarrierProps {
  storedPin: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function PINActivationBarrier({
  storedPin,
  onSuccess,
  onCancel
}: PINActivationBarrierProps) {
  const [entered, setEntered] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  // Pad numbers clicked
  const handleKeyClick = (num: string) => {
    setErrorText(null);
    if (entered.length < 4) {
      const next = entered + num;
      setEntered(next);
      
      // Auto-submit when four digits accumulated
      if (next === storedPin) {
        onSuccess();
      } else if (next.length === 4) {
        setTimeout(() => {
          setErrorText("رمز السر غير متطابق؛ يرجى التحقق وإعادة المحاولة!");
          setEntered("");
        }, 150);
      }
    }
  };

  const clearEntered = () => {
    setEntered("");
    setErrorText(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-50 p-6 font-sansArabic text-right">
      
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl w-full max-w-sm text-center space-y-6 shadow-2xl relative">
        
        {/* Lock visual circle */}
        <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <h3 className="font-bold text-white text-base">دفتر المحاضرات مؤمن</h3>
          <p className="text-xs text-slate-400 mt-1">يرجى كتابة رمز المرور (PIN) لفك قفل التطبيق أو استعراض المواد المخفية</p>
        </div>

        {/* Enter Code Display Indicators */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border transition-all ${
                entered.length > idx 
                  ? 'bg-indigo-500 border-indigo-400 scale-110' 
                  : 'bg-slate-700/50 border-slate-600'
              }`}
            />
          ))}
        </div>

        {errorText && (
          <p className="text-[11px] text-rose-400 leading-relaxed font-semibold">{errorText}</p>
        )}

        {/* Pad Buttons Grid */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyClick(num)}
              className="w-16 h-16 bg-slate-700 hover:bg-slate-600 text-white font-sans font-bold text-lg rounded-2xl transition active:scale-95 mx-auto flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={clearEntered}
            className="text-xs text-rose-400 hover:underline flex items-center justify-center font-semibold"
          >
            مسح الكل
          </button>
          
          <button
            onClick={() => handleKeyClick("0")}
            className="w-16 h-16 bg-slate-700 hover:bg-slate-600 text-white font-sans font-bold text-lg rounded-2xl transition active:scale-95 mx-auto flex items-center justify-center"
          >
            0
          </button>
          
          {onCancel ? (
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:underline flex items-center justify-center font-semibold"
            >
              إلغاء الأمر
            </button>
          ) : (
            <div />
          )}
        </div>

        <p className="text-[10px] text-slate-500">
          ملاحظة: حمايتك أولويتنا؛ تخزن شفرة المرور بأمان تام في الذاكرة التوافقية المستقرة دون إرسالها للخوادم.
        </p>
      </div>

    </div>
  );
}
