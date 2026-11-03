import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let storageClient: SupabaseClient | undefined;

export class EvidenceStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceStorageError";
  }
}

function getStorageConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET;

  if (!url || !serviceRoleKey || !bucketName) {
    throw new EvidenceStorageError(
      "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET must be configured"
    );
  }
  return { url, serviceRoleKey, bucketName };
}

export function getEvidenceStorage() {
  const { url, serviceRoleKey, bucketName } = getStorageConfig();
  storageClient ??= createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const bucket = storageClient.storage.from(bucketName);
  return {
    bucketName,
    async createSignedUpload(storageKey: string, upsert: boolean) {
      const { data, error } = await bucket.createSignedUploadUrl(storageKey, {
        upsert,
      });
      if (error) {
        throw new EvidenceStorageError(`Unable to create signed upload: ${error.message}`);
      }
      return { signedUrl: data.signedUrl, token: data.token };
    },
    async download(storageKey: string) {
      const { data, error } = await bucket.download(storageKey);
      if (error) {
        throw new EvidenceStorageError(`Unable to retrieve stored evidence: ${error.message}`);
      }
      return new Uint8Array(await data.arrayBuffer());
    },
    async remove(storageKey: string) {
      const { error } = await bucket.remove([storageKey]);
      if (error) {
        throw new EvidenceStorageError(`Unable to remove stored evidence: ${error.message}`);
      }
    },
  };
}
