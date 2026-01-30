'use client';

type DisconnectModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DisconnectModal({
  open,
  onClose,
  onConfirm,
}: DisconnectModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1e1d1f]/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="disconnect-modal-title"
    >
      <div
        className="bg-[#3e3d3f] rounded-2xl shadow-lg border border-[#4e4d4f] p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="disconnect-modal-title"
          className="text-lg font-bold text-[#e8e7e9] mb-2"
        >
          Disconnect wallet?
        </h2>
        <p className="text-[#b5b4b6] text-sm mb-6">
          You will need to connect again to create or manage snaps.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg border border-[#4e4d4f] bg-[#525152] text-[#e8e7e9] text-sm font-medium hover:bg-[#6b6a6c] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#2a292b] text-[#e8e7e9] text-sm font-medium hover:bg-[#1e1d1f] border border-[#4e4d4f] transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
