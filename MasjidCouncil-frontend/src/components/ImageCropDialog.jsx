import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, Loader2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Crop, zoom and rotate one image before it is uploaded. Purely client side: the result is a
 * new File drawn on a canvas, so the server only ever stores the edited image.
 *
 * aspects: [{ label, value }] where value is width / height, or null for a free crop. The
 * first entry is selected unless defaultAspect names another value.
 */

const OUTPUT_TYPE = 'image/jpeg';
const OUTPUT_QUALITY = 0.92;
// Keeps the canvas (and the upload) inside the 5 MB limit for very large photos.
const MAX_OUTPUT_EDGE = 3000;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    // Remote images (an already uploaded banner) need CORS to be drawn onto a canvas that is
    // then read back; a blob: URL from a picked file does not care.
    if (!src.startsWith('blob:') && !src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image for editing.'));
    img.src = src;
  });

const toRadians = (deg) => (deg * Math.PI) / 180;

// Bounding box of a w × h rectangle rotated by `rotation` degrees.
const rotatedSize = (width, height, rotation) => {
  const r = toRadians(rotation);
  return {
    width: Math.abs(Math.cos(r) * width) + Math.abs(Math.sin(r) * height),
    height: Math.abs(Math.sin(r) * width) + Math.abs(Math.cos(r) * height),
  };
};

/** Draws the cropped (and rotated) area onto a canvas and returns it as a File. */
const renderCroppedFile = async (src, pixelCrop, rotation, fileName) => {
  const image = await loadImage(src);

  // Rotate the whole image on a scratch canvas first; react-easy-crop reports the crop in
  // the coordinates of that rotated bounding box.
  const bounds = rotatedSize(image.naturalWidth, image.naturalHeight, rotation);
  const rotatedCanvas = document.createElement('canvas');
  rotatedCanvas.width = Math.round(bounds.width);
  rotatedCanvas.height = Math.round(bounds.height);
  const rctx = rotatedCanvas.getContext('2d');
  rctx.translate(bounds.width / 2, bounds.height / 2);
  rctx.rotate(toRadians(rotation));
  rctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(pixelCrop.width, pixelCrop.height));
  const out = document.createElement('canvas');
  out.width = Math.max(1, Math.round(pixelCrop.width * scale));
  out.height = Math.max(1, Math.round(pixelCrop.height * scale));
  const ctx = out.getContext('2d');
  // JPEG has no alpha: fill white so transparent PNG areas do not turn black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    out.width,
    out.height
  );

  let blob;
  try {
    blob = await new Promise((resolve, reject) =>
      out.toBlob((b) => (b ? resolve(b) : reject(new Error('empty'))), OUTPUT_TYPE, OUTPUT_QUALITY)
    );
  } catch {
    // A tainted canvas (remote image served without CORS headers) cannot be read back.
    throw new Error('This image cannot be edited here. Upload the original file again to crop it.');
  }
  const base = String(fileName || 'image').replace(/\.[^.]+$/, '');
  return new File([blob], `${base}-edited.jpg`, { type: OUTPUT_TYPE });
};

const ImageCropDialog = ({ src, fileName, aspects, defaultAspect, title = 'Edit image', onDone, onCancel }) => {
  const presets = aspects?.length ? aspects : [{ label: 'Free', value: null }];
  const initialAspect = presets.some((p) => p.value === defaultAspect) ? defaultAspect : presets[0].value;

  const [aspect, setAspect] = useState(initialAspect);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState(null);
  const [natural, setNatural] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // A new source is a fresh edit.
  useEffect(() => {
    setAspect(initialAspect);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const onCropComplete = useCallback((_area, areaPixels) => setPixels(areaPixels), []);

  // "Free" crops to the whole image's shape; the user then zooms to trim.
  const effectiveAspect = aspect ?? (natural ? natural.width / natural.height : 4 / 3);

  const apply = async () => {
    if (!pixels) return;
    setBusy(true);
    setError('');
    try {
      onDone(await renderCroppedFile(src, pixels, rotation, fileName));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const iconBtn =
    'flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40';

  return (
    <Dialog.Root open onOpenChange={(next) => { if (!next && !busy) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-gray-900/60 backdrop-blur-[2px]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[111] flex max-h-[94vh] w-[94vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(16,24,40,0.45)] focus:outline-none"
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-3">
            <Dialog.Title className="text-base font-semibold text-gray-900">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" disabled={busy} aria-label="Close" className={iconBtn}>
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="relative h-[52vh] min-h-64 bg-gray-900">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={effectiveAspect}
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.2}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              onMediaLoaded={(m) => setNatural({ width: m.naturalWidth, height: m.naturalHeight })}
            />
          </div>

          <div className="space-y-3 overflow-y-auto px-5 py-4">
            {presets.length > 1 && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Crop shape">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    role="radio"
                    aria-checked={aspect === p.value}
                    onClick={() => setAspect(p.value)}
                    className={`min-h-9 rounded-full px-3.5 text-xs font-medium ring-1 transition-colors ${
                      aspect === p.value
                        ? 'bg-[#1F6B3A] text-white ring-[#1F6B3A]'
                        : 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex min-w-56 flex-1 items-center gap-2">
                <button type="button" aria-label="Zoom out" className={iconBtn} onClick={() => setZoom((z) => Math.max(1, z - 0.2))}>
                  <ZoomOut className="h-4 w-4" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="h-2 flex-1 cursor-pointer accent-[#1F6B3A]"
                />
                <button type="button" aria-label="Zoom in" className={iconBtn} onClick={() => setZoom((z) => Math.min(4, z + 0.2))}>
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Rotate left" className={iconBtn} onClick={() => setRotation((r) => (r - 90 + 360) % 360)}>
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Rotate right" className={iconBtn} onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="min-h-11 rounded-lg px-3 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Reset
                </button>
              </div>
            </div>

            {pixels && (
              <p className="text-xs text-gray-400">
                Output: {Math.round(pixels.width)} × {Math.round(pixels.height)} px. Drag to move, scroll or pinch to zoom.
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy || !pixels}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#1F6B3A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2E7D4F] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Apply & upload
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageCropDialog;
