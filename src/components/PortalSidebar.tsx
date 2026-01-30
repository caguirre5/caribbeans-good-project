import { useMemo, useState } from "react";

type MenuItem = {
  icon: string;
  id: string;
  title: string;
  description: string;
  mode: "tab" | "route";
  to?: string; // solo si mode === "route"
};

export default function PortalSidebar({
  items,
  activeId,
  onItemClick,
}: {
  items: MenuItem[];
  activeId: string;
  onItemClick: (item: MenuItem) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = useMemo(() => {
    return items.find((it) => it.id === activeId) ?? items[0];
  }, [items, activeId]);

  const handleSelect = (item: MenuItem) => {
    onItemClick(item);
    setMobileOpen(false);
  };

  return (
    <aside className="w-full lg:w-[280px] lg:min-h-screen bg-white border-b lg:border-b-0 lg:border-r border-[#044421]/10">
      <div className="p-4 lg:p-5">
        {/* header */}

        <nav className="mt-20 lg:mt-0">
          {/* =========================
              MOBILE: centered dropdown
             ========================= */}
          <div className="lg:hidden">
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  className="
                    w-full rounded-xl border border-[#044421]/15 bg-[#f6faf7]
                    px-3 py-2 flex items-center justify-between gap-3
                  "
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#044421]/15 shrink-0">
                      <img
                        src={activeItem?.icon}
                        alt=""
                        className="w-6 h-6 opacity-90"
                      />
                    </span>

                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#044421] truncate">
                        {activeItem?.title ?? "Select"}
                      </span>
                    </span>
                  </div>

                  <svg
                    className={`w-5 h-5 text-[#044421] transition ${
                      mobileOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* dropdown menu */}
                {mobileOpen && (
                  <>
                    {/* overlay to close */}
                    <button
                      type="button"
                      aria-label="Close menu"
                      className="fixed inset-0 z-40"
                      onClick={() => setMobileOpen(false)}
                    />

                    <div
                      className="
                        absolute left-1/2 -translate-x-1/2 mt-2 z-50
                        w-full rounded-2xl border border-[#044421]/15 bg-white shadow-lg
                        p-2
                      "
                    >
                      <div className="max-h-[60vh] overflow-auto">
                        {items.map((item) => {
                          const isActive =
                            item.mode === "tab" && item.id === activeId;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={`
                                w-full flex items-center gap-3 p-2 rounded-xl border transition
                                ${
                                  isActive
                                    ? "bg-[#f6faf7] border-[#044421]/15"
                                    : "bg-white border-transparent hover:bg-[#f6faf7] hover:border-[#044421]/15"
                                }
                              `}
                            >
                              <span
                                className={`
                                  flex items-center justify-center w-10 h-10 rounded-xl shrink-0
                                  ${isActive ? "bg-[#044421]/15" : "bg-[#044421]/10"}
                                `}
                              >
                                <img
                                  src={item.icon}
                                  alt=""
                                  className="w-6 h-6 opacity-90"
                                />
                              </span>

                              <span className="min-w-0 text-left">
                                <span className="block text-sm font-semibold text-[#044421] leading-tight">
                                  {item.title}
                                </span>
                                {/* si quieres mostrar description en mobile */}
                                {/* <span className="block text-xs text-gray-500 truncate">{item.description}</span> */}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* =========================
              DESKTOP: your current list
             ========================= */}
          <div className="hidden lg:flex lg:flex-col">
            {items.map((item) => {
              const isActive = item.mode === "tab" && item.id === activeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item)}
                  className={`
                    group rounded-xl transition border
                    ${
                      isActive
                        ? "bg-[#f6faf7] border-[#044421]/15"
                        : "bg-white border-transparent hover:border-[#044421]/15 hover:bg-[#f6faf7]"
                    }
                    flex items-center p-2 justify-start gap-3
                    lg:w-full lg:px-3 lg:py-3
                  `}
                >
                  <span
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-xl shrink-0
                      ${isActive ? "bg-[#044421]/15" : "bg-[#044421]/10"}
                    `}
                  >
                    <img src={item.icon} alt="" className="w-6 h-6 opacity-90" />
                  </span>

                  <span className="min-w-0 hidden lg:block">
                    <span className="block text-sm font-semibold text-[#044421] leading-tight">
                      {item.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
}
