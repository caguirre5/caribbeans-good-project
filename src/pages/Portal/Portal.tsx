import React from "react";

import UserHomeDashboard from "./UserHomeDashboard";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import GuatemalaSeasonCalendar from "../../components/SeasonCalendar";




type PortalEvent = {
  id: string;
  monthLabel: string;
  title: string;
  subtitle?: string;
  tag?: string;
};

const portalEvents: PortalEvent[] = [
  {
    id: "apr-harvest",
    monthLabel: "April",
    title: "Harvest Season",
    subtitle: "Peak availability — keep an eye on fresh lots.",
    tag: "Seasonal",
  },
  // agrega más aquí y se apilan en columna automáticamente
];

interface PortalProps {
  setActiveTab: (tab: string) => void;
}

const Portal: React.FC<PortalProps> = ({  }) => {


  return (
    <div className="w-full  text-[#044421] bg-[#f6faf7]">
      {/* 3-column layout on lg: menu | content | events */}
      <div className="w-full flex flex-col lg:flex-row">
        

        {/* ==================== CENTER CONTENT ==================== */}
        <main className="flex-1 w-full">
          <div className="w-full px-4 md:px-6 lg:px-8 py-6">
            {/* Header: title + buttons */}
            <section className="w-full">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs tracking-widest uppercase text-[#044421]/60">
                    Overview
                  </p>
                  <h1
                    className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight"
                    style={{ fontFamily: "KingsThing" }}
                  >
                    Dashboard overview
                  </h1>
                  <p className="text-sm text-[#044421]/70 mt-1 max-w-2xl">
                    Quick snapshot of your contracts and orders — plus access to prices,
                    resources and ordering.
                  </p>
                </div>

                {/* Social buttons (top-right of dashboard) */}
                <div className="flex items-center justify-start lg:justify-end gap-3">
                  <a
                    href="https://www.youtube.com/@caribbeangoods8639"
                    target="_blank"
                    rel="noreferrer"
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
                      border border-[#044421]/15 bg-white shadow-sm
                      hover:bg-[#044421]/5 transition
                    "
                  >
                    <FontAwesomeIcon icon={faYoutube} className="text-[#cc0000]" />
                    YouTube
                  </a>

                  <a
                    href="https://open.spotify.com/show/6JKyBk5hZD8QxqF1mVFINf"
                    target="_blank"
                    rel="noreferrer"
                    className="
                      inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
                      border border-[#044421]/15 bg-white shadow-sm
                      hover:bg-[#044421]/5 transition
                    "
                  >
                    <FontAwesomeIcon icon={faSpotify} className="text-[#1DB954]" />
                    Spotify
                  </a>
                </div>
              </div>
            </section>

            {/* Guatemala season calendar (before dashboard) */}
            <section className="w-full mt-5">
              <GuatemalaSeasonCalendar />
            </section>

            {/* Dashboard */}
            <section className="w-full mt-5">
              <UserHomeDashboard />
            </section>

            {/* <div className="hidden lg:block w-full h-8 bg-[#c9d3c0]"/> */}

            <section className="w-full mt-5 hidden lg:block">
              <iframe
                src="https://7da3f3b2.sibforms.com/serve/MUIFAIm4d6X-yOQg_yk1vzUfko1R0VK8sHILXehHnm1xYy4xFmNuYhQtsfNhjUudDbbAsiydw6oJM2FhyIWwNBq4GS1hgxg3YcEwk9a_fYBlnb-f29Ys_yNvcJYk-fv9MvxxeGAHV5yyUFbU8hYHzPC1oLbChsaMR1pnvD5Z7caX600GctvygVh3s9qCYlNqDJ6h-WFHfuYcf4jY"
                allowFullScreen
                style={{
                    display: 'block',
                    margin: '0 auto',
                    maxWidth: '100%',
                    border: 'none',
                    borderRadius:"10px"
                }}
                title="Brevo Form"
                className="w-[600px] h-[930px] lg:h-[600px] rounded-none lg:rounded-xl"
              ></iframe>
            </section>

            {/* Mobile: events below (only shows on < lg) */}
            <section className="w-full mt-5 lg:hidden">
              <EventsPanel portalEvents={portalEvents} />
              <iframe
                src="https://7da3f3b2.sibforms.com/serve/MUIFAIm4d6X-yOQg_yk1vzUfko1R0VK8sHILXehHnm1xYy4xFmNuYhQtsfNhjUudDbbAsiydw6oJM2FhyIWwNBq4GS1hgxg3YcEwk9a_fYBlnb-f29Ys_yNvcJYk-fv9MvxxeGAHV5yyUFbU8hYHzPC1oLbChsaMR1pnvD5Z7caX600GctvygVh3s9qCYlNqDJ6h-WFHfuYcf4jY"
                allowFullScreen
                style={{
                    display: 'block',
                    margin: '0 auto',
                    maxWidth: '100%',
                    border: 'none',
                    borderRadius:"10px"
                }}
                title="Brevo Form"
                className="mt-2 w-[600px] h-[830px] lg:h-[600px] rounded-none lg:rounded-xl"
              ></iframe>
            </section>
          </div>
        </main>

        {/* ==================== RIGHT SIDEBAR (EVENTS) ==================== */}
        <aside className="hidden lg:block w-[22%] bg-transparent">
          <div className="pt-6 pr-4">
            {/* sticky is optional; if you don't want it, remove lg:sticky lg:top-6 */}
            <div className="lg:sticky lg:top-6">
              <EventsPanel portalEvents={portalEvents} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Portal;

/** ==================== EVENTS PANEL (reusable) ==================== **/
function EventsPanel({ portalEvents }: { portalEvents: PortalEvent[] }) {
  return (
    <div className="rounded-2xl border border-[#044421]/10 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-[#044421]/10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#044421]/10 shrink-0">
              <FontAwesomeIcon icon={faCalendarDays} className="text-[#044421] text-sm" />
            </span>

            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">
                Events & notes
              </p>
              <p className="text-[11px] text-[#044421]/60 leading-snug mt-0.5">
                Seasonal updates & reminders.
              </p>
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#044421]/10 text-[#044421] font-medium shrink-0">
            Soon
          </span>
        </div>
      </div>

      {/* List */}
      <div className="p-2">
        {portalEvents.length === 0 ? (
          <div className="rounded-xl border border-[#044421]/10 bg-[#f6faf7] p-2.5">
            <p className="text-[13px] font-semibold">No upcoming events</p>
            <p className="text-[11px] text-[#044421]/70 mt-1 leading-snug">
              Add items to <code className="px-1 py-0.5 bg-white rounded">portalEvents</code>.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {portalEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-[#044421]/10 bg-[#f6faf7] p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-widest text-[#044421]/60">
                      {ev.monthLabel}
                    </p>
                    <p className="text-[13px] font-semibold leading-snug truncate">
                      {ev.title}
                    </p>
                  </div>

                  {ev.tag ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#044421]/10 shrink-0">
                      {ev.tag}
                    </span>
                  ) : null}
                </div>

                {ev.subtitle ? (
                  <p className="text-[11px] text-[#044421]/70 mt-1.5 leading-snug">
                    {ev.subtitle}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

