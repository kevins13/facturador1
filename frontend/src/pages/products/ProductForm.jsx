import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Package, Save, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      api.get('/products').then((res) => {
        const product = res.data.find(p => p.id === parseInt(id));
        if (product) {
          setValue('name', product.name);
          setValue('code', product.code);
          setValue('price', product.price);
          setValue('stock', product.stock);
        }
      });
    }
  }, [id, isEditing, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/products/${id}`, data);
      } else {
        await api.post('/products', data);
      }
      navigate('/products');
    } catch (error) {
      alert('Error al guardar el producto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Package className="text-indigo-500" />
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-slate-500">Completa los datos del producto o servicio.</p>
        </div>
      </div>

      <div className="card p-8 border border-slate-200">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nombre del Producto *</label>
              <input 
                {...register('name', { required: 'El nombre es requerido' })}
                className="input-field w-full"
                placeholder="Ej. Diseño Web"
              />
              {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Código (Opcional)</label>
              <input 
                {...register('code')}
                className="input-field w-full"
                placeholder="Ej. SRV-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Precio *</label>
              <input 
                type="number" step="0.01"
                {...register('price', { required: 'El precio es requerido', min: 0 })}
                className="input-field w-full"
                placeholder="0.00"
              />
              {errors.price && <span className="text-red-500 text-sm">{errors.price.message}</span>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Stock (Opcional)</label>
              <input 
                type="number"
                {...register('stock')}
                className="input-field w-full"
                placeholder="0"
                defaultValue={0}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save size={20} />
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
