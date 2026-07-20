import React, { useState, useEffect } from "react";
import ResourceLibrary from "./ResourceLibrary";
import CoffeeCharts from "./CoffeeCharts";
import PlaceOrder from "./PlaceOrder";
import Portal from "./Portal"; // (si quieres que "home" siga usando el dashboard overview)
import Dashboard from "./AdminSection/Admin";
import InventoryManager from "./AdminSection/InventoryManager";

import Header from "../../components/HeaderControls";
import Footer from "../../components/Footer";
import SampleForm from "../../components/SampleForm";

import { useAuth } from "../../contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Icons
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBoxesStacked,
  faCartShopping,
  faChartLine,
  faFolderOpen,
  faGaugeHigh,
  faScrewdriverWrench,
  faUser,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import PortalSidebar from "../../components/PortalSidebar";
import MyOrders from "./Orders";
import Profile from '../../components/Profile';

type MenuItem = {
  icon: IconDefinition;
  id: string;
  title: string;
  description: string;
  mode: "tab" | "route";
  to?: string;
};

const PortalHome: React.FC = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("home");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!currentUser) return;
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setIsAdmin(userData?.roles?.includes("admin") || false);
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
      }
    };
    fetchUserRoles();
  }, [currentUser]);

  // eventos externos
  useEffect(() => {
    const handler = () => setActiveTab("place-order");
    window.addEventListener("openPlaceOrder", handler);
    return () => window.removeEventListener("openPlaceOrder", handler);
  }, []);

  useEffect(() => {
    const handler = () => setActiveTab("coffee-charts");
    window.addEventListener("openCoffeeCharts", handler);
    return () => window.removeEventListener("openCoffeeCharts", handler);
  }, []);

  const menuItems: MenuItem[] = [
    // ✅ HOME (tab)
    {
      icon: faGaugeHigh,
      id: "home",
      title: "My dashboard",
      description: "Overview, seasonality & updates.",
      mode: "tab",
    },
    { icon: faChartLine, id: "coffee-charts", title: "Prices & availability", description: "See stock and place an order.", mode: "tab" },
    { icon: faFolderOpen, id: "resource-library", title: "Farm information", description: "Photos, videos and farm resources.", mode: "tab" },
    { icon: faCartShopping, id: "place-order", title: "Order now", description: "Place your order — we reply in 24h.", mode: "tab" },

    { icon: faUser, id: "my-account", title: "My account", description: "Personal information.", mode: "tab" },

    { icon: faBoxesStacked, id: "my-orders", title: "My Orders", description: "See all your orders.", mode: "tab" },

    ...(isAdmin
      ? [
          { icon: faWarehouse, id: "inventory", title: "Inventory", description: "Manage stock, varieties and invoices.", mode: "tab" as const },
          { icon: faScrewdriverWrench, id: "admin", title: "Admin", description: "Manage users and contracts.", mode: "tab" as const },
        ]
      : []),
  ];

  const handleSidebarClick = (item: MenuItem) => {
    setActiveTab(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };



  const renderCenter = () => {
    switch (activeTab) {
      case "home":
        return <Portal setActiveTab={setActiveTab} />;
      case "resource-library":
        return <ResourceLibrary setActiveTab={setActiveTab} />;
      case "coffee-charts":
        return <CoffeeCharts />;
      case "place-order":
        return <PlaceOrder />;
      case "my-orders":
        return <MyOrders />;
      case "my-account":
        return <Profile />;
      case "inventory":
        return isAdmin ? <InventoryManager /> : null;
      case "admin":
        return isAdmin ? <Dashboard /> : null;
      default:
        return <Portal setActiveTab={setActiveTab} />;
    }
  };



  return (
    <div className="w-full">
      <Header />

      <nav className="mt-20 hidden w-full justify-center space-x-6 h-4 border-b bg-[#c9d3c0] lg:flex"/>

      <div className=" w-full flex flex-col lg:flex-row">
        {/* ✅ Sidebar SIEMPRE visible en desktop */}
        <PortalSidebar
          items={menuItems}
          activeId={activeTab}
          onItemClick={handleSidebarClick}
        />


        {/* Center content */}
        <main className="min-w-0 flex-1 bg-[#f6faf7] overflow-x-hidden">
          

          <div className="min-w-0 max-w-full mb-[80px] overflow-x-hidden">{renderCenter()}</div>
        </main>
      </div>

      {/* Botón samples + modal */}
      <button
        type="button"
        onClick={() => setShowSampleModal(true)}
        className="
          fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3
          rounded-full bg-[#044421] text-white shadow-lg hover:bg-[#06603a]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#044421]
          text-sm sm:text-base
        "
      >
        <span className="text-lg">📦</span>
        <span className="font-semibold hidden sm:inline">Request samples</span>
        <span className="font-semibold sm:hidden">Samples</span>
      </button>

      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Request coffee samples</h3>
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <SampleForm />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PortalHome;
