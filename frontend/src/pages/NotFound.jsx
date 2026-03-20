import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-shell py-16">
      <div className="section-shell p-10 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-3xl font-bold">404</div>
        <h1 className="mt-6 text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for does not exist or has moved.</p>
        <Link to="/equipment" className="btn-primary mt-6">Browse Equipment</Link>
      </div>
    </div>
  );
}
