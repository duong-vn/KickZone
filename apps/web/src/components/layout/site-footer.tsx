import Link from 'next/link';
import { Share2 } from 'lucide-react';

type FooterColumn = {
  title: string;
  links: { href: string; label: string }[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Về chúng tôi',
    links: [
      { href: '#', label: 'Giới thiệu' },
      { href: '#', label: 'Tuyển dụng' },
      { href: '#', label: 'Blog thể thao' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { href: '#', label: 'Điều khoản sử dụng' },
      { href: '#', label: 'Chính sách bảo mật' },
      { href: '#', label: 'Liên hệ' },
      { href: '#', label: 'Câu hỏi thường gặp' },
    ],
  },
  {
    title: 'Đối tác',
    links: [
      { href: '#', label: 'Hợp tác chủ sân' },
      { href: '#', label: 'Tài trợ giải đấu' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#2e3132] py-16 text-sm text-[#c0c6db]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-4">
        <div className="flex flex-col gap-4">
          <div className="font-(family-name:--font-manrope) text-2xl font-bold tracking-tight text-white">
            KICKZONE
          </div>
          <p className="max-w-70 text-xs leading-relaxed text-[#c0c6db]">
            Nền tảng đặt sân bóng chuyên nghiệp, kết nối đam mê và đơn giản hóa
            việc tổ chức trận đấu.
          </p>
          <div className="pt-2">
            <a
              href="#"
              aria-label="Chia sẻ"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#006e2f]"
            >
              <Share2 className="h-4 w-4" />
            </a>
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-white">
              {column.title}
            </div>
            <div className="flex flex-col gap-2">
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-[#c0c6db] transition-colors hover:text-[#4ae176]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-white/10 px-6 pt-8 text-center text-xs text-[#c0c6db]/70">
        © 2026 KICKZONE. Nền tảng đặt sân bóng chuyên nghiệp.
      </div>
    </footer>
  );
}
