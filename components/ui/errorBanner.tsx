export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="p-3.5 bg-red-50 border border-red-100 rounded-2xl">
      <p className="text-xs font-bold text-red-600">⚠ {message}</p>
    </div>
  );
}