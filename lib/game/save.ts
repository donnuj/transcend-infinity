"use client";

import { api } from "@/lib/api";
import { useGameStore } from "./store";

type CloudSaveEnvelope = {
  schemaVersion: number;
  revision: number;
  data: Record<string, unknown>;
};

type CloudSaveDownload = {
  schemaVersion: number;
  revision: number;
  checksum: string;
  data: unknown;
  serverOfflineMs: number;
};

type CloudSaveResponse = {
  success: boolean;
  revision: number;
};

let _revision = 0;
let _loaded = false; // true after confirmed server state (save found or 404)
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _uploading = false;

// Carrega save da nuvem.
// Retorna serverOfflineMs (>=0) se encontrou save, null se não existe save ainda.
// Lança em qualquer outro erro (rede, 5xx, etc.) para que o chamador não confunda
// com "sem save" e dispare um uploadCloudSave indevido.
export async function loadCloudSave(): Promise<number | null> {
  let res: CloudSaveDownload | null;
  try {
    res = await api.get<CloudSaveDownload | null>("/player/save");
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      _loaded = true; // confirmado: sem save — seguro criar com revision=0
      return null;
    }
    console.error("[save] load failed", err);
    throw err; // não retorna null — evita upload acidental sobre save existente
  }

  if (!res || !res.data || typeof res.data !== "object") {
    _loaded = true;
    return null;
  }

  _revision = res.revision ?? 0;
  _loaded = true;
  useGameStore.setState((s) => ({ ...s, save: res!.data as typeof s.save, cloudSynced: true, lastSyncAt: new Date().toISOString() }));
  return res.serverOfflineMs ?? 0;
}

// Sobe save para a nuvem. Em conflito de revisão, re-baixa primeiro e re-tenta uma vez.
export async function uploadCloudSave(retrying = false): Promise<void> {
  if (_uploading) return;

  // Se ainda não confirmamos o estado do servidor (ex: loadCloudSave falhou no início
  // da sessão por servidor frio), tentar carregar agora antes de sobrescrever com dados locais.
  if (!_loaded && !retrying) {
    try { await loadCloudSave(); }
    catch { /* falhou de novo — continua; server rejeitará com 409 se necessário */ }
  }

  _uploading = true;
  const now = new Date().toISOString();
  const { save } = useGameStore.getState();

  const envelope: CloudSaveEnvelope = {
    schemaVersion: 1,
    revision: _revision,
    data: save,
  };

  try {
    const res = await api.post<CloudSaveResponse>("/player/save", envelope);
    if (res?.revision != null) _revision = res.revision;
    useGameStore.getState().setCloudSynced(true, now);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 409 && !retrying) {
      _uploading = false;
      await loadCloudSave().catch(() => null);
      await new Promise<void>((r) => setTimeout(r, 200));
      await uploadCloudSave(true);
      return;
    }
    console.error("[save] upload failed", status, err, (err as { issues?: unknown })?.issues);
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
