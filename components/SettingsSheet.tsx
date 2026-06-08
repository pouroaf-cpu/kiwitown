"use client";

// Full-screen, blurred-backdrop overlay — same visual format as the Task Editor
// wizard (TaskWizard). Header: ✕ · title · optional Save. Body scrolls.
export default function SettingsSheet({
  title,
  onClose,
  onSave,
  saving = false,
  saveLabel = "Save",
  children,
}: {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/60 backdrop-blur-md sm:items-center sm:p-6">
      <div className="relative flex w-full max-w-lg flex-col bg-bg sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-text-secondary hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{title}</span>
          {onSave ? (
            <button type="button" onClick={onSave} disabled={saving} className="rounded-lg px-2 py-1 text-sm font-semibold text-brand">
              {saving ? "…" : saveLabel}
            </button>
          ) : (
            <span className="w-12" />
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
