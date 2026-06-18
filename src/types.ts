/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Academic Structure
export interface University {
  id: string;
  name: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  universityId: string;
}

export interface SubjectItem {
  id: string;
  name: string;
  yearId: string;
  color: string; // Tailwind color name like 'blue', 'purple', etc.
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Canvas Drawings & Shapes
export interface Point {
  x: number;
  y: number;
  time?: number; // for path-audio syncing
}

export interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  brushType: 'pen' | 'pencil' | 'highlighter';
  width: number;
  layer: 'drawings' | 'notes';
}

export interface GeometricShape {
  id: string;
  type: 'square' | 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'line' | 'star' | 'heart' | 'cube' | 'pyramid' | 'sphere' | 'cylinder' | 'cone';
  x: number;
  y: number;
  width: number;
  height: number;
  borderSize: number;
  borderColor: string;
  fillColor: string; // 'transparent' or hex/tailwind class
  text?: string; // Text printed inside or next to shape
  layer: 'shapes';
}

export interface StickerSticker {
  id: string;
  type: 'important' | 'question' | 'note' | 'definition' | 'law' | 'example' | 'formula' | 'chart';
  x: number;
  y: number;
  text: string;
  layer: 'stickers';
}

export interface DragTextbox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  fontSize: number;
  layer: 'textboxes';
}

export type bgType = 'ruled' | 'grid' | 'dotted' | 'plain' | 'oldPaper' | 'isoNetwork';

// Canvas Page Data
export interface PageData {
  id: string;
  pageNumber: number;
  templateType: 'cornell' | 'math' | 'timeline' | 'blank' | 'mindmap';
  bgPattern: bgType;
  strokes: DrawingStroke[];
  shapes: GeometricShape[];
  stickers: StickerSticker[];
  textboxes: DragTextbox[];
  cornellSummary?: string;
  cornellCues?: string;
  bgImage?: string; // Base64 or background image URL of the imported page for draw/annotations
}

// Media Audio Recording with timestamps & transcription
export interface TimeMarker {
  id: string;
  timeSeconds: number;
  label: string;
  noteRefId?: string; // reference to a stroke or shape created at this moment
}

export interface AudioRecording {
  id: string;
  title: string;
  durationSeconds: number;
  timestamp: string;
  audioBlobUrl?: string; // transient
  audioBase64?: string; // to persist locally in IndexedDB
  audioChunksCount?: number;
  transcription?: string;
  markers: TimeMarker[];
  type?: 'audio' | 'video'; // added to support both Professor Voice and Lecturer Video recording
  videoUrl?: string; // added to store transient video clip previews
  folderId?: string; // ID of the folder it belongs to
}

// AI Summary & Metadata
export interface AISummary {
  summary: string;
  keyPoints: string[];
  keywords: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  knowStatus?: 'dont_know' | 'partial' | 'know_well';
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ChangelogEntry {
  id: string;
  version: number;
  timestamp: string;
  author: string;
  description: string;
  snapshotData?: string; // PageData serialized snapshot
}

// Lecture Document / Uploaded Resource
export interface Folder {
  id: string;
  name: string;
  parentId?: string; // optional parent folder
}

export interface LectureDocument {
  id: string;
  name: string;
  type: string; // mimeType (e.g. application/pdf, video/mp4, image/jpeg, etc.)
  sizeKb: number;
  base64: string; // content to persist across reloads
  timestamp: string;
  transcription?: string; // OCR text, audio text transcription, or analysis details
  folderId?: string; // ID of the folder it belongs to
}

// Lecture Object
export interface Lecture {
  id: string;
  title: string;
  date: string;
  subjectId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bookmarked: boolean;
  tags: string[];
  pages: PageData[];
  recordings: AudioRecording[];
  folders: Folder[]; // Added folders
  documents?: LectureDocument[]; // optional uploaded files list
  aiSummary?: AISummary;
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  lectureText?: string;
  changelog: ChangelogEntry[];
  studyPlanAdvice?: {
    plan: string;
    recommendations: string;
    tips: string;
  };
}

// System Gamification / Metrics
export interface StudyStats {
  totalLectures: number;
  hoursStudied: number;
  streakDays: number;
  xpPoints: number;
  medals: {
    id: string;
    title: string;
    description: string;
    unlockedAt?: string;
    icon: string; // lucide icon identifier
  }[];
}

// Local PIN lock settings
export interface SecurityConfig {
  isEnabled: boolean;
  pinCode: string;
  hiddenSubjectIds: string[]; // subjects hidden under security pin
}

// Backup Restore Config
export interface BackupRestoreConfig {
  isAutoBackupEnabled: boolean;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  lastBackupDate?: string;
  backupsList: {
    id: string;
    timestamp: string;
    sizeKb: number;
    lecturesCount: number;
  }[];
}
