import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Search, Download, Send } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../utils/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    try {
      await api.put(`/invoices/${id}/pay`);
      fetchInvoice();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownload = async () => {
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

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await api.post(`/invoices/${id}/send`);
      alert(`Correo enviado exitosamente!\nPreview (para pruebas): ${res.data.previewUrl}`);
    } catch (error) {
      console.error(error);
      alert('Error al enviar el correo');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) return <div className="p-8">Cargando detalle...</div>;
  if (!invoice) return <div className="p-8 text-red-500">Documento no encontrado</div>;

  const isQuote = invoice.type === 'quote';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/invoices')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="flex gap-3">
          {!isQuote && invoice.status === 'pending' && (
            <button onClick={markAsPaid} className="btn-secondary flex items-center gap-2 !text-green-600 !border-green-200 hover:!bg-green-50">
              <CheckCircle size={18} /> Marcar Pagada
            </button>
          )}
          <button onClick={handleSendEmail} disabled={sendingEmail} className="btn-secondary flex items-center gap-2">
            <Send size={18} /> {sendingEmail ? 'Enviando...' : 'Enviar por Email'}
          </button>
          <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>

      {/* Document View */}
      <div className="card !p-12 shadow-lg border border-slate-200">
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 tracking-tight">AuraLink</h1>
            <p className="text-sm text-slate-500 mt-1">Soluciones Tecnológicas</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-800">
              {isQuote ? 'PRESUPUESTO' : 'FACTURA'}
            </h2>
            <p className="text-slate-600 mt-1 text-lg">#{invoice.id.toString().padStart(6, '0')}</p>
            <p className="text-sm text-slate-500 mt-1">Fecha: {format(new Date(invoice.date || invoice.createdAt), 'dd/MM/yyyy')}</p>
            <div className="mt-3 text-right">
              {!isQuote ? (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                  invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {invoice.status === 'paid' ? 'PAGADA' : 'PENDIENTE'}
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  COTIZACIÓN
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emitido para:</h3>
          <p className="text-xl font-bold text-slate-800">{invoice.client.name}</p>
          <p className="text-slate-600 mt-1">{invoice.client.address}</p>
          <div className="flex gap-4 mt-2 text-sm text-slate-500">
            <p>CUIT: {invoice.client.cuit}</p>
            <p>&bull;</p>
            <p>{invoice.client.email}</p>
            <p>&bull;</p>
            <p>{invoice.client.phone}</p>
          </div>
        </div>

        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-800">
              <th className="py-3 font-semibold">Descripción</th>
              <th className="py-3 font-semibold text-right w-24">Cant.</th>
              <th className="py-3 font-semibold text-right w-32">Precio</th>
              <th className="py-3 font-semibold text-right w-24">IVA</th>
              <th className="py-3 font-semibold text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="py-4 text-slate-700 font-medium">{item.description}</td>
                <td className="py-4 text-slate-600 text-right">{item.quantity}</td>
                <td className="py-4 text-slate-600 text-right">${parseFloat(item.price).toFixed(2)}</td>
                <td className="py-4 text-slate-600 text-right">{item.taxRate || 0}%</td>
                <td className="py-4 text-slate-800 font-semibold text-right">
                  ${(parseFloat(item.price) * parseInt(item.quantity) * (1 + parseFloat(item.taxRate || 0) / 100)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <div className="w-80 space-y-3">
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>Subtotal Neto:</span>
              <span>${(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 font-medium">
              <span>IVA Total:</span>
              <span>${(invoice.taxTotal || 0).toFixed(2)}</span>
            </div>
            {(invoice.discount > 0) && (
              <div className="flex justify-between items-center text-red-500 font-medium">
                <span>Descuento:</span>
                <span>-${invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-2xl font-bold text-slate-900 border-t-2 border-slate-800 pt-4 mt-2">
              <span>TOTAL</span>
              <span className="text-indigo-600">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default InvoiceDetail;
