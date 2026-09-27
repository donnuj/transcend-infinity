"use client";

import { api } from "@/lib/api";
import { useGameStore } from "./store";

type CloudSaveEnvelope = {
  schemaVersion: number;
  revision: number;
  data: string; // JSON stringified SaveData
};

type CloudSaveResponse = {
  success: boolean;
  revision: number;
};

let _revision = 0;
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _uploading = false;

// Carrega save da nuvem. Retorna true se encontrou um save existente.
export async function loadCloudSave(): Promise<boolean> {
  try {
    const res = await api.get<CloudSaveEnvelope | null>("/player/save");
    if (!res || res.data === "null" || !res.data) return false;

    let cloudSave: unknown;
    try { cloudSave = JSON.parse(res.data); } catch { return false; }
    if (!cloudSave || typeof cloudSave !== "object") return false;

    _revision = res.revision ?? 0;
    useGameStore.setState((s) => ({ ...s, save: cloudSave as typeof s.save, cloudSynced: true, lastSyncAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

// Sobe save para a nuvem. Em conflito de revisão, re-baixa primeiro e re-tenta uma vez.
export async function uploadCloudSave(retrying = false): Promise<void> {
  if (_uploading) return;
  _uploading = true;
  const { save } = useGameStore.getState();
  const now = new Date().toISOString();

  const envelope: CloudSaveEnvelope = {
    schemaVersion: 1,
    revision: _revision,
    data: JSON.stringify({ ...save, savedAt: now }),
  };

  try {
    const res = await api.post<CloudSaveResponse>("/player/save", envelope);
    if (res?.revision != null) _revision = res.revision;
    useGameStore.getState().setCloudSynced(true, now);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 409 && !retrying) {
      // Revisão desatualizada — re-sincroniza e tenta uma vez mais
      await loadCloudSave();
      _uploading = false;
      return uploadCloudSave(true);
    }
    useGameStore.getState().setCloudSynced(false);
  } finally {
    _uploading = false;
  }
}

// Debounced auto-save: chama depois de mudanças no store.
export function scheduleSave(delayMs = 3000): void {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    uploadCloudSave();
    _syncTimer = null;
  }, delayMs);
}

// Hook: retorna função de save manual + status
export function useSave() {
  const cloudSynced = useGameStore((s) => s.cloudSynced);
  const lastSyncAt = useGameStore((s) => s.lastSyncAt);
  return { cloudSynced, lastSyncAt, save: uploadCloudSave };
}
