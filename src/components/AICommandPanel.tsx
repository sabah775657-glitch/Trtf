import React, { useState } from "react";
import { Lecture, Flashcard, QuizQuestion } from "../types";
import { Sparkles, Brain, Award, Play, Pause, RefreshCw, Volume2, HelpCircle, CheckCircle2, ChevronLeft, ChevronRight, FileAudio, ChevronDown, ChevronUp } from "lucide-react";

interface AICommandPanelProps {
  lecture: Lecture;
  onUpdateLecture: (updates: Partial<Lecture>) => void;
}

export default function AICommandPanel({ lecture, onUpdateLecture }: AICommandPanelProps) {
  // Panel collapse/expand state
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  // Loading indicators
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [loadingPodcast, setLoadingPodcast] = useState(false);

  // Error placeholders
  const [errorText, setErrorText] = useState<string | null>(null);

  // Active sub-tab inside AI panel
  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'quiz' | 'flashcards' | 'tutor' | 'podcast'>('summary');

  // Flashcards Study Engine State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);

  // Quiz Engine State
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Podcast audio play state
  const [podcastAudio, setPodcastAudio] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string>("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Gather text across all pages in the lecture to feed to Gemini
  const gatherLectureText = () => {
    let fullText = `عنوان المحاضرة: ${lecture.title}\n`;
    lecture.pages.forEach((page, i) => {
      fullText += `\n--- الصفحة ${i + 1} ---\n`;
      if (page.cornellCues) fullText += `الكلمات المساعدة: ${page.cornellCues}\n`;
      if (page.cornellSummary) fullText += `الملخص الهامشي: ${page.cornellSummary}\n`;
      page.textboxes.forEach((box) => {
        fullText += `${box.text}\n`;
      });
      page.shapes.forEach((shp) => {
        if (shp.text) fullText += `شكل يعبر عن: ${shp.text}\n`;
      });
      page.stickers.forEach((st) => {
        fullText += `ملاحظة (${st.type}): ${st.text}\n`;
      });
    });
    // Append audio transcript if any
    lecture.recordings.forEach((rec) => {
      if (rec.transcription) {
        fullText += `\nنص مفرغ صوتياً: ${rec.transcription}\n`;
      }
    });
    return fullText;
  };

  // 1. Call Gemini to summarize
  const handleGenerateSummary = async () => {
    setLoadingSummary(true);
    setErrorText(null);
    try {
      const notesContent = gatherLectureText();
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notesContent, subject: lecture.title })
      });
      if (!res.ok) throw new Error("فشلت عملية التلخيص");
      const data = await res.json();
      onUpdateLecture({ aiSummary: data });
    } catch (e: any) {
      setErrorText("تعذر توليد التلخيص بالذكاء الاصطناعي حالياً.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. Call Gemini for flashcards
  const handleGenerateFlashcards = async () => {
    setLoadingFlashcards(true);
    setErrorText(null);
    try {
      const notesContent = gatherLectureText();
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notesContent, subject: lecture.title })
      });
      if (!res.ok) throw new Error("عطل في توليد الكروت");
      const data = await res.json();
      onUpdateLecture({ flashcards: data });
      setCurrentIndex(0);
      setShowBack(false);
    } catch (e) {
      setErrorText("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لإنشاء بطاقات الاستذكار.");
    } finally {
      setLoadingFlashcards(false);
    }
  };

  // 3. Call Gemini for Quiz MCQ questions
  const handleGenerateQuiz = async () => {
    setLoadingQuiz(true);
    setErrorText(null);
    setUserAnswers({});
    setQuizScore(null);
    try {
      const notesContent = gatherLectureText();
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: notesContent, subject: lecture.title })
      });
      if (!res.ok) throw new Error("عطل في إعداد أسئلة الامتحان");
      const data = await res.json();
      onUpdateLecture({ quiz: data });
    } catch (e) {
      setErrorText("حدث خطأ في توليد الأسئلة؛ يرجى المحاولة لاحقاً.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  // 4. Call Gemini Smart Academic Tutor Consultant
  const handleQueryTutor = async () => {
    setLoadingTutor(true);
    setErrorText(null);
    try {
      const notesContent = gatherLectureText();
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          historySummary: notesContent,
          currentSubject: lecture.title
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onUpdateLecture({ studyPlanAdvice: data });
    } catch (e) {
      setErrorText("عطل في الاتصال بالمستشار الدراسي الذكي.");
    } finally {
      setLoadingTutor(false);
    }
  };

  // 5. Call Gemini to create full Podcast Audio
  const handleGeneratePodcast = async () => {
    setLoadingPodcast(true);
    setErrorText(null);
    try {
      const summaryText = lecture.aiSummary?.summary || "هذه محاضرة رائعة تتحدث عن موضوعات الجامعة والقرون والشبكات العصبية.";
      const res = await fetch("/api/ai/podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lecture.title,
          summary: summaryText
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "خطأ في خادم الصوت الأكاديمي");
      }
      const data = await res.json();
      // Reset old audio element so the new audio is loaded fresh
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsAudioPlaying(false);
      }
      setPodcastAudio(data.audioBase64);
      setPodcastScript(data.textScript);
    } catch (e: any) {
      setErrorText(e.message || "فشلت عملية تحويل الملاحظات لبودكاست مسموع. تأكد من تفعيل مفتاح GEMINI_API_KEY.");
    } finally {
      setLoadingPodcast(false);
    }
  };

  // Study quiz submissions
  const handleSubmitQuiz = () => {
    if (!lecture.quiz) return;
    let score = 0;
    lecture.quiz.forEach((q, index) => {
      if (userAnswers[index] === q.answerIndex) {
        score++;
      }
    });
    setQuizScore(score);
  };

  // Audio Playback trigger
  const togglePodcastAudio = () => {
    if (!podcastAudio) return;
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } else {
      const audio = new Audio("data:audio/wav;base64," + podcastAudio);
      audioRef.current = audio;
      audio.onended = () => setIsAudioPlaying(false);
      audio.play();
      setIsAudioPlaying(true);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full font-sansArabic">
      
      {/* Top Banner Navigation */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
          <div>
            <h3 className="font-bold text-sm">مستشار الذكاء الاصطناعي الأكاديمي (Gemini AI)</h3>
            <p className="text-[10px] text-indigo-200 mt-0.5">حلل ملاحظاتك ووَلّد ملخصات وبطاقات امتحانات مذهلة</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full font-semibold">تلقائي ومتكامل</span>
          
          {/* Mini-square collapse/expand arrowhead button */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 border border-white/10 text-white"
            title={isPanelCollapsed ? "فتح وبسط لوحة مستشار الذكاء الاصطناعي 🧭" : "طي وإخفاء لوحة مستشار الذكاء الاصطناعي 📘"}
          >
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${isPanelCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex bg-slate-100 border-b border-slate-200 text-xs overflow-x-auto select-none ${isPanelCollapsed ? 'hidden' : ''}`}>
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`flex-1 py-3 text-center font-bold border-b-2 transition min-w-[80px] ${activeSubTab === 'summary' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          تلخيص المحاضرة
        </button>
        <button
          onClick={() => setActiveSubTab('quiz')}
          className={`flex-1 py-3 text-center font-bold border-b-2 transition min-w-[80px] ${activeSubTab === 'quiz' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          أسئلة الاختبار
        </button>
        <button
          onClick={() => setActiveSubTab('flashcards')}
          className={`flex-1 py-3 text-center font-bold border-b-2 transition min-w-[80px] ${activeSubTab === 'flashcards' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          بطاقات الاستذكار
        </button>
        <button
          onClick={() => setActiveSubTab('tutor')}
          className={`flex-1 py-3 text-center font-bold border-b-2 transition min-w-[100px] ${activeSubTab === 'tutor' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          المستشار الذكي
        </button>
        <button
          onClick={() => {
            setActiveSubTab('podcast');
            if (!lecture.aiSummary) {
              setErrorText("يرجى إكمال 'تلخيص المحاضرة' أولاً للحصول على المحتوى الصوتي المناسب للسيناريو بودكاست.");
            }
          }}
          className={`flex-1 py-3 text-center font-bold border-b-2 transition min-w-[90px] ${activeSubTab === 'podcast' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          تحويل لبودكاست 🎙️
        </button>
      </div>

      {/* Main Console Box */}
      <div className={`flex-1 p-5 overflow-y-auto min-h-[300px] ${isPanelCollapsed ? 'hidden' : ''}`}>
        {errorText && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-xs leading-relaxed text-right">
            {errorText}
          </div>
        )}

        {/* 1. Summary View */}
        {activeSubTab === 'summary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">ملخص شامل ونقاط رئيسية للمراجعة</h4>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingSummary}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-xs transition"
              >
                {loadingSummary ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>استخراج بالذكاء الاصطناعي</span>
              </button>
            </div>

            {lecture.aiSummary ? (
              <div className="space-y-4 text-right">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-800 text-xs mb-2 text-indigo-700 border-r-2 border-indigo-600 pr-2">موجز المحاضرة</h5>
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">{lecture.aiSummary.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                    <h5 className="font-bold text-slate-800 text-xs mb-2 text-purple-700 border-r-2 border-purple-600 pr-2">النقاط الرئيسية</h5>
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
                      {lecture.aiSummary.keyPoints.map((point, index) => (
                        <li key={index} className="leading-relaxed list-none flex items-start gap-1">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                    <h5 className="font-bold text-slate-800 text-xs mb-2 text-amber-700 border-r-2 border-amber-600 pr-2">الكلمات المفتاحية التلقائية</h5>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {lecture.aiSummary.keywords.map((word, index) => (
                        <span key={index} className="text-[10px] px-2 py-1 bg-amber-100 font-semibold text-amber-800 rounded-md">
                          #{word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Brain className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                <p className="text-xs">لم يتم استخراج تلخيص بعد. اضغط على الزر بالأعلى لقراءة الملاحظات والذكاء الاصطناعي سيتولى الباقي!</p>
              </div>
            )}
          </div>
        )}

        {/* 2. Quiz View */}
        {activeSubTab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">اختبر فهمك - أسئلة امتحانات نموذجية مخصصة</h4>
              <button
                onClick={handleGenerateQuiz}
                disabled={loadingQuiz}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-xs transition animate-pulse"
              >
                {loadingQuiz ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>توليد أسئلة اختبار</span>
              </button>
            </div>

            {lecture.quiz && lecture.quiz.length > 0 ? (
              <div className="space-y-5 text-right">
                {lecture.quiz.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex gap-2 items-start">
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded mt-0.5">س{qIndex + 1}</span>
                      <h5 className="font-bold text-slate-800 text-xs leading-relaxed">{q.question}</h5>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                      {q.options.map((opt, oIndex) => {
                        const isSelected = userAnswers[qIndex] === oIndex;
                        const showCorrect = quizScore !== null && q.answerIndex === oIndex;
                        const showWrong = quizScore !== null && isSelected && q.answerIndex !== oIndex;

                        return (
                          <button
                            key={oIndex}
                            onClick={() => quizScore === null && setUserAnswers({ ...userAnswers, [qIndex]: oIndex })}
                            className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium border text-right transition ${
                              showCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' :
                              showWrong ? 'bg-rose-50 border-rose-300 text-rose-800' :
                              isSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold' : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{opt}</span>
                            {quizScore !== null && q.answerIndex === oIndex && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {quizScore !== null && (
                      <div className="text-[11px] leading-relaxed bg-amber-50 rounded-lg p-2.5 border border-amber-100 text-amber-900">
                        <strong>التفسير العلمي:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {quizScore === null ? (
                  <button
                    onClick={handleSubmitQuiz}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                  >
                    عرض نموذج الإجابة وتصحيح اختباري
                  </button>
                ) : (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold">نتيجتك الأكاديمية: {quizScore} من {lecture.quiz.length}</p>
                      <p className="text-[10px] text-slate-500 mt-1">يمكنك إعادة توليد أسئلة مغايرة لتدريب مستمر.</p>
                    </div>
                    <button
                      onClick={handleGenerateQuiz}
                      className="text-xs font-bold text-indigo-700 hover:underline"
                    >
                      توليد أسئلة جديدة
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <HelpCircle className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                <p className="text-xs">اضغط على زر التوليد لصياغة أسئلة مراجعة مطابقة لهيكلية الامتحانات الدراسية.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. Flashcards study review */}
        {activeSubTab === 'flashcards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">بطاقات تذكر سريعة (Flashcards) للتكرار المتباعد</h4>
              <button
                onClick={handleGenerateFlashcards}
                disabled={loadingFlashcards}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-xs transition"
              >
                {loadingFlashcards ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>صياغة بطاقات فلاش</span>
              </button>
            </div>

            {lecture.flashcards && lecture.flashcards.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                
                {/* Simulated Flipping Card */}
                <div
                  onClick={() => setShowBack(!showBack)}
                  className={`w-full max-w-md h-52 flex flex-col justify-between p-6 rounded-2xl border cursor-pointer select-none shadow hover:shadow-md transition-all duration-300 text-right ${
                    showBack ? 'bg-amber-100 border-amber-300 transform scale-105' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200'
                  }`}
                >
                  <span className="text-[9px] text-slate-500 font-mono tracking-wider">
                    {showBack ? "الجواب الفصيح (الخلف)" : "السؤال والمصطلح (الأمام)"}
                  </span>
                  
                  <div className="my-auto">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed text-center">
                      {showBack ? lecture.flashcards[currentIndex].back : lecture.flashcards[currentIndex].front}
                    </p>
                  </div>

                  <p className="text-[10px] text-center text-indigo-600 font-semibold animate-pulse">
                    انقر لقلب البطاقة ومعاينة الجهة الأخرى
                  </p>
                </div>

                {/* Card Nav Controls */}
                <div className="flex items-center justify-between w-full max-w-sm px-4">
                  <button
                    onClick={() => {
                      if (currentIndex > 0) {
                        setCurrentIndex(currentIndex - 1);
                        setShowBack(false);
                      }
                    }}
                    disabled={currentIndex === 0}
                    className="p-1 px-2 text-xs bg-slate-100 font-semibold text-slate-800 rounded disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span className="text-xs text-slate-500 font-medium">بطاقة {currentIndex + 1} من {lecture.flashcards.length}</span>
                  <button
                    onClick={() => {
                      if (currentIndex < lecture.flashcards.length - 1) {
                        setCurrentIndex(currentIndex + 1);
                        setShowBack(false);
                      }
                    }}
                    disabled={currentIndex === lecture.flashcards.length - 1}
                    className="p-1 px-2 text-xs bg-indigo-600 font-semibold text-white rounded disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Brain className="w-10 h-10 text-indigo-300 mx-auto mb-2" />
                <p className="text-xs">يرجى الضغط على زر الصياغة لإنشاء الكروت التعليمية الفعالة.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Smart virtual advisor tutor */}
        {activeSubTab === 'tutor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs">المستشار الدراسي والأكاديمي الذكي يوصيك بالخطة</h4>
              <button
                onClick={handleQueryTutor}
                disabled={loadingTutor}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg text-xs transition"
              >
                {loadingTutor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>الحصول على خطة مراجعة</span>
              </button>
            </div>

            {lecture.studyPlanAdvice ? (
              <div className="space-y-4 text-right">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex gap-3">
                  <div className="text-emerald-700 mt-0.5"><Award className="w-5 h-5" /></div>
                  <div>
                    <h5 className="font-bold text-emerald-800 text-xs">خطة مراجعة مخصصة للامتحان</h5>
                    <p className="text-slate-700 text-xs mt-1.5 leading-relaxed whitespace-pre-line">{lecture.studyPlanAdvice.plan}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <h5 className="font-bold text-indigo-800 text-xs">مراجع خارجية إضافية موصى بها</h5>
                  <p className="text-slate-700 text-xs mt-1.5 leading-relaxed whitespace-pre-line">{lecture.studyPlanAdvice.recommendations}</p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs leading-relaxed">
                  <strong>✨ نصيحة المستشار اليومية:</strong> {lecture.studyPlanAdvice.tips}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Volume2 className="w-10 h-10 text-indigo-300 mx-auto mb-2 animate-bounce" />
                <p className="text-xs">تواصل مع مستشار دراسي خبير واكسب جدولاً منظمًا يوضح لك الثغرات المعرفية.</p>
              </div>
            )}
          </div>
        )}

        {/* 5. Convert notes to podcast script and sound play! */}
        {activeSubTab === 'podcast' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs">الملخص الصوتي التفاعلي (تحويل محاضراتك لبودكاست مسموع)</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">احصل على ملف صوتي مبسط يروي لك الدرس بصوت نقي رائع</p>
              </div>
              <button
                onClick={handleGeneratePodcast}
                disabled={loadingPodcast || !lecture.aiSummary}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold rounded-lg text-xs shadow-sm transition"
              >
                {loadingPodcast ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileAudio className="w-3.5 h-3.5" />}
                <span>صناعة بودكاست المحاضرة</span>
              </button>
            </div>

            {podcastAudio ? (
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-right space-y-4">
                <div className="flex items-center justify-between">
                  {/* Play audio button */}
                  <button
                    onClick={togglePodcastAudio}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-transform active:scale-95"
                  >
                    {isAudioPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isAudioPlaying ? "إيقاف مؤقت للبودكاست" : "تشغيل البودكاست المسموع"}</span>
                  </button>

                  <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100/50 px-3 py-1 rounded-full flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    <span>متاح مسموعاً</span>
                  </span>
                </div>

                <div className="p-4 bg-white/80 rounded-xl border border-indigo-100/30">
                  <h5 className="font-bold text-slate-700 text-xs mb-1">السيناريو الصوتي للبودكاست (صوت الأستاذ الافتراضي):</h5>
                  <p className="text-slate-600 text-xs italic leading-relaxed font-sans mt-2">
                    "{podcastScript}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileAudio className="w-12 h-12 text-indigo-300 mx-auto mb-2 animate-bounce" />
                <p className="text-xs">ميزة حصرية: صياغة سيناريو البودكاست وتنزيله للاستماع أثناء ممارسة الرياضة أو السفر!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
