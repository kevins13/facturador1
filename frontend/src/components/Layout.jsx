import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, LogOut, Package } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Catálogo', path: '/products', icon: Package, roles: ['ADMIN', 'SELLER'] },
    { name: 'Clientes', path: '/clients', icon: Users, roles: ['ADMIN', 'SELLER'] },
    { name: 'Facturas', path: '/invoices', icon: FileText, roles: ['ADMIN', 'SELLER'] },
  ].filter(link => !link.roles || link.roles.includes(user.role || 'ADMIN'));

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-wider text-primary-500">AuraLink</h1>
          <p className="text-xs text-slate-400 mt-1">Sistema de Facturación</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || 
                           (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center uppercase font-bold text-sm">
              {user.email.charAt(0)}
            </div>
            <div className="text-sm truncate text-slate-300">{user.email}</div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-slate-400 hover:text-white px-4 py-2 w-full transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">
            {navLinks.find(link => location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path)))?.name || ''}
          </h2>
          {location.pathname !== '/' && (
            <Link to="/" className="btn-secondary text-sm flex items-center gap-2 py-1.5 px-3">
              <LayoutDashboard size={16} />
              Ir al Dashboard
            </Link>
          )}
        </header>
        <div className="flex-1 overflow-auto p-8 main-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
