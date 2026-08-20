import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

// ---------------------------------------------------------------------------
// Inline Auth Guard Function
// Protects routes by checking if a valid JWT token exists in localStorage
// ---------------------------------------------------------------------------
export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true;
  }

  // Redirect unauthenticated users to the Login page
  return router.parseUrl('/login');
};

// ---------------------------------------------------------------------------
// Application Routes Setup
// ---------------------------------------------------------------------------
export const routes: Routes = [
  // 1. Default Route -> Redirects to Login or Dashboard
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // 2. Authentication Route
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Sales System - Login'
  },

  // 3. Protected Application Routes (Requires Authentication)
  {
    path: '',
    canActivate: [authGuard],
    children: [
      // Master Screens
      {
        path: 'masters/customer',
        loadComponent: () =>
          import('./features/masters/customer-master/customer-master.component').then(
            (m) => m.CustomerMasterComponent
          ),
        title: 'Customer Master'
      },
      {
        path: 'masters/item',
        loadComponent: () =>
          import('./features/masters/item-master/item-master.component').then(
            (m) => m.ItemMasterComponent
          ),
        title: 'Item Master'
      },

      // Sales Transactions
      {
        path: 'sales/sales-entry',
        loadComponent: () =>
          import('./features/sales/sales-entry/sales-entry.component').then(
            (m) => m.SalesEntryComponent
          ),
        title: 'Sales Invoice Entry'
      },

      // Analytics & Dashboard
      {
        path: 'analytics/dashboard',
        loadComponent: () =>
          import('./features/analytics/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
        title: 'Sales Dashboard'
      },
      {
        path: 'analytics/sales-report',
        loadComponent: () =>
          import('./features/analytics/sales-report/sales-report.component').then(
            (m) => m.SalesReportComponent
          ),
        title: 'Interactive Sales Report'
      }
    ]
  },

  // 4. Wildcard Route -> Redirects unknown URLs back to Login or Dashboard
  {
    path: '**',
    redirectTo: 'login'
  }
];


import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient()
  ]
};
