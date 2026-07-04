import React from "react";
import GoogleSheetTable from "../../components/GoogleSheet";

const CoffeeCharts: React.FC = () => {
  const handleOrderNow = () => {
    sessionStorage.setItem("openOrderNow", "true");
    window.dispatchEvent(new Event("openPlaceOrder"));
  };

  return (
    <div
      className="flex flex-col text-center items-center text-[#044421]"
      style={{ minHeight: "calc(100vh - 15rem)" }}
    >
      <div className="w-full px-4 pt-5 pb-3 lg:pt-7">
        <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 border-b border-[#044421]/10 pb-4 text-left lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1
              className="text-4xl font-bold leading-none lg:text-5xl"
              style={{ fontFamily: "KingsThing" }}
            >
              Prices & availability
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-snug text-[#044421]/75 lg:text-base">
              Browse current green coffee availability, filter by your access,
              and place an order when you are ready.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
            <div className="rounded-lg border border-[#044421]/10 bg-white/60 px-4 py-3 text-sm leading-snug text-[#044421]/80 shadow-sm lg:max-w-[360px]">
              Some varieties are exclusive to specific groups.
              <span className="ml-2 inline-flex rounded border border-yellow-400 bg-yellow-100 px-2 py-[2px] text-[10px] font-semibold text-yellow-800">
                EXCLUSIVE
              </span>
            </div>

            <button
              onClick={handleOrderNow}
              className="h-12 w-full rounded-full bg-[#044421] px-8 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#066232] sm:w-auto"
            >
              Order now
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <GoogleSheetTable />
      </div>
    </div>
  );
};

export default CoffeeCharts;
