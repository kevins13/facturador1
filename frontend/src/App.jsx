import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Carga perezosa de rutas (Lazy Loading) para evitar que un error en una librería (ej. recharts) tire toda la app
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ClientsList = lazy(() => import('./pages/clients/ClientsList'));
const ClientForm = lazy(() => import('./pages/clients/ClientForm'));
const InvoicesList = lazy(() => import('./pages/invoices/InvoicesList'));
const InvoiceForm = lazy(() => import('./pages/invoices/InvoiceForm'));
const InvoiceDetail = lazy(() => import('./pages/invoices/InvoiceDetail'));
const ProductsList = lazy(() => import('./pages/products/ProductsList'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando aplicación...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              
              {/* Clientes */}
              <Route path="clients" element={<ClientsList />} />
              <Route path="clients/new" element={<ClientForm />} />
              <Route path="clients/edit/:id" element={<ClientForm />} />

              {/* Productos */}
              <Route path="products" element={<ProductsList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/edit/:id" element={<ProductForm />} />
              
              {/* Facturas */}
              <Route path="invoices" element={<InvoicesList />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
