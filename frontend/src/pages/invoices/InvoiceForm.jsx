import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import Select from 'react-select';
import api from '../../utils/api';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      type: 'invoice',
      discount: 0,
      items: [{ description: '', quantity: 1, price: 0, taxRate: 21, productId: null }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchDiscount = watch('discount');

  let subtotalAccum = 0;
  let taxAccum = 0;

  watchItems.forEach(item => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;
    
    const itemSub = qty * price;
    const itemTax = itemSub * (taxRate / 100);
    
    subtotalAccum += itemSub;
    taxAccum += itemTax;
  });

  const discountValue = parseFloat(watchDiscount) || 0;
  const totalAmount = subtotalAccum + taxAccum - discountValue;

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/products')
    ]).then(([clientsRes, productsRes]) => {
      setClients(clientsRes.data);
      setProducts(productsRes.data);
    }).catch(err => console.error("Error fetching data", err));
  }, []);

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} - $${p.price.toFixed(2)}`,
    product: p
  }));

  const handleProductSelect = (index, selectedOption) => {
    if (selectedOption) {
      const p = selectedOption.product;
      setValue(`items.${index}.description`, p.name);
      setValue(`items.${index}.price`, p.price);
    }
  };

  const onSubmit = async (data) => {
    try {
      await api.post('/invoices', data);
      navigate('/invoices');
    } catch (error) {
      alert('Error al crear la factura o presupuesto');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Nueva Operación</h2>
        <button onClick={() => navigate('/invoices')} className="btn-secondary">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <select 
                {...register('clientId', { required: 'Debe seleccionar un cliente' })}
                className="input-field w-full"
              >
                <option value="">Seleccione un cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.cuit}</option>
                ))}
              </select>
              {errors.clientId && <span className="text-red-500 text-xs">{errors.clientId.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
              <select {...register('type')} className="input-field w-full">
                <option value="invoice">Factura (Afecta ingresos)</option>
                <option value="quote">Presupuesto (Cotización)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-semibold text-slate-800">Detalle de Ítems</h3>
            <button 
              type="button" 
              onClick={() => append({ description: '', quantity: 1, price: 0, taxRate: 21, productId: null })}
              className="btn-secondary text-sm flex items-center gap-1 py-1.5"
            >
              <Plus size={16} /> Agregar Fila
            </button>
          </div>

          <div className="space-y-4 text-sm font-medium text-slate-500 hidden lg:flex px-2">
            <div className="w-1/4">Producto del Catálogo</div>
            <div className="w-1/4">Descripción Manual</div>
            <div className="w-24 text-right">Cant.</div>
            <div className="w-32 text-right">Precio ($)</div>
            <div className="w-24 text-right">IVA (%)</div>
            <div className="w-32 text-right">Subtotal</div>
            <div className="w-12"></div>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentItem = watchItems[index] || {};
              const itemSubtotal = (parseFloat(currentItem.quantity || 0) * parseFloat(currentItem.price || 0));
              const itemTax = itemSubtotal * (parseFloat(currentItem.taxRate || 0) / 100);
              const totalRow = itemSubtotal + itemTax;

              return (
                <div key={field.id} className="flex flex-col lg:flex-row items-end lg:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-full lg:w-1/4">
                    <label className="lg:hidden block text-xs text-slate-500 mb-1">Buscar Producto</label>
                    <Select
                      options={productOptions}
                      placeholder="Buscar en catálogo..."
                      isClearable
                      onChange={(opt) => handleProductSelect(index, opt)}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-full lg:w-1/4">
                    <label className="lg:hidden block text-xs text-slate-500 mb-1">Descripción</label>
                    <input
                      {...register(`items.${index}.description`, { required: true })}
                      className="input-field py-1.5 w-full bg-white"
                      placeholder="Descripción"
                    />
                  </div>
                  <div className="w-1/3 lg:w-24">
                    <label className="lg:hidden block text-xs text-slate-500 mb-1">Cant.</label>
                    <input
                      type="number" min="1" step="0.01"
                      {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                      className="input-field py-1.5 text-right w-full bg-white"
                    />
                  </div>
                  <div className="w-1/3 lg:w-32">
                    <label className="lg:hidden block text-xs text-slate-500 mb-1">Precio Unit.</label>
                    <input
                      type="number" min="0" step="0.01"
                      {...register(`items.${index}.price`, { required: true, min: 0 })}
                      className="input-field py-1.5 text-right w-full bg-white"
                    />
                  </div>
                  <div className="w-1/3 lg:w-24">
                    <label className="lg:hidden block text-xs text-slate-500 mb-1">IVA</label>
                    <select {...register(`items.${index}.taxRate`)} className="input-field py-1.5 w-full bg-white">
                      <option value="0">0%</option>
                      <option value="10.5">10.5%</option>
                      <option value="21">21%</option>
                    </select>
                  </div>
                  <div className="w-full lg:w-32 text-right font-medium text-slate-700 py-2">
                    ${totalRow.toFixed(2)}
                  </div>
                  <div className="w-full lg:w-12 flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white rounded-md border border-slate-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="w-full md:w-1/3 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Descuento Global ($)</label>
              <input 
                type="number" step="0.01" min="0"
                {...register('discount')}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
            
            <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal Neto:</span>
                <span>${subtotalAccum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>IVA Total:</span>
                <span>${taxAccum.toFixed(2)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>Descuento:</span>
                  <span>-${discountValue.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-lg font-bold text-slate-900">
                <span>TOTAL:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isSubmitting || fields.length === 0} className="btn-primary py-3 px-8 text-lg">
            {isSubmitting ? 'Guardando...' : 'Emitir Documento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
