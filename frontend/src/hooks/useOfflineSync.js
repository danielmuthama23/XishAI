/**
 * hooks/useOfflineSync.js
 * ───────────────────────
 * Queues incident reports in IndexedDB when offline.
 * Replays them against the API when connectivity is restored.
 */
import { useState, useEffect, useCallback } from 'react'
import { openDB } from 'idb'
import { api } from '../services/api'

const DB_NAME    = 'civicai-offline'
const STORE_NAME = 'pending-reports'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'localId', autoIncrement: true })
      }
    },
  })
}

export function useOfflineSync() {
  const [isOnline,  setIsOnline]  = useState(navigator.onLine)
  const [pending,   setPending]   = useState(0)
  const [syncing,   setSyncing]   = useState(false)

  // Track online / offline events
  useEffect(() => {
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Refresh pending count from IDB
  const refreshCount = useCallback(async () => {
    const db    = await getDB()
    const count = await db.count(STORE_NAME)
    setPending(count)
  }, [])

  useEffect(() => { refreshCount() }, [refreshCount])

  // Queue a report for later
  const queueReport = useCallback(async (formData) => {
    const db = await getDB()
    // FormData can't be stored directly — serialise to a plain object
    const payload = {}
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Convert file to base64 for storage
        const buffer = await value.arrayBuffer()
        payload[key] = {
          _isFile:      true,
          name:         value.name,
          type:         value.type,
          base64:       btoa(String.fromCharCode(...new Uint8Array(buffer))),
        }
      } else {
        payload[key] = value
      }
    }
    await db.add(STORE_NAME, { payload, queuedAt: new Date().toISOString() })
    await refreshCount()
  }, [refreshCount])

  // Replay all queued reports when online
  const syncNow = useCallback(async () => {
    if (!isOnline || syncing) return
    setSyncing(true)
    const db   = await getDB()
    const all  = await db.getAll(STORE_NAME)

    for (const record of all) {
      try {
        const fd = new FormData()
        for (const [key, val] of Object.entries(record.payload)) {
          if (val && val._isFile) {
            // Reconstruct File from base64
            const binary = atob(val.base64)
            const bytes  = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
            fd.append(key, new File([bytes], val.name, { type: val.type }))
          } else {
            fd.append(key, val)
          }
        }
        await api.reportIncident(fd)
        await db.delete(STORE_NAME, record.localId)
      } catch (err) {
        console.warn('[offlineSync] failed to sync record', record.localId, err)
      }
    }

    await refreshCount()
    setSyncing(false)
  }, [isOnline, syncing, refreshCount])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pending > 0) syncNow()
  }, [isOnline]) // eslint-disable-line

  return { isOnline, pending, syncing, queueReport, syncNow }
}
