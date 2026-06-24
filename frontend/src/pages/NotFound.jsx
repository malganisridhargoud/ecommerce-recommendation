import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-shell py-5">
      <div className="section-shell p-5 text-center">
        <div className="mx-auto d-flex align-items-center justify-content-center rounded-circle fw-bold text-3xl" style={{ height: '6rem', width: '6rem', backgroundColor: '#fff7ed', color: '#c2410c' }}>404</div>
        <h1 className="mt-4 text-2xl fw-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-muted-custom">The page you are looking for does not exist or has moved.</p>
        <Link to="/equipment" className="btn-apple btn-primary-apple mt-4 d-inline-flex">Browse Equipment</Link>
      </div>
    </div>
  );
}
