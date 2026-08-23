import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HTTP_ENABLED, httpUploads } from "@/api/http";

export type UploadFolder = "looks" | "events" | "receipts";

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

/** Upload to Cloudinary when the API is on; otherwise keep a local data URL (demo only). */
export async function resolveImageUpload(
  file: File,
  folder: UploadFolder = "looks",
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }
  if (HTTP_ENABLED) {
    const { url } = await httpUploads.upload(file, folder);
    return url;
  }
  return readImageFile(file);
}

export default function ImageUpload({
  label,
  value,
  name,
  onChange,
  compact = false,
  folder = "looks",
}: {
  label: string;
  value?: string;
  name?: string;
  onChange?: (url: string) => void;
  compact?: boolean;
  folder?: UploadFolder;
}) {
  const [preview, setPreview] = useState(value ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPreview(value ?? "");
  }, [value]);

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    try {
      const url = await resolveImageUpload(file, folder);
      setPreview(url);
      onChange?.(url);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPreview("");
    onChange?.("");
  }

  return (
    <div>
      <p className="os-label mb-1">{label}</p>
      {name ? <input type="hidden" name={name} value={preview} /> : null}
      <label
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-paper ${
          compact ? "h-28" : "h-44"
        } ${busy ? "pointer-events-none opacity-70" : ""}`}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-muted">
            <ImagePlus className="h-5 w-5 text-ink" />
            {busy ? "Uploading…" : "Upload image"}
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-ink" />
          </span>
        ) : null}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(event) => void pick(event.target.files?.[0])}
        />
      </label>
      {preview && !busy ? (
        <button type="button" onClick={clear} className="mt-1 inline-flex items-center gap-1 text-xs underline">
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      ) : null}
    </div>
  );
}

export function ImageUploadList({
  label,
  values,
  onChange,
  folder = "looks",
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: UploadFolder;
}) {
  const [busy, setBusy] = useState(false);

  async function add(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    try {
      const url = await resolveImageUpload(file, folder);
      onChange([...values, url]);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="os-label mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {values.map((url, index) => (
          <div key={`${url.slice(0, 48)}-${index}`} className="relative">
            <img src={url} alt="" className="h-24 w-full rounded-xl object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 rounded-full bg-ink p-1 text-white"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remove image"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label
          className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-paper text-xs text-ink ${
            busy ? "pointer-events-none opacity-70" : ""
          }`}
        >
          {busy ? <Loader2 className="mb-1 h-4 w-4 animate-spin" /> : <ImagePlus className="mb-1 h-4 w-4" />}
          {busy ? "Uploading…" : "Add"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void add(event.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
