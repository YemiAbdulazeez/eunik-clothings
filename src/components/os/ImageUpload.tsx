import { ImagePlus, Trash2 } from "lucide-react";
import { useState } from "react";

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

export default function ImageUpload({
  label,
  value,
  name,
  onChange,
  compact = false,
}: {
  label: string;
  value?: string;
  name?: string;
  onChange?: (url: string) => void;
  compact?: boolean;
}) {
  const [preview, setPreview] = useState(value ?? "");

  async function pick(file: File | undefined) {
    if (!file) return;
    const url = await readImageFile(file);
    setPreview(url);
    onChange?.(url);
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
        className={`flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-paper ${
          compact ? "h-28" : "h-44"
        }`}
      >
        {preview ? (
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm text-muted">
            <ImagePlus className="h-5 w-5 text-ink" />
            Upload image
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => void pick(event.target.files?.[0])}
        />
      </label>
      {preview ? (
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
}: {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
}) {
  async function add(file: File | undefined) {
    if (!file) return;
    const url = await readImageFile(file);
    onChange([...values, url]);
  }

  return (
    <div>
      <p className="os-label mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {values.map((url, index) => (
          <div key={`${url.slice(0, 24)}-${index}`} className="relative">
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
        <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line bg-paper text-xs text-ink">
          <ImagePlus className="mb-1 h-4 w-4" />
          Add
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => void add(event.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}
