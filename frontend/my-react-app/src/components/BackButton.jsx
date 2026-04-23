import "./BackButton.css";

export default function BackButton({ href = "/" }) {
  return (
    <a className="back-btn" href={href}>
      <svg
        width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Back to Home
    </a>
  );
}
