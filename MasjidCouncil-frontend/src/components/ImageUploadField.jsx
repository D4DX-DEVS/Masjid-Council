import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, RotateCcw, Trash2 } from 'lucide-react';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

/**
 * Pick, upload and preview one image. The caller supplies the upload function, so each admin
 * page goes through its own feature-guarded endpoint, and decides what to store from the
 * { url, key } it gets back.
 *
 * onRemove / onRestore are optional: without onRemove the image is required and cannot be
 * cleared; onRestore offers a way back to a built-in default.
 */
const ImageUploadField = ({
  label,
  hint,
  required,
  previewSrc,
  upload,
  onUploaded,
  onRemove,
  onRestore,
  onError,
}) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      onError('Image is larger than 5 MB.');
      return;
    }
    setUploading(true);
    onError('');
    try {
      onUploaded(await upload(file));
    } catch (error) {
      onError(error.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const secondary =
    'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium disabled:opacity-50';

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {previewSrc ? (
        <div className="space-y-2">
          <img
            src={previewSrc}
            alt=""
            className="max-h-40 w-full rounded-lg bg-gray-50 object-contain ring-1 ring-gray-200"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={`${secondary} border border-gray-200 text-gray-700 hover:bg-gray-50`}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Replace
            </button>
            {onRestore && (
              <button
                type="button"
                onClick={onRestore}
                disabled={uploading}
                className={`${secondary} text-gray-600 hover:bg-gray-100`}
              >
                <RotateCcw className="h-4 w-4" />
                Use default
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                disabled={uploading}
                className={`${secondary} text-red-600 hover:bg-red-50`}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 text-sm text-gray-500 transition-colors hover:border-green-400 hover:bg-green-50/40 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5 text-gray-400" />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
          {onRestore && (
            <button type="button" onClick={onRestore} className={`${secondary} text-gray-600 hover:bg-gray-100`}>
              <RotateCcw className="h-4 w-4" />
              Use default
            </button>
          )}
        </div>
      )}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES}
        className="hidden"
        aria-label={label}
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
};

export default ImageUploadField;
