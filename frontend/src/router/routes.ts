// Comprehensive routing configuration for nested tabs
export interface RouteConfig {
  path: string;
  component: string;
  tabs?: {
    [key: string]: {
      path: string;
      subTabs?: {
        [key: string]: {
          path: string;
          subTabs?: {
            [key: string]: {
              path: string;
            };
          };
        };
      };
    };
  };
}

export const ROUTES: Record<string, RouteConfig> = {
  // Main pages
  dashboard: {
    path: '/',
    component: 'Dashboard'
  },
  
  // Companies with nested tabs
  companies: {
    path: '/companies',
    component: 'CompaniesPage'
  },
  companyDetails: {
    path: '/companies/:id',
    component: 'CompanyDetailsPage',
    tabs: {
      overview: { path: '/companies/:id/overview' },
      schemes: { path: '/companies/:id/schemes' },
      members: { path: '/companies/:id/members' },
      analytics: { path: '/companies/:id/analytics' }
    }
  },

  // Schemes with nested tabs
  schemes: {
    path: '/schemes',
    component: 'SchemesPage'
  },
  schemeDetails: {
    path: '/schemes/:id',
    component: 'SchemeDetailsPage',
    tabs: {
      overview: { path: '/schemes/:id/overview' },
      assignments: { 
        path: '/schemes/:id/assignments',
        subTabs: {
          coverage: {
            path: '/schemes/:id/assignments/coverage',
            subTabs: {
              plans: { path: '/schemes/:id/assignments/coverage/plans' },
              benefits: { path: '/schemes/:id/assignments/coverage/benefits' }
            }
          },
          medical: {
            path: '/schemes/:id/assignments/medical',
            subTabs: {
              hospitals: { path: '/schemes/:id/assignments/medical/hospitals' },
              services: { path: '/schemes/:id/assignments/medical/services' },
              labtests: { path: '/schemes/:id/assignments/medical/labtests' },
              medicines: { path: '/schemes/:id/assignments/medical/medicines' }
            }
          }
        }
      },
      members: { path: '/schemes/:id/members' },
      analytics: { path: '/schemes/:id/analytics' }
    }
  },

  // Medical Catalog with nested tabs
  medicalCatalog: {
    path: '/medical-catalog',
    component: 'MedicalCatalogPage',
    tabs: {
      services: { path: '/medical-catalog/services' },
      medicines: { path: '/medical-catalog/medicines' },
      labtests: { path: '/medical-catalog/labtests' },
      prices: { path: '/medical-catalog/prices' }
    }
  },

  // Other pages
  members: {
    path: '/members',
    component: 'MembersPage'
  },
  providers: {
    path: '/providers',
    component: 'ProvidersPage'
  },
  claims: {
    path: '/claims',
    component: 'ClaimsPage'
  },
  reports: {
    path: '/reports',
    component: 'ReportsPage'
  },
  analytics: {
    path: '/analytics',
    component: 'AnalyticsPage'
  },
  settings: {
    path: '/settings',
    component: 'SettingsPage'
  }
};

// Helper functions for route generation
export const generateRoute = (routeName: string, params: Record<string, string> = {}): string => {
  const route = ROUTES[routeName];
  if (!route) return '/';
  
  let path = route.path;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  
  return path;
};

export const generateTabRoute = (
  routeName: string, 
  params: Record<string, string> = {}, 
  tab?: string, 
  subTab?: string, 
  subSubTab?: string
): string => {
  const route = ROUTES[routeName];
  if (!route || !route.tabs) return generateRoute(routeName, params);
  
  let path = route.path;
  
  if (tab && route.tabs[tab]) {
    path = route.tabs[tab].path;
    
    if (subTab && route.tabs[tab].subTabs && route.tabs[tab].subTabs[subTab]) {
      path = route.tabs[tab].subTabs[subTab].path;
      
      if (subSubTab && route.tabs[tab].subTabs[subTab].subTabs && route.tabs[tab].subTabs[subTab].subTabs[subSubTab]) {
        path = route.tabs[tab].subTabs[subTab].subTabs[subSubTab].path;
      }
    }
  }
  
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  
  return path;
};

// Tab validation functions
export const isValidTab = (routeName: string, tab: string): boolean => {
  const route = ROUTES[routeName];
  return route?.tabs ? tab in route.tabs : false;
};

export const isValidSubTab = (routeName: string, tab: string, subTab: string): boolean => {
  const route = ROUTES[routeName];
  return route?.tabs?.[tab]?.subTabs ? subTab in route.tabs[tab].subTabs! : false;
};

export const isValidSubSubTab = (routeName: string, tab: string, subTab: string, subSubTab: string): boolean => {
  const route = ROUTES[routeName];
  return route?.tabs?.[tab]?.subTabs?.[subTab]?.subTabs ? subSubTab in route.tabs[tab].subTabs![subTab].subTabs! : false;
};

