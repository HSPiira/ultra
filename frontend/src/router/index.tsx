import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/dashboard/Dashboard';
import CompaniesPage from '../pages/companies/CompaniesPage';
import { SettingsPage } from '../pages/settings';
import ClaimsPage from '../pages/claims/ClaimsPage';
import MembersPage from '../pages/members/MembersPage';
import ProvidersPage from '../pages/providers/ProvidersPage';
import MedicalCatalogPage from '../pages/medical-catalog/MedicalCatalogPage';
import SchemesPage from '../pages/schemes/SchemesPage';
import ReportsPage from '../pages/reports/ReportsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'companies',
        element: <CompaniesPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'claims',
        element: <ClaimsPage />
      },
      {
        path: 'members',
        element: <MembersPage />
      },
      {
        path: 'providers',
        element: <ProvidersPage />
      },
      {
        path: 'medical-catalog',
        element: <MedicalCatalogPage />
      },
      {
        path: 'schemes',
        element: <SchemesPage />
      },
      {
        path: 'reports',
        element: <ReportsPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      }
    ]
  }
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default router;
