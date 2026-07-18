import { StudySession, DailyQuestions, ErrorBookItem, SpecialImportanceItem, UserSettings, MockTest } from './types';
import { secureJsonParse, cleanObjectPrototype } from './utils/security';

const DB_NAME = 'PrepTrackDB';
const DB_VERSION = 2;

class MemoryFallback {
  private static storage: Record<string, string> = {};

  public static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return this.storage[key] || null;
    }
  }

  public static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      this.storage[key] = value;
    }
  }

  public static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      delete this.storage[key];
    }
  }

  public static clear(): void {
    try {
      localStorage.clear();
    } catch {
      this.storage = {};
    }
  }
}

export class PrepTrackDB {
  private static db: IDBDatabase | null = null;
  private static isFallback: boolean = false;

  public static isFallbackEnabled(): boolean {
    if (this.isFallback) return true;
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined' || !window.indexedDB) {
      this.isFallback = true;
      return true;
    }
    return false;
  }

  public static async getDB(): Promise<IDBDatabase> {
    if (this.isFallbackEnabled()) {
      throw new Error('Using fallback storage');
    }
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      try {
        if (!window.indexedDB) {
          this.isFallback = true;
          reject('IndexedDB not supported');
          return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          console.warn('IndexedDB opened with error, falling back to localStorage:', event);
          this.isFallback = true;
          reject('Could not open IndexedDB');
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Settings Store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }

          // Study Sessions Store
          if (!db.objectStoreNames.contains('study_sessions')) {
            db.createObjectStore('study_sessions', { keyPath: 'id' });
          }

          // Questions Solved Store
          if (!db.objectStoreNames.contains('questions_solved')) {
            db.createObjectStore('questions_solved', { keyPath: 'date' });
          }

          // Error Book Store
          if (!db.objectStoreNames.contains('error_book')) {
            db.createObjectStore('error_book', { keyPath: 'id' });
          }

          // Special Importance Store
          if (!db.objectStoreNames.contains('special_importance')) {
            db.createObjectStore('special_importance', { keyPath: 'id' });
          }

          // Chapter Completion Store
          if (!db.objectStoreNames.contains('chapter_completion')) {
            db.createObjectStore('chapter_completion', { keyPath: 'id' });
          }

          // Mock Tests Store
          if (!db.objectStoreNames.contains('mock_tests')) {
            db.createObjectStore('mock_tests', { keyPath: 'id' });
          }
        };
      } catch (e) {
        console.warn('Failed to open IndexedDB synchronously, falling back to localStorage:', e);
        this.isFallback = true;
        reject(e);
      }
    });
  }

  // --- SETTINGS OPERATIONS ---
  public static async getSettings(): Promise<UserSettings> {
    const defaults: UserSettings = {
      theme: 'glass',
      pomodoroWorkDuration: 25,
      pomodoroBreakDuration: 5,
      dailyStudyMinutesGoal: 180,
      dailyQuestionsSolvedGoal: 30,
      clockFormat: '12',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    };

    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_settings');
      return secureJsonParse<UserSettings>(val, defaults);
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('settings', 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get('user_settings');

        request.onsuccess = () => {
          if (request.result) {
            resolve(cleanObjectPrototype<UserSettings>(request.result));
          } else {
            resolve(defaults);
          }
        };

        request.onerror = () => {
          resolve(defaults);
        };
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_settings');
      return secureJsonParse<UserSettings>(val, defaults);
    }
  }

  public static async saveSettings(settings: UserSettings): Promise<void> {
    const cleaned = cleanObjectPrototype<UserSettings>(settings);
    if (this.isFallbackEnabled()) {
      MemoryFallback.setItem('preptrack_settings', JSON.stringify(cleaned));
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ ...cleaned, id: 'user_settings' });

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save settings');
      });
    } catch {
      MemoryFallback.setItem('preptrack_settings', JSON.stringify(cleaned));
    }
  }

  // --- STUDY SESSION OPERATIONS ---
  public static async getStudySessions(): Promise<StudySession[]> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_study_sessions');
      return secureJsonParse<StudySession[]>(val, []);
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('study_sessions', 'readonly');
        const store = transaction.objectStore('study_sessions');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result || [];
          const cleaned = items.map(item => cleanObjectPrototype<StudySession>(item));
          const sorted = cleaned.sort((a, b) => b.startTime - a.startTime);
          resolve(sorted);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_study_sessions');
      return secureJsonParse<StudySession[]>(val, []);
    }
  }

  public static async saveStudySession(session: StudySession): Promise<void> {
    const cleanedSession = cleanObjectPrototype<StudySession>(session);
    if (this.isFallbackEnabled()) {
      try {
        const sessions = await this.getStudySessions();
        const index = sessions.findIndex(s => s.id === cleanedSession.id);
        if (index > -1) {
          sessions[index] = cleanedSession;
        } else {
          sessions.push(cleanedSession);
        }
        MemoryFallback.setItem('preptrack_study_sessions', JSON.stringify(sessions));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('study_sessions', 'readwrite');
        const store = transaction.objectStore('study_sessions');
        const request = store.put(cleanedSession);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save study session');
      });
    } catch {
      try {
        const sessions = await this.getStudySessions();
        const index = sessions.findIndex(s => s.id === cleanedSession.id);
        if (index > -1) {
          sessions[index] = cleanedSession;
        } else {
          sessions.push(cleanedSession);
        }
        MemoryFallback.setItem('preptrack_study_sessions', JSON.stringify(sessions));
      } catch {}
    }
  }

  public static async deleteStudySession(id: string): Promise<void> {
    if (this.isFallbackEnabled()) {
      try {
        const sessions = await this.getStudySessions();
        const filtered = sessions.filter(s => s.id !== id);
        MemoryFallback.setItem('preptrack_study_sessions', JSON.stringify(filtered));
      } catch (e) {
        console.error('Fallback delete error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('study_sessions', 'readwrite');
        const store = transaction.objectStore('study_sessions');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete study session');
      });
    } catch {
      try {
        const sessions = await this.getStudySessions();
        const filtered = sessions.filter(s => s.id !== id);
        MemoryFallback.setItem('preptrack_study_sessions', JSON.stringify(filtered));
      } catch {}
    }
  }

  // --- QUESTIONS SOLVED OPERATIONS ---
  public static async getQuestionsSolved(): Promise<DailyQuestions[]> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_questions_solved');
      return secureJsonParse<DailyQuestions[]>(val, []);
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('questions_solved', 'readonly');
        const store = transaction.objectStore('questions_solved');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result || [];
          const cleaned = items.map(item => cleanObjectPrototype<DailyQuestions>(item));
          const sorted = cleaned.sort((a, b) => a.date.localeCompare(b.date));
          resolve(sorted);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_questions_solved');
      return secureJsonParse<DailyQuestions[]>(val, []);
    }
  }

  public static async saveQuestionsSolved(record: DailyQuestions): Promise<void> {
    const cleanedRecord = cleanObjectPrototype<DailyQuestions>(record);
    if (this.isFallbackEnabled()) {
      try {
        const items = await this.getQuestionsSolved();
        const index = items.findIndex(i => i.date === cleanedRecord.date);
        if (index > -1) {
          items[index] = cleanedRecord;
        } else {
          items.push(cleanedRecord);
        }
        MemoryFallback.setItem('preptrack_questions_solved', JSON.stringify(items));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('questions_solved', 'readwrite');
        const store = transaction.objectStore('questions_solved');
        const request = store.put(cleanedRecord);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save questions solved');
      });
    } catch {
      try {
        const items = await this.getQuestionsSolved();
        const index = items.findIndex(i => i.date === cleanedRecord.date);
        if (index > -1) {
          items[index] = cleanedRecord;
        } else {
          items.push(cleanedRecord);
        }
        MemoryFallback.setItem('preptrack_questions_solved', JSON.stringify(items));
      } catch {}
    }
  }

  // --- ERROR BOOK OPERATIONS ---
  public static async getErrorBook(): Promise<ErrorBookItem[]> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_error_book');
      return secureJsonParse<ErrorBookItem[]>(val, []);
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('error_book', 'readonly');
        const store = transaction.objectStore('error_book');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result || [];
          const cleaned = items.map(item => cleanObjectPrototype<ErrorBookItem>(item));
          const sorted = cleaned.sort((a, b) => b.timestamp - a.timestamp);
          resolve(sorted);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_error_book');
      return secureJsonParse<ErrorBookItem[]>(val, []);
    }
  }

  public static async saveErrorBookItem(item: ErrorBookItem): Promise<void> {
    const cleanedItem = cleanObjectPrototype<ErrorBookItem>(item);
    if (this.isFallbackEnabled()) {
      try {
        const items = await this.getErrorBook();
        const index = items.findIndex(i => i.id === cleanedItem.id);
        if (index > -1) {
          items[index] = cleanedItem;
        } else {
          items.push(cleanedItem);
        }
        MemoryFallback.setItem('preptrack_error_book', JSON.stringify(items));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('error_book', 'readwrite');
        const store = transaction.objectStore('error_book');
        const request = store.put(cleanedItem);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save error book item');
      });
    } catch {
      try {
        const items = await this.getErrorBook();
        const index = items.findIndex(i => i.id === cleanedItem.id);
        if (index > -1) {
          items[index] = cleanedItem;
        } else {
          items.push(cleanedItem);
        }
        MemoryFallback.setItem('preptrack_error_book', JSON.stringify(items));
      } catch {}
    }
  }

  public static async deleteErrorBookItem(id: string): Promise<void> {
    if (this.isFallbackEnabled()) {
      try {
        const items = await this.getErrorBook();
        const filtered = items.filter(i => i.id !== id);
        MemoryFallback.setItem('preptrack_error_book', JSON.stringify(filtered));
      } catch (e) {
        console.error('Fallback delete error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('error_book', 'readwrite');
        const store = transaction.objectStore('error_book');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete error book item');
      });
    } catch {
      try {
        const items = await this.getErrorBook();
        const filtered = items.filter(i => i.id !== id);
        MemoryFallback.setItem('preptrack_error_book', JSON.stringify(filtered));
      } catch {}
    }
  }

  // --- SPECIAL IMPORTANCE OPERATIONS ---
  public static async getSpecialImportance(): Promise<SpecialImportanceItem[]> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_special_importance');
      return secureJsonParse<SpecialImportanceItem[]>(val, []);
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('special_importance', 'readonly');
        const store = transaction.objectStore('special_importance');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result || [];
          const cleaned = items.map(item => cleanObjectPrototype<SpecialImportanceItem>(item));
          const sorted = cleaned.sort((a, b) => b.timestamp - a.timestamp);
          resolve(sorted);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_special_importance');
      return secureJsonParse<SpecialImportanceItem[]>(val, []);
    }
  }

  public static async saveSpecialImportanceItem(item: SpecialImportanceItem): Promise<void> {
    const cleanedItem = cleanObjectPrototype<SpecialImportanceItem>(item);
    if (this.isFallbackEnabled()) {
      try {
        const items = await this.getSpecialImportance();
        const index = items.findIndex(i => i.id === cleanedItem.id);
        if (index > -1) {
          items[index] = cleanedItem;
        } else {
          items.push(cleanedItem);
        }
        MemoryFallback.setItem('preptrack_special_importance', JSON.stringify(items));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('special_importance', 'readwrite');
        const store = transaction.objectStore('special_importance');
        const request = store.put(cleanedItem);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save special importance item');
      });
    } catch {
      try {
        const items = await this.getSpecialImportance();
        const index = items.findIndex(i => i.id === cleanedItem.id);
        if (index > -1) {
          items[index] = cleanedItem;
        } else {
          items.push(cleanedItem);
        }
        MemoryFallback.setItem('preptrack_special_importance', JSON.stringify(items));
      } catch {}
    }
  }

  public static async deleteSpecialImportanceItem(id: string): Promise<void> {
    if (this.isFallbackEnabled()) {
      try {
        const items = await this.getSpecialImportance();
        const filtered = items.filter(i => i.id !== id);
        MemoryFallback.setItem('preptrack_special_importance', JSON.stringify(filtered));
      } catch (e) {
        console.error('Fallback delete error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('special_importance', 'readwrite');
        const store = transaction.objectStore('special_importance');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete special importance item');
      });
    } catch {
      try {
        const items = await this.getSpecialImportance();
        const filtered = items.filter(i => i.id !== id);
        MemoryFallback.setItem('preptrack_special_importance', JSON.stringify(filtered));
      } catch {}
    }
  }

  // --- CHAPTER COMPLETION OPERATIONS ---
  public static async getChapterCompletion(): Promise<Record<string, boolean>> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_chapter_completion');
      return secureJsonParse<Record<string, boolean>>(val, {});
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('chapter_completion', 'readonly');
        const store = transaction.objectStore('chapter_completion');
        const request = store.getAll();

        request.onsuccess = () => {
          const result: Record<string, boolean> = {};
          const items = request.result || [];
          items.forEach((item: { id: string; completed: boolean }) => {
            if (item && typeof item.id === 'string') {
              result[item.id] = !!item.completed;
            }
          });
          resolve(cleanObjectPrototype<Record<string, boolean>>(result));
        };
        request.onerror = () => resolve({});
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_chapter_completion');
      return secureJsonParse<Record<string, boolean>>(val, {});
    }
  }

  public static async saveChapterCompletion(id: string, completed: boolean): Promise<void> {
    const safeId = String(id).replace(/[^a-zA-Z0-9_\-]/g, '');
    if (this.isFallbackEnabled()) {
      try {
        const completions = await this.getChapterCompletion();
        completions[safeId] = completed;
        MemoryFallback.setItem('preptrack_chapter_completion', JSON.stringify(completions));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('chapter_completion', 'readwrite');
        const store = transaction.objectStore('chapter_completion');
        const request = store.put({ id: safeId, completed });

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save chapter completion');
      });
    } catch {
      try {
        const completions = await this.getChapterCompletion();
        completions[safeId] = completed;
        MemoryFallback.setItem('preptrack_chapter_completion', JSON.stringify(completions));
      } catch {}
    }
  }

  public static async clearChapterCompletions(): Promise<void> {
    if (this.isFallbackEnabled()) {
      MemoryFallback.removeItem('preptrack_chapter_completion');
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('chapter_completion', 'readwrite');
        const store = transaction.objectStore('chapter_completion');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to clear chapters');
      });
    } catch {
      MemoryFallback.removeItem('preptrack_chapter_completion');
    }
  }

  // --- MOCK TEST OPERATIONS ---
  public static async getMockTests(): Promise<MockTest[]> {
    if (this.isFallbackEnabled()) {
      const val = MemoryFallback.getItem('preptrack_mock_tests');
      return secureJsonParse<MockTest[]>(val, []);
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('mock_tests', 'readonly');
        const store = transaction.objectStore('mock_tests');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result || [];
          const cleaned = items.map(item => cleanObjectPrototype<MockTest>(item));
          const sorted = cleaned.sort((a, b) => b.timestamp - a.timestamp);
          resolve(sorted);
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      const val = MemoryFallback.getItem('preptrack_mock_tests');
      return secureJsonParse<MockTest[]>(val, []);
    }
  }

  public static async saveMockTest(test: MockTest): Promise<void> {
    const cleanedMock = cleanObjectPrototype<MockTest>(test);
    if (this.isFallbackEnabled()) {
      try {
        const tests = await this.getMockTests();
        const index = tests.findIndex(t => t.id === cleanedMock.id);
        if (index > -1) {
          tests[index] = cleanedMock;
        } else {
          tests.push(cleanedMock);
        }
        MemoryFallback.setItem('preptrack_mock_tests', JSON.stringify(tests));
      } catch (e) {
        console.error('Fallback save error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('mock_tests', 'readwrite');
        const store = transaction.objectStore('mock_tests');
        const request = store.put(cleanedMock);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save mock test');
      });
    } catch {
      try {
        const tests = await this.getMockTests();
        const index = tests.findIndex(t => t.id === cleanedMock.id);
        if (index > -1) {
          tests[index] = cleanedMock;
        } else {
          tests.push(cleanedMock);
        }
        MemoryFallback.setItem('preptrack_mock_tests', JSON.stringify(tests));
      } catch {}
    }
  }

  public static async deleteMockTest(id: string): Promise<void> {
    if (this.isFallbackEnabled()) {
      try {
        const tests = await this.getMockTests();
        const filtered = tests.filter(t => t.id !== id);
        MemoryFallback.setItem('preptrack_mock_tests', JSON.stringify(filtered));
      } catch (e) {
        console.error('Fallback delete error:', e);
      }
      return;
    }
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('mock_tests', 'readwrite');
        const store = transaction.objectStore('mock_tests');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete mock test');
      });
    } catch {
      try {
        const tests = await this.getMockTests();
        const filtered = tests.filter(t => t.id !== id);
        MemoryFallback.setItem('preptrack_mock_tests', JSON.stringify(filtered));
      } catch {}
    }
  }

  // --- RESET ALL DATA ---
  public static async resetAllData(): Promise<void> {
    if (this.isFallbackEnabled()) {
      MemoryFallback.clear();
      return;
    }
    try {
      const db = await this.getDB();
      db.close();
      this.db = null;

      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete database');
      });
    } catch {
      MemoryFallback.clear();
    }
  }
}
