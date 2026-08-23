import Link from 'next/link';

export function AuthBrand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
      aria-label="Về trang chủ KickZone"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <FootballIcon />
      </span>
      <span className="font-heading text-2xl font-extrabold tracking-tight">
        KickZone
      </span>
    </Link>
  );
}

function FootballIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6 fill-none stroke-current"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3.2 2.3-1.2 3.8h-4l-1.2-3.8L12 7Z" />
      <path d="m12 7 .2-4M15.2 9.3l3.8-1.2M14 13.1l2.4 3.2M10 13.1l-2.4 3.2M8.8 9.3 5 8.1M16.4 16.3l3.1 1.2M7.6 16.3l-3.1 1.2" />
    </svg>
  );
}
