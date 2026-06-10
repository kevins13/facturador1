import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/invoices/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching stats', error);
        if (error.response?.status === 403) {
           navigate('/invoices'); // Sellers can't see this
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  if (loading) return <div className="p-8">Cargando dashboard...</div>;
  if (!stats) return <div className="p-8 text-red-500">Error cargando métricas.</div>;

  const statCards = [
    { title: 'Mes Actual', value: `$${stats.totalThisMonth.toFixed(2)}`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Mes Pasado', value: `$${stats.totalLastMonth.toFixed(2)}`, icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
    { title: 'Pendiente de Cobro', value: `$${stats.pendingTotal.toFixed(2)}`, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Total Pagado', value: `$${stats.paidTotal.toFixed(2)}`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-500">Métricas y estadísticas de tu negocio.</p>
        </div>
        <div className="space-x-3">
          <Link to="/clients/new" className="btn-secondary transition-transform hover:scale-105 inline-block">Nuevo Cliente</Link>
          <Link to="/invoices/new" className="btn-primary transition-transform hover:scale-105 inline-block">Nueva Factura</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card flex items-center p-6 space-x-4 hover:shadow-lg transition-shadow border border-slate-100">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon size={28} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h4 className="text-2xl font-bold text-slate-900">{stat.value}</h4>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6 border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Ingresos (Últimos 6 meses)</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
