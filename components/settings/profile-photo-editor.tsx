"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass, secondaryClass } from "./settings-ui";

export function ProfileAvatar({ photo, name, initials, large = false }: { photo?: string; name: string; initials: string; large?: boolean }) {
  const className = `${large ? "h-24 w-24 text-xl" : "h-12 w-12 text-sm"} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700`;
  // Cropped user uploads are data URLs; no image optimization server is needed.
  // eslint-disable-next-line @next/next/no-img-element
  return photo ? <img src={photo} alt={`${name}'s profile photo`} className={`${className} object-cover`} /> : <div role="img" aria-label={`${name}'s initials`} className={className}>{initials}</div>;
}

export default function ProfilePhotoEditor({ photo, name, initials, disabled, onChange, onPending }: {
  photo: string; name: string; initials: string; disabled: boolean; onChange: (photo: string) => void; onPending: (pending: boolean) => void;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ zoom: 1, x: 50, y: 50 });
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null); const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => {
    if (!image || !canvas.current) return;
    const context = canvas.current.getContext("2d"); if (!context) return;
    const size = Math.min(image.naturalWidth, image.naturalHeight) / crop.zoom;
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, 256, 256);
    context.drawImage(image, (image.naturalWidth - size) * crop.x / 100, (image.naturalHeight - size) * crop.y / 100, size, size, 0, 0, 256, 256);
  }, [image, crop]);
  async function select(file?: File) {
    if (!file) return;
    const request = ++generation.current;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setError("Choose a JPG, PNG or WebP photo up to 5 MB."); return; }
    setLoading(true); onPending(true);
    const url = URL.createObjectURL(file);
    try {
      const next = new Image(); next.src = url; await next.decode();
      if (request !== generation.current) return;
      if (next.naturalWidth > 16000 || next.naturalHeight > 16000) throw new Error("Choose a photo with dimensions below 16,000 pixels.");
      setImage(next); setCrop({ zoom: 1, x: 50, y: 50 });
    } catch (reason) { if (request === generation.current) { setError(reason instanceof Error ? reason.message : "This image could not be opened."); onPending(Boolean(image)); } }
    finally { URL.revokeObjectURL(url); if (request === generation.current) setLoading(false); }
  }
  function cancel() { generation.current++; setImage(null); setLoading(false); onPending(false); setError(""); }
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-5"><ProfileAvatar photo={photo} name={name} initials={initials} large /><div className="space-y-3"><label className="block text-sm font-semibold text-slate-800" htmlFor="profile-photo-upload">Upload or replace photo</label><input id="profile-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || loading} className="block max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-blue-700" onChange={(event) => { void select(event.target.files?.[0]); event.target.value = ""; }} /><p className="text-sm text-slate-500">JPG, PNG or WebP, up to 5 MB. Crop to a square before saving.</p>{photo && <button type="button" className={secondaryClass} disabled={disabled || loading} onClick={() => { cancel(); onChange(""); }}>Remove photo</button>}</div></div>
    {loading && <p role="status" className="text-sm text-slate-500">Opening photo…</p>}
    {image && <fieldset disabled={disabled || loading} className="space-y-4 rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold text-slate-800">Crop preview</legend><canvas ref={canvas} width={256} height={256} role="img" aria-label="Square photo crop preview" className="mx-auto h-48 w-48 rounded-xl" />{([{ key: "zoom", label: "Zoom", min: 1, max: 3, step: 0.05 }, { key: "x", label: "Horizontal position", min: 0, max: 100, step: 1 }, { key: "y", label: "Vertical position", min: 0, max: 100, step: 1 }] as const).map(({ key, label, ...range }) => <label key={key} className="block text-sm text-slate-700">{label}<input type="range" {...range} value={crop[key]} className={`${inputClass} accent-blue-600`} onChange={(event) => setCrop({ ...crop, [key]: Number(event.target.value) })} /></label>)}<div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondaryClass} onClick={cancel}>Cancel crop</button><button type="button" className={secondaryClass} onClick={() => { try { const data = canvas.current?.toDataURL("image/jpeg", 0.85); if (!data || data.length > 180000) throw new Error("This crop is too large. Choose a smaller photo."); onChange(data); cancel(); } catch (reason) { setError(reason instanceof Error ? reason.message : "The crop could not be saved."); } }}>Use this crop</button></div></fieldset>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
