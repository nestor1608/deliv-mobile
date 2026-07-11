// src/utils/storage.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('deliv.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }
  return db;
}

export function getItem<T>(key: string): T | null {
  const database = getDb();
  const result = database.getFirstSync<{ value: string }>('SELECT value FROM storage WHERE key = ?', [key]);
  return result ? JSON.parse(result.value) as T : null;
}

export function setItem<T>(key: string, value: T): void {
  const database = getDb();
  database.runSync('INSERT OR REPLACE INTO storage (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
}

export function removeItem(key: string): void {
  const database = getDb();
  database.runSync('DELETE FROM storage WHERE key = ?', [key]);
}

export function clear(): void {
  const database = getDb();
  database.runSync('DELETE FROM storage');
}
