import React, { useState, useEffect, useRef } from "react";
import { University, AcademicYear, SubjectItem, Lecture, PageData, StudyStats, SecurityConfig, BackupRestoreConfig, AudioRecording, TimeMarker, ChangelogEntry, DragTextbox, LectureDocument, bgType, Folder as FolderType } from "./types";
import { loadAppState, saveAppState } from "./initialData";
import NotebookCanvas from "./components/NotebookCanvas";
import AICommandPanel from "./components/AICommandPanel";
import StatsDashboard from "./components/StatsDashboard";
import BackupDriveManager from "./components/BackupDriveManager";
import PINActivationBarrier from "./PINActivationBarrier";
import DailyTraining from "./DailyTraining";
import HandwritingAI from "./components/HandwritingAI";

// Lucide icons
import {
  Award, BookOpen, Clock, Flame, CheckCircle, Search, Pin, Plus, Folder, GraduationCap, Calendar, 
  Sparkles, Shield, Cloud, Bookmark, Tag, Trash2, Sliders, Play, Trash, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Tv, Camera, Share2, HelpCircle, FileText, Image, Maximize2, Minimize2, Check, Lock, Unlock, LogOut, Code, Copy, Clipboard, Volume2, Video, Bell, BellRing, Smartphone, Monitor,
  Sun, Moon, History, MessageSquare, Menu, Key, X, Mic, ArrowUp, ArrowDown, AlignJustify, Grid3X3, MoreHorizontal
} from "lucide-react";

// Hook global fetch to intercept backend AI requests and seamlessly inject custom api credentials
if (typeof window !== "undefined") {
  try {
    const originalFetch = window.fetch;
    // Standard assignment block
    (window as any).fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === "string" ? input : (input as Request).url;
      const isAiEndpoint = url && url.includes("/api/ai/");
      const isValidation = url && url.includes("validate-key");

      if (isAiEndpoint) {
        const storedKey = localStorage.getItem("customAiKey") || "";
        const storedProvider = localStorage.getItem("aiProvider") || "gemini";
        if (storedKey && storedKey.trim() !== "") {
          init = init || {};
          const headers = new Headers(init.headers || {});
          headers.set("x-custom-api-key", storedKey.trim());
          headers.set("x-custom-provider", storedProvider);
          init.headers = headers;
        }
      }

      const fetchPromise = originalFetch.call(window, input, init);

      if (isAiEndpoint && !isValidation) {
        const storedKey = localStorage.getItem("customAiKey") || "";
        if (storedKey && storedKey.trim() !== "") {
          fetchPromise.then(res => {
            if (res && res.ok) {
              const cleanedKey = storedKey.trim();
              const storageKey = `localUsedCount_${cleanedKey}`;
              const current = parseInt(localStorage.getItem(storageKey) || "0", 10);
              localStorage.setItem(storageKey, String(current + 1));
            }
          }).catch(() => {});
        }
      }

      return fetchPromise;
    };
  } catch (e) {
    console.warn("Failed standard fetch override, attempting property definition override:", e);
    try {
      const originalFetch = window.fetch;
      Object.defineProperty(window, "fetch", {
        value: function (input: RequestInfo | URL, init?: RequestInit) {
          const url = typeof input === "string" ? input : (input as Request).url;
          const isAiEndpoint = url && url.includes("/api/ai/");
          const isValidation = url && url.includes("validate-key");

          if (isAiEndpoint) {
            const storedKey = localStorage.getItem("customAiKey") || "";
            const storedProvider = localStorage.getItem("aiProvider") || "gemini";
            if (storedKey && storedKey.trim() !== "") {
              init = init || {};
              const headers = new Headers(init.headers || {});
              headers.set("x-custom-api-key", storedKey.trim());
              headers.set("x-custom-provider", storedProvider);
              init.headers = headers;
            }
          }

          const fetchPromise = originalFetch.call(window, input, init);

          if (isAiEndpoint && !isValidation) {
            const storedKey = localStorage.getItem("customAiKey") || "";
            if (storedKey && storedKey.trim() !== "") {
              fetchPromise.then(res => {
                if (res && res.ok) {
                  const cleanedKey = storedKey.trim();
                  const storageKey = `localUsedCount_${cleanedKey}`;
                  const current = parseInt(localStorage.getItem(storageKey) || "0", 10);
                  localStorage.setItem(storageKey, String(current + 1));
                }
              }).catch(() => {});
            }
          }

          return fetchPromise;
        },
        configurable: true,
        writable: true
      });
    } catch (err) {
      console.error("Critical: Could not map custom headers to window.fetch on this sandbox/browser environment:", err);
    }
  }
}

export default function App() {
  // Load initial app data from localStorage
  const [appState, setAppState] = useState(() => loadAppState());

  // Drawer status, floating buttons, dynamic key config and academic details state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showFloatingQuickActions, setShowFloatingQuickActions] = useState(() => {
    return localStorage.getItem("showFloatingQuickActions") !== "false";
  });
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("aiProvider") || "gemini");
  const [customAiKey, setCustomAiKey] = useState(() => localStorage.getItem("customAiKey") || "");
  const [showAiKeyModal, setShowAiKeyModal] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [academicDetails, setAcademicDetails] = useState(() => {
    try {
      const stored = localStorage.getItem("academicDetails");
      return stored ? JSON.parse(stored) : {
        university: "جامعة الملك سعود",
        college: "كلية علوم الحاسب والمعلومات",
        department: "قسم تقنية المعلومات",
        level: "المستوى الخامس",
      };
    } catch {
      return {
        university: "جامعة الملك سعود",
        college: "كلية علوم الحاسب والمعلومات",
        department: "قسم تقنية المعلومات",
        level: "المستوى الخامس",
      };
    }
  });

  // Keep floating action checkbox setting and academic details synced to localstorage
  useEffect(() => {
    localStorage.setItem("showFloatingQuickActions", String(showFloatingQuickActions));
  }, [showFloatingQuickActions]);

  useEffect(() => {
    localStorage.setItem("academicDetails", JSON.stringify(academicDetails));
  }, [academicDetails]);

  // App lock barrier flag
  const [showAppPINBarrier, setShowAppPINBarrier] = useState(false);
  const [pendingActiveSubjectId, setPendingActiveSubjectId] = useState<string | null>(null);

  // States for verification and key checking
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [keyValidationResult, setKeyValidationResult] = useState<{
    checked: boolean;
    valid: boolean;
    provider?: string;
    owner?: string;
    permissions?: string[];
    quotaAllowed?: string;
    quotaUsed?: string | number;
    quotaRemaining?: string | number;
    expiryDate?: string;
    status?: string;
    error?: string;
  } | null>(null);

  const handleVerifyKey = async (keyToCheck: string, providerToCheck: string) => {
    if (!keyToCheck || !keyToCheck.trim()) {
      setKeyValidationResult({
        checked: true,
        valid: false,
        error: "الرجاء إدخال رمز المفتاح أولاً قبل عملية الفحص."
      });
      return;
    }
    setIsCheckingKey(true);
    setKeyValidationResult(null);
    try {
      const cleanedKey = keyToCheck.trim();
      const storageKey = `localUsedCount_${cleanedKey}`;
      const localCount = parseInt(localStorage.getItem(storageKey) || "0", 10);

      const response = await fetch("/api/ai/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          key: keyToCheck, 
          provider: providerToCheck,
          localUsedCount: localCount
        })
      });
      const data = await response.json();
      setKeyValidationResult({
        checked: true,
        valid: !!data.valid,
        provider: data.provider,
        owner: data.owner,
        permissions: data.permissions,
        quotaAllowed: data.quotaAllowed,
        quotaUsed: data.quotaUsed,
        quotaRemaining: data.quotaRemaining,
        expiryDate: data.expiryDate,
        status: data.status,
        error: data.error
      });
    } catch (err: any) {
      setKeyValidationResult({
        checked: true,
        valid: false,
        error: "فشل الاتصال بخادم التحقق. تأكد من توفر اتصال بالشبكة."
      });
    } finally {
      setIsCheckingKey(false);
    }
  };

  // Reusable lightweight modal prompts to replace blocking browser prompt(...) calls inside sandboxed iframe
  const [promptValue, setPromptValue] = useState("");
  const [customPrompt, setCustomPrompt] = useState<{
    isOpen: boolean;
    title: string;
    label: string;
    placeholder?: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: "",
    label: "",
    placeholder: "",
    defaultValue: "",
    onConfirm: () => {}
  });

  const openCustomPrompt = (
    title: string,
    label: string,
    defaultValue: string,
    placeholder: string,
    callback: (val: string) => void
  ) => {
    setPromptValue(defaultValue);
    setCustomPrompt({
      isOpen: true,
      title,
      label,
      placeholder,
      defaultValue,
      onConfirm: callback
    });
  };

  // Active Selected Hierarchy IDs
  const [activeUnivId, setActiveUnivId] = useState<string>("univ-1");
  const [activeYearId, setActiveYearId] = useState<string>("year-1");
  const [activeSubId, setActiveSubId] = useState<string>("sub-1");

  // Section collapse states
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState<boolean>(true);
  const [isLecturesExpanded, setIsLecturesExpanded] = useState<boolean>(true);
  const [isMediaHubCollapsed, setIsMediaHubCollapsed] = useState<boolean>(false);

  // Active Lecture and Page Indexes
  const [selectedLectureId, setSelectedLectureId] = useState<string>("lec-1");
  const [activePageNumber, setActivePageNumber] = useState<number>(1);

  // Focus Mode toggle
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("isDarkMode") === "true";
  });

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [bookmarkOnly, setBookmarkOnly] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Create new entities panel modals
  const [newUnivName, setNewUnivName] = useState("");
  const [newYearName, setNewYearName] = useState("");
  const [newSubName, setNewSubName] = useState("");

  // New Lecture input states
  const [newLectureTitle, setNewLectureTitle] = useState("");
  const [newLectureDifficulty, setNewLectureDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Device Layout Simulation mode ('desktop' for full experience, 'phone' for native mobile frame preview)
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'phone'>('desktop');

  // Collapsible panel states
  const [isFloatingPanelCollapsed, setIsFloatingPanelCollapsed] = useState(false);
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);

  // Lecturer Video recording parameters 
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraFileInputRef = useRef<HTMLInputElement | null>(null);
  const voiceActiveRef = useRef<boolean>(false);
  const videoSpeechActiveRef = useRef<boolean>(false);
  const voiceDedupeRef = useRef<string[]>([]);
  const videoDedupeRef = useRef<string[]>([]);

  // Active playback console for recorded lecture videos 
  const [activeViewingVideoId, setActiveViewingVideoId] = useState<string | null>(null);

  // Intelligent external documents (PDF, slides, sheets) parser tracker
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [documentParseError, setDocumentParseError] = useState<string | null>(null);

  // Active overall app tabs
  const [activeMainTab, setActiveMainTab] = useState<'editor' | 'stats' | 'cloud' | 'security' | 'training' | 'handwriting-ai' | 'file-manager'>('editor');

  // Real-time floating overlay view modes
  const [activeOverlay, setActiveOverlay] = useState<'materials' | 'lecture-hub' | 'stats' | 'training' | 'handwriting-ai' | 'cloud' | 'security' | 'file-manager' | 'settings' | 'ai-advisor' | 'changelog' | null>(null);
  const [isAiAdvisorCollapsed, setIsAiAdvisorCollapsed] = useState<boolean>(false);

  // Floating overlay position and size (Computer Window simulation)
  const [overlayPos, setOverlayPos] = useState({ x: 200, y: 80 });
  const [overlayHasBeenDragged, setOverlayHasBeenDragged] = useState(false);
  const [isEditingBreadcrumb, setIsEditingBreadcrumb] = useState(false);
  const [editUnivVal, setEditUnivVal] = useState("");
  const [editCollegeVal, setEditCollegeVal] = useState("");
  const [editYearVal, setEditYearVal] = useState("");
  const [editLevelVal, setEditLevelVal] = useState("");
  const [editSubVal, setEditSubVal] = useState("");
  const [editLecVal, setEditLecVal] = useState("");
  const [overlaySize, setOverlaySize] = useState({ width: 780, height: 580 });
  const [overlayIsFullscreen, setOverlayIsFullscreen] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isResizingOverlay, setIsResizingOverlay] = useState(false);
  const [isOverlayPinned, setIsOverlayPinned] = useState<boolean>(false);
  const [showBgStyleSelector, setShowBgStyleSelector] = useState<boolean>(false);
  const [cameraCaptureMode, setCameraCaptureMode] = useState<'photo' | 'video'>('photo');
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });


  // Media recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState("تسجيل محاضرة اليوم...");
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // MediaRecorder for real audio capture
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingBlobsRef = useRef<Map<string, Blob>>(new Map());
  const blobUrlsRef = useRef<Map<string, string>>(new Map());
  const [pendingBlobIds, setPendingBlobIds] = useState<Set<string>>(new Set());
  const [isTranscribing, setIsTranscribing] = useState<string | null>(null);

  // Lecture text (transcription result) editing state
  const [lectureTextEdit, setLectureTextEdit] = useState<string>("");

  // Dictation (speech-to-textbox) state
  const [isDictating, setIsDictating] = useState(false);
  const dictationTextRef = useRef<string>("");

  // Real-time voice visual representation waves array
  const [waveHeights, setWaveHeights] = useState<number[]>([]);

  // Whiteboard Snapshot scanning
  const [scannedTextOCR, setScannedTextOCR] = useState<string | null>(null);
  const [scanningImageOCR, setScanningImageOCR] = useState(false);

  // Active viewing document for preview modal
  const [activeViewingDoc, setActiveViewingDoc] = useState<LectureDocument | null>(null);

  // NEW PARAMETRIC INSERT MODAL & AI ANALYSIS
  const [showComplexInsertModal, setShowComplexInsertModal] = useState(false);
  const [insertPagePosition, setInsertPagePosition] = useState<'before' | 'after' | 'end'>('end');
  const [insertPageTemplate, setInsertPageTemplate] = useState<'cornell' | 'math' | 'timeline' | 'blank' | 'mindmap'>('blank');
  const [insertPageBgPattern, setInsertPageBgPattern] = useState<bgType>('ruled');
  
  // Analyzing documents params & outputs
  const [analyzingDocItem, setAnalyzingDocItem] = useState<LectureDocument | null>(null);
  const [analysisPageRange, setAnalysisPageRange] = useState<'all' | 'custom'>('all');
  const [analysisCustomStart, setAnalysisCustomStart] = useState<number>(1);
  const [analysisCustomEnd, setAnalysisCustomEnd] = useState<number>(5);
  const [analysisTypeSelect, setAnalysisTypeSelect] = useState<'bullet_points' | 'quiz' | 'summary'>('bullet_points');
  const [analysisItemsPerPage, setAnalysisItemsPerPage] = useState<number>(5);
  const [isPerformingDocumentAnalysis, setIsPerformingDocumentAnalysis] = useState(false);
  
  // Storing generated analyses per-document (survives app reloads smoothly)
  const [docAnalyses, setDocAnalyses] = useState<Record<string, Array<{
    id: string;
    timestamp: string;
    title: string;
    type: string;
    content: string;
    pageRange: string;
  }>>>(() => {
    try {
      const saved = localStorage.getItem("unnoted_doc_analyses");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("unnoted_doc_analyses", JSON.stringify(docAnalyses));
  }, [docAnalyses]);

  // -------------------------------------------------------------
  // NEW STATES: Fullscreen, Floating AI Chatbot, Live Speech-to-Text, Shutter
  // -------------------------------------------------------------
  const [isCanvasFullScreen, setIsCanvasFullScreen] = useState(false);
  const [floatingBotOpen, setFloatingBotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; timestamp: Date }[]>([
    { sender: 'bot', text: 'أهلاً بك! أنا رفيقك ومستشارك الأكاديمي العائم 👨‍🎓📚. كيف يمكنني مساعدتك في درس ومحاضرات الدفتر اليوم؟ يمكنني توليد الأسئلة، مراجعة المصطلحات أو صياغة الخطط المخصصة لك!', timestamp: new Date() }
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const [liveTranscriptText, setLiveTranscriptText] = useState("");
  const [speechRecognitionRef, setSpeechRecognitionRef] = useState<any>(null);
  const [shutterFlash, setShutterFlash] = useState(false);

  // App level lock PIN Setup helper
  const [customPinInput, setCustomPinInput] = useState("");

  // Share and Export formats
  const [qrStateCode, setQrStateCode] = useState<string | null>(null);

  // Copy paste clipboard snapshot buffer
  const [clipboardPageBuffer, setClipboardPageBuffer] = useState<PageData | null>(null);

  // Notifications State & Opened tracking
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [openedLectureIds, setOpenedLectureIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("unnoted_opened_lectures");
      return stored ? JSON.parse(stored) : ["lec-1"]; // Seed first lecture as opened initially
    } catch {
      return ["lec-1"];
    }
  });

  useEffect(() => {
    localStorage.setItem("unnoted_opened_lectures", JSON.stringify(openedLectureIds));
  }, [openedLectureIds]);

  useEffect(() => {
    if (selectedLectureId && !openedLectureIds.includes(selectedLectureId)) {
      setOpenedLectureIds(prev => [...prev, selectedLectureId]);
    }
  }, [selectedLectureId]);

  // Center and scale simulated desktop window whenever an overlay is activated to avoid half-hidden side placements
  useEffect(() => {
    if (activeOverlay && typeof window !== "undefined") {
      setOverlayHasBeenDragged(false); // Reset dragging state on activation so it centers perfectly with standard CSS layout
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      
      const widthVal = Math.min(780, Math.floor(screenW * 0.92));
      const heightVal = Math.min(580, Math.floor(screenH * 0.82));
      
      const x = Math.max(10, Math.floor((screenW - widthVal) / 2));
      const y = Math.max(20, Math.floor((screenH - heightVal) / 2));
      
      setOverlaySize({ width: widthVal, height: heightVal });
      setOverlayPos({ x, y });
    }
  }, [activeOverlay]);

  // Center simulated desktop window on startup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const x = Math.max(20, Math.floor((window.innerWidth - 780) / 2));
      const y = Math.max(40, Math.floor((window.innerHeight - 580) / 2));
      setOverlayPos({ x, y });
    }
  }, []);

  // Globally track mouse movements for window dragging and resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingOverlay && !overlayIsFullscreen) {
        const nextX = e.clientX - dragStartOffset.current.x;
        const nextY = e.clientY - dragStartOffset.current.y;
        const boundedX = Math.max(10, Math.min(window.innerWidth - 100, nextX));
        const boundedY = Math.max(10, Math.min(window.innerHeight - 100, nextY));
        setOverlayPos({ x: boundedX, y: boundedY });
      } else if (isResizingOverlay && !overlayIsFullscreen) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;
        const newWidthStd = Math.max(380, Math.min(1600, resizeStartSize.current.width - deltaX)); // Since Arabic is elements right-to-left usually, sizing can delta
        // We'll support positive drag resize:
        const widthVal = Math.max(400, Math.min(1600, resizeStartSize.current.width + deltaX));
        const heightVal = Math.max(300, Math.min(1200, resizeStartSize.current.height + deltaY));
        setOverlaySize({
          width: widthVal,
          height: heightVal
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingOverlay(false);
      setIsResizingOverlay(false);
    };

    if (isDraggingOverlay || isResizingOverlay) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingOverlay, isResizingOverlay, overlayIsFullscreen]);

  const getNotifications = () => {
    const list: {
      id: string;
      title: string;
      description: string;
      type: "unopened" | "untested" | "unparsed_handwriting";
      lectureId: string;
      subjectId: string;
    }[] = [];

    appState.lectures.forEach(lec => {
      const isOpened = openedLectureIds.includes(lec.id);
      if (!isOpened) {
        list.push({
          id: `unopened-${lec.id}`,
          title: "محاضرة في انتظار المذاكرة 📚",
          description: `لديك محاضرة لم تفتحها بعد: (${lec.title}). افتحها الآن وابدأ تدوين الملاحظات.`,
          type: "unopened",
          lectureId: lec.id,
          subjectId: lec.subjectId
        });
      } else {
        const hasQuiz = lec.quiz && lec.quiz.length > 0;
        if (!hasQuiz) {
          list.push({
            id: `untested-${lec.id}`,
            title: "تنبيه تقييم الفهم والأسئلة 📝",
            description: `لقد ذاكرت (${lec.title}) ولكنك لم تختبر عقليتك وتولّد لها أسئلة تقويم بعد!`,
            type: "untested",
            lectureId: lec.id,
            subjectId: lec.subjectId
          });
        }

        const totalStrokes = lec.pages.reduce((acc, p) => acc + (p.strokes?.length || 0), 0);
        if (totalStrokes > 0 && !lec.studyPlanAdvice) {
          list.push({
            id: `unparsed-${lec.id}`,
            title: "تحليل الكتابة اليدوية والذكاء الاصطناعي ✍️",
            description: `رصدنا ملاحظات بخط اليد في مقرر (${lec.title}). شغل معالجة الخطوط لتوليد التقرير الأكاديمي الشامل.`,
            type: "unparsed_handwriting",
            lectureId: lec.id,
            subjectId: lec.subjectId
          });
        }
      }
    });
    return list;
  };

  const handleNotificationClick = (notif: { id: string; type: string; lectureId: string; subjectId: string }) => {
    if (notif.subjectId) {
      setActiveSubId(notif.subjectId);
    }
    if (notif.lectureId) {
      setSelectedLectureId(notif.lectureId);
      setActivePageNumber(1);
    }
    if (notif.type === "unparsed_handwriting") {
      setActiveMainTab("handwriting-ai");
    } else if (notif.type === "untested") {
      setActiveMainTab("training");
    } else {
      setActiveMainTab("editor");
    }
    if (notif.lectureId && !openedLectureIds.includes(notif.lectureId)) {
      setOpenedLectureIds(prev => [...prev, notif.lectureId]);
    }
    setIsNotificationsOpen(false);
  };

  // Auto persistent write check trigger
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Cleanup video stream tracks on unmount to release camera LED
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // ✅ FIX: Bind videoStream to the video element via useEffect (replaces unreliable setTimeout)
  useEffect(() => {
    if (videoStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = videoStream;
      videoPreviewRef.current.play().catch(() => {});
    }
    if (!videoStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, [videoStream]);

  // Keep activePageNumber and selection hierarchies bounds-checked and synced to prevent exceptions
  useEffect(() => {
    const activeLec = getSelectedLecture();
    if (activeLec && activeLec.pages && activeLec.pages.length > 0) {
      if (activePageNumber > activeLec.pages.length) {
        setActivePageNumber(activeLec.pages.length);
      } else if (activePageNumber < 1) {
        setActivePageNumber(1);
      }
    } else {
      if (activePageNumber !== 1) {
        setActivePageNumber(1);
      }
    }
  }, [selectedLectureId, activeSubId, appState.lectures, activePageNumber]);

  useEffect(() => {
    // 1. Ensure activeUnivId is valid
    const univs = appState.universities || [];
    let curUnivId = activeUnivId;
    if (univs.length > 0) {
      const exists = univs.some(u => u.id === activeUnivId);
      if (!exists) {
        curUnivId = univs[0].id;
        setActiveUnivId(curUnivId);
      }
    } else {
      curUnivId = "";
    }

    // 2. Ensure activeYearId is valid for the chosen university
    const yearsForUniv = (appState.years || []).filter(y => y.universityId === curUnivId);
    let curYearId = activeYearId;
    if (yearsForUniv.length > 0) {
      const exists = yearsForUniv.some(y => y.id === activeYearId);
      if (!exists) {
        curYearId = yearsForUniv[0].id;
        setActiveYearId(curYearId);
      }
    } else {
      curYearId = "";
    }

    // 3. Ensure activeSubId is valid for the chosen academic year
    const subsForYear = (appState.subjects || []).filter(s => s.yearId === curYearId);
    let curSubId = activeSubId;
    if (subsForYear.length > 0) {
      const exists = subsForYear.some(s => s.id === activeSubId);
      if (!exists) {
        curSubId = subsForYear[0].id;
        setActiveSubId(curSubId);
      }
    } else {
      curSubId = "";
    }

    // 4. Ensure selectedLectureId is valid for the chosen subject
    const lecturesForSub = (appState.lectures || []).filter(l => l.subjectId === curSubId);
    if (lecturesForSub.length > 0) {
      const exists = lecturesForSub.some(l => l.id === selectedLectureId);
      if (!exists) {
        setSelectedLectureId(lecturesForSub[0].id);
      }
    } else {
      if (selectedLectureId !== "") {
        setSelectedLectureId("");
      }
    }
  }, [appState.universities, appState.years, appState.subjects, appState.lectures, activeUnivId, activeYearId, activeSubId, selectedLectureId]);

  // Audio recording waves animator helper
  useEffect(() => {
    if (isVoiceRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        // Generate mock heights
        setWaveHeights(Array.from({ length: 24 }, () => Math.floor(Math.random() * 45) + 5));
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingSeconds(0);
      setWaveHeights([]);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isVoiceRecording]);

  // Sync lectureTextEdit when the selected lecture changes (or lectureText is updated)
  useEffect(() => {
    const lec = appState.lectures.find(l => l.id === selectedLectureId);
    if (lec?.lectureText !== undefined) {
      setLectureTextEdit(lec.lectureText);
    } else {
      setLectureTextEdit("");
    }
  }, [selectedLectureId, appState.lectures]);

  // Video recording timer incrementer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isVideoRecording) {
      interval = setInterval(() => {
        setVideoSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVideoSeconds(0);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVideoRecording]);

  // Helpers to resolve references
  const getSelectedLecture = (): Lecture | undefined => {
    const found = appState.lectures.find(l => l.id === selectedLectureId);
    return found;
  };

  const getSelectedSubject = (): SubjectItem | undefined => {
    return appState.subjects.find(s => s.id === activeSubId);
  };

  // 1. Create a new University item
  const handleAddUniversity = () => {
    if (!newUnivName.trim()) return;
    const newUniv: University = {
      id: "univ-" + Date.now(),
      name: newUnivName
    };
    setAppState(prev => ({
      ...prev,
      universities: [...prev.universities, newUniv]
    }));
    setActiveUnivId(newUniv.id);
    setNewUnivName("");
  };

  // 2. Create a new Academic year semesters
  const handleAddYear = () => {
    if (!newYearName.trim()) return;
    const newYr: AcademicYear = {
      id: "year-" + Date.now(),
      name: newYearName,
      universityId: activeUnivId
    };
    setAppState(prev => ({
      ...prev,
      years: [...prev.years, newYr]
    }));
    setActiveYearId(newYr.id);
    setNewYearName("");
  };

  // 3. Create a new Course Subject
  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    const newSb: SubjectItem = {
      id: "sub-" + Date.now(),
      name: newSubName,
      yearId: activeYearId,
      color: ["indigo", "purple", "sky", "rose", "emerald", "amber"][Math.floor(Math.random() * 6)] as any
    };
    setAppState(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSb]
    }));
    setActiveSubId(newSb.id);
    setNewSubName("");
  };

  // 4. Create new Lecture item
  const handleAddLecture = () => {
    if (!newLectureTitle.trim()) return;
    const newLec: Lecture = {
      id: "lec-" + Date.now(),
      title: newLectureTitle,
      date: new Date().toISOString().split("T")[0],
      subjectId: activeSubId,
      difficulty: newLectureDifficulty,
      bookmarked: false,
      tags: [],
      pages: [
        {
          id: "page-" + Date.now(),
          pageNumber: 1,
          templateType: "blank",
          bgPattern: "ruled",
          strokes: [],
          shapes: [],
          stickers: [],
          textboxes: []
        }
      ],
      recordings: [],
      folders: [],
      changelog: [
        { id: "chg-start", version: 1, timestamp: new Date().toISOString(), author: "النظام", description: "تهيئة المذكرة الدراسية لأول مرة." }
      ]
    };

    setAppState(prev => {
      // Add XP for creating a lecture
      const stats = { ...prev.stats, totalLectures: prev.stats.totalLectures + 1, xpPoints: prev.stats.xpPoints + 50 };
      return {
        ...prev,
        lectures: [...prev.lectures, newLec],
        stats
      };
    });
    setSelectedLectureId(newLec.id);
    setActivePageNumber(1);
    setNewLectureTitle("");
  };

  const startEditingBreadcrumb = () => {
    const activeUniv = appState.universities.find(u => u.id === activeUnivId);
    const activeYear = (appState.years || []).find(y => y.id === activeYearId);
    const activeSub = appState.subjects.find(s => s.id === activeSubId);
    const activeLec = appState.lectures.find(l => l.id === selectedLectureId);

    setEditUnivVal(activeUniv?.name || academicDetails.university || "");
    setEditCollegeVal(academicDetails.college || "");
    setEditYearVal(activeYear?.name || academicDetails.department || "");
    setEditLevelVal(academicDetails.level || "");
    setEditSubVal(activeSub?.name || "");
    setEditLecVal(activeLec?.title || "");
    setIsEditingBreadcrumb(true);
  };

  const saveBreadcrumbEdits = () => {
    setAppState(prev => {
      let updatedUnivs = [...prev.universities];
      let updatedYears = [...(prev.years || [])];
      let updatedSubjects = [...(prev.subjects || [])];
      let updatedLectures = [...(prev.lectures || [])];

      if (activeUnivId) {
        updatedUnivs = updatedUnivs.map(u => u.id === activeUnivId ? { ...u, name: editUnivVal.trim() } : u);
      } else if (editUnivVal.trim()) {
        const newUnivId = "univ-" + Date.now();
        updatedUnivs.push({ id: newUnivId, name: editUnivVal.trim() });
        setActiveUnivId(newUnivId);
      }

      if (activeYearId) {
        updatedYears = updatedYears.map(y => y.id === activeYearId ? { ...y, name: editYearVal.trim() } : y);
      } else if (editYearVal.trim()) {
        const newYearId = "year-" + Date.now();
        updatedYears.push({ id: newYearId, name: editYearVal.trim(), universityId: activeUnivId });
        setActiveYearId(newYearId);
      }

      if (activeSubId) {
        updatedSubjects = updatedSubjects.map(s => s.id === activeSubId ? { ...s, name: editSubVal.trim() } : s);
      } else if (editSubVal.trim()) {
        const newSubId = "sub-" + Date.now();
        updatedSubjects.push({ id: newSubId, name: editSubVal.trim(), yearId: activeYearId, color: "indigo" });
        setActiveSubId(newSubId);
      }

      if (selectedLectureId) {
        updatedLectures = updatedLectures.map(l => l.id === selectedLectureId ? { ...l, title: editLecVal.trim() } : l);
      }

      return {
        ...prev,
        universities: updatedUnivs,
        years: updatedYears,
        subjects: updatedSubjects,
        lectures: updatedLectures
      };
    });

    setAcademicDetails(prev => ({
      ...prev,
      university: editUnivVal.trim(),
      college: editCollegeVal.trim(),
      department: editYearVal.trim(),
      level: editLevelVal.trim(),
    }));

    setIsEditingBreadcrumb(false);
  };

  // Clean updates of active lecture
  const updateLectureData = (lectureId: string, updates: Partial<Lecture>) => {
    console.log("Updating lecture:", lectureId, "with updates:", updates);
    setAppState(prev => {
      const updated = prev.lectures.map((l) => {
        if (l.id === lectureId) {
          const updatedL = { ...l, ...updates };
          console.log("Lecture updated successfully:", updatedL);
          
          // Record history snapshots automatically to enable full reverting
          const nextVersion = (l.changelog?.length ? (l.changelog[l.changelog.length - 1]?.version || 1) + 1 : 1);
          const targetPages = updates.pages || l.pages;
          
          let description = "تعديل المذكرة والرسوم والملاحظات اليدوية التفاعلية.";
          if (updates.title) description = `تغيير العنوان إلى: ${updates.title}`;
          else if (updates.difficulty) description = `تعديل صعوبة الاختبار الدراسي إلى: ${updates.difficulty}`;
          else if (updates.recordings) description = "إضافة تفريغ مستمع صوتي في الذكاء الاصطناعي";
          else if (updates.aiSummary) description = "توليد ملخص أكاديمي ذكي بوسط المقال";
          else if (updates.quiz) description = "توليد اختبارات الفهم والألغاز الذكية";
          else if (updates.documents) description = "تحديث قائمة المرفقات";

          const log: ChangelogEntry = {
            id: "chg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
            version: nextVersion,
            timestamp: new Date().toISOString(),
            author: "أنا / المستشار الأكاديمي",
            description,
            snapshotData: JSON.stringify(targetPages)
          };
          updatedL.changelog = [...(l.changelog || []), log];
          return updatedL;
        }
        return l;
      });
      console.log("New appState lectures:", updated);
      return { ...prev, lectures: updated };
    });
  };

  // Revert lecture pages to a previous changelog snapshot version
  const handleRevertToVersion = (entry: ChangelogEntry) => {
    const lecture = getSelectedLecture();
    if (!lecture || !entry.snapshotData) return;

    try {
      const restoredPages = JSON.parse(entry.snapshotData);
      if (Array.isArray(restoredPages)) {
        setAppState(prev => {
          const updated = prev.lectures.map((l) => {
            if (l.id === lecture.id) {
              return {
                ...l,
                pages: restoredPages,
                changelog: [
                  ...(l.changelog || []),
                  {
                    id: "chg-rev-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
                    version: (l.changelog[l.changelog.length - 1]?.version || 1) + 1,
                    timestamp: new Date().toISOString(),
                    author: "النظام",
                    description: `تمت استعادة النسخة رقم (${entry.version}) بنجاح.`,
                    snapshotData: entry.snapshotData
                  }
                ]
              };
            }
            return l;
          });
          return { ...prev, lectures: updated };
        });
        alert(`🎉 تم استعادة المحاضرة وتحديث صفحات الدفتر بنجاح إلى النسخة المؤرشفة رقم (${entry.version}) المستحوذ عليها بتاريخ ${new Date(entry.timestamp).toLocaleString('ar-SA')}!`);
      }
    } catch (e) {
      alert("عذراً، لم تنجح استعادة النسخة التاريخية لتعثر قراءة هيكل التدوين.");
    }
  };

  // Live intelligent floating assistant chat handler which proxies to backend API and/or acts as fallback offline
  const handleSendChatMessage = async (msgText: string) => {
    if (!msgText.trim()) return;

    const userMsg = { sender: 'user' as const, text: msgText, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setBotTyping(true);

    try {
      const lecture = getSelectedLecture();
      const contextText = lecture ? `المحاضرة الحالية: "${lecture.title}". لخصها الطالب كالتالي: ${lecture.aiSummary?.summary || "لا توجد ملخصات بعد"}` : '';

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          context: contextText
        })
      });

      if (!res.ok) throw new Error("API status is bad");
      const data = await res.json();

      setChatMessages(prev => [
        ...prev,
        { sender: 'bot' as const, text: data.reply || data.response || "مرحباً! لم أتمكن من صياغة إجابة مناسبة.", timestamp: new Date() }
      ]);
    } catch (err) {
      // Local Arabic educational responder
      const fallbacks = [
        "أهلاً بك! دراسة الخوارزميات تتطلب دائماً التكرار المنظم. جرب رسم خريطة تدفق ذهنية على ورقتك بالكمبيوتر أو الآيباد والتحقق من صعوبة المادة.",
        "سؤالك مهم جداً! لربط هذا المفهوم بالدفتر، جرب التقاط صورة السبورة الذكية بالكامل، وسنعالج الصورة بالذكاء الاصطناعي بالكامل ونولد لك صندوق نصوص لتلوينه ودراسته.",
        "لقد قمت بتحليل تدويناتك الحالية. طريقتك ممتازة، ولكن للتفوق أنصحك بتشغيل الميكروفون لمدة ثلاث دقائق، ثم النقر على 'توليد أوراق الاختبار' لاختبار مستواك الدراسي.",
        "عزيزي الطالب، رفيقك متصل بكل الموارد. هل تود أن أشرح لك المزيد من تطبيقات هندسة الاتصال أو شرح طرق المذاكرة الفعالة للبومودورو؟"
      ];
      const picked = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot' as const, text: picked, timestamp: new Date() }
      ]);
    } finally {
      setBotTyping(false);
    }
  };

  const handleUpdatePageData = (pageIndex: number, updates: Partial<PageData>) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const updatedPages = lecture.pages.map((p, idx) => {
      if (idx === pageIndex) {
        return { ...p, ...updates };
      }
      return p;
    });
    updateLectureData(lecture.id, { pages: updatedPages });
  };

  // Add Page to Lecture
  const handleInsertPage = (template: PageData['templateType']) => {
    // If the lecture already has pages, show our advanced insertion menu instead of appending blindly!
    const lecture = getSelectedLecture();
    if (lecture && lecture.pages.length > 0) {
      setInsertPageTemplate(template);
      setInsertPageBgPattern('ruled');
      setInsertPagePosition('after');
      setShowComplexInsertModal(true);
    } else {
      handleInsertPageAdaptive({
        position: 'end',
        template: template,
        bgPattern: 'ruled'
      });
    }
  };

  // Adaptive Insert Page support (before, after, end) with custom background styling
  const handleInsertPageAdaptive = (params: {
    position: 'before' | 'after' | 'end';
    template: PageData['templateType'];
    bgPattern: bgType;
  }) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;

    const newPage: PageData = {
      id: "page-custom-" + Date.now(),
      pageNumber: 1, // placeholder, normalized below
      templateType: params.template,
      bgPattern: params.bgPattern,
      strokes: [],
      shapes: [],
      stickers: [],
      textboxes: []
    };

    let updatedPages = [...lecture.pages];
    const currentIndex = activePageNumber - 1; // 0-indexed

    if (params.position === 'before' && currentIndex >= 0 && updatedPages.length > 0) {
      updatedPages.splice(currentIndex, 0, newPage);
    } else if (params.position === 'after' && currentIndex >= 0 && updatedPages.length > 0) {
      updatedPages.splice(currentIndex + 1, 0, newPage);
    } else {
      updatedPages.push(newPage);
    }

    // Normalize page numbers perfectly
    const normalized = updatedPages.map((p, idx) => ({
      ...p,
      pageNumber: idx + 1
    }));

    updateLectureData(lecture.id, { pages: normalized });

    // Deduce target page pointer
    let targetPageNum = 1;
    if (params.position === 'before') {
      targetPageNum = Math.max(1, activePageNumber);
    } else if (params.position === 'after') {
      targetPageNum = activePageNumber + 1;
    } else {
      targetPageNum = normalized.length;
    }
    
    setActivePageNumber(targetPageNum);
    setShowComplexInsertModal(false);
  };

  // Delete current page
  const handleDeletePage = (pageIndex: number) => {
    const lecture = getSelectedLecture();
    if (!lecture || lecture.pages.length <= 1) return;
    const filtered = lecture.pages.filter((_, i) => i !== pageIndex).map((p, i) => ({
      ...p,
      pageNumber: i + 1
    }));
    updateLectureData(lecture.id, { pages: filtered });
    setActivePageNumber(1);
  };

  // Reorder index layout of pages
  const handleMovePageOrder = (direction: 'up' | 'down') => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const total = lecture.pages.length;
    const currentIdx = activePageNumber - 1;
    if (direction === 'up' && currentIdx > 0) {
      const copy = [...lecture.pages];
      const temp = copy[currentIdx];
      copy[currentIdx] = copy[currentIdx - 1];
      copy[currentIdx - 1] = temp;
      
      const normalized = copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      updateLectureData(lecture.id, { pages: normalized });
      setActivePageNumber(currentIdx);
    } else if (direction === 'down' && currentIdx < total - 1) {
      const copy = [...lecture.pages];
      const temp = copy[currentIdx];
      copy[currentIdx] = copy[currentIdx + 1];
      copy[currentIdx + 1] = temp;
      
      const normalized = copy.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      updateLectureData(lecture.id, { pages: normalized });
      setActivePageNumber(currentIdx + 2);
    }
  };

  // Copy page content to clipboard
  const handleCopyPage = () => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const currentPage = lecture.pages[activePageNumber - 1];
    setClipboardPageBuffer(currentPage);
    alert("تم نسخ الصفحة بنجاح إلى حافظة التطبيق 📋");
  };

  // Paste content from clipboard
  const handlePastePage = () => {
    const lecture = getSelectedLecture();
    if (!lecture || !clipboardPageBuffer) return;
    const currentPage = lecture.pages[activePageNumber - 1];
    
    const pasted: Partial<PageData> = {
      strokes: [...currentPage.strokes, ...clipboardPageBuffer.strokes.map(s => ({ ...s, id: s.id + "-pasted" }))],
      shapes: [...currentPage.shapes, ...clipboardPageBuffer.shapes.map(sh => ({ ...sh, id: sh.id + "-pasted" }))],
      stickers: [...currentPage.stickers, ...clipboardPageBuffer.stickers.map(st => ({ ...st, id: st.id + "-pasted" }))],
      textboxes: [...currentPage.textboxes, ...clipboardPageBuffer.textboxes.map(tx => ({ ...tx, id: tx.id + "-pasted" }))]
    };
    handleUpdatePageData(activePageNumber - 1, pasted);
    alert("تم دمج محتويات الصفحة الملصوقة بنجاح 🎉");
  };

  // Start real or mock recording progress
  const handleStartVoiceRecording = () => {
    setIsVoiceRecording(true);
    voiceActiveRef.current = true;
    voiceDedupeRef.current = [];
    setNewLectureTitle("");

    // Silent MediaRecorder — NO Web Speech API (prevents browser chime)
    // Transcription happens via Gemini AFTER the user stops recording
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
        const mr = new MediaRecorder(stream, { mimeType });
        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.start(500);
        mediaRecorderRef.current = mr;
      })
      .catch(e => console.warn("MediaRecorder audio capture unavailable:", e));
  };

  // Stop recording of lecture
  const handleStopVoiceRecording = () => {
    voiceActiveRef.current = false;
    setIsVoiceRecording(false);

    const lecture = getSelectedLecture();
    if (!lecture) return;

    const duration = recordingSeconds || 65;
    const cleanTranscriptionValue = liveTranscriptText.trim().replace(/^جاري تشغيل ميكروفون المستمع الصوتي الذكي\.\.\. 🎙️/, "").trim();

    const recId = "rec-" + Date.now();

    // Stop MediaRecorder, save blob, then auto-transcribe via Gemini
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const mr = mediaRecorderRef.current;
      const capturedLectureId = lecture.id;
      const capturedCount = (lecture.recordings || []).length;
      mediaRecorderRef.current = null;
      mr.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) return;
          const mimeType = audioChunksRef.current[0]?.type || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          pendingBlobsRef.current.set(recId, blob);
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.set(recId, url);
          setPendingBlobIds(prev => new Set([...prev, recId]));
          try { mr.stream.getTracks().forEach(t => t.stop()); } catch(_) {}

          const autoTitle = `🎙️ تسجيل صوتي (${capturedCount + 1})`;
          const initialRec: AudioRecording = {
            id: recId, title: autoTitle,
            durationSeconds: duration, timestamp: new Date().toISOString(),
            type: 'audio',
            transcription: cleanTranscriptionValue || "🔄 جاري التفريغ التلقائي...",
            audioBlobUrl: url, markers: []
          };
          setAppState(prev => ({
            ...prev,
            lectures: prev.lectures.map(l =>
              l.id === capturedLectureId
                ? { ...l, recordings: [...(l.recordings || []), initialRec] }
                : l
            )
          }));

          setIsTranscribing(recId);
          try {
            const audioMime = blob.type.startsWith('video/') ? 'audio/webm' : (blob.type || 'audio/webm');
            const txHeaders: Record<string, string> = { 'Content-Type': audioMime };
            const storedKey = localStorage.getItem("customAiKey")?.trim() || "";
            if (storedKey) {
              txHeaders['x-custom-api-key'] = storedKey;
              txHeaders['x-custom-provider'] = localStorage.getItem("aiProvider") || "gemini";
            }
            const response = await fetch('/api/ai/transcribe', {
              method: 'POST', headers: txHeaders, body: blob,
            });
            if (!response.ok) throw new Error("فشل الخادم");
            const data = await response.json();
            const transcript = (data.transcript || "").trim();
            if (transcript) {
              setAppState(prev => ({
                ...prev,
                lectures: prev.lectures.map(l =>
                  l.id === capturedLectureId
                    ? { ...l, lectureText: transcript, recordings: (l.recordings || []).map(r => r.id === recId ? { ...r, transcription: transcript } : r) }
                    : l
                )
              }));
              setLectureTextEdit(transcript);
            }
          } catch (e: any) {
            console.warn("Auto-transcription failed:", e.message);
            setAppState(prev => ({
              ...prev,
              lectures: prev.lectures.map(l =>
                l.id === capturedLectureId
                  ? { ...l, recordings: (l.recordings || []).map(r => r.id === recId ? { ...r, transcription: cleanTranscriptionValue || "⚠️ فشل التفريغ التلقائي." } : r) }
                  : l
              )
            }));
          } finally {
            setIsTranscribing(null);
          }
        } catch (outerErr) {
          console.warn("Voice recording save error:", outerErr);
          setIsTranscribing(null);
        }
      };
      mr.stop();
    } else {
      // No MediaRecorder — save with speech-to-text transcript
      const newRec: AudioRecording = {
        id: recId,
        title: recordingTitle || `🎙️ تسجيل صوتي (${(lecture.recordings || []).length + 1})`,
        durationSeconds: duration, timestamp: new Date().toISOString(),
        type: 'audio', transcription: cleanTranscriptionValue, markers: []
      };
      updateLectureData(lecture.id, { recordings: [...(lecture.recordings || []), newRec] });
    }
    setRecordingTitle("تسجيل صفي جديد...");
  };

  // Switch between front and back camera while recording
  const handleSwitchCamera = async () => {
    const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(newFacing);
    if (!isVideoRecording) return;
    try {
      // Neutralize old recorder's onstop so it doesn't trigger a partial save
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== 'inactive') {
          try { mediaRecorderRef.current.stop(); } catch(_) {}
        }
        mediaRecorderRef.current = null;
      }
      // Stop old stream tracks
      if (videoStream) videoStream.getTracks().forEach(t => { try { t.stop(); } catch(_) {} });

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: newFacing },
        audio: true
      });
      setVideoStream(newStream);

      // Reset chunks so the new segment starts clean
      audioChunksRef.current = [];
      const videoMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'audio/webm';
      const mr = new MediaRecorder(newStream, { mimeType: videoMime });
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(500);
      mediaRecorderRef.current = mr;
    } catch(e: any) {
      console.warn("Camera switch failed:", e.message);
    }
  };

  // Start real camera capture stream using WebRTC or use dynamic simulation helper
  const handleStartVideoRecording = async () => {
    try {
      setVideoSeconds(0);
      videoDedupeRef.current = [];

      // Request camera + microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: cameraFacing },
        audio: true
      });

      // Set stream — useEffect will bind it to videoPreviewRef automatically
      setVideoStream(stream);
      setIsVideoRecording(true);
      videoSpeechActiveRef.current = true;
      // NO Web Speech API here — silent recording only; Gemini transcribes after stop

      // Record FULL stream (video + audio) — audio extracted server-side for transcription
      try {
        audioChunksRef.current = [];
        // Pick best supported video mimeType
        const videoMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm')
              ? 'video/webm'
              : 'audio/webm';
        const mr = new MediaRecorder(stream, { mimeType: videoMime });
        mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        mr.start(500);
        mediaRecorderRef.current = mr;
      } catch (mrErr) {
        console.warn("Video MediaRecorder failed, falling back to audio-only:", mrErr);
        try {
          const audioOnlyStream = new MediaStream(stream.getAudioTracks());
          const mr = new MediaRecorder(audioOnlyStream, { mimeType: 'audio/webm' });
          mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
          mr.start(500);
          mediaRecorderRef.current = mr;
        } catch (fallbackErr) {
          console.warn("Audio fallback MediaRecorder also failed:", fallbackErr);
        }
      }

    } catch (err: any) {
      console.warn("Camera/mic access blocked:", err.name, err.message);
      const msg = err.name === 'NotAllowedError'
        ? "❌ تم رفض الوصول إلى الكاميرا. يرجى السماح بالكاميرا والميكروفون في إعدادات المتصفح."
        : err.name === 'NotFoundError'
          ? "❌ لا توجد كاميرا متصلة بالجهاز."
          : "❌ تعذّر تشغيل الكاميرا: " + err.message;
      alert(msg);
    }
  };

  // Capture slide/whiteboard photo during video mode and automatically trigger intelligent OCR conversion back to textbox inside active page
  const handleCaptureLecturePhoto = async () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 400);

    const lecture = getSelectedLecture();
    if (!lecture) return;

    // If video stream is active, capture a frame from it directly
    if (videoStream && videoPreviewRef.current) {
      try {
        const video = videoPreviewRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL("image/jpeg", 0.8);
          setScanningImageOCR(true);
          try {
            const res = await fetch("/api/ai/ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageData: base64 })
            });
            const data = await res.json();
            const newBox: any = {
              id: "txt-ocr-snap-" + Date.now(),
              x: 75,
              y: 120,
              width: 330,
              height: 150,
              text: data.text || "لم يتم التعرف على نص في الصورة.",
              fontSize: 12,
              color: "#0f766e",
              layer: "textboxes"
            };
            handleUpdatePageData(activePageNumber - 1, {
              textboxes: [...(lecture.pages[activePageNumber - 1]?.textboxes || []), newBox]
            });
          } finally {
            setScanningImageOCR(false);
          }
        }
        return;
      } catch (err) {
        console.warn("Frame capture from video stream failed, falling back to file picker:", err);
      }
    }

    // No active stream — open camera/file picker instead
    cameraFileInputRef.current?.click();
  };

  // Turn off lecturer camera and compile detailed transcription synced to active lectures
  const handleStopVideoRecording = () => {
    videoSpeechActiveRef.current = false;
    setIsVideoRecording(false);
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }

    const lecture = getSelectedLecture();
    if (!lecture) return;

    const duration = videoSeconds || 1;
    const cleanTranscriptionValue = liveTranscriptText.trim().replace(/^جاري تشغيل كاميرا المحاضرة والمستمع الصوتي\.\.\. 📹/, "").trim();

    const recId = "vid-rec-" + Date.now();

    // ✅ Stop MediaRecorder, save blob, then AUTO-TRANSCRIBE via Gemini
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const mr = mediaRecorderRef.current;
      const capturedLectureId = lecture.id;
      const capturedRecordingsCount = (lecture.recordings || []).length;
      mediaRecorderRef.current = null;
      mr.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) return;
          const mimeType = audioChunksRef.current[0]?.type || 'video/webm';
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          audioChunksRef.current = [];
          pendingBlobsRef.current.set(recId, blob);
          const url = URL.createObjectURL(blob);
          blobUrlsRef.current.set(recId, url);
          setPendingBlobIds(prev => new Set([...prev, recId]));

          const isVideoBlob = mimeType.startsWith('video/');
          const initialRec: AudioRecording = {
            id: recId,
            title: `${isVideoBlob ? '🎥' : '🎙️'} تسجيل ${isVideoBlob ? 'فيديو' : 'صوتي'} المحاضرة (${capturedRecordingsCount + 1})`,
            durationSeconds: duration,
            timestamp: new Date().toISOString(),
            type: isVideoBlob ? 'video' : 'audio',
            transcription: "🔄 جاري التفريغ التلقائي...",
            audioBlobUrl: url,
            videoUrl: isVideoBlob ? url : undefined,
            markers: []
          };
          setAppState(prev => ({
            ...prev,
            lectures: prev.lectures.map(l =>
              l.id === capturedLectureId
                ? { ...l, recordings: [...(l.recordings || []), initialRec] }
                : l
            )
          }));

          setIsTranscribing(recId);
          try {
            // Normalise video blobs → audio/webm so Gemini transcription accepts them
            const sendMime = blob.type.startsWith('video/') ? 'audio/webm' : (blob.type || 'audio/webm');
            const vidTxHeaders: Record<string, string> = { 'Content-Type': sendMime };
            const storedKeyV = localStorage.getItem("customAiKey")?.trim() || "";
            if (storedKeyV) {
              vidTxHeaders['x-custom-api-key'] = storedKeyV;
              vidTxHeaders['x-custom-provider'] = localStorage.getItem("aiProvider") || "gemini";
            }
            const response = await fetch('/api/ai/transcribe', {
              method: 'POST',
              headers: vidTxHeaders,
              body: blob,
            });
            if (!response.ok) throw new Error("فشل الخادم " + response.status);
            const data = await response.json();
            const transcript = (data.transcript || "").trim();
            setAppState(prev => ({
              ...prev,
              lectures: prev.lectures.map(l =>
                l.id === capturedLectureId
                  ? {
                      ...l,
                      lectureText: transcript || l.lectureText,
                      recordings: (l.recordings || []).map(r =>
                        r.id === recId
                          ? { ...r, transcription: transcript || cleanTranscriptionValue || "لم يُكتشف كلام." }
                          : r
                      )
                    }
                  : l
              )
            }));
            if (transcript) setLectureTextEdit(transcript);
          } catch (e: any) {
            console.warn("Auto video transcription failed:", e.message);
            setAppState(prev => ({
              ...prev,
              lectures: prev.lectures.map(l =>
                l.id === capturedLectureId
                  ? { ...l, recordings: (l.recordings || []).map(r => r.id === recId ? { ...r, transcription: cleanTranscriptionValue || "⚠️ فشل التفريغ." } : r) }
                  : l
              )
            }));
          } finally {
            setIsTranscribing(null);
          }
        } catch (outerErr) {
          console.warn("Video recording save error:", outerErr);
          setIsTranscribing(null);
        }
      };
      mr.stop();
    } else {
      // No MediaRecorder — save with speech-to-text transcript only
      const newRec: AudioRecording = {
        id: recId,
        title: `🎙️ تسجيل صوتي (${(lecture.recordings || []).length + 1})`,
        durationSeconds: duration,
        timestamp: new Date().toISOString(),
        type: 'audio',
        transcription: cleanTranscriptionValue || "لا يوجد ميكروفون متاح.",
        markers: []
      };
      updateLectureData(lecture.id, { recordings: [...(lecture.recordings || []), newRec] });
    }
  };

  // Send captured audio blob to Gemini for Arabic transcription
  const handleTranscribeRecording = async (recId: string) => {
    const blob = pendingBlobsRef.current.get(recId);
    if (!blob) {
      alert("الملف الصوتي غير متاح في هذه الجلسة (لا يُحفظ بعد التحديث). يرجى إعادة التسجيل أو استخدام التفريغ الفوري المحفوظ أدناه.");
      return;
    }

    const lecture = getSelectedLecture();
    if (!lecture) return;

    setIsTranscribing(recId);
    try {
      // Normalise video blobs to audio/webm – WebM containers carry audio tracks
      // that Gemini can transcribe; video/* MIME types are rejected by the model
      const blobMime = blob.type.startsWith('video/') ? 'audio/webm' : (blob.type || 'audio/webm');
      const headers: Record<string, string> = {
        'Content-Type': blobMime,
      };
      if (customAiKey.trim()) {
        headers['x-custom-api-key'] = customAiKey.trim();
        headers['x-custom-provider'] = aiProvider;
      }

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers,
        body: blob,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "خطأ في الخادم" }));
        throw new Error(errData.error || "فشل تحويل الصوت إلى نص");
      }

      const data = await response.json();
      const transcript = (data.transcript || "").trim();

      if (!transcript) throw new Error("لم يُعَد أي نص من الخادم. تأكد من أن الملف الصوتي يحتوي على كلام مسموع.");

      // Save transcript to the recording + lecture text field
      const updatedRecordings = lecture.recordings.map(r =>
        r.id === recId ? { ...r, transcription: transcript } : r
      );
      updateLectureData(lecture.id, {
        recordings: updatedRecordings,
        lectureText: transcript,
      });
      setLectureTextEdit(transcript);

      // Keep blob / URL active for playback, downloads and re-transcribing
      // pendingBlobsRef.current.delete(recId);
      // setPendingBlobIds(prev => {
      //   const next = new Set(prev);
      //   next.delete(recId);
      //   return next;
      // });
    } catch (e: any) {
      console.error("Transcription failed:", e);
      alert("خطأ في التحويل إلى نص:\n" + (e.message || "خطأ غير معروف") + "\n\nتأكد من وجود مفتاح GEMINI_API_KEY في إعدادات الذكاء الاصطناعي.");
    } finally {
      setIsTranscribing(null);
    }
  };

  // Delete a recording and clean up its blob URL
  const handleDeleteRecording = (recId: string) => {
    if (!confirm("هل تريد حذف هذا التسجيل نهائياً؟")) return;
    const lecture = getSelectedLecture();
    if (!lecture) return;

    const url = blobUrlsRef.current.get(recId);
    if (url) { URL.revokeObjectURL(url); blobUrlsRef.current.delete(recId); }
    pendingBlobsRef.current.delete(recId);
    setPendingBlobIds(prev => { const n = new Set(prev); n.delete(recId); return n; });

    updateLectureData(lecture.id, {
      recordings: (lecture.recordings || []).filter(r => r.id !== recId),
    });
  };

  // ── Dictation: Web Speech API → continuous textbox on canvas (no AI) ────
  // _dictationActive flag lives outside React state so restart logic can read it
  // without stale-closure issues.
  const handleStartDictation = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("متصفحك لا يدعم التعرف على الصوت.\nيُرجى استخدام Google Chrome أو Microsoft Edge.");
      return;
    }
    dictationTextRef.current = "";
    (window as any)._dictationActive = true;
    setIsDictating(true);

    const startRecognition = () => {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "ar-SA";

      recognition.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            dictationTextRef.current += e.results[i][0].transcript + " ";
          }
        }
      };

      recognition.onerror = (e: any) => {
        // "no-speech" and "aborted" are normal — ignore them
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("Dictation error:", e.error);
        }
      };

      recognition.onend = () => {
        // If the user hasn't manually stopped, restart immediately so
        // listening continues uninterrupted through the whole lecture.
        if ((window as any)._dictationActive) {
          try { startRecognition(); } catch (e) {}
        } else {
          // User stopped — flush text to a new canvas textbox
          setIsDictating(false);
          const finalText = dictationTextRef.current.trim();
          if (!finalText) return;
          // Use a callback ref to getSelectedLecture so we always read current state
          const lecture = getSelectedLecture();
          if (!lecture) return;
          const page = lecture.pages[activePageNumber - 1];
          if (!page) return;
          const newBox = {
            id: "dictation-" + Date.now(),
            x: 60,
            y: 80,
            width: 340,
            height: 110,
            text: finalText,
            fontSize: 13,
            color: "#1e293b",
            layer: "textboxes" as const,
            fontFamily: "sansArabic",
            bold: false,
            italic: false,
          };
          handleUpdatePageData(activePageNumber - 1, {
            textboxes: [...(page.textboxes || []), newBox],
          });
          dictationTextRef.current = "";
        }
      };

      recognition.start();
      (window as any)._dictationRecognition = recognition;
    };

    startRecognition();
  };

  const handleStopDictation = () => {
    (window as any)._dictationActive = false;
    if ((window as any)._dictationRecognition) {
      try { (window as any)._dictationRecognition.stop(); } catch (e) {}
      delete (window as any)._dictationRecognition;
    }
    // setIsDictating(false) will be called inside recognition.onend after flush
  };

  // Option to explicitly insert transcribed text into the notebook canvas page
  const handleInsertTranscriptToCanvas = () => {
    const lecture = getSelectedLecture();
    if (!lecture || !liveTranscriptText) return;

    const clean = liveTranscriptText.replace(/^جاري تشغيل ميكروفون المستمع الصوتي الذكي\.\.\. 🎙️|^جاري تشغيل كاميرا المحاضرة والمستمع الصوتي\.\.\. 📹/g, "").trim();
    if (!clean) {
      alert("لا يوجد تفريغ صوتي متاح لإدراجه بالدفتر بعد!");
      return;
    }

    const newBox: any = {
      id: "txt-transcript-" + Date.now(),
      x: 80,
      y: 110,
      width: 320,
      height: 160,
      text: "🎙️ تفريغ المستمع الصوتي الفوري المكتوب:\n" + clean,
      fontSize: 12,
      color: "#1e1b4b", // deep indigo text
      layer: "textboxes"
    };

    handleUpdatePageData(activePageNumber - 1, {
      textboxes: [...(lecture.pages[activePageNumber - 1]?.textboxes || []), newBox]
    });
    alert("🎉 تم إدراج تفريغ المستمع الصوتي لخطوط وسطور الدفتر بنجاح كصندوق نصي مرن ومتحرك!");
  };

  // Share lecture observations as markdown/text file (supports bluetooth and whatsapp transfers)
  const handleShareText = () => {
    const lecture = getSelectedLecture();
    if (!lecture) return;

    let txt = `====================================\n`;
    txt += `🎓 الدفتر الأكاديمي الذكي - تقرير المحاضرة الفوري المباشر ✍️\n`;
    txt += `====================================\n\n`;
    txt += `العنوان وموضوع الدراسة: ${lecture.title}\n`;
    txt += `التاريخ المحدد: ${new Date(lecture.date).toLocaleDateString('ar-SA')}\n`;
    txt += `مستوى الصعوبة الاستذكاري: ${lecture.difficulty === 'hard' ? 'صعب 🔥' : lecture.difficulty === 'medium' ? 'متوسط ⚡' : 'سهل 🍃'}\n`;
    txt += `الشارات والتصنيفات: ${lecture.tags.join(', ') || 'لا توجد تصنيفات حالية'}\n\n`;

    if (lecture.aiSummary) {
      txt += `------------------------------------\n`;
      txt += `🧠 ملخص وتوجيهات الذكاء الاصطناعي والمستشار:\n`;
      txt += `------------------------------------\n`;
      txt += `${lecture.aiSummary.summary}\n\n`;
      txt += `💡 النقاط والمفاهيم العظمى المستخرجة:\n`;
      lecture.aiSummary.keyPoints.forEach((pt, i) => {
        txt += `${i + 1}. ${pt}\n`;
      });
      txt += `\n🏷️ الكلمات المفتاحية والدلالية: ${lecture.aiSummary.keywords.join(', ')}\n\n`;
    }

    txt += `------------------------------------\n`;
    txt += `📖 تفاصيل ومحتوى الصفحات الحالية بالدفتر:\n`;
    txt += `------------------------------------\n`;
    lecture.pages.forEach((page, idx) => {
      txt += `[صفحة دراسية رقم ${page.pageNumber}]:\n`;
      if (page.cornellCues) txt += `- الكلمات المفتاحية وأسئلة المراجعة الجانبية: ${page.cornellCues}\n`;
      if (page.cornellSummary) txt += `- ملخص السطرين أسفل الورقة: ${page.cornellSummary}\n`;
      if (page.textboxes.length > 0) {
        txt += `- النصوص والتعليقات المطبوعة بالدفتر:\n`;
        page.textboxes.forEach((tb) => {
          txt += `  * ${tb.text}\n`;
        });
      }
      txt += `\n`;
    });

    if (lecture.recordings.length > 0) {
      txt += `------------------------------------\n`;
      txt += `🎙️ تفاغ الميكروفون والمستمع الصوتي المباشر:\n`;
      txt += `------------------------------------\n`;
      lecture.recordings.forEach((rec, i) => {
        txt += `[تسجيل رقم ${i + 1} - ${rec.title}]:\n`;
        txt += `- تاريخ ووقت التسجيل: ${new Date(rec.timestamp).toLocaleString('ar-SA')}\n`;
        txt += `- النص المفرغ تلقائياً: ${rec.transcription || 'لا يوجد تفريغ صفي صادر'}\n\n`;
      });
    }

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    // Attempt mobile share or direct file download:
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], `${lecture.title}.txt`, { type: "text/plain" })] })) {
      const fileObj = new File([blob], `${lecture.title}.txt`, { type: "text/plain" });
      navigator.share({
        title: lecture.title,
        text: `أشارك معكم ملخص مادة ${lecture.title} من دفتري الأكاديمي الذكي 📖`,
        files: [fileObj]
      }).catch(() => {
        triggerDirectDownload(url, `${lecture.title}.txt`);
      });
    } else if (navigator.share) {
      navigator.share({
        title: lecture.title,
        text: txt.substring(0, 1000) // send first 1000 characters if files sharing blocked
      }).catch(() => {
        triggerDirectDownload(url, `${lecture.title}.txt`);
      });
    } else {
      triggerDirectDownload(url, `${lecture.title}.txt`);
    }
  };

  const handleSharePDF = () => {
    const lecture = getSelectedLecture();
    if (!lecture) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("⚠️ يرجى السماح بفتح النوافذ المنبثقة (Popups) لعرض ورسم نسخة الـ PDF الجاهزة للتصدير والطباعة!");
      return;
    }

    let pagesHTML = "";
    lecture.pages.forEach((page) => {
      let textboxesHTML = "";
      page.textboxes.forEach((tb) => {
        textboxesHTML += `
          <div style="background:#f8fafc; border-right:4px solid #4f46e5; padding:12px; margin:10px 0; border-radius:8px; font-size:13px; line-height:1.6; color:#334155;">
            ${tb.text.replace(/\n/g, "<br/>")}
          </div>
        `;
      });

      pagesHTML += `
        <div class="pdf-page" style="background:white; padding:30px; border: 1px solid #e2e8f0; border-radius:12px; margin-bottom: 25px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:10px; margin-bottom:20px;">
            <span style="font-weight:bold; color:#4f46e5; font-size:14px;">المذكرة الصفية - صفحة رقم ${page.pageNumber}</span>
            <span style="font-size:12px; color:#64748b; font-weight:bold;">نوع القالب: ${page.templateType === 'cornell' ? 'كورنيل الأكاديمي' : 'مخطط متكامل'}</span>
          </div>

          ${page.templateType === 'cornell' ? `
            <div style="display:grid; grid-template-columns:1fr; gap:15px; margin-bottom:20px;">
              <div style="border-right: 4px solid #ef4444; background:#fef2f2; border-radius:8px; padding:12px;">
                <h4 style="margin:0 0 6px 0; color:#ef4444; font-size:12px; font-weight:700;">الكلمات الدالة وأسئلة المذاكرة الجانبية (Cues)</h4>
                <p style="font-size:13px; margin:0; line-height:1.5; color:#451a03;">${page.cornellCues || "لا توجد أسئلة مضافة"}</p>
              </div>
              <div style="padding-top:10px;">
                <h4 style="margin:0 0 8px 0; color:#4f46e5; font-size:12px; font-weight:700;">ملاحظات الصفحة والتدوينات بالتفصيل</h4>
                ${textboxesHTML || '<p style="color:#94a3b8; font-size:13px; margin:0;">لا توجد تعليقات أو ملاحظات مدونة في هذا القسم.</p>'}
              </div>
            </div>
            <div style="background:#fffbeb; border:1px solid #fde68a; padding:14px; border-radius:8px; margin-top:20px;">
              <h4 style="margin:0 0 6px 0; color:#d97706; font-size:12px; font-weight:700;">ملخص كورنيل للسطرين (Summary)</h4>
              <p style="font-size:13px; margin:0; font-weight:500; color:#78350f; line-height:1.5;">${page.cornellSummary || "لا توجد خلاصة مكتوبة"}</p>
            </div>
          ` : `
            <div>
              <h4 style="margin:0 0 10px 0; color:#4f46e5; font-size:13px; font-weight:700;">المذكرات والتدوينات الحرة بوسط الصفحة</h4>
              ${textboxesHTML || '<p style="color:#94a3b8; font-size:12px; margin:0;">لا توجد نصوص مدونة في هذه الصفحة.</p>'}
            </div>
          `}
        </div>
      `;
    });

    let recordingsHTML = "";
    lecture.recordings.forEach((rec, i) => {
      recordingsHTML += `
        <div style="background:#f1f5f9; padding:14px; border-radius:8px; margin-bottom:10px; font-size:12.5px; border-right:4px solid #64748b;">
          <h4 style="margin:0 0 6px 0; color:#1e293b; font-size:13px; font-weight:700;">${i + 1}. ${rec.title} (${Math.floor(rec.durationSeconds / 60)}د و ${rec.durationSeconds % 60}ث)</h4>
          <p style="margin:0; line-height:1.6; color:#475569;"><strong>تفريغ المستمع المباشر:</strong> ${rec.transcription || 'لا يوجد تفريغ صفي صادر'}</p>
        </div>
      `;
    });

    let quizHTML = "";
    if (lecture.quiz && lecture.quiz.length > 0) {
      lecture.quiz.forEach((q, i) => {
        quizHTML += `
          <div style="margin-bottom:18px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
            <p style="font-weight:700; font-size:13px; margin:0 0 10px 0; color:#1e293b;">س${i + 1}: ${q.question}</p>
            <div style="display:grid; grid-template-columns:1fr; gap:8px; margin-bottom:8px;">
              ${q.options.map((opt, idx) => `
                <div style="padding:8px 12px; border:1px solid ${idx === q.answerIndex ? '#10b981; background:#ecfdf5;' : '#e2e8f0; background:#f8fafc;'}; border-radius:6px; font-size:12px;">
                  ${idx + 1}. ${opt} ${idx === q.answerIndex ? '✅ [الإجابة الصحيحة]' : ''}
                </div>
              `).join('')}
            </div>
            <p style="font-size:11px; color:#059669; margin:0; background:#f0fdf4; padding:6px; border-radius:4px; font-weight:500;">💡 التفسير الصفي: ${q.explanation}</p>
          </div>
        `;
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${lecture.title} - مستند الدفتر الأكاديمي</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Cairo', sans-serif;
            margin: 0;
            padding: 30px;
            background: #f1f5f9;
            color: #1e293b;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          }
          @media print {
            body { padding: 0; background: white; }
            .container { max-width: 100%; box-shadow: none; padding: 0; }
            .pdf-page { page-break-after: always; border: none !important; box-shadow: none !important; margin: 0 0 40px 0 !important; padding: 0 !important; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="max-width:800px; margin: 0 auto 20px auto; display:flex; justify-content:space-between; align-items:center; background:#4f46e5; color:white; padding:15px; border-radius:12px; box-shadow:0 4px 10px rgba(79, 70, 229, 0.2);">
          <span style="font-weight:700; font-size:13.5px;">تم توليد مستند الدفتر الذكي الجاهز للطباعة والتصدير اللاسلكي 📚</span>
          <button onclick="window.print()" style="background:white; color:#4f46e5; border:0; padding:8px 18px; border-radius:8px; font-weight:bold; font-size:12.5px; cursor:pointer; font-family:'Cairo';">أبدأ طباعة وتصدير PDF الآن 🖨️</button>
        </div>

        <div class="container">
          <!-- Header info -->
          <div style="text-align:center; border-bottom:4px solid #4f46e5; padding-bottom:20px; margin-bottom:30px;">
            <p style="font-size:11px; font-weight:800; color:#4f46e5; margin:0; text-transform:uppercase; letter-spacing:1px;">تقرير وتلخيص المراجعة الأكاديمية الشاملة</p>
            <h1 style="margin:5px 0 10px 0; font-size:25px; font-weight:800; color:#1e1b4b;">${lecture.title}</h1>
            <div style="display:flex; justify-content:center; gap:20px; font-size:13px; color:#4b5563; font-weight:600;">
              <span>📅 التاريخ: ${new Date(lecture.date).toLocaleDateString('ar-SA')}</span>
              <span>🔥 الصعوبة: ${lecture.difficulty === 'hard' ? 'صعب' : lecture.difficulty === 'medium' ? 'متوسط' : 'سهل'}</span>
              <span>🏷️ الشارات: ${lecture.tags.join(', ') || 'لا توجد شارات'}</span>
            </div>
          </div>

          <!-- Section 1 AI Summarization if available -->
          ${lecture.aiSummary ? `
            <div style="margin-bottom:35px; background:#f8fafc; border:1px solid #e2e8f0; padding:20px; border-radius:12px;">
              <h2 style="margin:0 0 12px 0; color:#4f46e5; font-size:15px; font-weight:700;">🧠 تلخيص المستشار الأكاديمي الذكي</h2>
              <p style="font-size:13.5px; line-height:1.7; color:#334155; margin:0 0 15px 0;">${lecture.aiSummary.summary}</p>
              
              <h3 style="font-size:13.5px; margin:0 0 8px 0; color:#1e293b; font-weight:700;">💡 أهم النقاط المستنبطة:</h3>
              <ul style="font-size:13px; line-height:1.6; margin:0; padding-right:20px; color:#475569;">
                ${lecture.aiSummary.keyPoints.map(pt => `<li>${pt}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Pages in the Notebook -->
          <div style="margin-bottom:35px;">
            <h2 style="color:#4f46e5; font-size:15px; margin:0 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-weight:800;">📖 أوراق ومضمون صفحات الدفتر الرقمي</h2>
            ${pagesHTML}
          </div>

          <!-- Recordings and Transcripts if available -->
          ${lecture.recordings.length > 0 ? `
            <div style="margin-bottom:35px;">
              <h2 style="color:#4f46e5; font-size:15px; margin:0 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-weight:800;">🎙️ تفريغ محاضرات المستمع الصوتي المباشر</h2>
              ${recordingsHTML}
            </div>
          ` : ''}

          <!-- expected quizzes if available -->
          ${lecture.quiz && lecture.quiz.length > 0 ? `
            <div style="margin-bottom:35px; page-break-before:always;">
              <h2 style="color:#4f46e5; font-size:15px; margin:0 0 15px 0; border-bottom:2px solid #e2e8f0; padding-bottom:5px; font-weight:800;">🔥 الاختبارات التقويمية الدورية</h2>
              ${quizHTML}
            </div>
          ` : ''}

          <!-- Footer details -->
          <div style="text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:15px; margin-top:40px;">
            تم توليده وتنسيقه بواسطة Smart Lecture Notebook ذو الواجهة الذكية المتكاملة للهواتف المحمولة واللوحيات.
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const triggerDirectDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("💾 تم حفظ وتنزيل تقرير المحاضرة بنجاح على جهازك! يمكنك الآن إرساله بالبلوتوث أو مشاركته مع زملائك.");
  };

  // Base64 helper for local files parsing
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Process Document upload (PDF, PowerPoint, Excel, text, video, image, audio) and append Cornell page loaded with summarizes
  const handleParseDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lecture = getSelectedLecture();
    if (!lecture) {
      alert("يرجى اختيار محاضرة أو إنشاء واحدة أولاً لرفع المستند بداخلها!");
      return;
    }

    setIsParsingDocument(true);
    setDocumentParseError(null);

    try {
      const fileData = await convertFileToBase64(file);
      const isDocument = file.type === "application/pdf" || 
                         file.name.endsWith(".pdf") || 
                         file.name.endsWith(".pptx") || 
                         file.name.endsWith(".xlsx") || 
                         file.name.endsWith(".docx") || 
                         file.name.endsWith(".txt");

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");

      // Create a LectureDocument object to store in the lecture
      const newDocObj: LectureDocument = {
        id: "doc-" + Date.now(),
        name: file.name,
        type: file.type || (isAudio ? 'audio/mpeg' : isVideo ? 'video/mp4' : isImage ? 'image/png' : 'application/octet-stream'),
        sizeKb: Math.floor(file.size / 1024),
        base64: fileData,
        timestamp: new Date().toISOString()
      };

      // Handle PPTX specifically for "slide conversion" simulation
      let updatedDocs = [...(lecture.documents || []), newDocObj];
      if (file.name.endsWith(".pptx")) {
        alert("محاكاة تحويل شرائح PowerPoint إلى صور...");
        // Simulation: Add 3 fake slides
        for (let i = 1; i <= 3; i++) {
          const slideId = "slide-" + Date.now() + "-" + i;
          const slideDocObj: LectureDocument = {
            id: slideId,
            name: `Slide ${i} of ${file.name}`,
            type: 'image/png',
            sizeKb: 100,
            base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", // 1x1 transparent
            timestamp: new Date().toISOString(),
            folderId: currentFolderId || undefined
          };
          updatedDocs.push(slideDocObj);
        }
      }
      
      // If it's a document, we run AI parsing as before
      if (isDocument) {
        const response = await fetch("/api/ai/parse-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: Math.floor(file.size / 1024), // in KB
            fileData,
          }),
        });

        if (!response.ok) {
          throw new Error("فشل الخادم في معالجة المستند.");
        }

        const result = await response.json();
        if (result.success) {
          // Build Cornell page
          const uniquePageNum = lecture.pages.length + 1;
          const newPageId = "page-" + Date.now();
          
          const startingX = 100;
          const startY = 120;
          const boxesText = result.boxes || [];
          
          const generatedBoxes = boxesText.map((textStr: string, index: number) => ({
            id: `box-docx-${index}-${Date.now()}`,
            x: startingX,
            y: startY + (index * 170),
            width: 250,
            height: index === 0 ? 120 : 100,
            text: textStr,
            color: index === 0 ? "#4f46e5" : "#1e293b",
            fontSize: 12,
            layer: 'textboxes' as const,
          }));

          const newPageItem: PageData = {
            id: newPageId,
            pageNumber: uniquePageNum,
            templateType: 'cornell',
            bgPattern: 'ruled',
            strokes: [],
            shapes: [],
            textboxes: generatedBoxes,
            stickers: [
              { id: "st-docx-1", x: 260, y: 30, text: "مستند مستورد 📄", type: 'definition', layer: 'stickers' }
            ],
            cornellCues: `${result.topic || "المحور الأكاديمي"}\n\n${result.cues || ""}`,
            cornellSummary: result.cornellSummary || "لم تتوفر خلاصة جاهزة."
          };

          const updatedPages = [...lecture.pages, newPageItem];
          updateLectureData(lecture.id, { pages: updatedPages, documents: updatedDocs });
          setActivePageNumber(uniquePageNum);
          
          alert(`🎉 تم بنجاح رفع مستند (${file.name}) وحفظه، وتحليله ذكياً لتوليد صفحة كورنيل متكاملة مع صناديق ملاحظات تفاعلية!`);
        } else {
          throw new Error(result.error || "خطأ غير معروف في المعالجة");
        }
      } else {
        // Simple non-document upload (image, video, audio)
        updateLectureData(lecture.id, { documents: updatedDocs });
        if (isImage) {
          alert(`📸 تم رفع وصيانة الصورة (${file.name}) بنجاح! تتوفر الصورة الآن في المرفقات للمعاينة، أو الحذف، أو استخراج النص تلقائياً عبر النموذج.`);
        } else if (isVideo) {
          alert(`🎥 تم رفع وتأمين فيديو المحاضرة (${file.name}) بنجاح! يمكنك الآن تشغيله مباشرة أو تفريغ كلامه بالذكاء الاصطناعي من شريط المرفقات.`);
        } else if (isAudio) {
          alert(`🎙️ تم رفع الملف الصوتي المستورد (${file.name}) بنجاح! يمكنك تشغيله وتفريغ نصوصه بالكامل في أي وقت.`);
        } else {
          alert(`📎 تم رفع الملف المرفق (${file.name}) وحفظه بنجاح بمفكرة هذه المحاضرة.`);
        }
      }
    } catch (error: any) {
      console.error("Document parser frontend error:", error);
      setDocumentParseError(error.message || "حدث خطأ أثناء الاتصال بالخادم.");
      alert(`عذراً، حدث خطأ أثناء معالجة المستند: ${error.message || "قم بالتحقق من الاتصال وعاود المحاولة."}`);
    } finally {
      setIsParsingDocument(false);
      // reset file input
      event.target.value = "";
    }
  };

  // Delete attachment from lecture
  const handleDeleteDocument = (docId: string) => {
    console.log("Delete button clicked for document:", docId);
    const lecture = getSelectedLecture();
    console.log("Lecture found:", lecture ? lecture.id : "None", "Current Docs:", lecture?.documents);
    
    if (!lecture) {
      console.log("No lecture selected, cannot delete.");
      return;
    }
    
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا الملف المرفق نهائياً؟")) {
      console.log("Deletion cancelled by user.");
      return;
    }
    
    const filteredDocs = (lecture.documents || []).filter(d => d.id !== docId);
    console.log("Filtered Docs:", filteredDocs);
    
    updateLectureData(lecture.id, { documents: filteredDocs });
    alert("🗑️ تم حذف الملف المرفق بنجاح.");
  };

  // ✅ NEW: View media (image/video/audio) in a full modal viewer
  const handleViewMedia = (doc: LectureDocument) => {
    setActiveViewingDoc(doc);
  };

  // ✅ NEW: Re-analyze a document/image with AI (re-extract text/OCR)
  const handleReAnalyzeDocument = async (doc: LectureDocument) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const isImage = doc.type.startsWith('image/');
    if (!isImage) {
      alert("إعادة التحليل متاحة حالياً للصور فقط.");
      return;
    }
    setScanningImageOCR(true);
    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: doc.base64 })
      });
      const data = await res.json();
      const extractedText = data.text || "لم يُستخرج نص من الصورة.";
      const updatedDocs = (lecture.documents || []).map(d =>
        d.id === doc.id ? { ...d, transcription: extractedText } : d
      );
      updateLectureData(lecture.id, { documents: updatedDocs });
      setScannedTextOCR(extractedText);
      alert("✅ تم استخراج النص من الصورة بنجاح!");
    } catch (e: any) {
      alert("❌ فشل استخراج النص: " + e.message);
    } finally {
      setScanningImageOCR(false);
    }
  };

  const handleMoveItem = (itemId: string, type: 'document' | 'recording', folderId: string | null) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    
    if (type === 'document') {
      const updatedDocs = (lecture.documents || []).map(doc => 
        doc.id === itemId ? { ...doc, folderId: folderId || undefined } : doc
      );
      updateLectureData(lecture.id, { documents: updatedDocs });
    } else {
      const updatedRecs = (lecture.recordings || []).map(rec => 
        rec.id === itemId ? { ...rec, folderId: folderId || undefined } : rec
      );
      updateLectureData(lecture.id, { recordings: updatedRecs });
    }
    alert("تم نقل العنصر بنجاح.");
  };

  const FolderSelector = ({ itemId, type }: { itemId: string, type: 'document' | 'recording' }) => {
    const lecture = getSelectedLecture();
    if (!lecture) return null;
    return (
        <select 
            onChange={(e) => handleMoveItem(itemId, type, e.target.value === 'null' ? null : e.target.value)} 
            className="p-1 text-[10px] bg-slate-800 text-slate-200 border border-slate-700 rounded-md"
            title="نقل إلى مجلد"
        >
            <option value="null">⬅️ نقل</option>
            <option value="null">الرئيسية</option>
            {(lecture.folders || []).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
    );
  };

  const handleShareFile = async (doc: LectureDocument) => {
    console.log("Sharing document:", doc.name, "Type:", doc.type);
    try {
      const base64Data = doc.base64.includes(",") ? doc.base64.split(",")[1] : doc.base64;
      const byteCharacters = atob(base64Data);
      console.log("Base64 decoded. Length:", byteCharacters.length);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.type });
      console.log("Blob created. Size:", blob.size);
      const file = new File([blob], doc.name, { type: doc.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        console.log("Using navigator.share");
        await navigator.share({
          files: [file],
          title: doc.name,
          text: `مشاركة ملف: ${doc.name}`
        });
      } else {
        console.log("Falling back to download");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.name;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch(e) {
      // Ignore user cancellation
      if (e instanceof Error && (e.name === 'AbortError' || e.message.includes('canceled'))) {
        console.log("Share canceled by user");
        return;
      }
      console.error("Error sharing file:", e);
      alert("تعذر مشاركة الملف: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  // Re-analyse standard document (PDF, Text, etc.)
  const handleReanalyseDocument = async (docId: string) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const doc = (lecture.documents || []).find(d => d.id === docId);
    if (!doc) return;

    setIsParsingDocument(true);
    setDocumentParseError(null);
    alert(`⚙️ جاري إعادة تحليل المستند (${doc.name}) بالذكاء الاصطناعي لتحديث ملخص كورنيل...`);

    try {
      const response = await fetch("/api/ai/parse-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: doc.name,
          fileType: doc.type,
          fileSize: doc.sizeKb,
          fileData: doc.base64,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل الخادم في إعادة معالجة المستند.");
      }

      const result = await response.json();
      if (result.success) {
        // Create matching Cornell Page template
        const uniquePageNum = lecture.pages.length + 1;
        const newPageId = "page-" + Date.now();
        
        const startingX = 100;
        const startY = 120;
        const boxesText = result.boxes || [];
        
        const generatedBoxes = boxesText.map((textStr: string, index: number) => ({
          id: `box-docx-re-${index}-${Date.now()}`,
          x: startingX,
          y: startY + (index * 170),
          width: 250,
          height: index === 0 ? 120 : 100,
          text: textStr,
          color: index === 0 ? "#4f46e5" : "#1e293b",
          fontSize: 12,
          layer: 'textboxes' as const,
        }));

        const newPageItem: PageData = {
          id: newPageId,
          pageNumber: uniquePageNum,
          templateType: 'cornell',
          bgPattern: 'ruled',
          strokes: [],
          shapes: [],
          textboxes: generatedBoxes,
          stickers: [
            { id: "st-docx-re", x: 260, y: 30, text: "تحليل مكرر 🔄", type: 'definition', layer: 'stickers' }
          ],
          cornellCues: `${result.topic || "المحور الأكاديمي"} (محدث)\n\n${result.cues || ""}`,
          cornellSummary: result.cornellSummary || "لم تتوفر خلاصة جاهزة."
        };

        const updatedPages = [...lecture.pages, newPageItem];
        updateLectureData(lecture.id, { pages: updatedPages });
        setActivePageNumber(uniquePageNum);
        
        alert(`🔄 تم بنجاح معالجة المستند وتوليد شريحة/صفحة دراسية محدثة ومحملة ببيانات كورنيل الذكية!`);
      } else {
        throw new Error(result.error || "خطأ غير معروف");
      }
    } catch (error: any) {
      console.error("Re-analysis error:", error);
      alert(`خطأ أثناء إعادة التحليل: ${error.message}`);
    } finally {
      setIsParsingDocument(false);
    }
  };

  // Convert uploaded audio/video document to text script
  const handleTranscribeDocumentAttachment = async (docId: string) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const doc = (lecture.documents || []).find(d => d.id === docId);
    if (!doc) return;

    setIsParsingDocument(true);
    setDocumentParseError(null);
    alert(`🎙️ جاري تفريغ الصوت وتحويل كلام المحاضرة بالذكاء الاصطناعي (Gemini)... قد يستغرق ذلك بضع ثوانٍ.`);

    try {
      // Helper to convert base64 back to Blob
      const base64ToBlob = (b64: string, mime: string) => {
        const byteCharacters = atob(b64.split(",")[1] || b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mime });
      };

      const blob = base64ToBlob(doc.base64, doc.type);

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": doc.type },
        body: blob
      });

      if (!res.ok) throw new Error("فشل خادم التفريغ الأكاديمي.");
      const data = await res.json();
      const transcript = (data.transcript || "").trim();

      if (!transcript) {
        throw new Error("لم يتم رصد كلام واضح بالملف الصوتي.");
      }

      // Save transcription to document description & write to lecture text
      const updatedDocs = (lecture.documents || []).map(d =>
        d.id === docId ? { ...d, transcription: transcript } : d
      );
      updateLectureData(lecture.id, { 
        documents: updatedDocs,
        lectureText: transcript
      });
      setLectureTextEdit(transcript);
      alert(`🎉 تم استخراج النص بنجاح وإلحاقه بالتفريغ الصفي للأستاذ!`);
    } catch (err: any) {
      console.error(err);
      alert(`عذراً، فشل التفريغ الصوتي: ${err.message}`);
    } finally {
      setIsParsingDocument(false);
    }
  };

  // Image Optical Character recognition
  const handleOcrImageAttachment = async (docId: string) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    const doc = (lecture.documents || []).find(d => d.id === docId);
    if (!doc) return;

    setIsParsingDocument(true);
    setDocumentParseError(null);
    alert(`📸 جاري إجراء قراءة ضوئية للذكاء الاصطناعي (OCR) على الصورة (${doc.name})...`);

    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: doc.base64 })
      });
      if (!res.ok) throw new Error("فشل الخادم في قراءة الصورة واكتشاف النصوص.");
      const data = await res.json();
      
      if (data.text) {
        // Update document with transcription list
        const updatedDocs = (lecture.documents || []).map(d =>
          d.id === docId ? { ...d, transcription: data.text } : d
        );
        updateLectureData(lecture.id, { 
          documents: updatedDocs,
          lectureText: data.text
        });
        setLectureTextEdit(data.text);
        alert(`🎉 تم نجاح استخراج النص من الصورة! تم نسخه أيضاً إلى مفكرة تفريغ المحاضرة.`);
      } else {
        alert("لم يتم العثور على أي نصوص واضحة في الصورة المحددة.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`خطأ أثناء مسح الصورة: ${err.message}`);
    } finally {
      setIsParsingDocument(false);
    }
  };

  // Perform Advanced Multi-Option Document Analysis
  const handleAnalyzeDocumentAdvanced = async (doc: LectureDocument) => {
    setIsPerformingDocumentAnalysis(true);
    alert(`⚡ جاري التوافق والاتصال بمذعن التحليل الأكاديمي... يتم الآن معالجة ملف (${doc.name}) وفقاً للنطاق المحدد ونوع المخرجات المطلوبة. قد يستغرق هذا الأمر بضع ثوانٍ.`);

    try {
      const pageRangeStr = analysisPageRange === 'all' ? 'all' : `${analysisCustomStart}-${analysisCustomEnd}`;
      
      const response = await fetch("/api/ai/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: doc.name,
          fileType: doc.type,
          fileSize: doc.sizeKb,
          fileData: doc.base64,
          pageRange: pageRangeStr,
          analysisType: analysisTypeSelect,
          itemsPerPage: analysisItemsPerPage
        })
      });

      if (!response.ok) {
        throw new Error("فشل خوادم التحليل الكلي للمستندات.");
      }

      const result = await response.json();
      if (result.success) {
        const newAnalysisItem = {
          id: `analysis-id-${Date.now()}`,
          timestamp: result.timestamp || new Date().toISOString(),
          title: result.title || "تقرير تحليل أكاديمي سريع",
          type: analysisTypeSelect,
          content: result.content || "لم يتم إنتاج مخرجات ملموسة.",
          pageRange: analysisPageRange === 'all' ? 'جميع صفحات الملف' : `الصفحات من ${analysisCustomStart} إلى ${analysisCustomEnd}`
        };

        const existingList = docAnalyses[doc.id] || [];
        const nextDocAnalyses = {
          ...docAnalyses,
          [doc.id]: [newAnalysisItem, ...existingList]
        };

        setDocAnalyses(nextDocAnalyses);
        setAnalyzingDocItem(null); // Close the analyze setup modal/dialog

        alert(`🎉 تم الانتهاء بنجاح من تحليل المستند (${doc.name}) بالذكاء الاصطناعي وصياغة المخرجات الأكاديمية! يمكنك الاطلاع وقراءة هذه المخرجات الهامة مباشرة تحت اسم المستند/المذكرة في قائمة المقررات والمذكرات بالمنبثقة الآن لتجنب ازدحام الشاشة الرئيسية.`);
      } else {
        throw new Error(result.error || "استجابة غير صحيحة من نظام التحليل الأكاديمي.");
      }
    } catch (e: any) {
      console.error("Advanced document analysis error:", e);
      alert(`عذراً، حدث خطأ أثناء تشغيل التحليل: ${e.message || "يرجى التحقق من الاتصال وعود مجدداً."}`);
    } finally {
      setIsPerformingDocumentAnalysis(false);
    }
  };

  // Load PDF.js dynamically using a cascading retry system (CDNs + Local Server Proxy fallbacks)
  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/api/libs/pdf.worker.min.js";
        resolve(pdfjsLib);
        return;
      }

      // Candidate script files (prioritize our local server-side caching proxy)
      const scriptSources = [
        "/api/libs/pdf.min.js",
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js",
        "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.min.js"
      ];

      const workerSources = [
        "/api/libs/pdf.worker.min.js",
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js",
        "https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js"
      ];

      let currentIndex = 0;

      const tryLoadSource = () => {
        if (currentIndex >= scriptSources.length) {
          reject(new Error("فشل تحميل مكتبة قارئ مستندات PDF. يرجى التحقق من اتصالك بالإنترنت أو الخادم المساعد."));
          return;
        }

        const src = scriptSources[currentIndex];
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => {
          const loadedLib = (window as any).pdfjsLib;
          if (loadedLib) {
            loadedLib.GlobalWorkerOptions.workerSrc = workerSources[currentIndex] || "/api/libs/pdf.worker.min.js";
            resolve(loadedLib);
          } else {
            currentIndex++;
            tryLoadSource();
          }
        };

        script.onerror = () => {
          console.warn(`Failed to load PDF.js from source: ${src}, trying next candidate...`);
          currentIndex++;
          tryLoadSource();
        };

        document.body.appendChild(script);
      };

      tryLoadSource();
    });
  };

  // Convert Base64 payload back into Uint8Array buffer
  const convertBase64ToUint8Array = (base64String: string) => {
    const rawData = base64String.split(",")[1] || base64String;
    const binaryString = atob(rawData);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Build notebook canvas pages from PDF pages list
  const handleRenderPdfToNotebook = async (doc: any) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;

    setIsParsingDocument(true);
    setDocumentParseError(null);
    alert(`📂 جاري تهيئة وتحضير ملف الـ PDF (${doc.name}) وتجزئة صفحاته للرسم والكتابة... قد يستغرق ذلك بضع ثوانٍ.`);

    try {
      const pdfjsLib = await loadPdfJs();
      const pdfBuffer = convertBase64ToUint8Array(doc.base64);

      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      if (numPages === 0) {
        throw new Error("ملف PDF فارغ أو غير صالح للقراءة.");
      }

      const generatedPages: PageData[] = [];

      // Render each page to offscreen canvas
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Crisp scaling

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          // Fill white background before rendering
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgBase64 = canvas.toDataURL("image/png");

          generatedPages.push({
            id: `pdf-imported-page-${i}-${Date.now()}`,
            pageNumber: i,
            templateType: "blank",
            bgPattern: "plain",
            strokes: [],
            shapes: [],
            stickers: [],
            textboxes: [],
            bgImage: imgBase64,
            cornellSummary: `الصفحة رقم ${i} من المستند: ${doc.name}`,
            cornellCues: `${doc.name}\nالصفحة ${i}`
          });
        }
      }

      // Prompt user to select Replace vs Append
      const replaceAll = confirm(`هل تود استبدال كامل صفحات الدفتر الورقي الحالي بصفحات هذا المستند (${numPages} صفحة)؟\n\nنعم = استبدال الكل\nإلغاء = إضافة كصفحات إضافية في نهاية الدفتر.`);

      let updatedPages: PageData[] = [];
      if (replaceAll) {
        updatedPages = generatedPages;
      } else {
        const nextStartNumber = lecture.pages.length + 1;
        const alignedPages = generatedPages.map((p, idx) => ({
          ...p,
          pageNumber: nextStartNumber + idx
        }));
        updatedPages = [...lecture.pages, ...alignedPages];
      }

      updateLectureData(lecture.id, { pages: updatedPages });
      setActivePageNumber(replaceAll ? 1 : lecture.pages.length + 1);
      setActiveViewingDoc(null); // Close preview modal if open to view the notebook!
      
      alert(`🎉 تم بنجاح جلب وتأمين صفحات المستند المرفق (${doc.name}) بالدفتر كخلفية تفاعلية! يمكنك بدء المذاكرة والكتابة يدويًا بالفرشاة أو تدوين ملاحظات تفاعلية الآن.`);
    } catch (e: any) {
      console.error("PDF Notebook rendering error:", e);
      alert(`خطأ أثناء تجزئة صفحات الـ PDF: ${e.message}`);
    } finally {
      setIsParsingDocument(false);
    }
  };

  // Convert an image document into a single notebook canvas page
  const handleRenderImageToNotebook = (doc: any) => {
    const lecture = getSelectedLecture();
    if (!lecture) return;

    try {
      const uniquePageNum = lecture.pages.length + 1;
      const newPageItem: PageData = {
        id: `img-imported-page-${Date.now()}`,
        pageNumber: uniquePageNum,
        templateType: "blank",
        bgPattern: "plain",
        strokes: [],
        shapes: [],
        stickers: [],
        textboxes: [],
        bgImage: doc.base64,
        cornellSummary: `الصورة الملموسة المرفقة: ${doc.name}`,
        cornellCues: `${doc.name}`
      };

      const appendMode = confirm(`هل تود تعيين هذه الصورة كصفحة دراسية جديدة بمفكرة الدرس للكتابة والرسم فوقها؟`);
      if (!appendMode) return;

      const updatedPages = [...lecture.pages, newPageItem];
      updateLectureData(lecture.id, { pages: updatedPages });
      setActivePageNumber(uniquePageNum);
      setActiveViewingDoc(null); // Close preview modal if open to view the notebook!

      alert(`🎉 تم نجاح تحويل الصورة (${doc.name}) إلى صفحة دراسية تفاعلية وقابلة للكتابة بالكامل داخل الدفتر بامتياز!`);
    } catch (e: any) {
      console.error(e);
      alert("تعذر استيراد الصورة للدفتر.");
    }
  };

  // Simulation of whiteboard slide snapshot scan OCR
  // Handle image file selected from camera or file picker for OCR
  const handleCameraFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanningImageOCR(true);
    setScannedTextOCR(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: base64 })
      });
      const data = await res.json();
      setScannedTextOCR(data.text);
      const lecture = getSelectedLecture();
      if (lecture && lecture.pages.length > 0) {
        const currentPage = lecture.pages[activePageNumber - 1];
        const newBox = {
          id: "ocr-box-" + Date.now(),
          x: 50,
          y: 50,
          width: 350,
          height: 130,
          text: data.text,
          fontSize: 13,
          color: "#1e293b",
          layer: "textboxes" as const
        };
        handleUpdatePageData(activePageNumber - 1, {
          textboxes: [...currentPage.textboxes, newBox]
        });

        // Auto-save to Media Center
        const newDoc = {
          id: "doc-" + Date.now(),
          name: `صورة سبورة - ${new Date().toLocaleDateString()}`,
          type: "image/jpeg",
          sizeKb: Math.floor(base64.length / 1024),
          base64: base64,
          timestamp: new Date().toISOString(),
        };
        updateLectureData(lecture.id, { documents: [...(lecture.documents || []), newDoc] });
      }
    } catch (err) {
      setScannedTextOCR("تعذر قراءة الصورة، يرجى المحاولة مرة أخرى.");
    } finally {
      setScanningImageOCR(false);
      // Reset input so same file can be selected again
      if (cameraFileInputRef.current) cameraFileInputRef.current.value = "";
    }
  };

  const handleWhiteboardScanOCR = () => {
    // Open real camera / file picker instead of sending mock data
    cameraFileInputRef.current?.click();
  };

  // Security Lock controls
  const handleTogglePINActivation = () => {
    if (appState.security.isEnabled) {
      // Disable
      setAppState(prev => ({
        ...prev,
        security: { ...prev.security, isEnabled: false, pinCode: "" }
      }));
      alert("تم إيقاف قفل التطبيق السري بنجاح.");
    } else {
      if (customPinInput.length !== 4) {
        alert("يرجى إدخال رمز قفل مكوّن من 4 أرقام عددية لتأمين الدفتر الخاص بك!");
        return;
      }
      setAppState(prev => ({
        ...prev,
        security: { ...prev.security, isEnabled: true, pinCode: customPinInput }
      }));
      setCustomPinInput("");
      alert("تم تفعيل وتأمين تطبيقك بنجاح بالشفرة السرية 🔒");
    }
  };

  // Hide or unhide subject IDs under pin protect
  const handleLockSubjectId = (subId: string) => {
    if (!appState.security.isEnabled) {
      alert("يرجى أولاً تفعيل وتعيين البصمة أو الرقم السري PIN من شاشة الأمن والخصوصية.");
      return;
    }
    const isLocked = appState.security.hiddenSubjectIds.includes(subId);
    let next: string[];
    if (isLocked) {
      next = appState.security.hiddenSubjectIds.filter(id => id !== subId);
    } else {
      next = [...appState.security.hiddenSubjectIds, subId];
    }
    setAppState(prev => ({
      ...prev,
      security: { ...prev.security, hiddenSubjectIds: next }
    }));
  };

  // Safe checks of clicking course subject
  const handleSubjectClickAndBarrierCheck = (subId: string) => {
    const isLocked = appState.security.hiddenSubjectIds.includes(subId);
    if (isLocked && appState.security.isEnabled) {
      setPendingActiveSubjectId(subId);
      setShowAppPINBarrier(true);
    } else {
      setActiveSubId(subId);
      setSelectedLectureId(""); // Close any currently open lecture on subject transition!
    }
  };

  // Search filter matching logic
  const getFilteredLectures = () => {
    let matched = appState.lectures.filter(l => l.subjectId === activeSubId);

    // Filter by Date Range
    if (startDate) {
      matched = matched.filter((l) => l.date >= startDate);
    }
    if (endDate) {
      matched = matched.filter((l) => l.date <= endDate);
    }

    // Filter by Difficulty
    if (difficultyFilter !== 'all') {
      matched = matched.filter((l) => l.difficulty === difficultyFilter);
    }

    // Filter by Bookmark status
    if (bookmarkOnly) {
      matched = matched.filter((l) => l.bookmarked);
    }

    if (!searchQuery.trim()) return matched;
    const query = searchQuery.toLowerCase();
    return matched.filter((l) => {
      const matchTitle = l.title.toLowerCase().includes(query);
      const matchTags = l.tags.some(t => t.toLowerCase().includes(query));
      const matchSummary = l.aiSummary?.summary.toLowerCase().includes(query) || false;
      return matchTitle || matchTags || matchSummary;
    });
  };

  // Cloud backup and Restore triggers to simulate drive flow
  const handleBackupToDriveTrigger = () => {
    const newBackupItem = {
      id: "bak-" + Date.now(),
      timestamp: new Date().toISOString(),
      sizeKb: Math.floor(Math.random() * 200) + 50,
      lecturesCount: appState.lectures.length
    };
    
    // Stringify database to mock cloud storage JSON payload
    const snapshotStr = JSON.stringify({
      lectures: appState.lectures,
      universities: appState.universities,
      years: appState.years,
      subjects: appState.subjects
    });
    localStorage.setItem(`cloud_snapshot_${newBackupItem.id}`, snapshotStr);

    setAppState(prev => ({
      ...prev,
      backup: {
        ...prev.backup,
        lastBackupDate: new Date().toISOString(),
        backupsList: [newBackupItem, ...prev.backup.backupsList]
      }
    }));
  };

  const handleRestoreFromDriveTrigger = (backupId: string) => {
    const payload = localStorage.getItem(`cloud_snapshot_${backupId}`);
    if (payload) {
      const parsed = JSON.parse(payload);
      setAppState(prev => ({
        ...prev,
        lectures: parsed.lectures || prev.lectures,
        universities: parsed.universities || prev.universities,
        years: parsed.years || prev.years,
        subjects: parsed.subjects || prev.subjects
      }));
      if (parsed.lectures?.length > 0) {
        setSelectedLectureId(parsed.lectures[0].id);
      }
    }
  };

  // Markdown note exporter
  const handleExportMarkdown = () => {
    const lecture = getSelectedLecture();
    if (!lecture) return;
    
    let md = `# ${lecture.title}\n`;
    md += `**التاريخ:** ${lecture.date} | **الصعوبة:** ${lecture.difficulty}\n\n`;
    if (lecture.aiSummary) {
      md += `## ملخص الذكاء الاصطناعي\n${lecture.aiSummary.summary}\n\n`;
    }
    lecture.pages.forEach((page, index) => {
      md += `### الصفحة ${index + 1} (${page.templateType})\n`;
      if (page.cornellSummary) md += `*خلاصة كورنيل:* ${page.cornellSummary}\n`;
      page.textboxes.forEach((box) => {
        md += `> ${box.text}\n\n`;
      });
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lecture.title}-نوتس.md`;
    link.click();
    alert("تم تصدير المحاضرة كملف Markdown بنجاح! 🚀");
  };

  // Mock instant QR code generator
  const handleToggleQRCodeShare = () => {
    if (qrStateCode) {
      setQrStateCode(null);
    } else {
      setQrStateCode("https://ai.studio/notebook-share/" + selectedLectureId);
    }
  };

  const lecture = getSelectedLecture();

  // 1. Left Sidebar navigation - Converted to overlay drawer panel
  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sansArabic relative ${
      isDarkMode ? "night-mode" : ""
    }`}>
      {!isFocusMode && (
        <>
          {/* Backdrop Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Drawer Sidebar Container */}
          <div className={`fixed inset-y-0 right-0 w-80 bg-slate-950 border-l border-slate-800 flex flex-col text-right z-50 transition-transform duration-300 transform overflow-hidden ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}>
            {/* Header with Exit button — sticky, never scrolls */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-rose-400 rounded-lg font-black text-xs transition active:scale-95 cursor-pointer"
              >
                إغلاق ×
              </button>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[13px] tracking-wide text-indigo-400">لوحة المزايا والأقسام</span>
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            {/* Scrollable sidebar body */}
            <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-4 custom-scrollbar">

            {/* Quick Stats overview */}
            <div className="p-3 bg-slate-900/40 border border-indigo-950/40 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
              <div className="text-left font-sans text-indigo-400 font-extrabold">
                <span className="text-[9px] block text-slate-500">مجموع المكافآت</span>
                <strong>{appState.stats.xpPoints} XP</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500" />
                <span>أيام متصلة: <strong>{appState.stats.streakDays}</strong></span>
              </div>
            </div>

            {/* AI key and Academic controls shortcut block */}
            <div className="border border-indigo-950/80 bg-indigo-950/15 p-3 rounded-xl space-y-2.5 text-right">
              <span className="text-[10px] text-indigo-400 font-black block leading-none">ميزات التحكم الرقمي الفوري</span>
              
              <label className="flex items-center justify-between cursor-pointer gap-2 select-none text-[10px] text-slate-300">
                <input
                  type="checkbox"
                  checked={showFloatingQuickActions}
                  onChange={(e) => setShowFloatingQuickActions(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>تفعيل الأزرار العائمة بالدفتر ✨</span>
              </label>
              
              <button
                onClick={() => {
                  setShowAiKeyModal(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-1.5 px-2.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 text-[10px] border border-indigo-600/30 rounded-lg flex items-center justify-center gap-1.5 font-bold transition duration-150"
              >
                <Key className="w-3 h-3 text-indigo-400" />
                <span>كود تشغيل التطبيق</span>
              </button>

              <button
                onClick={() => {
                  setIsEditingAcademic(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full py-1.5 px-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 text-[10px] border border-emerald-600/30 rounded-lg flex items-center justify-center gap-1.5 font-bold transition duration-150"
              >
                ✏️
                <span>تحديث البيانات الأكاديمية</span>
              </button>
            </div>

            {/* Toggle Main Navigation Tabs */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800 flex flex-col shrink-0">
              <span className="text-[9px] text-slate-400 font-bold block mb-1 uppercase tracking-wider text-right pr-1">أقسام المحاضرة والتقويم</span>
              
              <button
                onClick={() => { setActiveOverlay(null); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === null ? 'bg-indigo-600/15 text-indigo-300 border-r-4 border-indigo-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>الدفتر الذكي المكتبي</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">📝</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('materials'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'materials' ? 'bg-indigo-600/15 text-indigo-300 border-r-4 border-indigo-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>مقررات ومذكرات المادة</span>
                </div>
                <span className="text-[10px] text-indigo-550 font-bold bg-slate-900 px-1.5 py-0.5 rounded">📚</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('lecture-hub'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'lecture-hub' ? 'bg-indigo-600/15 text-indigo-300 border-r-4 border-indigo-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-500" />
                  <span>مركز وسائط المحاضرات</span>
                </div>
                <span className="text-[10px] text-slate-550 font-bold bg-slate-900 px-1.5 py-0.5 rounded">🎙️</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('ai-advisor'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'ai-advisor' ? 'bg-indigo-600/15 text-indigo-300 border-r-4 border-indigo-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>مستشار الذكاء الاصطناعي</span>
                </div>
                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-900/30 px-1.5 py-0.5 rounded">AI</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('training'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'training' ? 'bg-amber-600/15 text-amber-300 border-r-4 border-amber-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>التدريب والتقويم اليومي</span>
                </div>
                <span className="text-[10.5px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold border border-amber-500/10">مستمر</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('handwriting-ai'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'handwriting-ai' ? 'bg-purple-600/15 text-purple-300 border-r-4 border-purple-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>تحليل خط يدي ورسمي</span>
                </div>
                <span className="text-[9.5px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded font-mono font-bold">DRAW</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('stats'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'stats' ? 'bg-emerald-600/15 text-emerald-300 border-r-4 border-emerald-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  <span>لوحة الإنجاز والتحليلات</span>
                </div>
                <span className="text-[9.5px] text-emerald-400 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded">XP</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('settings'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'settings' ? 'bg-indigo-600/15 text-indigo-305 border-r-4 border-indigo-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>إعدادات الضبط والمنصة</span>
                </div>
                <span className="text-[10px] text-indigo-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">⚙️</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('changelog'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'changelog' ? 'bg-amber-600/15 text-amber-350 border-r-4 border-amber-505 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" />
                  <span>سجل التعديلات للمراجعات</span>
                </div>
                <span className="text-[10px] text-amber-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">TIME</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('cloud'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'cloud' ? 'bg-sky-600/15 text-sky-300 border-r-4 border-sky-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-sky-500" />
                  <span>النسخ والملفات السحابية</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-bold">DRIVE</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('security'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'security' ? 'bg-rose-600/15 text-rose-300 border-r-4 border-rose-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>بوابة قفل وأمان PIN</span>
                </div>
                <span className="text-[10px] text-rose-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">PIN</span>
              </button>

              <button
                onClick={() => { setActiveOverlay('file-manager'); setIsAiAdvisorCollapsed(false); setIsSidebarOpen(false); }}
                className={`w-full p-2 rounded-xl text-right text-xs font-black transition flex items-center justify-between gap-2 ${activeOverlay === 'file-manager' ? 'bg-teal-600/15 text-teal-300 border-r-4 border-teal-500 font-extrabold' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-teal-400" />
                  <span>ذاكرة التخزين المحلية</span>
                </div>
                <span className="text-[10px] text-teal-405 font-bold bg-slate-900 px-1.5 py-0.5 rounded">FILE</span>
              </button>
            </div>

            {/* Core Navigation Selector: Universities & Academic years */}
            <div className="space-y-3 pt-3 border-t border-slate-800 overflow-y-auto flex-1 text-right">
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider text-right pr-1">الهيكل الدراسية والمساقات</span>
              
              <div>
                <label className="text-[10px] text-slate-400 font-bold tracking-wide block mb-1">الجامعة أو المؤسسة</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      openCustomPrompt(
                        "إضافة جامعة جديدة",
                        "أدخل اسم الجامعة الجديدة:",
                        "",
                        "مثال: جامعة الملك سعود",
                        (promptName) => {
                          if (promptName.trim()) {
                            setNewUnivName(promptName.trim());
                            const tempId = "univ-" + Date.now();
                            setAppState(prev => ({
                              ...prev,
                              universities: [...prev.universities, { id: tempId, name: promptName.trim() }]
                            }));
                            setActiveUnivId(tempId);
                          }
                        }
                      );
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    title="إضافة جامعة"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <select
                    value={activeUnivId}
                    onChange={(e) => setActiveUnivId(e.target.value)}
                    className="flex-1 bg-slate-900 border-0 text-xs font-semibold text-slate-100 rounded-lg p-2 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    {appState.universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold tracking-wide block mb-1">الفصل والسنوات الدراسية</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      openCustomPrompt(
                        "إضافة سنة دراسية جديدة",
                        "أدخل اسم السنة الجديدة:",
                        "",
                        "مثال: السنة الثالثة - الفصل الأول",
                        (promptName) => {
                          if (promptName.trim()) {
                            const tempId = "year-" + Date.now();
                            setAppState(prev => ({
                              ...prev,
                              years: [...(prev.years || []), { id: tempId, universityId: activeUnivId, name: promptName.trim() }]
                            }));
                            setActiveYearId(tempId);
                          }
                        }
                      );
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    title="إضافة سنة دراسية"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <select
                    value={activeYearId}
                    onChange={(e) => setActiveYearId(e.target.value)}
                    className="flex-1 bg-slate-900 border-0 text-xs font-semibold text-slate-100 rounded-lg p-2 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    {(appState.years || []).filter(y => y.universityId === activeUnivId).map((y) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold tracking-wide block mb-1">المادة الدراسية (الموضوع)</label>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      openCustomPrompt(
                        "إضافة مادة دراسية جديدة",
                        "اسم المادة أو المقرر الدراسي:",
                        "",
                        "مثال: الذكاء الاصطناعي",
                        (promptName) => {
                          if (promptName.trim()) {
                            const tempId = "sub-" + Date.now();
                            const newSb = {
                              id: tempId,
                              name: promptName.trim(),
                              yearId: activeYearId,
                              color: ["indigo", "purple", "sky", "rose", "emerald", "amber"][Math.floor(Math.random() * 6)] as any
                            };
                            setAppState(prev => ({
                              ...prev,
                              subjects: [...prev.subjects, newSb]
                            }));
                            setActiveSubId(tempId);
                            setSelectedLectureId(""); // clear selected lecture
                          }
                        }
                      );
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
                    title="إضافة مادة جديدة"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <select
                    value={activeSubId}
                    onChange={(e) => {
                      setActiveSubId(e.target.value);
                      setSelectedLectureId("");
                    }}
                    className="flex-1 bg-slate-900 border-0 text-xs font-semibold text-slate-100 rounded-lg p-2 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    {appState.subjects && appState.subjects.filter(s => s.yearId === activeYearId).length > 0 ? (
                      appState.subjects
                        .filter(s => s.yearId === activeYearId)
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                    ) : (
                      <option value="">لا توجد مواد لهذا العام الدراسية</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Version History & Reviews Timeline inside Sidebar */}
              {lecture && (
                <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/80 text-right space-y-2 mt-4 select-none">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[8px] text-slate-500 font-mono">حفظ تلقائي للنسخ</span>
                    <h4 className="font-extrabold text-[10px] text-indigo-400 flex items-center justify-end gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>سجل إصدارات التعديل</span>
                    </h4>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed pr-0.5">
                    استعد النسخ السابقة لصفحات هذه المحاضرة بكبسة زر. ينشئ الدفتر تلقائياً عند حفظ ومعالجة الكتابة الفورية.
                  </p>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                    {lecture.changelog && lecture.changelog.length > 0 ? (
                      [...lecture.changelog].reverse().map((entry, idx) => (
                        <div key={`${entry.id || 'sidebar-chg'}-${idx}`} className="bg-slate-950/80 p-2 rounded-lg border border-slate-900/60 flex flex-col gap-1 text-right hover:bg-slate-900 transition">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[8px] bg-slate-900/95 text-indigo-400 font-mono px-1 py-0.5 rounded border border-slate-800 font-extrabold">
                              v{entry.version}
                            </span>
                            <span className="text-[9.5px] font-bold text-slate-200 truncate">{entry.description}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] text-slate-500 mt-1">
                            {entry.snapshotData && (
                              <button
                                onClick={() => handleRevertToVersion(entry)}
                                className="px-1.5 py-0.5 bg-indigo-950 text-indigo-400 hover:bg-indigo-650 hover:text-white border border-indigo-800/50 rounded font-black text-[8px] transition cursor-pointer"
                              >
                                استعادة النسخة 🔄
                              </button>
                            )}
                            <span className="font-mono text-[8px] text-slate-500">{new Date(entry.timestamp).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-600 text-[10px]">
                        لا تتوفر إصدارات مؤرشفة بعد لهذه المحاضرة.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* End scrollable sidebar body */}
            </div>
          </div>
        </>
      )}


      {/* Main top header bar across all modes */}
      <header className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-right">
        
        {/* Left panel action symbols: Clean Camera Capture Types & Notifications */}
        <div className="flex items-center gap-2.5 relative">
          <span className="text-[10px] text-slate-500 font-extrabold ml-1 hidden sm:inline">نوع الالتقاط الصفي:</span>

          {/* 1. Camera Photo OCR Capture */}
          <button
            onClick={handleWhiteboardScanOCR}
            className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-705 text-teal-400 hover:text-teal-300 rounded-lg transition flex items-center justify-center cursor-pointer"
            title="التقاط صورة لسبورة الكلية ومسحها ذكياً 📷"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* 2. Video Record Capture */}
          <button
            onClick={() => {
              if (!isVideoRecording) {
                handleStartVideoRecording();
              } else {
                handleStopVideoRecording();
              }
            }}
            className={`p-2 rounded-lg border transition flex items-center justify-center cursor-pointer ${
              isVideoRecording 
                ? 'bg-rose-950/40 text-rose-400 border-rose-900 animate-pulse' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300'
            }`}
            title={isVideoRecording ? "إيقاف التسجيل 🔴" : "تسجيل بث مباشر صوت وفيديو المحاضر 📹"}
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Smart Alerts and Notification Bell */}
          <div className="relative">
            <button
              id="notification-bell-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`p-2 rounded-lg relative transition flex items-center justify-center ${
                getNotifications().length > 0
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400'
              }`}
              title="تنبيهات المذاكرة والتقييمات"
            >
              {getNotifications().length > 0 ? (
                <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4 text-slate-400" />
              )}
              
              {getNotifications().length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border border-slate-950">
                  {getNotifications().length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute left-0 mt-2.5 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-right">
                <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">تنبيهات ونشاط المذاكرة الذكية</span>
                  <h4 className="text-xs font-black text-slate-100">صندوق الإشعارات والمتابعة</h4>
                </div>
                
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                  {getNotifications().length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <span className="text-2xl block">🎉</span>
                      <p className="text-xs font-bold text-emerald-400">مكتمل بالكامل!</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sansArabic">
                        رائع جداً! لقد تفقدت كل محاضراتك، وأجريت لها أسئلة تقويم الفهم، وحفظت ملاحظات خط يدك بنجاح.
                      </p>
                    </div>
                  ) : (
                    getNotifications().map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="p-3.5 hover:bg-slate-800/80 transition cursor-pointer text-right space-y-1 group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-1.5 py-0.5 rounded leading-none">
                            {notif.type === "unopened" ? "لم تفتحها" : notif.type === "untested" ? "ينقصها تقويم" : "خط اليد"}
                          </span>
                          <h5 className="text-[11px] font-bold text-amber-300 group-hover:text-amber-200 transition">
                            {notif.title}
                          </h5>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-sansArabic">
                          {notif.description}
                        </p>
                        <div className="pt-1.5 flex justify-end">
                          <span className="text-[9px] text-indigo-400 group-hover:underline font-bold flex items-center gap-1">
                            ابدأ المراجعة الفورية والتقويم الآن ←
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section: Elegant search button, simulated layout switchers and menu trigger */}
        <div className="flex items-center gap-3 order-last select-none">
          {/* Devices Simulation & Layout Mode Selector + Theme mode */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/85 p-0.5 rounded-xl">
            {/* Phone sim Button */}
            <button
              onClick={() => setLayoutMode('phone')}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                layoutMode === 'phone' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              title="محاكاة شاشة الجوال (صغير) 📱"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            {/* Desktop sim Button */}
            <button
              onClick={() => setLayoutMode('desktop')}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                layoutMode === 'desktop' 
                  ? 'bg-indigo-600 text-white shadow shadow-indigo-505/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              title="محاكاة شاشة الكمبيوتر (كبير) 💻"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-3 bg-slate-800 mx-0.5" />

            {/* Day/Night Theme toggler */}
            <button
              onClick={() => {
                const nextTheme = !isDarkMode;
                setIsDarkMode(nextTheme);
                localStorage.setItem("isDarkMode", String(nextTheme));
              }}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-850 rounded-lg transition duration-150 cursor-pointer"
              title={isDarkMode ? "الوضعية النهارية الصافية ☀️" : "الوضعية الليلية الداكنة 🌙"}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          </div>

          {/* Search Button right next to the menu as requested */}
          {!isFocusMode && (
            <button
              onClick={() => {
                if (activeOverlay === 'materials') {
                  setActiveOverlay(null);
                } else {
                  setActiveOverlay('materials');
                }
              }}
              className={`p-2 border rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer font-bold text-xs shadow-md active:scale-95 ${
                activeOverlay === 'materials'
                  ? 'bg-indigo-600 border-indigo-555 text-white shadow shadow-indigo-505/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-indigo-400 hover:border-slate-705'
              }`}
              title="البحث الذكي واستعراض مذكرات المواد الدراسية 🔍"
            >
              <Search className="w-3.5 h-3.5" />
              <span>البحث</span>
            </button>
          )}

          {/* Three-lined hamburger menu icon button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-705 hover:text-indigo-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-black text-xs text-slate-200 shadow-md group relative active:scale-95"
            title="افتح لوحة التنقل والأقسام"
          >
            <div className="flex flex-col gap-1 w-4 items-end">
              <div className="w-4 h-0.5 bg-current transition-all group-hover:w-3"></div>
              <div className="w-3 h-0.5 bg-current transition-all group-hover:w-4"></div>
              <div className="w-1.5 h-0.5 bg-current transition-all group-hover:w-4"></div>
            </div>
            <span>القائمة</span>
          </button>
        </div>
      </header>

        {/* Outer view swapper panel */}
        <main className={`flex-1 space-y-6 relative ${layoutMode === 'phone' ? 'p-1 sm:p-2' : 'p-4 md:p-6'}`}>
          
          {/* Academic Breadcrumb Status Bar (شريط تتبع المسار الدراسي الفوري للتكيف الفوري) */}
          {isEditingBreadcrumb ? (
            /* Breadcrumb Editor Form (وضع التعديل السريع لبيانات الرأس) */
            <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-start gap-3 w-full shadow-md select-none" dir="rtl">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 font-normal">الجامعة:</span>
                  <input
                    type="text"
                    value={editUnivVal}
                    onChange={(e) => setEditUnivVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-indigo-500 w-32 font-bold"
                    placeholder="جامعة الملك سعود"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-violet-400 font-normal">الكلية:</span>
                  <input
                    type="text"
                    value={editCollegeVal}
                    onChange={(e) => setEditCollegeVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-violet-500 w-32 font-bold"
                    placeholder="كلية علوم الحاسب"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-550 font-normal">القسم/السنة:</span>
                  <input
                    type="text"
                    value={editYearVal}
                    onChange={(e) => setEditYearVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-indigo-500 w-32 font-bold"
                    placeholder="تقنية المعلومات"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-amber-400 font-normal">المستوى:</span>
                  <input
                    type="text"
                    value={editLevelVal}
                    onChange={(e) => setEditLevelVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-amber-500 w-28 font-bold"
                    placeholder="المستوى الخامس"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-emerald-600 font-normal">المادة:</span>
                  <input
                    type="text"
                    value={editSubVal}
                    onChange={(e) => setEditSubVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-emerald-500 w-32 font-bold"
                    placeholder="اسم المادة"
                  />
                </div>

                {lecture && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-indigo-500 font-normal font-black">المحاضرة:</span>
                    <input
                      type="text"
                      value={editLecVal}
                      onChange={(e) => setEditLecVal(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-indigo-500 w-40 font-bold"
                      placeholder="عنوان المحاضرة"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 mr-auto">
                {/* Save & Sync Button */}
                <button
                  onClick={saveBreadcrumbEdits}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg transition shadow cursor-pointer flex items-center gap-1 active:scale-95"
                  title="حفظ كافة البيانات ومزامنتها الفورية مع الواجهة"
                >
                  <span>حفظ التغييرات 💾</span>
                </button>

                {/* Cancel Button */}
                <button
                  onClick={() => setIsEditingBreadcrumb(false)}
                  className="px-2.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-350 text-[10px] font-bold rounded-lg transition cursor-pointer active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 py-1 px-1.5 w-full select-none" dir="rtl">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* University Tag */}
                <div className="inline-flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 px-2 py-1 rounded-lg text-white font-extrabold shadow-sm">
                  <span className="text-[9px] text-slate-500 font-normal">الجامعة:</span>
                  <span className="text-[10px]">{appState.universities.find(u => u.id === activeUnivId)?.name || academicDetails.university || "جامعة الملك سعود"}</span>
                </div>

                {/* College Tag */}
                <div className="inline-flex items-center gap-1 bg-slate-900/95 border border-slate-800/80 px-2 py-1 rounded-lg text-slate-200 font-extrabold shadow-sm">
                  <span className="text-[9px] text-slate-500 font-normal">الكلية:</span>
                  <span className="text-[10px]">{academicDetails.college || "علوم الحاسب"}</span>
                </div>

                {/* Department Tag */}
                <div className="inline-flex items-center gap-1 bg-slate-900/60 border border-slate-800/60 px-2 py-1 rounded-lg text-slate-300 font-bold shadow-sm">
                  <span className="text-[9px] text-slate-505 font-normal">القسم/السنة:</span>
                  <span className="text-[10px]">{((appState.years || []).find(y => y.id === activeYearId)?.name) || academicDetails.department || "تقنية المعلومات"}</span>
                </div>

                {/* Level Tag */}
                <div className="inline-flex items-center gap-1 bg-slate-900/60 border border-slate-800/60 px-2 py-1 rounded-lg text-slate-400 font-bold shadow-sm">
                  <span className="text-[9px] text-slate-505 font-normal">المستوى:</span>
                  <span className="text-[10px]">{academicDetails.level || "المستوى الخامس"}</span>
                </div>

                {/* Subject Material */}
                <div className="inline-flex items-center gap-1 bg-emerald-950/40 border border-emerald-900/30 px-2.5 py-1 rounded-lg text-emerald-400 font-black shadow-sm">
                  <span className="text-[9px] text-emerald-600 font-normal">المادة:</span>
                  <span className="text-[10px]">{getSelectedSubject()?.name || "بدون مادة"}</span>
                </div>

                {/* Lecture */}
                {lecture && (
                  <div className="inline-flex items-center gap-1 bg-indigo-950/40 border border-indigo-900/30 px-2.5 py-1 rounded-lg text-indigo-400 font-black shadow-sm">
                    <span className="text-[9px] text-indigo-500 font-normal">مذكرة:</span>
                    <span className="text-[10px]">{lecture.title}</span>
                  </div>
                )}
              </div>

              {/* Edit trigger button right on the bar */}
              <button
                onClick={startEditingBreadcrumb}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="تعديل مباشر لأسماء الكلية والمادة ومحاضرة اليوم"
              >
                <span>تعديل وحفظ البيانات ✏️</span>
              </button>
            </div>
          )}
          
          {/* Middle Section: Draw Workspace (Directly renders the Notebook Canvas at 100% full capacity) */}
          <div className="w-full space-y-6">
            
            {/* Collapsed Overlay Notification Bar (شريط القسم المطوي ممتداً فوق الدفتر) */}
            {activeOverlay && isAiAdvisorCollapsed && (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 p-2.5 text-right text-xs rounded-xl border border-indigo-505/30 flex items-center justify-between text-indigo-300 font-bold select-none py-3 px-4 shadow-lg animate-fade-in" dir="rtl">
                <div className="flex items-center gap-1.5 text-[9px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded leading-none shrink-0 border-dashed animate-pulse font-extrabold">
                  <span>مطوي بالخلفية 🟢</span>
                </div>
                <div className="flex-1 text-slate-200 truncate pr-3 text-right">
                  <span>القسم المفتوح حالياً بالتوازي: </span>
                  <span className="text-indigo-400 font-black">
                    {activeOverlay === 'materials' && 'مذكرات المادة والبحث 🔍'}
                    {activeOverlay === 'lecture-hub' && 'مركز وسائط المحاضرات والمستندات 🎙️'}
                    {activeOverlay === 'ai-advisor' && 'مستشار الذكاء الاصطناعي الأكاديمي 🤖'}
                    {activeOverlay === 'training' && 'التدريبات والتقييمات اليومية 🏆'}
                    {activeOverlay === 'handwriting-ai' && 'التحليل الذكي لخط اليد ✏️'}
                    {activeOverlay === 'stats' && 'لوحة تحليلات الطالب وإحصائياته 📊'}
                    {activeOverlay === 'settings' && 'إعدادات المنصة وسجل المطور 🛠️'}
                    {activeOverlay === 'cloud' && 'النسخ السحابي والـ Google Drive ☁️'}
                    {activeOverlay === 'security' && 'وضع الحماية ورمز الـ PIN 🔒'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAiAdvisorCollapsed(false)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-[10px] text-white rounded-lg font-black transition cursor-pointer flex items-center gap-1"
                  >
                    <span>توسيع الشاشة</span>
                    <span>↗</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveOverlay(null);
                      setIsAiAdvisorCollapsed(false);
                    }}
                    className="p-1 px-1.5 text-rose-450 hover:text-rose-450 text-xs font-black transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* General Overlay Portal container (شاشة تطفو فوق الدفتر بشكل كامل يحاكي سطح مكتب الكمبيوتر الاحترافي) */}
            {activeOverlay && !isAiAdvisorCollapsed && (
              <>
                {/* Backdrop Blur overlay to keep desktop focus */}
                <div 
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 transition-opacity" 
                  onClick={() => {
                    // Option to close on backdrop click if needed
                  }}
                />
                
                <div 
                  className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] flex flex-col z-50 transition-all duration-300 overflow-hidden ${
                    overlayIsFullscreen 
                      ? 'fixed inset-4 w-auto h-auto' 
                      : 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] md:w-[760px] max-h-[85vh]'
                  }`} 
                  style={!overlayIsFullscreen ? (
                    overlayHasBeenDragged ? {
                      width: `${overlaySize.width}px`,
                      height: `${overlaySize.height}px`,
                      top: `${overlayPos.y}px`,
                      left: `${overlayPos.x}px`,
                      transform: 'none' // Disable translate centering when dragged
                    } : {
                      width: 'min(780px, 92vw)',
                      height: 'min(580px, 85vh)'
                    }
                  ) : {}}
                  dir="rtl"
                >
                  {/* Floating OS-like Titlebar Header */}
                  <div 
                    onMouseDown={(e) => {
                      if (overlayIsFullscreen) return;
                      // Only drag when clicking the bar (not on buttons)
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) return;
                      
                      setIsDraggingOverlay(true);
                      setOverlayHasBeenDragged(true); // User started dragging, switch to absolute positioning
                      dragStartOffset.current = {
                        x: e.clientX - overlayPos.x,
                        y: e.clientY - overlayPos.y
                      };
                    }}
                    onDoubleClick={() => setOverlayIsFullscreen(!overlayIsFullscreen)}
                    className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between select-none cursor-move shrink-0"
                  >
                    {/* Web Expressive Navigation Controls with Lucide Icons (Left Side) */}
                    <div className="flex items-center gap-1.5" dir="ltr">
                      {/* Close button with X icon */}
                      <button
                        onClick={() => {
                          setActiveOverlay(null);
                          setIsAiAdvisorCollapsed(false);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition flex items-center justify-center cursor-pointer border border-slate-800 bg-slate-900"
                        title="إغلاق كلي للنافذة ✕"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Minimize button with ChevronDown icon */}
                      <button
                        onClick={() => setIsAiAdvisorCollapsed(true)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer border border-slate-800 bg-slate-900"
                        title="طي وتصغير للأسفل 🗕"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Maximize/Restore button with Maximize2/Minimize2 icon */}
                      <button
                        onClick={() => setOverlayIsFullscreen(!overlayIsFullscreen)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex items-center justify-center cursor-pointer border border-slate-800 bg-slate-900"
                        title={overlayIsFullscreen ? "استعادة الحجم الطبيعي 🗗" : "تكبير لملء الشاشة بالكامل 🗖"}
                      >
                        {overlayIsFullscreen ? (
                          <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                          <Maximize2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* App icon and title on the Right Side */}
                    <div className="flex items-center gap-2 text-right">
                      {/* Subtitle / Title description */}
                      <span className="font-extrabold text-[12px] text-slate-200">
                        {activeOverlay === 'materials' && 'مذكرات المادة والبحث السريع 🔍'}
                        {activeOverlay === 'lecture-hub' && 'مركز وسائط المحاضرات والمستندات 🎙️'}
                        {activeOverlay === 'ai-advisor' && 'مستشار الذكاء الاصطناعي الأكاديمي 🤖'}
                        {activeOverlay === 'training' && 'التدريبات والتقييم الذاتي اليومي 🏆'}
                        {activeOverlay === 'handwriting-ai' && 'التحليل الذكي لخط اليد ✏️'}
                        {activeOverlay === 'stats' && 'لوحة تقييم الأداء والإحصائيات 📊'}
                        {activeOverlay === 'settings' && 'إعدادات المنصة وهندسة المواد 🛠️'}
                        {activeOverlay === 'cloud' && 'مزامنة السحاب والـ Google Drive ☁️'}
                        {activeOverlay === 'security' && 'تأمين الملفات وقفل الرمز السري 🔒'}
                        {activeOverlay === 'changelog' && 'سجل إصدارات التعديل والمسار الزمني 📖'}
                      </span>
                      
                      <div className="p-1 px-2.5 bg-indigo-650/15 border border-indigo-900/40 text-indigo-400 rounded-lg text-[9px] font-extrabold select-none">
                        <span>اللوحة العائمة</span>
                      </div>
                    </div>
                  </div>

                  {/* Window Inner Content Block - Scrollable with custom scrollbars */}
                  <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-slate-900 text-right space-y-4">
                    {/* Compact Hint Strip */}
                    <div className="bg-slate-950/40 px-3.5 py-2 border-r-4 border-indigo-650 rounded-lg text-[10px] text-slate-400 font-medium leading-normal mb-2" dir="rtl">
                      {activeOverlay === 'materials' && 'تعليمات: تصفح مذكرات المقررات التي أسستها بالمنصة، وابحث بسرعة لتصفية المحاضرات وتعديل الدفتر.'}
                      {activeOverlay === 'lecture-hub' && 'تعليمات: سجل صوت الأستاذ فوري ومزامن بالوقت، أو ارفع ملف PDF ليقوم Gemini بتشغيل خلاصة كورنيل.'}
                      {activeOverlay === 'ai-advisor' && 'تعليمات: اكتب مادتك أو اختر أحد محاور المراجعة التفاعلية، ودع Gemini يقوم بتوليد بطاقات المراجعة والتلخيص.'}
                      {activeOverlay === 'training' && 'تعليمات: اختبر مهارات استيعابك بأسئلة الذكاء الاصطناعي اليومية واكسب نقاط XP لزيادة مستواك.'}
                      {activeOverlay === 'handwriting-ai' && 'تعليمات: يحلل الذكاء الاصطناعي خط اليد ويفحص الرسم الهندسي والمعادلات الرياضية بالصفحة النشطة مباشرة.'}
                      {activeOverlay === 'stats' && 'تعليمات: تفقد إحصائيات تقويم درجات الفهم للألعاب، أيام الاستذكار المتتالية وسجل الشارات.'}
                      {activeOverlay === 'settings' && 'تعليمات: تحكم بـ الـ API key الفردي، والبيانات الأكاديمية والمؤسسية للمادة والكلية. تجد بالأسفل سجل تحديثات وتعديلات الإصدار.'}
                      {activeOverlay === 'cloud' && 'تعليمات: تضمن المزامنة السحابية حفظ إصدارات الدفتر وعدم فقدان الملاحظات عبر الأجهزة المختلفة.'}
                      {activeOverlay === 'security' && 'تعليمات: قم بتفعيل الرمز السري المكون من 4 أرقام لضمان حماية مذكرات الكلية من المتطفلين.'}
                      {activeOverlay === 'changelog' && 'تعليمات: تصفح المسار الزمني للتعديلات والنسخ المؤرخة المسترجعة بكبسة زر.'}
                    </div>
                  {/* 1. Materials Search & Selection Area */}
                  {activeOverlay === 'materials' && (
                    <div className="space-y-4" dir="rtl">
                      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            placeholder="ابحث عن محاضرة أو موضوع في الدفتر..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none text-right placeholder-slate-600 font-sansArabic"
                          />
                          
                          <select
                            value={difficultyFilter}
                            onChange={(e) => setDifficultyFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl p-2.5 outline-none text-right"
                          >
                            <option value="all">كل الصعوبات</option>
                            <option value="easy">سهلة</option>
                            <option value="medium">متوسطة</option>
                            <option value="hard">صعبة</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={bookmarkOnly}
                              onChange={(e) => setBookmarkOnly(e.target.checked)}
                              className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                            />
                            <span>أظهر المثبتة بالـمفضلة فقط ⭐</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 max-h-[380px] overflow-y-auto pr-1">
                        {getFilteredLectures().map(lec => {
                          const isSel = selectedLectureId === lec.id;
                          return (
                            <div 
                              key={lec.id}
                              onClick={() => {
                                setSelectedLectureId(lec.id);
                                setActivePageNumber(1);
                              }}
                              className={`p-4 rounded-xl border text-right cursor-pointer transition flex flex-col gap-3 group relative ${
                                isSel 
                                  ? 'bg-indigo-600/10 border-indigo-500 text-indigo-200' 
                                  : 'bg-slate-950 border-slate-850 hover:bg-slate-850/40 hover:border-slate-800 text-slate-300'
                              }`}
                            >
                              {/* Lecture Header Line */}
                              <div className="flex items-center justify-between w-full pointer-events-none">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold ${
                                    lec.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-900/30' :
                                    lec.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-900/30' :
                                    'bg-rose-500/10 text-rose-400 border border-rose-900/30'
                                  }`}>
                                    {lec.difficulty === 'easy' ? 'سهل' : lec.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">{lec.pages.length} ص</span>
                                </div>
                                <div className="text-right">
                                  <h5 className="font-extrabold text-xs text-slate-100 group-hover:text-white truncate">{lec.title}</h5>
                                  <span className="text-[8.5px] text-slate-500 block mt-0.5">{new Date(lec.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                              </div>

                              {/* Documents and Memos nested shelf - ONLY shown for active selected lecture or generally */}
                              {lec.documents && lec.documents.length > 0 ? (
                                <div className="mt-1 pt-3 border-t border-slate-850/60 space-y-2 text-right pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                  <span className="text-[10px] text-indigo-400 font-black flex items-center gap-1">
                                    <span>📎 مذكرات ومستندات المادة المتاحة ({lec.documents.length}):</span>
                                  </span>

                                  <div className="grid grid-cols-1 gap-2">
                                    {lec.documents.map((doc) => {
                                      const isPdf = doc.type === 'application/pdf' || doc.name.endsWith('.pdf');
                                      const isImg = doc.type.startsWith('image/');
                                      const analysesList = docAnalyses[doc.id] || [];
                                      
                                      return (
                                        <div key={doc.id} className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-right space-y-2">
                                          <div className="flex items-start justify-between gap-2">
                                            {/* File badge icon */}
                                            <span className="text-sm select-none">
                                              {isPdf ? '📄' : isImg ? '🖼️' : '📎'}
                                            </span>
                                            
                                            <div className="flex-1 text-right min-w-0">
                                              <p className="text-[11px] font-black text-slate-200 truncate" title={doc.name}>
                                                {doc.name}
                                              </p>
                                              <span className="text-[9px] text-slate-400 block">{doc.sizeKb} KB · مبرمجة محلياً</span>
                                            </div>
                                          </div>

                                          {/* Action Buttons list (قراءة، فتح وتعديل، تحليل) */}
                                          <div className="flex flex-wrap items-center gap-1.5 justify-end pt-1 bg-slate-950/20">
                                            <button
                                              onClick={() => setActiveViewingDoc(doc)}
                                              className="px-2 py-1 bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-slate-100 text-[9.5px] font-bold rounded-md transition cursor-pointer"
                                              title="فتح ومعاينة المستند"
                                            >
                                              👁️ عرض/قراءة
                                            </button>

                                            {isPdf && (
                                              <button
                                                onClick={() => handleRenderPdfToNotebook(doc)}
                                                className="px-2 py-1 bg-sky-950/40 border border-sky-900/55 hover:bg-sky-900 text-sky-350 hover:text-sky-100 text-[9.5px] font-extrabold rounded-md transition cursor-pointer"
                                                title="أخذ صفحات المستند وتضمينها بالكامل داخل صفحات الدفتر للكتابة والملاحظة"
                                              >
                                                📖 فتح وتعديل بالدفتر
                                              </button>
                                            )}

                                            {isImg && (
                                              <button
                                                onClick={() => handleRenderImageToNotebook(doc)}
                                                className="px-2 py-1 bg-sky-950/40 border border-sky-900/55 hover:bg-sky-900 text-sky-350 hover:text-sky-100 text-[9.5px] font-extrabold rounded-md transition cursor-pointer"
                                                title="أخذ صفحات الصورة وتضمينها بالكامل كصفحة دفتر قابلة للتعديل والمسح"
                                              >
                                                📖 فتح وتعديل بالدفتر
                                              </button>
                                            )}

                                            <button
                                              onClick={() => setAnalyzingDocItem(doc)}
                                              className="px-2 py-1 bg-indigo-950/50 border border-indigo-900 text-indigo-350 hover:text-indigo-100 text-[9.5px] font-black rounded-md transition cursor-pointer"
                                              title="تحليل المستند واستخلاص الأسئلة والملخصات والخرائط"
                                            >
                                              🧠 تحليل ومخرجات الـ AI
                                            </button>
                                          </div>

                                          {/* Smart display historical analyses - "عشان لا تزدحم القائمة الرئيسية" */}
                                          {analysesList.length > 0 && (
                                            <div className="mt-2 p-2 bg-slate-950/85 border border-slate-850/70 rounded-md text-right space-y-2">
                                              <div className="flex items-center justify-between pb-1 border-b border-slate-850/45 text-[8.5px]">
                                                <span className="text-slate-500">{new Date(analysesList[0].timestamp).toLocaleDateString('ar-EG')}</span>
                                                <span className="text-indigo-400 font-extrabold">🧠 تقارير التحليل المتاحة:</span>
                                              </div>
                                              
                                              {analysesList.map((an) => (
                                                <div key={an.id} className="p-1.5 bg-slate-900/60 rounded border border-slate-800 space-y-1 text-right">
                                                  <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                                                    <span className="text-slate-500">المدى: {an.pageRange}</span>
                                                    <span className="text-indigo-350">{an.title}</span>
                                                  </div>
                                                  <p className="text-[9.5px] text-slate-350 leading-relaxed max-h-24 overflow-y-auto select-all whitespace-pre-wrap font-sans">
                                                    {an.content}
                                                  </p>
                                                  <div className="text-left pt-1">
                                                    <button
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(an.content);
                                                        alert("📋 تم نسخ تقرير التحليل بنجاح!");
                                                      }}
                                                      className="text-[8px] font-bold text-indigo-450 hover:text-indigo-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-850"
                                                    >
                                                      نسخ النتيجة 📋
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-550 mt-1 pr-1 italic pointer-events-none text-right">
                                  لا توجد مذكرات أو ملفاتpdf حالياً بهذه المادة.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Lecture Media Hub Controls */}
                  {activeOverlay === 'lecture-hub' && (
                    <div className="space-y-6">
                      <p className="text-xs text-slate-400 leading-relaxed text-right">
                        قم بإدارة معمل الصوتيات المدمج، والتحليل الضوئي لصور السبورة، وبناء وتدقيق خلاصة كورنيل غنية ومحسّنة للمحاضرة عبر الذكاء الاصطناعي.
                      </p>
                      
                      <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-3 text-right">
                        <h4 className="text-xs font-bold text-slate-300">طرق ومصادر الإدخال الذكية:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              if (isVoiceRecording) {
                                handleStopVoiceRecording();
                              } else {
                                handleStartVoiceRecording();
                              }
                            }}
                            className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-2 transition ${
                              isVoiceRecording 
                                ? 'bg-rose-600/20 border-rose-600 text-rose-300 animate-pulse'
                                : 'bg-slate-905 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <Mic className={`w-5 h-5 ${isVoiceRecording ? 'text-rose-400 animate-pulse' : 'text-rose-400'}`} />
                            <span>{isVoiceRecording ? `⏹ إيقاف (${recordingSeconds} ث)` : 'تسجيل ميكروفون المدرس 🎙️'}</span>
                          </button>

                          <button
                            onClick={() => {
                              handleWhiteboardScanOCR();
                              alert("📷 تم التقاط السبورة الأكاديمية! جاري مسح وقراءة تدوينات خط اليد وإدراجها بكورنيل.");
                            }}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center font-bold text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 flex flex-col items-center justify-center gap-2 transition"
                          >
                            <Camera className="w-5 h-5 text-purple-400" />
                            <span>مسح سبورة الصف كاميرا OCR 📷</span>
                          </button>

                          <button
                            onClick={() => {
                              openCustomPrompt(
                                "تحميل مستند PDF",
                                "أدخل رابط ملف الـ PDF المدرسي لتحميله واستخراج كورنيل فوراً:",
                                "https://example.com/math-cornell-summary.pdf",
                                "رابط ملف PDF",
                                (p) => {
                                  if (p.trim()) {
                                    setIsParsingDocument(true);
                                    setTimeout(() => {
                                      setIsParsingDocument(false);
                                      alert("🧠 تم استقصاء المستند بنجاح وتحويله لبطاقات تفاعلية!");
                                    }, 3000);
                                  }
                                }
                              );
                            }}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center font-bold text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 flex flex-col items-center justify-center gap-2 transition"
                          >
                            <FileText className="w-5 h-5 text-emerald-400" />
                            <span>تحميل مستند PDF من الكلية 📂</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Documents and Recordings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-200 text-right">
                                المكتبة: {currentFolderId ? (lecture?.folders.find(f => f.id === currentFolderId)?.name || 'مجلد') : 'الرئيسية'}
                            </h4>
                            {currentFolderId && <button onClick={() => setCurrentFolderId(null)} className="text-xs text-indigo-400">عودة للرئيسية 🔙</button>}
                            <button onClick={() => {
                                const name = prompt("أدخل اسم المجلد الجديد:");
                                if (name && lecture) {
                                    const newFolder: FolderType = { id: Date.now().toString(), name, parentId: currentFolderId || undefined };
                                    updateLectureData(lecture.id, { folders: [...(lecture.folders || []), newFolder] });
                                }
                            }} className="text-xs text-emerald-400 font-bold">+ مجلد</button>
                        </div>
                        {lecture && (
                          <div className="space-y-3">
                            {/* Folder List */}
                            {(lecture.folders || []).filter(f => f.parentId === currentFolderId).length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {(lecture.folders || []).filter(f => f.parentId === currentFolderId).map(folder => (
                                        <button key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="p-2 bg-indigo-950/40 border border-indigo-900/40 rounded-lg flex items-center gap-2 text-indigo-200 font-bold text-[11px]">
                                            <span>📁</span> {folder.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Recordings */}
                            {( (lecture.recordings || []).filter(r => (r.folderId || null) === currentFolderId).length > 0 ) && (
                              <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl">
                                <h5 className="text-xs font-bold text-indigo-300 mb-3 text-right flex items-center justify-end gap-2">
                                  <span>التسجيلات والفيديو 🎙️</span>
                                  <span>({(lecture.recordings || []).filter(r => (r.folderId || null) === currentFolderId).length})</span>
                                </h5>
                                <div className="space-y-2.5">
                                  {(lecture.recordings || []).filter(r => (r.folderId || null) === currentFolderId).map(rec => {
                                    const isVid = rec.type === 'video';
                                    const mediaUrl = (rec as any).videoUrl || (rec as any).audioBlobUrl || undefined;
                                    const isPlaying = playingVideoId === rec.id;
                                    const dmins = String(Math.floor((rec.durationSeconds || 0) / 60)).padStart(2,'0');
                                    const dsecs = String((rec.durationSeconds || 0) % 60).padStart(2,'0');
                                    return (
                                      <div key={rec.id} className={`rounded-xl border overflow-hidden ${isVid ? 'bg-indigo-950/20 border-indigo-800/30' : 'bg-slate-900/60 border-slate-800/50'}`}>
                                        {/* Header */}
                                        <div className="flex items-center justify-between gap-2 px-3 py-2">
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${isVid ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' : 'bg-amber-500/15 text-amber-400 border-amber-500/25'}`}>
                                              {isVid ? '🎥 فيديو' : '🎙️ صوت'}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded-full">{dmins}:{dsecs}</span>
                                          </div>
                                          <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[110px] text-right">{rec.title}</span>
                                        </div>
                                        {/* Media player */}
                                        {isPlaying && mediaUrl && (
                                          <div className="px-3 pb-2">
                                            {isVid ? (
                                              <video controls src={mediaUrl} className="w-full rounded-lg border border-indigo-900/30 max-h-36 bg-black" preload="metadata" />
                                            ) : (
                                              <audio controls src={mediaUrl} className="w-full h-8 rounded-lg" preload="metadata" />
                                            )}
                                          </div>
                                        )}
                                        {/* Action strip */}
                                        <div className="flex items-center gap-1 px-3 pb-2.5 flex-wrap">
                                          <button
                                            onClick={() => setPlayingVideoId(isPlaying ? null : rec.id)}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${isPlaying ? 'bg-indigo-700 text-white' : 'bg-slate-800 hover:bg-indigo-800 text-slate-300 hover:text-white border border-slate-700'}`}
                                          >
                                            {isPlaying ? '⏹ إيقاف' : '▶ تشغيل'}
                                          </button>
                                          <button
                                            onClick={() => handleTranscribeRecording(rec.id)}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-emerald-800 text-slate-300 hover:text-white border border-slate-700 transition-all"
                                          >
                                            ✦ تحويل نص
                                          </button>
                                          <FolderSelector itemId={rec.id} type="recording" />
                                          <button
                                            onClick={() => handleDeleteRecording(rec.id)}
                                            className="mr-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-950 hover:bg-rose-900/50 text-rose-500 hover:text-rose-300 border border-rose-900/20 hover:border-rose-700 transition-all"
                                          >
                                            🗑 حذف
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {/* Images */}
                            {( (lecture.documents || []).filter(d => d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).length > 0 ) && (
                              <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl">
                                <h5 className="text-xs font-bold text-emerald-300 mb-3 text-right flex items-center justify-end gap-2">
                                  <span>الصور 🖼️</span>
                                  <span>({lecture.documents!.filter(d => d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).length})</span>
                                </h5>
                                <div className="space-y-2">
                                  {lecture.documents!.filter(d => d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                                      <span className="text-[11px] text-slate-200 truncate max-w-[120px] text-right font-medium">{doc.name}</span>
                                      <div className="flex gap-1 shrink-0">
                                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors" title="حذف">🗑️</button>
                                        <button onClick={() => handleViewMedia(doc)} className="p-1.5 rounded-md text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors" title="عرض">👁️</button>
                                        <button onClick={() => handleReAnalyzeDocument(doc)} className="p-1.5 rounded-md text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 transition-colors" title="إعادة تحليل">🔄</button>
                                        <FolderSelector itemId={doc.id} type="document" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Files */}
                            {( (lecture.documents || []).filter(d => !d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).length > 0 ) && (
                              <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl">
                                <h5 className="text-xs font-bold text-amber-300 mb-3 text-right flex items-center justify-end gap-2">
                                  <span>الملفات والمستندات 📄</span>
                                  <span>({lecture.documents!.filter(d => !d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).length})</span>
                                </h5>
                                <div className="space-y-2">
                                  {lecture.documents!.filter(d => !d.type.startsWith('image/') && (d.folderId || null) === currentFolderId).map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800/50">
                                      <span className="text-[11px] text-slate-200 truncate max-w-[120px] text-right font-medium">{doc.name}</span>
                                      <div className="flex gap-1 shrink-0">
                                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors" title="حذف">🗑️</button>
                                        <button onClick={() => handleViewMedia(doc)} className="p-1.5 rounded-md text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors" title="عرض">👁️</button>
                                        <button onClick={() => handleReAnalyzeDocument(doc)} className="p-1.5 rounded-md text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 transition-colors" title="إعادة تحليل">🔄</button>
                                        <FolderSelector itemId={doc.id} type="document" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. AI Advisor */}
                  {activeOverlay === 'ai-advisor' && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {lecture ? (
                        <AICommandPanel
                          lecture={lecture}
                          onUpdateLecture={(updates) => updateLectureData(lecture.id, updates)}
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-500 font-sansArabic text-xs">
                          يرجى اختيار مادة ومحاضرة دراسية نشطة أولاً من القائمة الجانبية لتوجيه مستشار الذكاء الاصطناعي الأكاديمي.
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Daily Training Drill */}
                  {activeOverlay === 'training' && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <DailyTraining
                        lectures={appState.lectures}
                        stats={appState.stats}
                        onUpdateStats={(updates) => {
                          const nextStats = { ...appState.stats, ...updates };
                          const nextState = { ...appState, stats: nextStats };
                          setAppState(nextState);
                          saveAppState(nextState);
                        }}
                      />
                    </div>
                  )}

                  {/* 5. Handwriting AI Annotation */}
                  {activeOverlay === 'handwriting-ai' && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <HandwritingAI
                        lectures={appState.lectures}
                        selectedLectureId={selectedLectureId}
                        activePageNumber={activePageNumber}
                        stats={appState.stats}
                        onUpdateStats={(updates) => {
                          const nextStats = { ...appState.stats, ...updates };
                          const nextState = { ...appState, stats: nextStats };
                          setAppState(nextState);
                          saveAppState(nextState);
                        }}
                      />
                    </div>
                  )}

                  {/* 6. Scholar Statistics Dashboard */}
                  {activeOverlay === 'stats' && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <StatsDashboard
                        stats={appState.stats}
                        onClaimBadge={(badgeId) => {
                          alert(`🏆 تم تسليم شارة الطالب المتفوق [${badgeId}] بنجاح، مبروك كسبك لـ 200 نقطة مراجعة متكاملة!`);
                          const nextStats = { 
                            ...appState.stats, 
                            xpPoints: appState.stats.xpPoints + 200,
                            claimedBadges: [...(appState.stats.claimedBadges || []), badgeId]
                          };
                          const nextState = { ...appState, stats: nextStats };
                          setAppState(nextState);
                          saveAppState(nextState);
                        }}
                      />
                    </div>
                  )}

                  {/* 7. Platform Settings */}
                  {activeOverlay === 'settings' && (
                    <div className="space-y-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-4">
                        <h4 className="text-xs font-black text-indigo-400">مفاتيح الأمان والتنسيق الأكاديمي:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button 
                            onClick={() => setShowAiKeyModal(true)}
                            className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-slate-350 hover:text-white transition cursor-pointer"
                          >
                             ⚙️ مفاتيح الـ API الذكي (Gemini)
                          </button>
                          <button 
                            onClick={() => setIsEditingAcademic(true)}
                            className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-slate-355 hover:text-white transition cursor-pointer"
                          >
                            🎓 تسمية الكلية والجامعة
                          </button>
                          <button 
                            onClick={() => {
                              setActiveOverlay('changelog');
                            }}
                            className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-lg text-[10px] font-bold text-slate-305 hover:text-white transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            📖 سجل التعديلات والمسار الزمني
                          </button>
                        </div>
                      </div>

                      {/* Version logs */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-3">
                        <span className="text-[9px] text-indigo-400 font-bold block">سجل إصدارات التحديث (سجل النضوج):</span>
                        <h4 className="font-extrabold text-xs text-slate-100">سجل إصدارات تكييف وتعديل المنصة للعام الأكاديمي الحالي</h4>
                        <div className="space-y-2 border-r border-indigo-900/60 pr-3.5 mr-1 font-sansArabic">
                          <div className="text-xs leading-relaxed text-slate-400">
                            <strong className="text-indigo-400 text-[10px] bg-indigo-950 px-2.5 py-0.5 rounded mr-1.5 font-bold font-mono">v3.5</strong>
                            <span>تم دمج شاشات التحليلات والتحكم في إطار منسق وتناظري فوق لوح الكتابة مباشرة، ومعالجة رموز الصفحة بدون نصوص.</span>
                          </div>
                          <div className="text-xs leading-relaxed text-slate-400 select-none">
                            <strong className="text-emerald-400 text-[10px] bg-emerald-950 px-2.5 py-0.5 rounded mr-1.5 font-bold font-mono">v3.2</strong>
                            <span>تحويل وضع الهاتف إلى وضع متكامل تماما لمعاينة وحفظ بطاقات تقويم الأداء الفوري.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 8. Cloud Backup */}
                  {activeOverlay === 'cloud' && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <BackupDriveManager
                        backupConfig={appState.backup || { isAutoBackupEnabled: true, schedule: "weekly", backupsList: [] }}
                        onUpdateBackupConfig={(updates) => {
                          const nextConf = { ...(appState.backup || { isAutoBackupEnabled: true, schedule: "weekly", backupsList: [] }), ...updates };
                          const nextState = { ...appState, backup: nextConf };
                          setAppState(nextState as any);
                          saveAppState(nextState as any);
                        }}
                        onTriggerBackup={() => {
                          alert("☁️ تم استدعاء مزود التخزين الخارجي! تم حفظ الدفتر بنجاح.");
                        }}
                        onTriggerRestore={(bId) => {
                          alert(`🔄 استعادة شاملة ناجحة للمدونة الدراسية رقم: ${bId}`);
                        }}
                      />
                    </div>
                  )}

                  {/* 9. Security barrier info */}
                  {activeOverlay === 'security' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-3">
                      <h4 className="text-xs font-black text-rose-400">🛡️ تأمين الخصوصية والرمز السري (PIN Barrier):</h4>
                      <p className="text-xs text-slate-400 leading-normal">
                        يحد الرمز السري من العابثين بملفات تدويناتك الجامعية وحسابات درجاتك بالاستذكار.
                      </p>
                      <button 
                        onClick={() => {
                          openCustomPrompt(
                            "تعديل القفل السري",
                            "أدخل رمز PIN من 4 أرقام لتعديل القفل السري للدفتر:",
                            "1234",
                            "رمز القفل السري",
                            (p) => {
                              if (p.trim() && p.trim().length === 4) {
                                alert("🔒 تم إيجاد واستبدال القفل الخصوصي بنجاح!");
                              } else {
                                alert("⚠️ خطأ: يجب كتابة 4 أرقام عددية ليكون الرمز السري مقبولاً.");
                              }
                            }
                          );
                        }}
                        className="px-3.5 py-1.5 bg-rose-650 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition"
                      >
                        تحديث الرمز السري للدفتر
                      </button>
                    </div>
                  )}

                  {/* 10. Notebook Changelog & History Tracker Overlay */}
                  {activeOverlay === 'changelog' && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[10px] text-slate-500 font-mono">حفظ دائم لمخططات ومربعات صفحات الدفتر</span>
                        <h4 className="font-extrabold text-xs text-indigo-400 flex items-center justify-end gap-1.5">
                          <History className="w-4 h-4 text-indigo-400" />
                          <span>سجل إصدارات التعديل والمسار الزمني للمراجعات (Changelog)</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed pr-1">
                        يمكنك استعادة النسخ والملاحظات السابقة لصفحات هذه المحاضرة تلقائياً بكبسة زر. ينشئ الدفتر لقطة حية وموثقة عند معالجة التدوين.
                      </p>

                      <div className="space-y-2 max-h-[350px] overflow-y-auto">
                        {lecture && lecture.changelog && lecture.changelog.length > 0 ? (
                          [...lecture.changelog].reverse().map((entry, idx) => (
                            <div key={`${entry.id || 'chg'}-${idx}`} className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between gap-3 text-right hover:bg-slate-900 transition text-xs">
                              <div className="flex items-center gap-2 text-left">
                                {entry.snapshotData && (
                                  <button
                                    onClick={() => handleRevertToVersion(entry)}
                                    className="px-2.5 py-1 bg-indigo-950 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-800 rounded font-black text-[9px] transition cursor-pointer"
                                  >
                                    العودة لهذه النسخة 🔄
                                  </button>
                                )}
                                <span className="text-[8px] bg-slate-950/80 text-indigo-400 font-mono px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                                  v{entry.version}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-bold text-slate-200">{entry.description}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5 font-sansArabic">
                                  من قبل: <span className="text-slate-400">{entry.author}</span> | التاريخ: <span className="font-mono text-indigo-300">{new Date(entry.timestamp).toLocaleString('ar-EG')}</span>
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-600 text-xs">
                            لا تتوفر إصدارات مؤرشفة بعد لهذه المحاضرة النشطة. افتح متصفح المواد واختر المحاضرة المطلوبة.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}

            {/* Active Notebook and media manager */}
            {lecture ? (
                  <div className="space-y-6">
                    


                    {/* Smart Classroom Multimedia Hub (مركز الوسائط الصفي والذكاء الاصطناعي) */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3">
                        {/* Audio/Video Active Wave and Pulse labels */}
                        {isVoiceRecording ? (
                          <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-full text-red-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-mono font-bold">{recordingSeconds} ثانية تسجيل</span>
                          </div>
                        ) : isVideoRecording ? (
                          <div className="flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/40 px-3 py-1 rounded-full text-indigo-400">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-505 animate-ping" />
                            <span className="text-xs font-mono font-bold text-indigo-300">{videoSeconds} ثانية فيديو</span>
                          </div>
                        ) : (
                          <span className="text-[10px] bg-slate-900 text-slate-400 font-bold px-2 py-0.5 rounded-full">جاهز للوسائط</span>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">
                            <span>مركز وسائط المحاضرات والـمستندات الذكية</span>
                            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          </span>

                          {/* Mini-square collapse/expand arrowhead button */}
                          <button
                            onClick={() => setIsMediaHubCollapsed(!isMediaHubCollapsed)}
                            className="w-6 h-6 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-indigo-400 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200"
                            title={isMediaHubCollapsed ? "فتح وبسط مركز وسائط المحاضرات 🎙️" : "طي وإخفاء مركز وسائط المحاضرات 📘"}
                          >
                            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isMediaHubCollapsed ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {!isMediaHubCollapsed && (
                        <>
                          {/* ── Recording type selector ─────────────────── */}
                          <div className="space-y-3">

                            {/* Row 1: Audio card + Video card */}
                            <div className="grid grid-cols-2 gap-3">

                              {/* Audio-only recording card */}
                              <div className={`rounded-xl border p-3 space-y-2 text-right transition ${isVoiceRecording ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800 bg-slate-900'}`}>
                                <div className="flex items-center justify-between">
                                  <Mic className={`w-4 h-4 ${isVoiceRecording ? 'text-amber-400 animate-pulse' : 'text-amber-500'}`} />
                                  <span className="text-[10px] font-extrabold text-amber-400">تسجيل صوتي</span>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-snug">صوت فقط · جودة عالية للنص</p>
                                {isVoiceRecording ? (
                                  <button
                                    onClick={handleStopVoiceRecording}
                                    className="w-full flex items-center justify-center gap-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black animate-pulse cursor-pointer transition"
                                  >
                                    <Square className="w-3 h-3 fill-white" />
                                    <span>إيقاف ({recordingSeconds} ث)</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleStartVoiceRecording}
                                    disabled={isVideoRecording}
                                    className={`w-full flex items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${isVideoRecording ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-600' : 'bg-amber-900/40 hover:bg-amber-800/50 text-amber-300 border border-amber-800/40'}`}
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>ابدأ التسجيل 🎙️</span>
                                  </button>
                                )}
                              </div>

                              {/* Video recording card */}
                              <div className={`rounded-xl border p-3 space-y-2 text-right transition ${isVideoRecording ? 'border-indigo-500/60 bg-indigo-950/20' : 'border-slate-800 bg-slate-900'}`}>
                                <div className="flex items-center justify-between">
                                  <Video className={`w-4 h-4 ${isVideoRecording ? 'text-indigo-400 animate-pulse' : 'text-indigo-500'}`} />
                                  <span className="text-[10px] font-extrabold text-indigo-400">تسجيل فيديو</span>
                                </div>
                                <p className="text-[9px] text-slate-500 leading-snug">فيديو + صوت · كاميرا الجهاز</p>
                                {isVideoRecording ? (
                                  <button
                                    onClick={handleStopVideoRecording}
                                    className="w-full flex items-center justify-center gap-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black animate-pulse cursor-pointer transition"
                                  >
                                    <Square className="w-3 h-3 fill-white" />
                                    <span>إيقاف ({videoSeconds} ث)</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleStartVideoRecording}
                                    disabled={isVoiceRecording}
                                    className={`w-full flex items-center justify-center gap-1 p-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${isVoiceRecording ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-600' : 'bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-300 border border-indigo-800/40'}`}
                                  >
                                    <Video className="w-3 h-3" />
                                    <span>ابدأ التسجيل 📹</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Row 2: OCR + Document upload */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={handleWhiteboardScanOCR}
                                disabled={scanningImageOCR}
                                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 hover:bg-purple-950/40 border border-slate-800 text-purple-300 rounded-xl text-[11px] font-bold transition duration-150 cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5 text-purple-400" />
                                <span>{scanningImageOCR ? "جاري المسح..." : "مسح سبورة (OCR)"}</span>
                              </button>
                              <label className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 hover:bg-teal-950/40 border border-slate-800 text-teal-300 rounded-xl text-[11px] font-bold cursor-pointer transition duration-150">
                                <FileText className="w-3.5 h-3.5 text-teal-400" />
                                <span>{isParsingDocument ? "جاري التحليل..." : "استيراد ملف/مستند"}</span>
                                <input type="file" accept=".pdf, .pptx, .xlsx, .docx, .txt, .png, .jpg, .jpeg, .mp4, .mov, .avi, .webm, .wav, .mp3, .m4a" onChange={handleParseDocumentUpload} className="hidden" disabled={isParsingDocument} />
                              </label>
                            </div>

                            {/* 📎 Lecture Files & Attachments Shelf */}
                            <div className="space-y-2 pt-3 border-t border-slate-900 mt-3 font-sansArabic text-right">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold block">
                                  المرفقات ومستندات المحاضرة ({lecture.documents?.length || 0}):
                                </span>
                              </div>
                              
                              {lecture.documents && lecture.documents.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                  {lecture.documents.map((doc) => {
                                    const isPdf = doc.type === 'application/pdf' || doc.name.endsWith('.pdf');
                                    const isImg = doc.type.startsWith('image/');
                                    const isVid = doc.type.startsWith('video/');
                                    const isAud = doc.type.startsWith('audio/') || doc.name.endsWith('.mp3') || doc.name.endsWith('.wav') || doc.name.endsWith('.m4a');
                                    
                                    return (
                                      <div key={doc.id} className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] hover:border-slate-700/60 transition group text-right">
                                        <div className="flex items-start justify-between gap-1.5">
                                          {/* File icon / badge */}
                                          <span className="text-lg leading-none select-none">
                                            {isPdf ? '📄' : isImg ? '🖼️' : isVid ? '🎥' : isAud ? '🎙️' : '📎'}
                                          </span>

                                          <div className="text-right flex-1 min-w-0">
                                            <h6 className="font-extrabold text-slate-205 truncate text-slate-200" title={doc.name}>
                                              {doc.name}
                                            </h6>
                                            <div className="flex items-center gap-2 mt-0.5 text-[9px] justify-end text-slate-500 font-sans">
                                              <span>{new Date(doc.timestamp).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                                              <span>•</span>
                                              <span>{doc.sizeKb} KB</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Transcription excerpt if exists */}
                                        {doc.transcription && (
                                          <p className="mt-1.5 p-1 px-1.5 bg-slate-950/70 border border-slate-800 text-slate-400 rounded-lg text-[9px] leading-relaxed max-h-12 overflow-y-auto text-right whitespace-pre-wrap select-all">
                                            🔍 {doc.transcription.slice(0, 150)}{doc.transcription.length > 150 ? '...' : ''}
                                          </p>
                                        )}

                                        {/* Action buttons bar */}
                                        <div className="flex items-center gap-1.5 justify-end mt-2 pt-2 border-t border-slate-800/60">
                                          {/* 👁️ Preview / View */}
                                          <button
                                            onClick={() => setActiveViewingDoc(doc)}
                                            className="px-2 py-0.5 bg-indigo-950/60 border border-indigo-900/40 hover:bg-indigo-900 text-indigo-300 hover:text-indigo-100 text-[10px] font-bold rounded-lg transition cursor-pointer"
                                            title="فتح وعرض محتوى الملف في نافذة معاينة ذكية"
                                          >
                                            👁️ {isVid || isAud ? 'تفغيل/تشغيل' : 'عرض/فتح'}
                                          </button>

                                          {isPdf && (
                                            <button
                                              onClick={() => handleRenderPdfToNotebook(doc)}
                                              disabled={isParsingDocument}
                                              className="px-2 py-0.5 bg-sky-950/70 border border-sky-900/40 hover:bg-sky-900 text-sky-300 hover:text-sky-100 text-[10px] font-extrabold rounded-lg transition cursor-pointer"
                                              title="تجزئة ملف الـ PDF كصفحات دراسية تفاعلية تفتح وتعدل داخل كشكول الدفتر"
                                            >
                                              📖 فتح وتعديل بالدفتر
                                            </button>
                                          )}

                                          {isImg && (
                                            <button
                                              onClick={() => handleRenderImageToNotebook(doc)}
                                              disabled={isParsingDocument}
                                              className="px-2 py-0.5 bg-sky-950/70 border border-sky-900/40 hover:bg-sky-900 text-sky-300 hover:text-sky-100 text-[10px] font-extrabold rounded-lg transition cursor-pointer"
                                              title="فتح الصورة كصفحة دراسية تفاعلية داخل كشكول الدفتر للكتابة والرسم"
                                            >
                                              📖 فتح وتعديل بالدفتر
                                            </button>
                                          )}

                                          {/* ⚙️ Re-analyze / Transcribe / OCR */}
                                          {isPdf && (
                                            <button
                                              onClick={() => handleReanalyseDocument(doc.id)}
                                              disabled={isParsingDocument}
                                              className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-900/40 hover:bg-emerald-900 text-emerald-300 hover:text-emerald-100 text-[10px] font-bold rounded-lg transition cursor-pointer disabled:opacity-40"
                                              title="إعادة فحص المستند بالذكاء الاصطناعي وتطبيق صيغة تلخيص كورنيل"
                                            >
                                              🔄 إعادة تحليل
                                            </button>
                                          )}

                                          {isImg && (
                                            <button
                                              onClick={() => handleOcrImageAttachment(doc.id)}
                                              disabled={isParsingDocument}
                                              className="px-2 py-0.5 bg-purple-950/60 border border-purple-900/40 hover:bg-purple-900 text-purple-300 hover:text-purple-100 text-[10px] font-bold rounded-lg transition cursor-pointer disabled:opacity-40"
                                              title="تحليل الصورة واستخراج النصوص المكتوبة بداخلها بالذكاء الاصطناعي"
                                            >
                                              🔍 استخراج النص (OCR)
                                            </button>
                                          )}

                                          {(isVid || isAud) && (
                                            <button
                                              onClick={() => handleTranscribeDocumentAttachment(doc.id)}
                                              disabled={isParsingDocument}
                                              className="px-2 py-0.5 bg-amber-950/60 border border-amber-900/40 hover:bg-amber-900 text-amber-300 hover:text-amber-100 text-[10px] font-bold rounded-lg transition cursor-pointer disabled:opacity-40"
                                              title="تفريغ كلام الصوت/الفيديو المسموع إلى لغة عربية مقروءة بالكامل"
                                            >
                                              🎙️ استخراج الكلام (AI)
                                            </button>
                                          )}

                                          {/* 🗑️ Delete */}
                                          <button
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="px-2 py-0.5 bg-rose-950/60 border border-rose-900/40 hover:bg-rose-905/70 hover:bg-rose-900 text-rose-400 hover:text-rose-100 text-[10px] font-bold rounded-lg transition cursor-pointer mr-0 select-none"
                                            title="حذف هذا الملتحق من الدفتر الأكاديمي"
                                          >
                                            🗑️ حذف
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[9px] text-slate-600 text-center py-2.5 bg-slate-950/40 rounded-xl border border-dashed border-slate-900 select-none">
                                  لا توجد مرفقات أو ملفات بالمحاضرة حالياً — ارفع مستند، عرض تقديمي، صورة، مقطع صوتي، أو فيديو باستخدام الزر المخصص.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* WebRTC Real-Time Camerawork Preview active feed panel */}
                          {isVideoRecording && (
                            <div className="bg-slate-900 rounded-2xl border border-indigo-500/60 overflow-hidden shadow-lg p-3 space-y-2.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center gap-1.5 font-bold">
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                  <span className="text-red-400">● البث المباشر نشط</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Camera Switch Button */}
                                  <button
                                    onClick={handleSwitchCamera}
                                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                                    title={cameraFacing === 'user' ? 'التبديل للكاميرا الخلفية 🔄' : 'التبديل للكاميرا الأمامية 🔄'}
                                  >
                                    <span>🔄</span>
                                    <span>{cameraFacing === 'user' ? 'خلفية' : 'أمامية'}</span>
                                  </button>
                                  <span className="font-extrabold text-slate-300 font-sansArabic">
                                    {cameraFacing === 'user' ? '📷 أمامية' : '📸 خلفية'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Video preview — mirror only for front camera */}
                              <div className="aspect-video w-full rounded-xl bg-black border border-slate-800 overflow-hidden relative flex items-center justify-center text-slate-600">
                                <video
                                  ref={videoPreviewRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''} ${videoStream ? 'block' : 'hidden'}`}
                                />
                                {!videoStream && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 p-4">
                                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] text-indigo-300 font-bold">جاري تشغيل الكاميرا...</p>
                                    <p className="text-[9px] text-slate-500">يرجى السماح بالوصول إلى الكاميرا في المتصفح</p>
                                  </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[8px] text-white flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                  {videoStream ? 'كاميرا نشطة 📹' : 'ميكروفون نشط 🎙️'}
                                </div>
                                {/* Timer */}
                                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-full text-[9px] text-white font-mono">
                                  {String(Math.floor(videoSeconds / 60)).padStart(2,'0')}:{String(videoSeconds % 60).padStart(2,'0')}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Processing status banner */}
                          {isParsingDocument && (
                            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-center space-y-2 flex flex-col items-center justify-center text-indigo-300">
                              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-bold leading-relaxed font-sansArabic">يقوم الذكاء الاصطناعي (Gemini) بفحص وقراءة الملف الدراسي المرفوع وتوليد خلاصة كورنيل غنية بالبيانات التفاعلية...</span>
                            </div>
                          )}

                          {/* Live transcription panel — only visible during active dictation */}
                          {(isDictating && liveTranscriptText) && (
                            <div className="p-4 bg-indigo-950/20 border border-indigo-505/30 rounded-xl space-y-3 text-right">
                              <div className="flex items-center justify-between text-xs pb-2 border-b border-indigo-900/40">
                                <span className="bg-red-950 border border-red-900 text-red-500 text-[9px] px-2 py-0.5 rounded animate-pulse">
                                  بث فوري
                                </span>
                                <h6 className="font-extrabold text-indigo-400">التفريغ الفوري الحي والمدعوم بالذكاء الاصطناعي</h6>
                              </div>
                              <p className="text-xs text-slate-300 font-sansArabic leading-relaxed">
                                {liveTranscriptText || "جاري تتبع ورصد كلام الأستاذ ومحاكاته للنص فورا..."}
                              </p>
                              
                              <button
                                onClick={handleInsertTranscriptToCanvas}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all duration-200 cursor-pointer"
                              >
                                📥 إلصاق وإدراج هذا التفريغ في مساحة الكتابة الحالية
                              </button>
                            </div>
                          )}

                          {/* ✅ IMPROVED: Recorded audio/video sessions with full media player */}
                          <div className="space-y-2 pt-3 border-t border-slate-900">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              التسجيلات المحفوظة ({lecture.recordings?.length || 0}):
                            </span>
                            <div className="grid grid-cols-1 gap-3 max-h-[420px] overflow-y-auto pr-1">
                              {lecture.recordings?.map((rec) => {
                                const isVideo = rec.type === 'video';
                                const hasBlob = pendingBlobIds.has(rec.id);
                                const blobUrl = blobUrlsRef.current.get(rec.id) || (rec as any).audioBlobUrl || (rec as any).videoUrl;
                                const hasMedia = !!(hasBlob && blobUrl) || !!(rec as any).videoUrl || !!(rec as any).audioBlobUrl;
                                const mediaUrl = blobUrl || (rec as any).videoUrl || (rec as any).audioBlobUrl;
                                const transcribing = isTranscribing === rec.id;
                                const durationMin = String(Math.floor((rec.durationSeconds || 0) / 60)).padStart(2,'0');
                                const durationSec = String((rec.durationSeconds || 0) % 60).padStart(2,'0');
                                return (
                                  <div
                                    key={rec.id}
                                    className={`rounded-2xl text-xs border overflow-hidden transition ${isVideo ? 'bg-indigo-950/15 border-indigo-800/40' : 'bg-slate-900/80 border-slate-800'}`}
                                  >
                                    {/* Header bar */}
                                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800/60">
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {isVideo ? (
                                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 px-1.5 py-0.5 rounded-full">🎥 فيديو</span>
                                        ) : (
                                          <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 px-1.5 py-0.5 rounded-full">🎙️ صوت</span>
                                        )}
                                        <span className="text-[9px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded-full">{durationMin}:{durationSec}</span>
                                        {hasMedia && (
                                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">● قابل للتشغيل</span>
                                        )}
                                      </div>
                                      <h6 className="font-extrabold text-slate-200 text-right truncate max-w-[160px] text-[11px]">{rec.title}</h6>
                                    </div>

                                    {/* ✅ Media player — video or audio */}
                                    {hasMedia && mediaUrl && (
                                      <div className="px-3 pt-2.5">
                                        {isVideo ? (
                                          <video
                                            controls
                                            src={mediaUrl}
                                            className="w-full rounded-xl border border-indigo-900/40 max-h-44 bg-black"
                                            preload="metadata"
                                          />
                                        ) : (
                                          <audio
                                            controls
                                            src={mediaUrl}
                                            className="w-full h-9 rounded-xl"
                                            preload="metadata"
                                          />
                                        )}
                                      </div>
                                    )}

                                    {/* Transcription preview */}
                                    {rec.transcription && (
                                      <div className="px-3 pt-2">
                                        <p className="text-[10px] text-slate-400 leading-relaxed font-sansArabic line-clamp-3 text-right bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
                                          {rec.transcription}
                                        </p>
                                      </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end px-3 py-2.5">
                                      {/* ── تحويل إلى نص / إعادة التحويل ── */}
                                      <button
                                        onClick={() => handleTranscribeRecording(rec.id)}
                                        disabled={transcribing || !hasMedia}
                                        title={!hasMedia ? "الملف الصوتي غير متاح في هذه الجلسة — سجّل مجدداً" : rec.transcription ? "إعادة التحويل إلى نص" : "تحويل التسجيل إلى نص"}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                                          transcribing
                                            ? 'bg-emerald-900/60 text-emerald-300 cursor-wait animate-pulse'
                                            : hasMedia
                                              ? rec.transcription
                                                ? 'bg-slate-800 hover:bg-emerald-800 text-slate-400 hover:text-white cursor-pointer border border-slate-700'
                                                : 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow'
                                              : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                                        }`}
                                      >
                                        {transcribing ? (
                                          <>
                                            <div className="w-2.5 h-2.5 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                            <span>جاري التحويل...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span>{rec.transcription ? '🔄' : '✦'}</span>
                                            <span>{rec.transcription ? 'إعادة تحويل' : 'تحويل إلى نص'}</span>
                                          </>
                                        )}
                                      </button>

                                      {/* Time markers */}
                                      {rec.markers?.length > 0 && rec.markers.map((marker) => (
                                        <button
                                          key={marker.id}
                                          onClick={() => alert(`العلامة الزمنية: ${marker.label}`)}
                                          className="text-[9px] px-1.5 py-0.5 bg-slate-950 hover:bg-indigo-600 text-slate-500 hover:text-white rounded border border-slate-900 transition"
                                        >
                                          ⏱️ {marker.label}
                                        </button>
                                      ))}

                                      {/* ── زر الحذف ── */}
                                      <button
                                        onClick={() => handleDeleteRecording(rec.id)}
                                        title="حذف هذا التسجيل نهائياً"
                                        className="mr-auto flex items-center gap-1 px-2 py-1 bg-slate-950 hover:bg-rose-900/60 text-rose-500 hover:text-rose-300 text-[10px] font-black rounded-lg border border-rose-900/30 hover:border-rose-700 transition"
                                      >
                                        🗑️ حذف
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {lecture.recordings?.length === 0 && (
                                <div className="text-center py-6 space-y-2">
                                  <div className="text-2xl">🎙️</div>
                                  <p className="text-[10px] text-slate-600 font-sansArabic">
                                    لا توجد تسجيلات بعد — ابدأ بالضغط على أحد زرَّي التسجيل أعلاه
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          </>
                        )}
                      </div>

                    {/* OCR Results view banner if populated */}
                    {scannedTextOCR && (
                      <div className="p-4 bg-purple-950/20 border border-purple-900 text-purple-200 rounded-xl text-xs leading-relaxed text-right space-y-1">
                        <strong className="text-purple-400">📝 نتيجة المسح الضوئي للسبورة (OCR):</strong>
                        <p className="font-mono">{scannedTextOCR}</p>
                      </div>
                    )}

                    {/* ── نص المحاضرة — Lecture Transcript Panel ────────── */}
                    {(lecture.lectureText || lectureTextEdit) && (
                      <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4 space-y-3 text-right">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsTranscriptCollapsed(!isTranscriptCollapsed)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                              title={isTranscriptCollapsed ? "توسيع نص المحاضرة" : "طي نص المحاضرة"}
                            >
                              {isTranscriptCollapsed ? '▶ توسيع' : '▼ طي'}
                            </button>
                            {!isTranscriptCollapsed && (
                              <>
                                <button
                                  onClick={() => {
                                    updateLectureData(lecture.id, { lectureText: lectureTextEdit });
                                  }}
                                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black rounded-lg transition cursor-pointer"
                                >
                                  💾 حفظ التعديلات
                                </button>
                                <button
                                  onClick={handleInsertTranscriptToCanvas}
                                  className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                                >
                                  📥 إدراج في الدفتر
                                </button>
                              </>
                            )}
                          </div>
                          <h3 className="font-extrabold text-emerald-400 text-xs flex items-center gap-1.5">
                            <span>📄 نص المحاضرة</span>
                          </h3>
                        </div>
                        {!isTranscriptCollapsed && (
                          <>
                            <textarea
                              dir="rtl"
                              value={lectureTextEdit}
                              onChange={(e) => setLectureTextEdit(e.target.value)}
                              rows={8}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-200 font-sansArabic leading-relaxed resize-y focus:outline-none focus:border-emerald-700 transition placeholder-slate-600"
                              placeholder="سيظهر نص المحاضرة هنا بعد الضغط على 'تحويل إلى نص' في أحد التسجيلات أعلاه..."
                            />
                            <p className="text-[9px] text-slate-600 text-left">
                              تم آخر تحديث: {new Date().toLocaleTimeString('ar-SA')} · يمكنك التعديل والحفظ
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Show empty lecture text panel hint when there are recordings but no text yet */}
                    {!lecture.lectureText && !lectureTextEdit && (lecture.recordings || []).length > 0 && (
                      <div className="bg-slate-950/60 border border-dashed border-emerald-900/30 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] font-extrabold text-emerald-500/70">📄 نص المحاضرة</p>
                        <p className="text-[10px] text-slate-600 font-sansArabic">
                          اضغط على <span className="text-emerald-400 font-bold">✦ تحويل إلى نص</span> في أي تسجيل أعلاه لاستخراج النص باستخدام Gemini AI
                        </p>
                      </div>
                    )}

                    {/* Integrated Page Controls bar */}
                    <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleMovePageOrder('up')}
                          disabled={activePageNumber <= 1}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded transition disabled:opacity-40"
                          title="رفع الصفحة الحالية للأعلى في الترتيب ↑"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMovePageOrder('down')}
                          disabled={activePageNumber >= lecture.pages.length}
                          className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded transition disabled:opacity-40"
                          title="خفض الصفحة الحالية للأسفل في الترتيب ↓"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px h-4 bg-slate-800 mx-1.5" />

                        <button
                          onClick={handleCopyPage}
                          className="p-1.5 text-slate-300 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 transition"
                          title="نسخ محتويات ورقة المذاكرة وبينات الرسم المؤقتة 📋"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handlePastePage}
                          disabled={!clipboardPageBuffer}
                          className="p-1.5 text-slate-300 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 transition disabled:opacity-40"
                          title="لصق ودمج ورقة الرسم المنسوخة بالذاكرة 📥"
                        >
                          <Clipboard className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown background selector - Compacted and visual popover */}
                      <div className="flex items-center gap-2 relative">
                        {/* Fullscreen focus mode controller button */}
                        <button
                          onClick={() => setIsCanvasFullScreen(true)}
                          className="p-1.5 text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 rounded hover:bg-indigo-900/40 transition"
                          title="تغطية كامل الشاشة ليكون الدفتر بأقصى اتساع مريح للكتابة اليدوية والرسم 📺"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>

                        {/* Read-Only Mode Toggle Switch Option as dynamic lock/unlock */}
                        <button
                          onClick={() => setIsReadOnly(!isReadOnly)}
                          className={`p-1.5 rounded transition duration-200 border cursor-pointer ${
                            isReadOnly
                              ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                          title={isReadOnly ? "الدفتر مقفل للقراءة فقط (اضغط للتعديل والكتابة) 🔒" : "الدفتر نشط وقابل للكتابة والرسم (اضغط للقفل والحماية) ✏️"}
                        >
                          {isReadOnly ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>

                        {/* Visual style icon display buttons instead of long texts */}
                        <div className="relative">
                          <button
                            onClick={() => setShowBgStyleSelector(!showBgStyleSelector)}
                            className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-850 hover:text-indigo-400 transition flex items-center justify-center gap-1 cursor-pointer"
                            title="تغيير نمط ورقة الدفتر النشطة 📄"
                          >
                            {/* Display correct icon based on active page pattern selection */}
                            {(() => {
                              const pat = lecture.pages[activePageNumber - 1]?.bgPattern || "ruled";
                              if (pat === 'ruled') return <AlignJustify className="w-4 h-4 text-indigo-400" />;
                              if (pat === 'grid') return <Grid3X3 className="w-4 h-4 text-emerald-450" />;
                              if (pat === 'dotted') return <MoreHorizontal className="w-4 h-4 text-purple-400" />;
                              if (pat === 'oldPaper') return <BookOpen className="w-4 h-4 text-amber-500" />;
                              if (pat === 'isoNetwork') return <Tv className="w-4 h-4 text-rose-450" />;
                              return <FileText className="w-4 h-4 text-slate-400" />;
                            })()}
                          </button>

                          {/* Float popover selector list of patterns */}
                          {showBgStyleSelector && (
                            <div className="absolute bottom-11 left-0 mb-1 bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col gap-1 w-44 z-50 animate-fade-in text-right">
                              <span className="text-[10px] text-indigo-400 font-extrabold pb-1.5 border-b border-slate-900 block text-right">اختر نمط الورقة:</span>
                              {[
                                { value: 'ruled', label: 'ورقة مسطرة 🗒️', icon: AlignJustify },
                                { value: 'grid', label: 'شبكة مربعات 📊', icon: Grid3X3 },
                                { value: 'dotted', label: 'منقطة 💬', icon: MoreHorizontal },
                                { value: 'plain', label: 'بيضاء نقية 📄', icon: FileText },
                                { value: 'oldPaper', label: 'كُتّاب عتيق 📜', icon: BookOpen },
                                { value: 'isoNetwork', label: 'شبكة هندسية 📐', icon: Tv },
                              ].map((pattern) => {
                                const IconComp = pattern.icon;
                                return (
                                  <button
                                    key={pattern.value}
                                    onClick={() => {
                                      handleUpdatePageData(activePageNumber - 1, { bgPattern: pattern.value as any });
                                      setShowBgStyleSelector(false);
                                    }}
                                    className={`flex items-center justify-between w-full px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                                      lecture.pages[activePageNumber - 1]?.bgPattern === pattern.value
                                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-900/30'
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                    }`}
                                  >
                                    <IconComp className="w-3.5 h-3.5" />
                                    <span>{pattern.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>



                        {/* Yellow Bookmark button */}
                        <button
                          onClick={() => {
                            const isCurrentlyBooked = lecture.bookmarked;
                            updateLectureData(lecture.id, { bookmarked: !isCurrentlyBooked });
                          }}
                          className={`p-1.5 rounded-lg border transition duration-150 cursor-pointer ${
                            lecture.bookmarked 
                              ? 'text-amber-400 bg-amber-400/20 border-amber-400/30 shadow' 
                              : 'text-slate-400 bg-slate-900 border-slate-800 hover:text-slate-200'
                          }`}
                          title={lecture.bookmarked ? "العلامة المرجعية نشطة (مفضلة) 🟡" : "إضافة علامة مرجعية"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${lecture.bookmarked ? 'fill-current' : ''}`} />
                        </button>

                        {/* Share QR button */}
                        <button
                          onClick={handleToggleQRCodeShare}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 rounded-lg transition cursor-pointer"
                          title="توليد رمز الاستجابة السريعة (QR) لمشاركة الدفتر فوراً 🔗"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Export markdown button */}
                        <button
                          onClick={handleExportMarkdown}
                          className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg transition cursor-pointer"
                          title="تصدير الدفتر كملف Markdown 📝"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Red X Close button - NO TEXT */}
                        <button
                          onClick={() => {
                            setSelectedLectureId(""); // Close active notebook
                            setActivePageNumber(1);
                            setIsFocusMode(false);
                          }}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/35 text-rose-500 hover:text-rose-450 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer shadow"
                          title="إغلاق هذا الدفتر والرجوع للرئيسية ✕"
                        >
                          <X className="w-4 h-4 text-rose-500 font-extrabold" />
                        </button>
                      </div>
                    </div>

                    {/* Integrated Canvas Workstage Board */}
                    <div className={`relative transition-all duration-300 flex flex-col`} style={layoutMode === 'phone' ? { minHeight: "calc(100vh - 120px)", height: "calc(100vh - 120px)" } : { minHeight: "calc(100vh - 240px)", height: "calc(100vh - 240px)" }}>

                      <div className="flex flex-col flex-1 h-full">
                        {/* Floating Speed Dial & Quick action buttons */}
                        {showFloatingQuickActions && lecture.pages.length > 0 && (
                          <div className="absolute top-4 left-4 z-45 flex flex-col gap-2 p-1.5 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl select-none text-right">
                            <button onClick={() => setIsFloatingPanelCollapsed(!isFloatingPanelCollapsed)} className="text-[8px] text-indigo-400 font-extrabold text-center block pb-1 border-b border-slate-800 cursor-pointer hover:text-indigo-300 transition">
                              {isFloatingPanelCollapsed ? '▶ تفريغ وميديا' : '▼ تفريغ وميديا'}
                            </button>
                            {!isFloatingPanelCollapsed && (<>
                            
                            
                            {/* Snap Camera Photo button */}
                            <button
                              onClick={() => {
                                handleWhiteboardScanOCR();
                                alert("📸 تم التقاط سبورة الصف! تم بدء معالجة تفريغ النصوص الفورية OCR لإدراج الملخص بالدفتر.");
                              }}
                              className="p-2 bg-slate-900 hover:bg-indigo-600 rounded-xl text-slate-300 transition duration-150 flex items-center justify-center cursor-pointer group relative"
                              title="التقاط لقطة فورية لـصبورة الصف"
                            >
                              <Camera className="w-4 h-4 text-purple-400" />
                              <span className="absolute right-12 top-1 bg-slate-950 border border-indigo-950 text-[9px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">مسح السبورة كاميرا</span>
                            </button>

                            {/* Dictation mic button — Web Speech API → textbox on canvas */}
                            <button
                              onClick={() => isDictating ? handleStopDictation() : handleStartDictation()}
                              className={`p-2 rounded-xl transition duration-150 flex items-center justify-center cursor-pointer group relative ${
                                isDictating ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 hover:bg-rose-600 text-slate-300'
                              }`}
                              title={isDictating ? "إيقاف الإملاء وإدراج النص في الدفتر" : "إملاء — تحدّث وسيُكتب في الدفتر مباشرة"}
                            >
                              <Mic className={`w-4 h-4 ${isDictating ? 'text-white' : 'text-rose-400'}`} />
                              <span className="absolute right-12 top-1 bg-slate-950 border border-rose-900/60 text-[9px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                {isDictating ? "⏹ إيقاف الإملاء" : "🎙 إملاء → نص في الدفتر"}
                              </span>
                            </button>

                            {/* Speech text transcription */}
                            <button
                              onClick={() => {
                                openCustomPrompt(
                                  "تفريغ نصي ذكي",
                                  "🎙️ [الكلام الذكي] اكتب الجملة التي تريد محاكاتها وسيتم تحويلها لنص عربي فوري داخل الدفتر:",
                                  "ملاحظة دراسية هامة: شرح الدكتور يركز على تكامل القوى الفيزيائية وطريقة تدوين النظرية بكورنيل.",
                                  "الجملة المراد محاكاتها",
                                  (transPrompt) => {
                                    if (transPrompt.trim()) {
                                      const newBoxId = "trans-box-" + Date.now();
                                      const newBox = {
                                        id: newBoxId,
                                        x: 80,
                                        y: 120,
                                        width: 300,
                                        height: 90,
                                        text: "🔊 تفريغ نصي:\n" + transPrompt.trim(),
                                        fontSize: 12,
                                        color: "#1e293b",
                                        layer: "textboxes" as const
                                      };
                                      handleUpdatePageData(activePageNumber - 1, {
                                        textboxes: [...(lecture.pages[activePageNumber - 1].textboxes || []), newBox]
                                      });
                                    }
                                  }
                                );
                              }}
                              className="p-2 bg-slate-900 hover:bg-emerald-600 rounded-xl text-slate-300 transition duration-150 flex items-center justify-center cursor-pointer group relative"
                              title="زر إملاء وتحويل الصوت لكتابة"
                            >
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              <span className="absolute right-12 top-1 bg-slate-950 border border-indigo-950 text-[9px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">تفريق الصوت لكتابة</span>
                            </button>
                            </>)}
                          </div>
                        )}

                        {lecture.pages.length > 0 ? (
                          <NotebookCanvas
                            page={lecture.pages[activePageNumber - 1]}
                            onUpdatePage={(updates) => handleUpdatePageData(activePageNumber - 1, updates)}
                            isReadOnly={isReadOnly}
                            isDarkMode={isDarkMode}
                            lectureDate={lecture.date}
                          />
                        ) : (
                          <div className="py-24 text-center text-slate-500">
                            يرجى إضافة صفحة مراجعة للاستمرار
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Canvas pages indexing carousel */}
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInsertPage('blank')}
                          className="px-3 py-1 bg-indigo-600/20 text-indigo-400 font-bold text-xs rounded border border-indigo-600/30"
                        >
                          + إضافة صفحة فارغة
                        </button>
                        <button
                          onClick={() => handleInsertPage('cornell')}
                          className="px-3 py-1 bg-purple-600/20 text-purple-400 font-bold text-xs rounded border border-purple-600/30"
                        >
                          + صفحة بنموذج Cornell ممتد
                        </button>
                        <button
                          onClick={() => handleDeletePage(activePageNumber - 1)}
                          disabled={lecture.pages.length <= 1}
                          className="p-1 text-rose-500 hover:bg-slate-900 rounded disabled:opacity-40"
                          title="مسح هذه الصفحة من الدفتر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePageNumber(prev => Math.max(1, prev - 1))}
                          disabled={activePageNumber === 1}
                          className="p-1 bg-slate-900 border border-slate-800 rounded text-slate-400 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-slate-300 font-bold">
                          صفحة {activePageNumber} من {lecture.pages.length}
                        </span>
                        <button
                          onClick={() => setActivePageNumber(prev => Math.min(lecture.pages.length, prev + 1))}
                          disabled={activePageNumber === lecture.pages.length}
                          className="p-1 bg-slate-900 border border-slate-800 rounded text-slate-400 disabled:opacity-40"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="py-16 px-6 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-6 max-w-2xl mx-auto shadow-xl" dir="rtl">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-slate-800">
                      <BookOpen className="w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-extrabold text-slate-200">الدفتر الذكي مغلق حالياً 📘</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        تم إغلاق تفاصيل المذكرة الدراسية بنجاح. اختر أحد مذكرات المادة المدرجة بالأسفل لفتحها وتعديلها، أو ابدأ بكتابة مذكرة جديدة فوراً!
                      </p>
                    </div>

                    {/* Quick creation inside the workspace if they want to */}
                    <div className="p-4 bg-slate-900/50 border border-slate-850 rounded-xl space-y-3 max-w-sm mx-auto text-right">
                      <h4 className="text-xs font-bold text-slate-300">💡 التحكم السريع والمحاضرات:</h4>
                      
                      {getFilteredLectures().length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 block">المحاضرات المتوفرة بـ ({getSelectedSubject()?.name || "المادة المحددة"}):</span>
                          <div className="grid grid-cols-1 gap-1 px-1.5 max-h-36 overflow-y-auto">
                            {getFilteredLectures().map(lec => (
                              <button
                                key={lec.id}
                                onClick={() => {
                                  setSelectedLectureId(lec.id);
                                  setActivePageNumber(1);
                                }}
                                className="w-full text-right p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-xs border border-slate-850 hover:border-indigo-500/50 text-slate-300 flex justify-between items-center transition cursor-pointer group shadow-sm hover:shadow-indigo-500/10"
                              >
                                <span className="font-bold truncate text-slate-200 group-hover:text-white pr-2">{lec.title}</span>
                                <span className="text-[10px] font-black px-2.5 py-1.5 rounded-md bg-indigo-600 group-hover:bg-indigo-500 text-white transition shadow flex items-center gap-1 shrink-0 select-none">
                                  <span>تحرير الدفتر</span>
                                  <span>✏️</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 leading-relaxed">لا توجد محاضرات مدرجة في هذه المادة حالياً. يمكنك بدء أول دفتر بالأسفل!</p>
                      )}

                      <div className="pt-3 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            openCustomPrompt(
                              "تأسيس محاضرة جديدة",
                              "أدخل عنوان المحاضرة الجديدة لتأسيسها والبدء بالكتابة فوراً:",
                              "",
                              "مثال: المحاضرة 1: مقدمة في خوارزميات البحث",
                              (val) => {
                                if (val.trim()) {
                                  const newLecId = "lec-" + Date.now();
                                  const newLec: Lecture = {
                                    id: newLecId,
                                    title: val.trim(),
                                    date: new Date().toISOString().split("T")[0],
                                    subjectId: activeSubId,
                                    difficulty: 'medium',
                                    bookmarked: false,
                                    tags: [],
                                    pages: [
                                      {
                                        id: "page-" + Date.now(),
                                        pageNumber: 1,
                                        templateType: "blank",
                                        bgPattern: "ruled",
                                        strokes: [],
                                        shapes: [],
                                        stickers: [],
                                        textboxes: []
                                      }
                                    ],
                                    recordings: [],
                                    folders: [],
                                    changelog: [
                                      { id: "chg-start", version: 1, timestamp: new Date().toISOString(), author: "النظام", description: "تهيئة المذكرة الدراسية لأول مرة." }
                                    ]
                                  };
                                  setAppState(prev => ({
                                    ...prev,
                                    lectures: [...prev.lectures, newLec],
                                    stats: { ...prev.stats, totalLectures: prev.stats.totalLectures + 1, xpPoints: prev.stats.xpPoints + 50 }
                                  }));
                                  setSelectedLectureId(newLecId);
                                  setActivePageNumber(1);
                                }
                              }
                            );
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-3 rounded-lg transition shadow-md cursor-pointer text-center"
                        >
                          + إضافة وبدء محاضرة جديدة 🚀
                        </button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
        </main>

        {/* Footer info brand bottom */}
        <footer className="bg-slate-950 py-4 px-6 border-t border-slate-800 text-[10px] text-slate-500 text-center flex flex-col md:flex-row justify-between items-center gap-2">
          <div>تحذير وتنبيه: لا تقم بمشاركة مفاتيح الأمان الشخصية. كافة البيانات تخضع لشروط الخصوصية والاستقرار الذكي الحصري.</div>
          <div className="font-semibold">دفتر المحاضرات للجامعات والمدارس © 2026 - تدوين الأفكار ببساطة ودقة</div>
        </footer>

        {/* FULLSCREEN CANVAS WRITING MODE (يغطي كافة الشاشة للكتابة والرسم المتكامل للايباد والاجهزة اللوحية) */}
        {isCanvasFullScreen && lecture && (
          <div className="fixed inset-0 bg-slate-950 z-[99999] flex flex-col p-4 space-y-4 font-sansArabic" dir="rtl">
            {/* Fullscreen header floating menu */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-3.5 rounded-2xl gap-3">
              <div className="text-right">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                  <span>اللوحة التفاعلية (ملء الشاشة 📺)</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">محاضرة: {lecture.title} | صفحة {activePageNumber} من {lecture.pages.length}</p>
              </div>

              {/* Quick in-screen controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    openCustomPrompt(
                      "مربع كتابة جديد",
                      "أدخل نص مربع الكتابة الجديد:",
                      "",
                      "مثال: تذكر مراجعة هذا القانون قبل الاختبار النهائي 💡",
                      (label) => {
                        if (label.trim() && lecture.pages[activePageNumber - 1]) {
                          const newTxt: DragTextbox = {
                            id: "txt-" + Date.now(),
                            x: 80,
                            y: 120,
                            width: 200,
                            height: 60,
                            text: label.trim(),
                            color: "#FFFFFF",
                            fontSize: 16,
                            layer: 'textboxes'
                          };
                          handleUpdatePageData(activePageNumber - 1, {
                            textboxes: [...(lecture.pages[activePageNumber - 1].textboxes || []), newTxt]
                          });
                        }
                      }
                    );
                  }}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <span>+ أدرج مربع نص</span>
                </button>

                <button
                  onClick={() => handleUpdatePageData(activePageNumber - 1, { strokes: [] })}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 text-red-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <span>مسح الرسوم 🧹</span>
                </button>

                <div className="w-[1px] h-6 bg-slate-800" />

                <button
                  onClick={() => setIsCanvasFullScreen(false)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-900/20 transition flex items-center gap-1 hover:scale-105 active:scale-95 shrink-0"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>إغلاق ملء الشاشة 📴</span>
                </button>
              </div>
            </div>

            {/* Actual canvas workspace body centered stretching to full height */}
            <div className="flex-1 bg-white rounded-2xl overflow-hidden relative shadow-inner border border-slate-800 flex flex-col justify-center">
              {lecture.pages[activePageNumber - 1] ? (
                <div className="w-full h-full max-h-[85vh] overflow-auto">
                  <NotebookCanvas
                    page={lecture.pages[activePageNumber - 1]}
                    onUpdatePage={(updates) => handleUpdatePageData(activePageNumber - 1, updates)}
                    isReadOnly={isReadOnly}
                    isDarkMode={isDarkMode}
                  />
                </div>
              ) : (
                <div className="py-24 text-center text-slate-500">
                  لا توجد صفحة نشطة لعرض المخططات التوضيحية
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING AI CHATBOT (المساعد الذكي العائم للمحاكاة والتحاور الطلابي) */}
        <div className="fixed bottom-6 right-6 z-[9999] font-sansArabic flex flex-col items-end space-y-3">
          {/* Chat box container if open */}
          {floatingBotOpen && (
            <div className="w-80 sm:w-96 h-[460px] bg-slate-950 border border-indigo-900/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col text-right">
              {/* Box Header */}
              <div className="bg-indigo-950 p-3 flex items-center justify-between border-b border-indigo-900/30">
                <button 
                  onClick={() => setFloatingBotOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="إغلاق رفيق الاستذكار"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2 justify-end">
                  <div className="text-right">
                    <h4 className="font-extrabold text-[12px] text-white">الرفيق الدراسي الذكي (Gemini)</h4>
                    <span className="text-[9px] text-teal-400 font-bold block">متصل ومستعد لشرح المحاضرة 🧠</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-505/35 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-950 scrollbar-thin">
                {chatMessages.map((msg, i) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div key={i} className={`flex ${isBot ? 'justify-start' : 'justify-end'} text-right`}>
                      <div className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed transition ${
                        isBot 
                          ? 'bg-slate-900/80 border border-slate-805 text-slate-100 rounded-tr-none' 
                          : 'bg-indigo-650 text-white rounded-tl-none shadow'
                      }`}>
                        <p>{msg.text}</p>
                        <span className="text-[8px] text-slate-500 block text-left mt-1 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {botTyping && (
                  <div className="flex justify-start text-right">
                    <div className="bg-slate-900/60 p-3 rounded-2xl text-xs text-slate-400 rounded-tr-none flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                      <span>الذكاء الأكاديمي يفكر...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* In-screen quick prompts list */}
              <div className="p-2 bg-slate-900/30 border-t border-slate-900 flex flex-wrap gap-1 justify-end font-bold">
                <button 
                  onClick={() => handleSendChatMessage("لخص لي الصفحة الحالية من الدفتر من فضلك.")}
                  className="text-[9px] px-2 py-1 bg-slate-900 hover:bg-indigo-950/40 text-indigo-300 rounded border border-indigo-900/20 font-bold transition cursor-pointer"
                >
                  📝 تلخيص الدفتر
                </button>
                <button 
                  onClick={() => handleSendChatMessage("كيف يمكنني مراجعة المصطلحات الصعبة كطالب؟")}
                  className="text-[9px] px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-800 transition cursor-pointer"
                >
                  🧠 نصائح دراسية
                </button>
              </div>

              {/* Dialogue Input Box */}
              <div className="p-2 border-t border-slate-900 bg-slate-950">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const target = e.currentTarget.elements.namedItem('chatQuery') as HTMLInputElement;
                    if (target && target.value.trim()) {
                      handleSendChatMessage(target.value);
                      target.value = "";
                    }
                  }}
                  className="flex gap-1.5"
                >
                  <button
                    type="submit"
                    className="px-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition text-center shrink-0 cursor-pointer"
                  >
                    أرسل
                  </button>
                  <input
                    name="chatQuery"
                    autoComplete="off"
                    placeholder="اسأل رفيق الاستذكار عن المحاضرة..."
                    className="flex-1 text-right p-2 text-xs bg-slate-900 border border-slate-850 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-white font-sansArabic"
                  />
                </form>
              </div>
            </div>
          )}

          {/* AI Settings Modal & OpenRouter Credentials */}
          {showAiKeyModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in" dir="rtl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-2xl relative text-right animate-scale-in">
                <div className="shrink-0 p-5 bg-slate-950 border-b border-slate-850 flex items-center justify-between rounded-t-2xl">
                  <button
                    onClick={() => setShowAiKeyModal(false)}
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-rose-400 hover:bg-slate-800 font-extrabold text-xs transition duration-150 cursor-pointer"
                  >
                    إغلاق ×
                  </button>
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black text-white">إعدادات الأكواد الخاصة بتشغيل التطبيق</h3>
                  </div>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    يمكنك تشغيل المساعد الدراسي الذكي بمفتاح الذكاء الاصطناعي الخاص بك لتفادي أي انقطاع بالخدمة أو للوصول لموديلات مالكة وفوق العادة ومستقلة.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-300 font-bold block">رابط تفعيل الخدمة والحصول على مفتاح مجاني 🔑</label>
                    <div className="p-3 bg-indigo-950/20 border border-indigo-900/45 rounded-xl space-y-2 text-xs text-slate-300 leading-normal">
                      <p>للحصول على مفتاح ذكاء اصطناعي مفعل مجاناً أو لطلب الدعم التقني، يرجى التواصل فوراً مع المالك الأساسي للتطبيق:</p>
                      <div className="space-y-1.5 pt-1">
                        <a
                          href="https://t.me/Abdu10Alkhaliq"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-400 hover:underline font-extrabold"
                        >
                          <span>💬 عبر تيليجرام: t.me/Abdu10Alkhaliq</span>
                        </a>
                        <a
                          href="https://wa.me/966511040524"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-emerald-400 hover:underline font-extrabold"
                        >
                          <span>🟢 عبر الواتساب: wa.me/966511040524</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] text-slate-300 font-bold block">مزوّد الخدمة الحالي (Provider)</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAiProvider(val);
                        localStorage.setItem("aiProvider", val);
                        localStorage.setItem("x-custom-provider", val);
                      }}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 text-right focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                      <option value="gemini">Google Gemini AI (الافتراضي)</option>
                      <option value="openrouter">OpenRouter API (مستقل متعدد النماذج)</option>
                      <option value="custom">مخدم ذكاء اصطناعي خاص (Custom Endpoint)</option>
                    </select>
                  </div>

                   <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-300 font-bold block">كود تشغيل التطبيق الشخصي (Secret Code)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="أدخل مفتاح الـ API هنا (مثال: sk-or-...)"
                        value={customAiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomAiKey(val);
                          localStorage.setItem("customAiKey", val);
                          setKeyValidationResult(null); // Reset because key changed
                        }}
                        className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 text-right placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyKey(customAiKey, aiProvider)}
                        disabled={isCheckingKey}
                        className="px-3 bg-indigo-950 text-indigo-400 hover:bg-slate-800 disabled:bg-slate-950/80 disabled:text-slate-600 border border-indigo-900/60 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        {isCheckingKey ? "جاري الفحص..." : "فحص المفتاح 🔍"}
                      </button>
                    </div>
                  </div>

                  {/* Key Verification & License Ticket Display */}
                  {keyValidationResult && (
                    <div className="mt-3 p-3.5 rounded-xl border transition-all text-xs text-right space-y-2.5 bg-slate-950 border-slate-850">
                      {keyValidationResult.valid ? (
                        <>
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-extrabold text-[10px] border border-emerald-900/40">
                              {keyValidationResult.status || "نشط وفعّال"}
                            </span>
                            <span className="text-slate-400 font-bold text-[10px]">البطاقة التقنية للمفتاح الدراسي</span>
                          </div>

                          <div className="space-y-1.5 text-slate-300">
                            <div>
                              <span className="text-slate-500 font-medium ml-1">👤 الجهة والمالك المانح:</span>
                              <span className="text-slate-200 font-semibold">{keyValidationResult.owner}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-900/40">
                              <div>
                                <span className="text-slate-500 block">📊 إجمالي رصيد المفتاح:</span>
                                <span className="text-slate-200 font-extrabold">{keyValidationResult.quotaAllowed}</span>
                              </div>
                              {keyValidationResult.quotaRemaining && (
                                <div>
                                  <span className="text-slate-500 block">🔄 المتبقي الفعلي المضمون:</span>
                                  <span className="text-emerald-400 font-extrabold">{keyValidationResult.quotaRemaining}</span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block">📅 صلاحية المدة الزمنية:</span>
                                <span className="text-slate-400">{keyValidationResult.expiryDate}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">📉 ما تم استهلاكه بالفعل:</span>
                                <span className="text-amber-400 font-extrabold">{keyValidationResult.quotaUsed}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-900">
                            <span className="text-slate-500 font-bold block mb-1 text-[10px]">🛡️ الصلاحيات الممنوحة للرمز:</span>
                            <div className="flex flex-wrap gap-1">
                              {keyValidationResult.permissions?.map((perm, pIdx) => (
                                <span key={pIdx} className="px-2 py-0.5 rounded bg-indigo-950/40 border border-indigo-900/30 text-[10px] text-slate-300">
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-rose-450 font-bold">
                            <span>❌ رمز غير فَعَّال أو غير صحيح</span>
                          </div>
                          <p className="text-rose-300 text-[11px] leading-relaxed bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-lg font-sans">
                            {keyValidationResult.error}
                          </p>
                          <p className="text-slate-300 text-[10px] leading-snug">
                            يرجى مراجعة المالك الأساسي للتطبيق (عبد الخالق كعبي) عبر تيليجرام أو واتساب للحصول على مفتاح دراسي مسبق التفعيل ومجاني بالكامل!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      alert("✅ تم حفظ كود التطبيق بنجاح! سيتم تطبيقه تلقائياً على كل الطلبات الذكية 🚀");
                      setShowAiKeyModal(false);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    تأكيد وحفظ الكود
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Academic Info Editing Form Modal */}
          {isEditingAcademic && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all" dir="rtl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative text-right">
                <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                  <button
                    onClick={() => setIsEditingAcademic(false)}
                    className="p-1 px-2 text-rose-450 hover:bg-slate-850 font-bold text-xs"
                  >
                    إغلاق ×
                  </button>
                  <h3 className="text-xs font-black text-white">تحديث تفاصيل المستوى الأكاديمي</h3>
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">اسم الجامعة والمؤسسة:</label>
                    <input
                      type="text"
                      value={academicDetails.university}
                      onChange={(e) => {
                        const next = { ...academicDetails, university: e.target.value };
                        setAcademicDetails(next);
                        localStorage.setItem("student_academic_university", e.target.value);
                      }}
                      placeholder="مثال: جامعة الملك سعود"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">اسم الكلية / المعهد:</label>
                    <input
                      type="text"
                      value={academicDetails.college}
                      onChange={(e) => {
                        const next = { ...academicDetails, college: e.target.value };
                        setAcademicDetails(next);
                        localStorage.setItem("student_academic_college", e.target.value);
                      }}
                      placeholder="مثال: كلية علوم الحاسب والمعلومات"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">التخصص الأكاديمي / القسم:</label>
                    <input
                      type="text"
                      value={academicDetails.department}
                      onChange={(e) => {
                        const next = { ...academicDetails, department: e.target.value };
                        setAcademicDetails(next);
                        localStorage.setItem("student_academic_department", e.target.value);
                      }}
                      placeholder="مثال: هندسة البرمجيات"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">المستوى / الفصل الحالي:</label>
                    <input
                      type="text"
                      value={academicDetails.level}
                      onChange={(e) => {
                        const next = { ...academicDetails, level: e.target.value };
                        setAcademicDetails(next);
                        localStorage.setItem("student_academic_level", e.target.value);
                      }}
                      placeholder="مثال: المستوى السابع"
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none text-right"
                    />
                  </div>

                  <button
                    onClick={() => {
                      alert("تم تحديث البيانات الأكاديمية بنجاح بنظام الكلية الفوري! 🎓");
                      setIsEditingAcademic(false);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    حفظ ومزامنة فورية للبيانات
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* The Action floating button trigger */}
          <button
            onClick={() => {
              setFloatingBotOpen(!floatingBotOpen);
              // Pre-seed greeting message if empty
              if (chatMessages.length === 0) {
                setChatMessages([
                  {
                    sender: 'bot',
                    text: "أهلاً بك يا بطل! أنا رفيقك الدراسي الذكي المستند لنماذج Gemini AI الموثقة. كيف يمكنني مساعدتك في مراجعة وتلخيص المحاضرة الحالية أو تنظيم وتلوين الدفتر اليوم؟ ✏️🧠",
                    timestamp: new Date()
                  }
                ]);
              }
            }}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_10px_40px_rgba(79,70,229,0.6)] border border-indigo-500 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer hover:rotate-6 group relative"
            title="افتح رفيق الاستذكار الطائر 🤖"
          >
            {floatingBotOpen ? (
              <span className="text-xl font-bold font-sans">✕</span>
            ) : (
              <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" />
            )}
            {/* Green notification blip */}
            {!floatingBotOpen && (
              <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-teal-400 border-2 border-slate-950 animate-ping" />
            )}
          </button>

          {/* Custom prompt modal backup */}
          {customPrompt.isOpen && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 font-sansArabic" dir="rtl">
              <div 
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-right">
                  <h3 className="text-base font-extrabold text-white">{customPrompt.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{customPrompt.label}</p>
                </div>

                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={customPrompt.placeholder || "أدخل القيمة..."}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-right placeholder-slate-650"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      customPrompt.onConfirm(promptValue);
                      setCustomPrompt(prev => ({ ...prev, isOpen: false }));
                    } else if (e.key === 'Escape') {
                      setCustomPrompt(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                />

                <div className="flex gap-2 flex-row-reverse font-black">
                  <button
                    onClick={() => {
                      customPrompt.onConfirm(promptValue);
                      setCustomPrompt(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    تأكيد الحفظ
                  </button>
                  <button
                    onClick={() => setCustomPrompt(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Interactive Preview Modal for Lecture Documents */}
          {activeViewingDoc && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-all" dir="rtl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative text-right flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveViewingDoc(null)}
                      className="p-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-rose-400 hover:text-rose-300 font-extrabold text-xs transition duration-150 cursor-pointer"
                    >
                      إغلاق ×
                    </button>
                    
                    <button
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = activeViewingDoc.base64;
                        link.download = activeViewingDoc.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="p-1 px-3 bg-emerald-950/50 border border-emerald-900/60 hover:bg-emerald-900 rounded-lg text-emerald-400 hover:text-emerald-250 font-extrabold text-xs transition duration-150 cursor-pointer flex items-center gap-1"
                      title="تنزيل وحفظ نسخة من هذا المرفق على جهازك المحلي"
                    >
                      <span>تنزيل الملف 📥</span>
                    </button>

                    {(activeViewingDoc.type === 'application/pdf' || activeViewingDoc.name.endsWith('.pdf')) && (
                      <button
                        onClick={() => handleRenderPdfToNotebook(activeViewingDoc)}
                        className="p-1 px-3 bg-sky-950 border border-sky-900 rounded-lg text-sky-400 hover:text-sky-200 font-extrabold text-xs transition duration-150 cursor-pointer flex items-center gap-1"
                        title="فتح ملف الـ PDF كصفحات تفاعلية وتعديلها بالدفتر الورقي"
                      >
                        <span>📖 فتح وتعديل بالدفتر</span>
                      </button>
                    )}

                    {activeViewingDoc.type.startsWith('image/') && (
                      <button
                        onClick={() => handleRenderImageToNotebook(activeViewingDoc)}
                        className="p-1 px-3 bg-sky-950 border border-sky-900 rounded-lg text-sky-400 hover:text-sky-200 font-extrabold text-xs transition duration-150 cursor-pointer flex items-center gap-1"
                        title="فتح الصورة كصفحة دراسية تفاعلية قابلة للكتابة والرسم بالدفتر"
                      >
                        <span>📖 فتح وتعديل بالدفتر</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {activeViewingDoc.type === 'application/pdf' || activeViewingDoc.name.endsWith('.pdf') ? '📄' : 
                       activeViewingDoc.type.startsWith('image/') ? '🖼️' : 
                       activeViewingDoc.type.startsWith('video/') ? '🎥' : 
                       activeViewingDoc.type.startsWith('audio/') || activeViewingDoc.name.endsWith('.mp3') || activeViewingDoc.name.endsWith('.wav') || activeViewingDoc.name.endsWith('.m4a') ? '🎙️' : '📎'}
                    </span>
                    <h3 className="text-sm font-black text-white truncate max-w-lg" title={activeViewingDoc.name}>
                      معاينة: {activeViewingDoc.name}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-slate-900/45 space-y-4 font-sansArabic">
                  {(() => {
                    const isPdf = activeViewingDoc.type === 'application/pdf' || activeViewingDoc.name.endsWith('.pdf');
                    const isImg = activeViewingDoc.type.startsWith('image/');
                    const isVid = activeViewingDoc.type.startsWith('video/');
                    const isAud = activeViewingDoc.type.startsWith('audio/') || activeViewingDoc.name.endsWith('.mp3') || activeViewingDoc.name.endsWith('.wav') || activeViewingDoc.name.endsWith('.m4a');
                    const isTxt = activeViewingDoc.type.startsWith('text/') || activeViewingDoc.name.endsWith('.txt');

                    if (isImg) {
                      return (
                        <div className="flex flex-col items-center justify-center p-2 bg-slate-950/20 border border-slate-800 rounded-2xl">
                          <img 
                            src={activeViewingDoc.base64} 
                            alt={activeViewingDoc.name} 
                            className="max-w-full max-h-[60vh] rounded-xl shadow-xl object-contain border border-slate-800/80" 
                          />
                        </div>
                      );
                    }

                    if (isVid) {
                      // ✅ FIX: Convert base64 to blob URL for proper video playback (no white screen)
                      let videoSrc = activeViewingDoc.base64;
                      try {
                        if (activeViewingDoc.base64.startsWith('data:')) {
                          const parts = activeViewingDoc.base64.split(',');
                          const mime = parts[0].match(/:(.*?);/)?.[1] || activeViewingDoc.type || 'video/mp4';
                          const byteChars = atob(parts[1]);
                          const byteArr = new Uint8Array(byteChars.length);
                          for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
                          videoSrc = URL.createObjectURL(new Blob([byteArr], { type: mime }));
                        }
                      } catch {}
                      return (
                        <div className="flex flex-col items-center justify-center bg-black rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                          <video 
                            src={videoSrc}
                            controls 
                            preload="metadata"
                            className="w-full max-h-[60vh] bg-black" 
                          />
                        </div>
                      );
                    }

                    if (isAud) {
                      // ✅ FIX: Convert base64 to blob URL for audio
                      let audioSrc = activeViewingDoc.base64;
                      try {
                        if (activeViewingDoc.base64.startsWith('data:')) {
                          const parts = activeViewingDoc.base64.split(',');
                          const mime = parts[0].match(/:(.*?);/)?.[1] || activeViewingDoc.type || 'audio/mpeg';
                          const byteChars = atob(parts[1]);
                          const byteArr = new Uint8Array(byteChars.length);
                          for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
                          audioSrc = URL.createObjectURL(new Blob([byteArr], { type: mime }));
                        }
                      } catch {}
                      return (
                        <div className="p-8 text-center bg-slate-950 border border-slate-850 rounded-2xl space-y-4 max-w-xl mx-auto shadow-xl">
                          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-3xl select-none">
                            🎙️
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-black text-slate-200">{activeViewingDoc.name}</h4>
                            <p className="text-[10px] text-slate-500">{activeViewingDoc.sizeKb ? `${activeViewingDoc.sizeKb} KB · ` : ''}تم الرفع بمفكرة الدرس</p>
                          </div>
                          <audio src={audioSrc} controls className="w-full h-12 inline-block max-w-md mx-auto" />
                        </div>
                      );
                    }

                    if (isPdf) {
                      // ✅ FIX: Convert base64 to blob URL, use <iframe> instead of <embed> to prevent white screen
                      let pdfSrc = activeViewingDoc.base64;
                      try {
                        if (activeViewingDoc.base64.startsWith('data:')) {
                          const parts = activeViewingDoc.base64.split(',');
                          const byteChars = atob(parts[1]);
                          const byteArr = new Uint8Array(byteChars.length);
                          for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
                          pdfSrc = URL.createObjectURL(new Blob([byteArr], { type: 'application/pdf' }));
                        }
                      } catch {}
                      return (
                        <div className="space-y-3 text-right">
                          <div className="p-2.5 bg-sky-950/30 border border-sky-900/40 text-sky-300 rounded-xl text-center text-[10px] font-bold flex items-center justify-center gap-1.5">
                            <span>📄</span>
                            <span>معاينة ملف PDF — يمكنك التنزيل بالزر الأخضر أعلاه إذا لم تظهر المعاينة</span>
                          </div>
                          <iframe
                            src={pdfSrc}
                            title={activeViewingDoc.name}
                            className="w-full h-[58vh] rounded-xl border border-slate-700 bg-slate-950"
                          />
                        </div>
                      );
                    }

                    if (isTxt) {
                      let textToShow = "جاري فك تشفير محتوى الملف...";
                      try {
                        const parts = activeViewingDoc.base64.split(",");
                        const b64 = parts[1] || parts[0];
                        textToShow = decodeURIComponent(escape(atob(b64)));
                      } catch (e) {
                        textToShow = "تعذّر تشغيل فك التشفير الخاص بالنصوص تلقائياً.";
                      }

                      return (
                        <div className="space-y-2 text-right">
                          <span className="text-[10px] text-slate-500 font-bold block">محتوى ملف النص المقروء:</span>
                          <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-850 text-xs font-mono text-right whitespace-pre-wrap select-text max-h-[58vh] overflow-y-auto">
                            {textToShow}
                          </pre>
                        </div>
                      );
                    }

                    // Fallback for other files (PPTX, XLSX, Docx, or binary)
                    return (
                      <div className="p-12 text-center bg-slate-950 border border-slate-850 rounded-2xl space-y-4 max-w-xl mx-auto shadow-xl">
                        <div className="w-16 h-16 bg-slate-850 border border-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                          📎
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-200">{activeViewingDoc.name}</h4>
                          <p className="text-[10px] text-slate-500">حجم الملف: {activeViewingDoc.sizeKb} KB · النوع: {activeViewingDoc.type}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed pt-2">
                            هذا الملف عبارة عن مستند دراسي أو هيكل ثنائي تفاعلي. لحمايته وتكامليته، يرجى الاستعانة بالنقر على زر التنزيل الأخضر بالأعلى لتنزيله واستخدامه على حاسوبك الخاص بسلام.
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Shared transcription/OCR notes sub-panel details if present */}
                  {activeViewingDoc.transcription && (
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-right">
                      <h5 className="text-[11px] font-extrabold text-indigo-400 flex items-center gap-1.5 justify-end">
                        <span>قراءة وتفريغ الذكاء الاصطناعي الحالي للمرفق:</span>
                        <span className="text-xs">📝</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                        {activeViewingDoc.transcription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-slate-950 border-t border-slate-850 text-center">
                  <p className="text-[10px] text-slate-500 font-bold select-none">
                    كافة مستندات وملفات المحاضرة تُحفظ وتشفر محلياً بخصوصية وسرية تامة على متصفح الطالب 🛡️
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 📋 Advanced Parametric Page Insertion Dialog */}
          {showComplexInsertModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 transition-all" dir="rtl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-right flex flex-col">
                <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                  <button
                    onClick={() => setShowComplexInsertModal(false)}
                    className="p-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-rose-400 hover:text-rose-350 font-extrabold text-xs transition duration-150 cursor-pointer"
                  >
                    إغلاق ×
                  </button>
                  <h3 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <span>إضافة صفحة ورقية مخصصة بالدفتر</span>
                    <span>📑</span>
                  </h3>
                </div>

                <div className="p-5 space-y-4 font-sansArabic">
                  {/* Position selector */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">موضع وموقع إدراج الورقة الجديدة:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setInsertPagePosition('before')}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                          insertPagePosition === 'before'
                            ? 'bg-indigo-650/30 border-indigo-500 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        قبل الورقة الحالية (ص.{activePageNumber})
                      </button>
                      <button
                        onClick={() => setInsertPagePosition('after')}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                          insertPagePosition === 'after'
                            ? 'bg-indigo-650/30 border-indigo-500 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        بعد الورقة الحالية (ص.{activePageNumber})
                      </button>
                      <button
                        onClick={() => setInsertPagePosition('end')}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                          insertPagePosition === 'end'
                            ? 'bg-indigo-650/30 border-indigo-500 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        في نهاية الدفتر
                      </button>
                    </div>
                  </div>

                  {/* Template Type */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">تطبيق قالب ومنهج تخطيط الورقة:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'blank', title: 'صفحة فارغة 📄' },
                        { id: 'cornell', title: 'ملاحظات كورنيل 📝' },
                        { id: 'math', title: 'تخطيط رياضي 📐' },
                        { id: 'timeline', title: 'جدول زمني ⏳' },
                        { id: 'mindmap', title: 'خريطة ذهنية 🕸️' }
                      ].map(item => (
                        <button
                          key={item.id}
                          onClick={() => setInsertPageTemplate(item.id as any)}
                          className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                            insertPageTemplate === item.id
                              ? 'bg-indigo-650/30 border-indigo-500 text-indigo-305 text-indigo-300'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-850'
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background patterns */}
                  <div className="space-y-1.5 text-right">
                    <label className="text-[10px] text-slate-400 font-bold block">نمط ونقش الخلفية البيانية:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'ruled', title: 'مسطرة كلاسيك 🪵' },
                        { id: 'grid', title: 'مربعات حسابية 🧮' },
                        { id: 'plain', title: 'ورقة صماء بيضاء' },
                        { id: 'dotted', title: 'نقاط منثورة 📍' },
                        { id: 'oldPaper', title: 'ورق قديم أثري 📜' },
                        { id: 'isoNetwork', title: 'شبكة هندسية 📡' }
                      ].map(pat => (
                        <button
                          key={pat.id}
                          onClick={() => setInsertPageBgPattern(pat.id as any)}
                          className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                            insertPageBgPattern === pat.id
                              ? 'bg-indigo-650/30 border-indigo-500 text-indigo-305 text-indigo-300'
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-850'
                          }`}
                        >
                          {pat.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Confirm insertion button */}
                  <div className="pt-3">
                    <button
                      onClick={() => handleInsertPageAdaptive({
                        position: insertPagePosition,
                        template: insertPageTemplate,
                        bgPattern: insertPageBgPattern
                      })}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer"
                    >
                      تأكيد إدراج وتوليد الصفحة الجديدة بالدفتر ✨
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🧠 Advanced Parametric AI Document Analysis Modal */}
          {analyzingDocItem && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 transition-all" dir="rtl">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-right flex flex-col">
                <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
                  <button
                    onClick={() => setAnalyzingDocItem(null)}
                    disabled={isPerformingDocumentAnalysis}
                    className="p-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-rose-450 hover:text-rose-300 font-extrabold text-xs transition duration-150 cursor-pointer disabled:opacity-50"
                  >
                    إغلاق ×
                  </button>
                  <h3 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                    <span>محلل المقررات والمذكرات الذكي (AI)</span>
                    <span>🧠</span>
                  </h3>
                </div>

                <div className="p-5 space-y-4 font-sansArabic text-right">
                  <div className="bg-slate-950 p-3 rounded-lg border border-indigo-950/40 space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold block">الملف المختار للتحليل والاستذكار:</span>
                    <h5 className="text-xs font-extrabold text-slate-200 truncate">{analyzingDocItem.name}</h5>
                    <span className="text-[9px] text-slate-505 text-slate-400 block">حجم المستند: {analyzingDocItem.sizeKb} KB · الصيغة المرجعية: {analyzingDocItem.type}</span>
                  </div>

                  {/* 1. Analysis Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block">تحديد نوع المعالجة الأكاديمية المطلوبة:</label>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => setAnalysisTypeSelect('bullet_points')}
                        className={`w-full p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                          analysisTypeSelect === 'bullet_points'
                            ? 'bg-indigo-650/15 border-indigo-500/80 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-sm">📌</span>
                        <div className="flex-1 text-right">
                          <h6 className="text-[11px] font-black">استخراج النقاط الرئيسية واللمحات المفتاحية</h6>
                          <p className="text-[9px] text-slate-505 text-slate-400 font-sansArabic">يقوم البروفيسور باستخراج أهم محاور الشرائح والصفحات بشكل مستقل ومتقن للسرعة والمقاصد الكبرى.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setAnalysisTypeSelect('quiz')}
                        className={`w-full p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                          analysisTypeSelect === 'quiz'
                            ? 'bg-indigo-650/15 border-indigo-500/80 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-sm">📝</span>
                        <div className="flex-1 text-right">
                          <h6 className="text-[11px] font-black">توليد بنك ورش وأسئلة تدريبية متكاملة (20 - 30 سؤالاً)</h6>
                          <p className="text-[9px] text-slate-505 text-slate-400 font-sansArabic">تجميع فوري من 20 إلى 30 سؤال اختبار شامل مع الأجوبة المفصلة لتأكيد الفهم واجتياز الاختبار بامتياز.</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setAnalysisTypeSelect('summary')}
                        className={`w-full p-2.5 rounded-xl border text-right transition flex items-center gap-2 ${
                          analysisTypeSelect === 'summary'
                            ? 'bg-indigo-650/15 border-indigo-500/80 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className="text-sm">📚</span>
                        <div className="flex-1 text-right">
                          <h6 className="text-[11px] font-black">تخليص شامل فائق للمستند الدراسي بموديلات كورنيل</h6>
                          <p className="text-[9px] text-slate-505 text-slate-400 font-sansArabic">نظرة عامة متقنة للغاية تجمع الأفكار المترابطة والخرائط ليكون المستند متاحاً ومفهوماً بلغة رصينة.</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 2. Page range choice */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold block font-sansArabic">تحديد مدى ونطاق التحليل الورقي:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setAnalysisPageRange('all')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition ${
                          analysisPageRange === 'all'
                            ? 'bg-indigo-650/20 border-indigo-500 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-850'
                        }`}
                      >
                        📚 جميع صفحات ومحتوى الملف
                      </button>
                      <button
                        onClick={() => setAnalysisPageRange('custom')}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition ${
                          analysisPageRange === 'custom'
                            ? 'bg-indigo-650/20 border-indigo-500 text-indigo-305 text-indigo-300'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-850'
                        }`}
                      >
                        ✂️ تحديد نطاق صفحات مخصص
                      </button>
                    </div>

                    {analysisPageRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-xl border border-slate-850 items-center">
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 font-bold block">إلى الصفحة:</span>
                          <input
                            type="number"
                            min={analysisCustomStart}
                            value={analysisCustomEnd}
                            onChange={(e) => setAnalysisCustomEnd(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-center text-slate-200 rounded p-1 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-slate-500 font-bold block">من الصفحة:</span>
                          <input
                            type="number"
                            min={1}
                            value={analysisCustomStart}
                            onChange={(e) => setAnalysisCustomStart(parseInt(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-800 text-xs text-center text-slate-200 rounded p-1 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Items Per Page Selection */}
                  <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] bg-indigo-950/80 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-900">
                        {analysisItemsPerPage} {analysisTypeSelect === 'bullet_points' ? 'نقاط' : analysisTypeSelect === 'quiz' ? 'أسئلة' : 'فقرات'}
                      </span>
                      <label className="text-[10px] text-slate-400 font-bold block font-sansArabic">
                        العدد المطلوب استخراجه من كل صفحة (بحد أقصى 10):
                      </label>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAnalysisItemsPerPage(num)}
                          className={`p-1.5 rounded-lg text-xs font-mono font-bold text-center transition cursor-pointer ${
                            analysisItemsPerPage === num
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    {analysisPageRange === 'custom' && (
                      <p className="text-[9px] text-indigo-400 font-sansArabic text-left pt-1">
                        ✨ المجموع المقدر لـ {Math.max(1, analysisCustomEnd - analysisCustomStart + 1)} صفحات هو:{" "}
                        <span className="font-extrabold text-xs underline decoration-indigo-500 text-white">
                          {Math.max(1, analysisCustomEnd - analysisCustomStart + 1) * analysisItemsPerPage}
                        </span>{" "}
                        {analysisTypeSelect === 'bullet_points' ? 'نقاط رئيسية' : analysisTypeSelect === 'quiz' ? 'أسئلة وإجابات نموذجية' : 'فقرات ملخصة'}
                      </p>
                    )}
                  </div>

                  {/* Action trigger */}
                  <div className="pt-3">
                    <button
                      onClick={() => handleAnalyzeDocumentAdvanced(analyzingDocItem)}
                      disabled={isPerformingDocumentAnalysis}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-500 text-white font-black text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isPerformingDocumentAnalysis ? (
                        <>
                          <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                          <span>جاري فحص وتفكيك الأوراق الآن...</span>
                        </>
                      ) : (
                        <span>✨ تشغيل معالجات الـ AI وإنتاج مخرجات التحليل</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hidden camera / image file input for OCR scan */}
          <input
            ref={cameraFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraFileSelected}
          />


        </div>

      </div>
  );
}
