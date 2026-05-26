export default function PendingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00AEEF" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Account pending</h1>
      <p className="text-text-secondary max-w-xs">
        Your account has been created. An admin will assign your role shortly — check back soon.
      </p>
    </div>
  );
}
