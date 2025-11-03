import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../store/authStore';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import Dashboard from '../pages/dashboard/Dashboard';
import CompaniesPage from '../pages/companies/CompaniesPage';
import { CompanyDetailsPage } from '../pages/companies';
import { SettingsPage } from '../pages/settings';
import ClaimsPage from '../pages/claims/ClaimsPage';
import MembersPage from '../pages/members/MembersPage';
import ProvidersPage from '../pages/providers/ProvidersPage';
import MedicalCatalogPage from '../pages/medical-catalog/MedicalCatalogPage';
import SchemesPage from '../pages/schemes/SchemesPage';
import { SchemeDetailsPage } from '../pages/schemes';
import ReportsPage from '../pages/reports/ReportsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
// import { ROUTES } from './routes'; // For future use

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      // Dashboard
      {
        index: true,
        element: <Dashboard />
      },
      
      // Companies
      {
        path: 'companies',
        element: <CompaniesPage />
      },
      {
        path: 'companies/:id',
        element: <CompanyDetailsPage />
      },
      {
        path: 'companies/:id/:tab',
        element: <CompanyDetailsPage />
      },
      
      // Schemes with nested tabs
      {
        path: 'schemes',
        element: <SchemesPage />
      },
      {
        path: 'schemes/:id',
        element: <SchemeDetailsPage />
      },
      {
        path: 'schemes/:id/:tab',
        element: <SchemeDetailsPage />
      },
      {
        path: 'schemes/:id/:tab/:subTab',
        element: <SchemeDetailsPage />
      },
      {
        path: 'schemes/:id/:tab/:subTab/:subSubTab',
        element: <SchemeDetailsPage />
      },
      
      // Medical Catalog with tabs
      {
        path: 'medical-catalog',
        element: <MedicalCatalogPage />
      },
      {
        path: 'medical-catalog/:tab',
        element: <MedicalCatalogPage />
      },
      
      // Other pages
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
        path: 'reports',
        element: <ReportsPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      },
    ]
  }
]);

export const AppRouter: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default router;
