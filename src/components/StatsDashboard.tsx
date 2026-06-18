import React from "react";
import { StudyStats } from "../types";
import { Award, Zap, BookOpen, Clock, CheckCircle, Flame, Star, Trophy, Sparkles } from "lucide-react";

interface StatsDashboardProps {
  stats: StudyStats;
  onClaimBadge?: (badgeId: string) => void;
}

export default function StatsDashboard({ stats, onClaimBadge }: StatsDashboardProps) {
  // Compute level progress bar based on XP
  const xpPerLevel = 500;
  const currentLevel = Math.floor(stats.xpPoints / xpPerLevel) + 1;
  const currentLevelProgressXp = stats.xpPoints % xpPerLevel;
  const progressPercent = Math.min(100, Math.floor((currentLevelProgressXp / xpPerLevel) * 100));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm font-sansArabic text-right space-y-6">
      
      {/* Level and XP Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-slate-200 pb-5">
        <div>
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 justify-end">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
            <span>لوحة المؤشرات والتحفيز الأكاديمي</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">تتبع رحلتك الدراسية، واجمع شارات التميز الأسبوعية لتحفيز مستمر</p>
        </div>

        {/* Level Box Badge */}
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-2xl border border-indigo-100 justify-end">
          <div className="text-left font-sans">
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">محصلة نقاط الأداء</p>
            <p className="text-sm font-black text-indigo-700">{stats.xpPoints} XP</p>
          </div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/30">
            {currentLevel}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">مستوى {currentLevel + 1}</span>
          <span className="font-bold text-indigo-600">تقدم مستوى التميز الدراسي: {progressPercent}%</span>
          <span className="font-bold text-slate-700">مستوى {currentLevel}</span>
        </div>
        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400">أكمل محاضرات جديدة، وحل أسئلة الذكاء الاصطناعي لكسب المزيد من نقاط XP.</p>
      </div>

      {/* Main Core Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Core Block 1: Lectures Count */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 justify-between">
          <div className="bg-blue-100 text-blue-800 p-2 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold">إجمالي المحاضرات</p>
            <p className="text-lg font-black text-slate-800 font-sans mt-0.5">{stats.totalLectures}</p>
          </div>
        </div>

        {/* Core Block 2: Hours Studied */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 justify-between">
          <div className="bg-amber-100 text-amber-800 p-2 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold">ساعات المذاكرة</p>
            <p className="text-lg font-black text-slate-800 font-sans mt-0.5">{stats.hoursStudied} س</p>
          </div>
        </div>

        {/* Core Block 3: Daily Streak */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 justify-between">
          <div className="bg-red-100 text-red-800 p-2 rounded-xl animate-bounce">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold">أيام تدوين متصلة</p>
            <p className="text-lg font-black text-slate-800 font-sans mt-0.5">{stats.streakDays} أيام</p>
          </div>
        </div>

        {/* Core Block 4: Medals unlocked */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3 justify-between">
          <div className="bg-purple-100 text-purple-800 p-2 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold">الشارات المحققة</p>
            <p className="text-lg font-black text-slate-800 font-sans mt-0.5">
              {stats.medals.filter(m => m.unlockedAt).length} من {stats.medals.length}
            </p>
          </div>
        </div>
      </div>

      {/* Unlocked Medals Badges Shelf */}
      <div className="space-y-3">
        <h4 className="font-bold text-slate-800 text-xs text-indigo-800 border-r-2 border-indigo-600 pr-2 pb-0.5">خزانة النياشين وشارات الإنجاز</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.medals.map((medal) => {
            const isUnlocked = !!medal.unlockedAt;
            return (
              <div 
                key={medal.id}
                className={`p-3.5 rounded-xl border transition flex items-start gap-3 text-right ${
                  isUnlocked 
                    ? 'bg-gradient-to-br from-indigo-50/50 to-white border-indigo-100' 
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                {/* Visual Circle Icon */}
                <div className={`p-2 rounded-2xl ${
                  isUnlocked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Star className="w-5 h-5 fill-current" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    {isUnlocked ? (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-full">
                        مكتملة
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-200 text-slate-600 font-semibold px-1.5 py-0.5 rounded-full">
                        مغلقة
                      </span>
                    )}
                    <h5 className="font-bold text-slate-800 text-xs">{medal.title}</h5>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{medal.description}</p>
                  {isUnlocked && (
                    <p className="text-[8px] text-slate-400 mt-1 font-mono">تاريخ الكسب: {new Date(medal.unlockedAt!).toLocaleDateString('ar-EG')}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Progress representation (Simulated bar columns chart via beautiful Tailwind CSS blocks) */}
      <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
        <h4 className="font-bold text-slate-800 text-xs text-indigo-800 mb-4">معدلات الحصاد الدراسي الأسبوعي (ساعات تدوين الملاحظات)</h4>
        
        <div className="flex items-end justify-between h-40 pt-4 px-6 md:px-12">
          {/* Sunday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer" style={{ height: "45%" }} title="3.5 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">أحد</span>
          </div>
          {/* Monday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer animate-pulse" style={{ height: "85%" }} title="5.5 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">اثنين</span>
          </div>
          {/* Tuesday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer" style={{ height: "30%" }} title="2 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">ثلاثاء</span>
          </div>
          {/* Wednesday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer" style={{ height: "65%" }} title="4.5 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">أربعاء</span>
          </div>
          {/* Thursday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer animate-pulse" style={{ height: "95%" }} title="6.8 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">خميس</span>
          </div>
          {/* Friday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-200 rounded-t-md hover:bg-indigo-300 transition-all cursor-pointer" style={{ height: "10%" }} title="0.5 ساعة" />
            <span className="text-[10px] font-bold text-slate-500">جمعة</span>
          </div>
          {/* Saturday */}
          <div className="flex flex-col items-center gap-2 h-full justify-end">
            <div className="w-8 bg-indigo-600 rounded-t-md hover:bg-indigo-700 transition-all cursor-pointer" style={{ height: "40%" }} title="3 ساعات" />
            <span className="text-[10px] font-bold text-slate-500">سبت</span>
          </div>
        </div>
      </div>

      {/* AI Self-Adaptive Personalization Diagnosis */}
      <div className="p-5 bg-gradient-to-l from-indigo-50/70 to-indigo-50/20 border border-indigo-100 rounded-xl space-y-4">
        <div className="flex items-center gap-2 justify-end">
          <div>
            <h4 className="font-extrabold text-xs text-indigo-950 font-sansArabic">مستشارك الذكي لتحليل المستوى والتطوير الذاتي</h4>
            <p className="text-[10px] text-indigo-700/80 mt-0.5">محرك ذكاء اصطناعي تفاعلي يفحص مستواك، سلوكك ونقاط ضعفك ليطور خطط الحفظ.</p>
          </div>
          <div className="p-2 bg-indigo-600 text-white rounded-lg animate-pulse shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white/70 p-4 rounded-xl border border-indigo-100/40 text-xs text-slate-700 leading-relaxed text-right space-y-2">
          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">تشخيص الذكاء الاصطناعي الحالي:</span>
          
          {stats.xpPoints < 300 ? (
            <p>مستوى المذاكرة في البداية. لتطوير ذاتك وتجاوز التحديات، يرجى تدوين ملاحظات جديدة يدوياً والتحول لقسم <strong>التدريب اليومي</strong> لحصد أول 200 نقطة XP إضافية وتفعيل ذاكرتك الدائمة.</p>
          ) : stats.xpPoints < 700 ? (
            <p>أداء ممتاز! يظهر فحص سلوكك تفضيلك للرسومات واستخدام الروابط البصرية والأسهم. يُنصح بالانتقال إلى قسم <strong>محلل خط اليد</strong>، ومسح رسوماتك بالكامل لتوليد أسئلة تملأ نقاط الضعف الرياضية والهندسية الحالية.</p>
          ) : (
            <p>لقد صُنفت كطالب فائق الأداء والالتزام! يقترح المحرك التكيفي تفعيل حظر رمز الخصوصية للأمان للمقررات الحيوية، واختبار نفسك في التدريبات المقترحة لمستوى الصعوبة العالي (Hard) في الخوارزميات العصبية لتقليص الأخطاء الشائعة.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-indigo-100/60 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5 justify-end">
              <span><strong>مرتفع (85%)</strong></span>
              <span className="h-2 w-2 bg-emerald-500 rounded-full mt-0.5" />
              <span>مؤشر الاستيعاب العام:</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span><strong>الخرائط والرسوم اليدوية</strong></span>
              <span className="h-2 w-2 bg-indigo-500 rounded-full mt-0.5" />
              <span>ميزة التعلم المفضلة لديك:</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
