import { useState, useRef, useEffect } from "react";
import { MessageSquareText, Phone, X, Headphones } from "lucide-react";

interface SupportLink {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  href: string;
  bg: string;
  hoverBg: string;
  shadow: string;
}

const supportLinks: SupportLink[] = [
  {
    id: "whatsapp",
    label: "محادثة واتساب",
    sublabel: "رد فوري على استفساراتك",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    href: "https://wa.me/201060607654",
    bg: "bg-[#25D366]",
    hoverBg: "hover:bg-[#20bd5a]",
    shadow: "shadow-[#25D366]/25",
  },
  {
    id: "phone",
    label: "اتصال هاتفي مباشر",
    sublabel: "للدعم الفني السريع",
    icon: <Phone className="h-5 w-5" />,
    href: "tel:+201060607654",
    bg: "bg-slate-800",
    hoverBg: "hover:bg-slate-700",
    shadow: "shadow-slate-800/25",
  },
];

const FloatingSocial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <aside
      ref={menuRef}
      aria-label="خيارات الدعم الفني والتواصل"
      className="fixed bottom-4 left-2 sm:bottom-6 sm:left-3 z-[80] flex flex-col items-start gap-2.5 select-none print:hidden"
      dir="rtl"
    >
      {/* Floating Popup Card */}
      <div
        className={`transition-all duration-300 origin-bottom-left ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-3 pointer-events-none"
        }`}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-200/90 overflow-hidden w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)]">
          {/* Card Header */}
          <div className="px-4 sm:px-5 py-3.5 sm:py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
                <Headphones className="h-4 w-4" />
              </div>
              <div className="text-right">
                <h4 className="text-xs sm:text-sm font-black tracking-tight">مركز الدعم والتواصل</h4>
                <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium">متاحون لخدمتك ومساعدتك دائماً</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="إغلاق"
              aria-label="إغلاق نافذة الدعم"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-3 sm:p-3.5 space-y-2 sm:space-y-2.5">
            {supportLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target={link.id === "whatsapp" ? "_blank" : undefined}
                rel={link.id === "whatsapp" ? "noopener noreferrer" : undefined}
                onClick={() => setIsOpen(false)}
                className={`
                  group flex items-center gap-3 sm:gap-3.5 w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl
                  ${link.bg} ${link.hoverBg} text-white
                  shadow-md ${link.shadow}
                  hover:scale-[1.02] active:scale-[0.98]
                  transition-all duration-200 cursor-pointer
                `}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                  {link.icon}
                </div>
                <div className="text-right flex-1 overflow-hidden">
                  <p className="text-xs sm:text-sm font-black leading-tight">{link.label}</p>
                  <p className="text-[10px] sm:text-[11px] text-white/80 font-medium mt-0.5">{link.sublabel}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Bottom subtle note */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>فريق الدعم الفني جاهز للرد السريع</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modern Circular Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "إغلاق نافذة التواصل" : "تواصل مع الدعم الفني"}
        title={isOpen ? "إغلاق" : "تواصل مع الدعم"}
        className={`
          group relative w-12 h-12 sm:w-14 sm:h-14 rounded-full
          flex items-center justify-center
          shadow-xl transition-all duration-300
          active:scale-90 hover:scale-110
          cursor-pointer touch-manipulation
          ${
            isOpen
              ? "bg-slate-900 text-white rotate-0 ring-4 ring-slate-200/80"
              : "bg-gradient-to-tr from-[#25D366] via-emerald-500 to-teal-400 text-white shadow-emerald-500/35 hover:shadow-emerald-500/50 ring-4 ring-white/80 dark:ring-slate-900/80 backdrop-blur-xs"
          }
        `}
      >
        {/* Glowing animated ping ring when closed */}
        {!isOpen && (
          <>
            <span className="absolute -inset-1 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-xs pointer-events-none" />
          </>
        )}

        {/* Icon swap transition */}
        <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center pointer-events-none">
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
            }`}
          >
            <X className="h-5 w-5 text-white" />
          </span>

          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
              isOpen ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
            }`}
          >
            <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
          </span>
        </div>
      </button>
    </aside>
  );
};

export default FloatingSocial;
