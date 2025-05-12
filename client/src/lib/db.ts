import { openDB, deleteDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
interface NCHSDatabase extends DBSchema {
  students: {
    key: number;
    value: any;
    indexes: { 'by-class': string; 'by-teacher': number };
  };
  progress: {
    key: number;
    value: any;
    indexes: { 'by-student': number };
  };
  teachingPlans: {
    key: number;
    value: any;
    indexes: { 'by-class': string; 'by-type': string; 'by-teacher': number };
  };
  users: {
    key: number;
    value: any;
    indexes: { 'by-email': string; 'by-role': string };
  };
  suggestions: {
    key: string;
    value: { suggestions: string; timestamp: number };
  };
}

// Database version
const DB_VERSION = 1;
const DB_NAME = 'nepal-central-hs-db';

// Function to initialize the database
export async function initDatabase(): Promise<IDBPDatabase<NCHSDatabase>> {
  return openDB<NCHSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist

      // Students store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: 'id' });
        studentStore.createIndex('by-class', 'class');
        studentStore.createIndex('by-teacher', 'teacherId');
      }

      // Progress store
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
        progressStore.createIndex('by-student', 'studentId');
      }

      // Teaching plans store
      if (!db.objectStoreNames.contains('teachingPlans')) {
        const planStore = db.createObjectStore('teachingPlans', { keyPath: 'id' });
        planStore.createIndex('by-class', 'class');
        planStore.createIndex('by-type', 'type');
        planStore.createIndex('by-teacher', 'teacherId');
      }

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-email', 'email', { unique: true });
        userStore.createIndex('by-role', 'role');
      }

      // Suggestions cache store
      if (!db.objectStoreNames.contains('suggestions')) {
        db.createObjectStore('suggestions', { keyPath: 'id' });
      }
    },
  });
}

// Get the database instance
let dbPromise: Promise<IDBPDatabase<NCHSDatabase>>;

export function getDb(): Promise<IDBPDatabase<NCHSDatabase>> {
  if (!dbPromise) {
    dbPromise = initDatabase();
  }
  return dbPromise;
}

// Function to sync local data with the server
export async function syncWithServer() {
  if (!navigator.onLine) {
    console.log('Offline mode - cannot sync with server');
    return;
  }

  try {
    const db = await getDb();
    // Implement sync logic here when online
    console.log('Syncing data with server...');
    
    // Example: Fetch latest students from server and update local DB
    const response = await fetch('/api/students');
    if (response.ok) {
      const students = await response.json();
      const tx = db.transaction('students', 'readwrite');
      await Promise.all([
        ...students.map((student: any) => tx.store.put(student)),
        tx.done
      ]);
    }
    
    // Similar syncs for other data types
    // ...
    
    console.log('Sync completed');
  } catch (error) {
    console.error('Error syncing with server:', error);
  }
}

// Function to clear the database (for logout)
export async function clearDatabase(): Promise<void> {
  await deleteDB(DB_NAME);
  dbPromise = initDatabase();
}

// Add online/offline event listeners
export function setupOfflineSync() {
  window.addEventListener('online', () => {
    console.log('Back online - syncing data...');
    syncWithServer();
  });
  
  window.addEventListener('offline', () => {
    console.log('Offline mode - changes will be synced when back online');
  });
}

// Initialize the database and setup sync
export function initOfflineSupport() {
  getDb().then(() => console.log('Database initialized'));
  setupOfflineSync();
  
  // Initial sync if online
  if (navigator.onLine) {
    syncWithServer();
  }
}
