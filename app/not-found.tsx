export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-6">
        <h1 className="text-3xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-600">Sorry, we couldn’t find the page you’re looking for.</p>
        <a href="/" className="mt-4 inline-block text-teal-700 hover:underline">Go back home</a>
      </div>
    </div>
  );
}
