export default function EmployeePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto max-w-7xl">
      <p className="text-sm font-semibold text-blue-600">EMPLOYEE WORKSPACE</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
        <p className="font-semibold text-slate-700">This module is ready for development</p>
        <p className="mt-2 text-sm text-slate-500">It will be connected when the matching backend API is available.</p>
      </div>
    </main>
  );
}
