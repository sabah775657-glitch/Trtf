import { University, AcademicYear, SubjectItem, Lecture, StudyStats, SecurityConfig, BackupRestoreConfig } from "./types";

// Seed data to give user a premium loaded notebook immediately
export const initialUniversities: University[] = [
  { id: "univ-1", name: "جامعة الملك سعود - كلية الحاسب" },
  { id: "univ-2", name: "جامعة القاهرة - الهندسة" }
];

export const initialYears: AcademicYear[] = [
  { id: "year-1", name: "السنة الثالثة - الفصل الأول", universityId: "univ-1" },
  { id: "year-2", name: "السنة الرابعة - مشروع التخرج", universityId: "univ-1" }
];

export const initialSubjects: SubjectItem[] = [
  { id: "sub-1", name: "الذكاء الاصطناعي ومعالجة اللغة", yearId: "year-1", color: "indigo" },
  { id: "sub-2", name: "الرياضيات المتقطعة للبرمجيات", yearId: "year-1", color: "purple" },
  { id: "sub-3", name: "خوارزميات وهياكل البيانات المتقدمة", yearId: "year-1", color: "sky" },
  { id: "sub-4", name: "الشبكات اللاسلكية والأمن السيبراني", yearId: "year-1", color: "rose" }
];

export const initialLectures: Lecture[] = [
  {
    id: "lec-1",
    title: "مقدمة نموذج الشبكات العصبية العميقة",
    date: "2026-06-11",
    subjectId: "sub-1",
    difficulty: "medium",
    bookmarked: true,
    tags: ["ذكاء_اصطناعي", "شبكات_عصبية", "تعلم_عميق"],
    pages: [
      {
        id: "page-1-1",
        pageNumber: 1,
        templateType: "cornell",
        bgPattern: "ruled",
        strokes: [
          {
            id: "str-1",
            color: "#4f46e5",
            brushType: "pen",
            width: 3,
            points: [
              { x: 100, y: 150 },
              { x: 150, y: 155 },
              { x: 200, y: 152 },
              { x: 250, y: 148 }
            ],
            layer: "drawings"
          }
        ],
        shapes: [
          {
            id: "shp-1",
            type: "circle",
            x: 200,
            y: 220,
            width: 80,
            height: 80,
            borderSize: 2,
            borderColor: "#6366f1",
            fillColor: "#e0e7ff80",
            text: "عصبون 입력",
            layer: "shapes"
          },
          {
            id: "shp-2",
            type: "rectangle",
            x: 400,
            y: 200,
            width: 140,
            height: 120,
            borderSize: 2,
            borderColor: "#a855f7",
            fillColor: "#f3e8ff80",
            text: "الطبقة الخفية (Hidden Layer)",
            layer: "shapes"
          },
          {
            id: "shp-3",
            type: "arrow",
            x: 290,
            y: 260,
            width: 100,
            height: 10,
            borderSize: 2,
            borderColor: "#3b82f6",
            fillColor: "#3b82f6",
            layer: "shapes"
          }
        ],
        stickers: [
          {
            id: "stk-1",
            type: "important",
            x: 50,
            y: 50,
            text: "هام جداً في الامتحان النهائي!",
            layer: "stickers"
          }
        ],
        textboxes: [
          {
            id: "txt-1",
            x: 100,
            y: 400,
            width: 350,
            height: 60,
            text: "قانون التنشيط (Sigmoid Activation Function) يحد المعطيات بين 0 و 1.",
            color: "#374151",
            fontSize: 14,
            layer: "textboxes"
          }
        ],
        cornellCues: "ما هو عصبون الإدخال؟\nما الغرض من دالة التنشيط؟",
        cornellSummary: "تتكون الشبكة العصبية من طبقة إدخال وطبقة مخفية وطبقة إخراج، وتعمل دالة التنشيط Sigmoid على ملاءمة القيم غير الخطية لتوسيع استيعاب النموذج الرياضي."
      }
    ],
    recordings: [
      {
        id: "rec-1",
        title: "تسجيل الأستاذ - الدالة المنشطة وموجز الشبكات",
        durationSeconds: 154,
        timestamp: "2026-06-11T10:30:00.000Z",
        transcription: "في هذه المحاضرة ركزنا على نموذج العصبون الاصطناعي وكيف يعالج المدخلات بضربها بالأوزان ثم جمع قيم التحيز قبل إمرارها للدالة المنشطة مثل سيجمويد أو ريلو.",
        markers: [
          { id: "m-1", timeSeconds: 15, label: "طرح سؤال الأوزان" },
          { id: "m-2", timeSeconds: 65, label: "شرح دالة Sigmoid بالتفصيل" },
          { id: "m-3", timeSeconds: 120, label: "توضيح شكل طبقات المعالجة" }
        ]
      }
    ],
    aiSummary: {
      summary: "تقدم هذه المحاضرة شرحاً وافياً لتركيبة الشبكات العصبية العميقة. تركز على محاكاة الخلايا العصبية البيولوجية، واستخدام الأوزان والتحيزات لتدريب الآلة. تنتهي بالتطرق للقيمة الرياضية للدوال المنشطة.",
      keyPoints: [
        "الشبكات العصبية مستوحاة من الدماغ البشري لمعالجة المعطيات.",
        "عصبونات الإدخال تضرب قيمها بالأوزان المقابلة ويضاف لها انحياز (bias).",
        "وظيفة دالة التنشيط هي إدخال ميزة اللاخطية للشبكة لتستطيع تتبع مسائل معقدة."
      ],
      keywords: ["الذكاء الاصطناعي", "الخوارزميات العصبية", "دالة التنشيط", "التعلم العميق"]
    },
    quiz: [
      {
        question: "ما هي دالة التنشيط الأكثر شيوعاً لحصر البيانات بين 0 و 1؟",
        options: ["ReLU", "Sigmoid", "Tanh", "LeakyReLU"],
        answerIndex: 1,
        explanation: "دالة Sigmoid تقوم بضغط أي عدد حقيقي إلى قيمة بين 0 و 1، وهي مثالية للاحتمالات الثنائية."
      },
      {
        question: "أي من العناصر التالية يضاف للمدخلات بعد ضربها بالأوزان في المعادلة الخلوية؟",
        options: ["الانحياز (Bias)", "دالة الفقدان", "معامل التعلم", "الطبقة المسترجعة"],
        answerIndex: 0,
        explanation: "معادلة العصبون هي (W*X + b)، حيث b يمثل الانحياز (Bias)."
      }
    ],
    flashcards: [
      { id: "fc-1", front: "ما دور الأوزان (Weights)؟", back: "تحديد قوة وأهمية كل مدخل في اتخاذ القرار داخل العصبون الاصطناعي." },
      { id: "fc-2", front: "لماذا نحتاج اللاخطية (Non-linearity)؟", back: "بدون دالة تنشيط لا خطية، ستتصرف الشبكة العصبية العميقة مثل دالة خطية واحدة بسيطة ولن تتمكن من حل المشاكل المعقدة." }
    ],
    changelog: [
      { id: "chg-1", version: 1, timestamp: "2026-06-11T12:00:00.000Z", author: "أنا", description: "إنشاء المحاضرة وإضافة الرسمة وصوت الأستاذ." }
    ]
  },
  {
    id: "lec-2",
    title: "الرياضيات المتقطعة: المجموعات والعلاقات الثنائية",
    date: "2026-06-12",
    subjectId: "sub-2",
    difficulty: "hard",
    bookmarked: false,
    tags: ["مجموعات", "علاقات_ثنائية", "منطق_رياضي"],
    pages: [
      {
        id: "page-2-1",
        pageNumber: 1,
        templateType: "math",
        bgPattern: "grid",
        strokes: [],
        shapes: [
          {
            id: "shp-4",
            type: "rectangle",
            x: 80,
            y: 80,
            width: 320,
            height: 180,
            borderSize: 2,
            borderColor: "#10b981",
            fillColor: "#ecfdf580",
            text: "المجموعات المتناهية A x B",
            layer: "shapes"
          }
        ],
        stickers: [
          {
            id: "stk-2",
            type: "definition",
            x: 90,
            y: 100,
            text: "العلاقة الانعكاسية: عندما يرتبط كل عنصر بنفسه.",
            layer: "stickers"
          }
        ],
        textboxes: []
      }
    ],
    recordings: [],
    changelog: [
      { id: "chg-2", version: 1, timestamp: "2026-06-12T14:30:00.000Z", author: "أنا", description: "بدء كتابة الأساسيات." }
    ]
  }
];

export const initialStats: StudyStats = {
  totalLectures: 3,
  hoursStudied: 12.5,
  streakDays: 4,
  xpPoints: 340,
  medals: [
    { id: "med-1", title: "أول محاضرة", description: "تم تدوين وحفظ أول محاضرة دراسية بالكامل بنجاح.", unlockedAt: "2026-06-11T11:00:00.000Z", icon: "CheckCircle" },
    { id: "med-2", title: "إتقان التلخيص", description: "استخدمت ميزة الذكاء الاصطناعي لإنشاء تلخيص ممتاز لمحاضرتك.", unlockedAt: "2026-06-11T11:15:00.000Z", icon: "Sparkles" },
    { id: "med-3", title: "أول رسم هندسي متقن", description: "استخدام ميزة تحويل الرسم اليدوي لأشكال ذكية ومثالية.", unlockedAt: "2026-06-12T14:40:00.000Z", icon: "LayoutTemplate" },
    { id: "med-4", title: "محب الاستطلاع الأكاديمي", description: "الاستماع إلى 3 تسجيلات صوتية مختلفة للأساتذة في نفس الأسبوع.", icon: "Music" },
    { id: "med-5", title: "بطل الامتحانات", description: "حل 5 اختبارات ذكية تم توليدها بالذكاء الاصطناعي بنجاح.", icon: "Award" }
  ]
};

export const initialSecurity: SecurityConfig = {
  isEnabled: false,
  pinCode: "",
  hiddenSubjectIds: []
};

export const initialBackup: BackupRestoreConfig = {
  isAutoBackupEnabled: true,
  schedule: "weekly",
  backupsList: [
    { id: "bak-1", timestamp: "2026-06-10T22:00:00.000Z", sizeKb: 142, lecturesCount: 2 }
  ]
};

// LocalStorage Persistence utility
const STORAGE_KEYS = {
  UNIVERSITIES: "unnoted_universities",
  YEARS: "unnoted_academic_years",
  SUBJECTS: "unnoted_subjects",
  LECTURES: "unnoted_lectures",
  STATS: "unnoted_stats",
  SECURITY: "unnoted_security",
  BACKUP: "unnoted_backup"
};

export function loadAppState() {
  let universities = initialUniversities;
  let years = initialYears;
  let subjects = initialSubjects;
  let lectures = initialLectures;
  let stats = initialStats;
  let security = initialSecurity;
  let backup = initialBackup;

  try {
    const rawUniversities = localStorage.getItem(STORAGE_KEYS.UNIVERSITIES);
    if (rawUniversities) universities = JSON.parse(rawUniversities);
  } catch (e) {
    console.error("Failed to parse universities state", e);
  }

  try {
    const rawYears = localStorage.getItem(STORAGE_KEYS.YEARS);
    if (rawYears) years = JSON.parse(rawYears);
  } catch (e) {
    console.error("Failed to parse years state", e);
  }

  try {
    const rawSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    if (rawSubjects) subjects = JSON.parse(rawSubjects);
  } catch (e) {
    console.error("Failed to parse subjects state", e);
  }

  try {
    const rawLectures = localStorage.getItem(STORAGE_KEYS.LECTURES);
    if (rawLectures) lectures = JSON.parse(rawLectures);
  } catch (e) {
    console.error("Failed to parse lectures state", e);
  }

  try {
    const rawStats = localStorage.getItem(STORAGE_KEYS.STATS);
    if (rawStats) stats = JSON.parse(rawStats);
  } catch (e) {
    console.error("Failed to parse stats state", e);
  }

  try {
    const rawSecurity = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (rawSecurity) security = JSON.parse(rawSecurity);
  } catch (e) {
    console.error("Failed to parse security state", e);
  }

  try {
    const rawBackup = localStorage.getItem(STORAGE_KEYS.BACKUP);
    if (rawBackup) backup = JSON.parse(rawBackup);
  } catch (e) {
    console.error("Failed to parse backup state", e);
  }

  return {
    universities,
    years,
    subjects,
    lectures,
    stats,
    security,
    backup
  };
}

export function saveAppState(state: {
  universities: University[];
  years: AcademicYear[];
  subjects: SubjectItem[];
  lectures: Lecture[];
  stats: StudyStats;
  security: SecurityConfig;
  backup: BackupRestoreConfig;
}) {
  const trySet = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      if (e?.name === "QuotaExceededError" || e?.code === 22) {
        console.warn("localStorage quota exceeded — clearing old strokes to free space.");
        try {
          const lectures = JSON.parse(localStorage.getItem(STORAGE_KEYS.LECTURES) || "[]");
          const trimmed = lectures.map((lec: any) => ({
            ...lec,
            pages: lec.pages?.map((pg: any) => ({ ...pg, strokes: pg.strokes?.slice(-30) ?? [] }))
          }));
          localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(trimmed));
          localStorage.setItem(key, value);
        } catch { /* give up silently */ }
      }
    }
  };
  trySet(STORAGE_KEYS.UNIVERSITIES, JSON.stringify(state.universities));
  trySet(STORAGE_KEYS.YEARS, JSON.stringify(state.years));
  trySet(STORAGE_KEYS.SUBJECTS, JSON.stringify(state.subjects));
  trySet(STORAGE_KEYS.LECTURES, JSON.stringify(state.lectures));
  trySet(STORAGE_KEYS.STATS, JSON.stringify(state.stats));
  trySet(STORAGE_KEYS.SECURITY, JSON.stringify(state.security));
  trySet(STORAGE_KEYS.BACKUP, JSON.stringify(state.backup));
}
