import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, FileText, ArrowRightCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';

const InvoicesList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('invoice'); // 'invoice' or 'quote'

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `documento-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
    }
  };

  const handleConvert = async (id) => {
    if (!window.confirm('¿Desea convertir este presupuesto en una factura real?')) return;
    try {
      await api.put(`/invoices/${id}/convert`);
      fetchInvoices();
      setFilterType('invoice');
    } catch (error) {
      alert('Error al convertir el presupuesto');
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Cargando documentos...</div>;

  const filteredInvoices = invoices.filter(inv => (inv.type || 'invoice') === filterType);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Operaciones</h2>
          <p className="text-slate-500">Administra tus facturas y presupuestos.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary flex items-center gap-2 transition-transform hover:scale-105">
          <Plus size={18} />
          Nueva Operación
        </Link>
      </div>

      <div className="flex space-x-2 border-b border-slate-200">
        <button 
          onClick={() => setFilterType('invoice')}
          className={`pb-3 px-4 font-medium transition-colors ${filterType === 'invoice' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Facturas
        </button>
        <button 
          onClick={() => setFilterType('quote')}
          className={`pb-3 px-4 font-medium transition-colors ${filterType === 'quote' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Presupuestos
        </button>
      </div>

      <div className="card overflow-x-auto border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-sm">
              <th className="py-4 px-6 font-semibold">Nro.</th>
              <th className="py-4 px-6 font-semibold">Cliente</th>
              <th className="py-4 px-6 font-semibold">Fecha</th>
              <th className="py-4 px-6 font-semibold">Total</th>
              <th className="py-4 px-6 font-semibold">Estado</th>
              <th className="py-4 px-6 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500">
                  No hay {filterType === 'invoice' ? 'facturas' : 'presupuestos'} registrados.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">#{inv.id.toString().padStart(6, '0')}</td>
                  <td className="py-4 px-6 text-slate-600 font-medium">{inv.client.name}</td>
                  <td className="py-4 px-6 text-slate-500">{format(new Date(inv.date || inv.createdAt), 'dd/MM/yyyy')}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">${inv.total.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    {filterType === 'invoice' ? (
                      <span className={`px-3 py-1 text-xs rounded-full font-medium border ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        Cotización
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 flex justify-end space-x-2">
                    {filterType === 'quote' && (
                      <button onClick={() => handleConvert(inv.id)} title="Convertir a Factura" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ArrowRightCircle size={18} />
                      </button>
                    )}
                    <Link to={`/invoices/${inv.id}`} title="Ver Detalle" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Eye size={18} />
                    </Link>
                    <button onClick={() => handleDownload(inv.id)} title="Descargar PDF" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <FileText size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesList;
