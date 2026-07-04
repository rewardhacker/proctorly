export default function Notice({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error) {
    return (
      <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (success) {
    return (
      <div className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
        {success}
      </div>
    );
  }
  return null;
}
