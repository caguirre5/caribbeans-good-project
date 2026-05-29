import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faBriefcase,
  faCalendarDays,
  faChevronLeft,
  faChevronRight,
  faFileContract,
  faFolderTree,
  faLayerGroup,
  faReceipt,
  faUserCheck,
  faUsers,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons';
import UserList from './UserList';
import Requests from './Requests';
import ProjectsList from './ProjectsList';
import ContractsDashboard from './ContractDashboard';
import TeamMembersDashboard from './TeamDashboard';
import OrdersList from './OrdersList';
import GroupsManager from './Groups';
import CompaniesManager from './Companies';
import EventsManager from './EventsManager';

type AdminTab =
  | 'users'
  | 'requests'
  | 'orders'
  | 'projects'
  | 'groups'
  | 'contracts'
  | 'teammembers'
  | 'companies'
  | 'events';

const tabs: { id: AdminTab; label: string; description: string; icon: any }[] = [
  { id: 'users', label: 'Users', description: 'Accounts, groups and roles', icon: faUsers },
  { id: 'requests', label: 'Requests', description: 'Pending access approvals', icon: faUserCheck },
  { id: 'contracts', label: 'Contracts', description: 'Reservations and dispatches', icon: faFileContract },
  { id: 'orders', label: 'Orders', description: 'Fulfilment workflow', icon: faReceipt },
  { id: 'events', label: 'Events', description: 'Portal announcements', icon: faCalendarDays },
  { id: 'companies', label: 'Companies', description: 'Company memberships', icon: faBriefcase },
  { id: 'groups', label: 'Groups', description: 'Exclusive access groups', icon: faLayerGroup },
  { id: 'projects', label: 'Projects', description: 'Impact counters', icon: faFolderTree },
  { id: 'teammembers', label: 'Team', description: 'Public team profiles', icon: faUsersGear },
];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="w-full px-4 lg:pr-10" style={{ minHeight: 'calc(100vh - 15rem)' }}>
      <div className="py-5">
        <p className="text-xs tracking-widest uppercase text-[#044421]/60">Admin</p>
        <h1
          className="text-3xl lg:text-4xl font-bold text-[#044421]"
          style={{ fontFamily: 'KingsThing' }}
        >
          Admin panel
        </h1>
        <p className="text-sm text-[#044421]/70 mt-1">
          Manage portal users, content, orders and internal data from one place.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <aside
          className={[
            'w-full shrink-0 transition-all duration-200',
            sidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-[260px]',
          ].join(' ')}
        >
          <div className="bg-white p-3 rounded-lg shadow-md">
            <div className="flex items-center justify-between gap-2 mb-3 border-b pb-3">
              <div className={sidebarCollapsed ? 'hidden lg:hidden' : 'min-w-0'}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Navigation
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">Admin tools</p>
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="h-9 w-9 rounded-md border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center justify-center shrink-0"
                title={sidebarCollapsed ? 'Show menu' : 'Hide menu'}
                aria-label={sidebarCollapsed ? 'Show admin menu' : 'Hide admin menu'}
              >
                <FontAwesomeIcon
                  icon={sidebarCollapsed ? faChevronRight : faChevronLeft}
                  className="hidden lg:block text-gray-600"
                />
                <FontAwesomeIcon icon={faBars} className="lg:hidden text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    title={sidebarCollapsed ? tab.label : undefined}
                    className={[
                      'w-full text-left rounded-md transition border flex items-center gap-3',
                      sidebarCollapsed ? 'lg:justify-center lg:px-2 px-3 py-2' : 'px-3 py-2',
                      selected
                        ? 'bg-[#174B3D] text-white border-[#174B3D]'
                        : 'bg-white text-gray-700 border-transparent hover:bg-gray-50 hover:border-gray-200',
                    ].join(' ')}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span
                      className={[
                        'h-9 w-9 rounded-md inline-flex items-center justify-center shrink-0',
                        selected ? 'bg-white/10' : 'bg-gray-50',
                      ].join(' ')}
                    >
                      <FontAwesomeIcon
                        icon={tab.icon}
                        className={selected ? 'text-white' : 'text-[#174B3D]'}
                      />
                    </span>

                    <span className={sidebarCollapsed ? 'lg:hidden min-w-0' : 'min-w-0'}>
                      <span className="block text-sm font-semibold truncate">{tab.label}</span>
                      <span
                        className={
                          selected
                            ? 'block text-xs text-white/70 truncate'
                            : 'block text-xs text-gray-400 truncate'
                        }
                      >
                        {tab.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-[#174B3D]/10 inline-flex items-center justify-center">
                <FontAwesomeIcon icon={activeMeta.icon} className="text-[#174B3D]" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{activeMeta.label}</h2>
                <p className="text-sm text-gray-500">{activeMeta.description}</p>
              </div>
            </div>
          </div>

          {activeTab === 'users' && <UserList />}
          {activeTab === 'requests' && <Requests />}
          {activeTab === 'projects' && <ProjectsList />}
          {activeTab === 'contracts' && <ContractsDashboard />}
          {activeTab === 'teammembers' && <TeamMembersDashboard />}
          {activeTab === 'orders' && <OrdersList />}
          {activeTab === 'groups' && <GroupsManager />}
          {activeTab === 'companies' && <CompaniesManager />}
          {activeTab === 'events' && <EventsManager />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
