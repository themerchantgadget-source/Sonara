import React from 'react';

interface ConfirmRemoveModalProps {
  title: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmRemoveModal: React.FC<ConfirmRemoveModalProps> = ({
  title,
  onCancel,
  onConfirm,
}) => {
  if (!title) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-dialog-title"
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[#292825] border border-[#f5f2ea]/12 p-6 shadow-2xl">
        <h2
          id="remove-dialog-title"
          className="font-serif text-xl text-[#f5f2ea] leading-snug"
        >
          Remove from this device?
        </h2>
        <p className="mt-2 text-sm text-[#a09b90] leading-relaxed">
          “{title}” will be removed from Sonara’s offline storage on this
          device.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-4 rounded-xl text-sm font-medium text-[#f5f2ea] hover:bg-[#f5f2ea]/8 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] px-5 rounded-xl text-sm font-semibold bg-[#d97757] text-[#1a0f0a] hover:bg-[#e08567] transition-colors cursor-pointer"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};
