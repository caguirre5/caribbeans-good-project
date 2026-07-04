import React from "react";

import EventsPanel from "../../components/EventsPanel";
import UserHomeDashboard from "./UserHomeDashboard";

interface PortalProps {
  setActiveTab: (tab: string) => void;
}

const SHOW_SUBSCRIBE_FORM = false;

const SubscribeForm = () => (
  <iframe
    src="https://7da3f3b2.sibforms.com/serve/MUIFAIm4d6X-yOQg_yk1vzUfko1R0VK8sHILXehHnm1xYy4xFmNuYhQtsfNhjUudDbbAsiydw6oJM2FhyIWwNBq4GS1hgxg3YcEwk9a_fYBlnb-f29Ys_yNvcJYk-fv9MvxxeGAHV5yyUFbU8hYHzPC1oLbChsaMR1pnvD5Z7caX600GctvygVh3s9qCYlNqDJ6h-WFHfuYcf4jY"
    allowFullScreen
    style={{
      display: "block",
      margin: "0 auto",
      maxWidth: "100%",
      border: "none",
      borderRadius: "10px",
    }}
    title="Brevo Form"
    className="mt-2 w-[600px] h-[830px] lg:h-[600px] rounded-none lg:rounded-xl"
  />
);

const Portal: React.FC<PortalProps> = () => {
  return (
    <div className="w-full text-[#044421] bg-[#f6faf7]">
      <div className="w-full flex flex-col lg:flex-row">
        <main className="flex-1 w-full">
          <div className="w-full px-4 md:px-6 lg:px-8 py-6">
            <section className="w-full">
              <UserHomeDashboard />
            </section>

            {SHOW_SUBSCRIBE_FORM && (
              <section className="w-full mt-5 hidden lg:block">
                <SubscribeForm />
              </section>
            )}

            <section className="w-full mt-5 lg:hidden">
              <EventsPanel />
              {SHOW_SUBSCRIBE_FORM && <SubscribeForm />}
            </section>
          </div>
        </main>

        <aside className="hidden lg:block w-[22%] bg-transparent">
          <div className="pt-6 pr-4">
            <div className="lg:sticky lg:top-6">
              <EventsPanel />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Portal;
