"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { api } from "@/lib/api";
import { InputRecord } from "@/types";
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  DollarSign,
  Package,
  Calendar,
  CheckCircle,
  Tag
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function CostsPage() {
  const { user, isOnline } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newInput, setNewInput] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    cost: "",
    date: new Date().toISOString().split('T')[0]
  });

  const loadInputs = async () => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let data: InputRecord[] = [];
      try {
        const res = await api.getInputs(farmerId);
        data = res.inputs || (Array.isArray(res) ? res : []);
        if (data.length > 0) await db.inputs.bulkPut(data);
      } catch (err) {
        console.error("Error fetching inputs from API:", err);
      }
      
      if (data.length === 0) {
        data = await db.inputs.where("farmerId").equals(farmerId).toArray();
      }
      setInputs(data);
    } catch (err) {
      console.error("Error loading inputs:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadInputs();
  }, [farmerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) return;
    
    const quantity = parseFloat(newInput.quantity);
    const cost = parseFloat(newInput.cost);

    if (isNaN(quantity) || quantity <= 0) {
      alert("Por favor ingresa una cantidad válida");
      return;
    }
    if (isNaN(cost) || cost < 0) {
      alert("Por favor ingresa un costo válido");
      return;
    }

    const inputData = {
      name: newInput.name,
      quantity,
      unit: newInput.unit,
      cost,
      date: newInput.date,
      farmerId
    };

    try {
      if (isOnline) {
        await api.createInput(inputData);
      } else {
        await db.inputs.add({
          ...inputData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'PENDIENTE'
        } as any);
      }
      setShowModal(false);
      setNewInput({ name: "", quantity: "", unit: "kg", cost: "", date: new Date().toISOString().split('T')[0] });
      loadInputs();
    } catch (err) {
      alert("Error al registrar insumo");
    }
  };

  const totalCost = inputs.reduce((sum, i) => sum + (i.cost || 0), 0);

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header */}
      <div className="p-4 flex items-center" style={{ backgroundColor: COLORS.amber.primary }}>
        <Link href="/dashboard" className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl flex-1" style={{ color: COLORS.white, fontWeight: 700 }}>Mis Insumos</h2>
      </div>

      <div className="p-4">
        {/* Resumen de costos */}
        <div className="mb-6 p-8 rounded-2xl text-center" style={{ backgroundColor: COLORS.amber.pale, border: `2px solid ${COLORS.amber.light}` }}>
          <p className="text-sm mb-2" style={{ color: COLORS.gray.medium }}>Total gastado</p>
          <p className="text-5xl" style={{ color: COLORS.amber.primary, fontWeight: 700 }}>${totalCost.toLocaleString()}</p>
        </div>

        {/* Lista de insumos */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-800 mb-2">Registros Recientes</h3>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.amber.primary }}></div>
            </div>
          ) : (
            <>
              {inputs.map((input) => (
                <div key={input.id} className="p-4 rounded-xl border border-gray-100 bg-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                       <Package size={20} color={COLORS.amber.primary} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{input.name}</p>
                      <p className="text-[10px] text-gray-500">{input.quantity} {input.unit} • {new Date(input.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-600">${(input.cost || 0).toLocaleString()}</p>
                </div>
              ))}
              {inputs.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <p>No tienes gastos registrados</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botón nuevo insumo */}
        <button onClick={() => setShowModal(true)} className="w-full mt-6 p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.amber.primary, color: COLORS.white, fontWeight: 700 }}>
          <Plus size={20} />
          <span>Registrar Nuevo Insumo</span>
        </button>
      </div>

      {/* Modal Nuevo Insumo */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-bold mb-6" style={{ color: COLORS.gray.dark }}>Registrar Gasto</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Nombre del Insumo</label>
                <div className="relative">
                   <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    type="text" 
                    required
                    value={newInput.name}
                    onChange={e => setNewInput({...newInput, name: e.target.value})}
                    placeholder="Ej: Fertilizante NPK" 
                    className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all text-gray-900 font-medium" 
                   />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Cantidad</label>
                  <input 
                    type="number" 
                    required
                    value={newInput.quantity}
                    onChange={e => setNewInput({...newInput, quantity: e.target.value})}
                    placeholder="0" 
                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all text-gray-900 font-medium" 
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Unidad</label>
                  <select 
                    value={newInput.unit}
                    onChange={e => setNewInput({...newInput, unit: e.target.value})}
                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="kg">Kilos (kg)</option>
                    <option value="L">Litros (L)</option>
                    <option value="bolsa">Bolsas</option>
                    <option value="unidad">Unidades</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Costo Total ($)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    type="number" 
                    required
                    value={newInput.cost}
                    onChange={e => setNewInput({...newInput, cost: e.target.value})}
                    placeholder="0" 
                    className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all text-gray-900 font-medium" 
                   />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Fecha</label>
                <div className="relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    type="date" 
                    required
                    value={newInput.date}
                    onChange={e => setNewInput({...newInput, date: e.target.value})}
                    className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all text-gray-900 font-medium" 
                   />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 p-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ backgroundColor: COLORS.amber.primary }}>
                  <CheckCircle size={20} />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
