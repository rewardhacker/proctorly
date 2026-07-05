export default function Loading() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="mb-4 h-7 w-24 animate-pulse rounded bg-gray-200" />
      <div className="mb-4 h-10 w-40 animate-pulse rounded bg-gray-200" />
      <ul className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <li key={i} className="rounded border p-3">
            <div className="mb-1 h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          </li>
        ))}
      </ul>
    </main>
  );
}
