/**
 * Tombstone / Deleted IDs Manager
 * Keeps track of deleted items so they are NEVER accidentally resurrected
 * when pulling or syncing with Google Sheets.
 */

const DELETED_IDS_STORAGE_KEY = 'universal_store_deleted_ids_v2';

export function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw);
    return new Set<string>(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set<string>();
  }
}

export function recordDeletedId(idOrIdentifier: string | string[]): void {
  if (!idOrIdentifier) return;
  try {
    const set = getDeletedIds();
    const idsToAdd = Array.isArray(idOrIdentifier) ? idOrIdentifier : [idOrIdentifier];
    
    idsToAdd.forEach((id) => {
      if (id && typeof id === 'string' && id.trim().length > 0) {
        set.add(id.trim());
      }
    });

    // Keep up to 5000 recent deleted IDs to protect storage
    const arr = Array.from(set).slice(-5000);
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Failed to persist deleted ID to localStorage:', e);
  }
}

export function isItemDeleted(id?: string, secondaryKey?: string): boolean {
  if (!id && !secondaryKey) return false;
  const deletedSet = getDeletedIds();
  if (id && deletedSet.has(id.trim())) return true;
  if (secondaryKey && deletedSet.has(secondaryKey.trim())) return true;
  return false;
}

export function clearAllDeletedIds(): void {
  try {
    localStorage.removeItem(DELETED_IDS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
