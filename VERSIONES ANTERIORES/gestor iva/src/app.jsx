import React, { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, FileText, PieChart, TrendingUp, TrendingDown, Calendar,
  CheckCircle, AlertCircle, Loader2, Filter, Download, Trash2, Plus, Cloud, CloudOff
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- TUS CREDENCIALES (YA INTEGRADAS) ---
const apiKey = "AQ.Ab8RN6LJfWtXae8xFQg2jNq9VqAbUYbdDE9d74Az2EEB0IRA3A"; 

const firebaseConfig = {
  apiKey: "AIzaSyD71ejCZx6kNVMugTQvYHnhrn_44osg4ZA",
  authDomain: "iva-app-7b81e.firebaseapp.com",
  projectId: "iva-app-7b81e",
  storageBucket: "iva-app-7b81e.firebasestorage.app",
  messagingSenderId: "314274336517",
  appId: "1:314274336517:web:b787d9f772b94b0c28716c"
};

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Autenticación Anónima (Para que funcione sin login por ahora)
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Error al autenticar:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronización con TU Firestore
  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);
    
    // Ruta en tu base de datos: users -> [tu_id] -> invoices
    const invoicesRef = collection(db, 'users', user.uid, 'invoices');
    const unsubscribe = onSnapshot(invoicesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setInvoices(data);
      setIsSyncing(false);
    }, (error) => {
      console.error("Error cargando facturas:", error);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Guardar en la nube
  const addInvoice = async (invoice) => {
    if (!user) return;
    try {
      const newId = Date.now().toString();
      const invoiceData = { ...invoice, id: newId };
      const docRef = doc(db, 'users', user.uid, 'invoices', newId);
      await setDoc(docRef, invoiceData);
      setCurrentView('reports');
    } catch (error) {
      console.error("Error guardando la factura:", error);
    }
  };

  // Eliminar de la nube
  const deleteInvoice = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'invoices', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error eliminando la factura:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col space-y-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
        <p className="text-gray-600 font-medium">Conectando con la base de datos...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      <aside className="w-64 bg-black text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex flex-col items-center border-b border-gray-800">
          <div className="bg-white p-2 rounded-lg mb-3">
            <img 
              src="/logo-redes_Transparente-216x216.png" 
              alt="Logo" 
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNWE1MGEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgMTZWMi41bC0yLjUtLjVWMTZjMCAxLjEtLjkgMi0yIDJINiIvPjxwYXRoIGQ9Ik0yIDE2djYuNWwyLjUuNVYxNmMwLTEuMS45LTIgMi0yaDE0Ii8+PHBhdGggZD0iTTEyIDEydjYuNWwyLjUuNVYxMmMwLTEuMS45LTIgMi0yaDMiLz48cGF0aCBkPSJNMTQgMnY2LjVsMi41LjVWOGMwLTEuMS0uOS0yLTItMmgtMyIvPjwvc3ZnPg==';
              }}
            />
          </div>
          <h1 className="text-lg font-bold text-center tracking-wider">REDES CARRERAS S.L.</h1>
          <p className="text-xs text-orange-500 uppercase font-semibold mt-1">Telecomunicaciones</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem icon={<PieChart />} label="Dashboard" isActive={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<TrendingDown className="text-red-400" />} label="Subir Compras" isActive={currentView === 'upload-expense'} onClick={() => setCurrentView('upload-expense')} />
          <NavItem icon={<TrendingUp className="text-green-400" />} label="Subir Ventas" isActive={currentView === 'upload-income'} onClick={() => setCurrentView('upload-income')} />
          <NavItem icon={<FileText />} label="Reportes" isActive={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
        </nav>
        
        <div className="p-4 text-xs text-gray-500 border-t border-gray-800 text-center flex flex-col items-center">
          <p className="mb-2">Gestión de IVA v1.0</p>
          {user ? (
            <div className="flex items-center space-x-1 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
              <Cloud size={14} />
              <span className="font-medium">{isSyncing ? 'Sincronizando...' : 'Conectado a Firebase'}</span>
            </div>
          ) : (
             <div className="flex items-center space-x-1 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
              <CloudOff size={14} />
              <span className="font-medium">Sin Conexión</span>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {currentView === 'dashboard' && <DashboardView invoices={invoices} />}
          {currentView === 'upload-expense' && <UploadView type="expense" onSave={addInvoice} />}
          {currentView === 'upload-income' && <UploadView type="income" onSave={addInvoice} />}
          {currentView === 'reports' && <ReportsView invoices={invoices} onDelete={deleteInvoice} />}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function DashboardView({ invoices }) {
  const totalIncomeIVA = invoices.filter(i => i.type === 'income').reduce((acc, curr) => acc + curr.totalIva, 0);
  const totalExpenseIVA = invoices.filter(i => i.type === 'expense').reduce((acc, curr) => acc + curr.totalIva, 0);
  const result = totalIncomeIVA - totalExpenseIVA;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Resumen General</h2>
        <p className="text-gray-500">Vista rápida del estado del IVA de la empresa.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="IVA Repercutido (Ventas)" amount={totalIncomeIVA} icon={<TrendingUp size={24} className="text-green-600" />} bgColor="bg-green-100" />
        <StatCard title="IVA Soportado (Compras)" amount={totalExpenseIVA} icon={<TrendingDown size={24} className="text-red-600" />} bgColor="bg-red-100" />
        <StatCard title="A Pagar a Hacienda" amount={result} icon={<PieChart size={24} className="text-orange-600" />} bgColor="bg-orange-100" isResult={true} />
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold mb-4">Últimos Movimientos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Emisor/Cliente</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3 text-right">IVA</th>
                <th className="px-6 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(-5).reverse().map((inv) => (
                <tr key={inv.id} className="bg-white border-b">
                  <td className="px-6 py-4">{inv.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.emitter}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${inv.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {inv.type === 'income' ? 'VENTA' : 'COMPRA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">€{inv.totalIva.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold">€{inv.total.toFixed(2)}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No hay facturas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, icon, bgColor, isResult }) {
  const isNegative = amount < 0;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-4 rounded-full ${bgColor}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className={`text-2xl font-bold ${isResult ? (isNegative ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
          {isResult && isNegative ? 'A Devolver: ' : ''}€{Math.abs(amount).toFixed(2)}
        </h4>
      </div>
    </div>
  );
}

function UploadView({ type, onSave }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError('');
      setExtractedData(null);
    }
  };

  const processFileWithAI = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        const mimeType = file.type;

        if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
           throw new Error("Formato no soportado. Por favor sube una imagen o PDF.");
        }

        let resultData = null;
        let attempts = 0;
        
        while (attempts < 3) {
          try {
            const prompt = `Eres un contable experto en España. Extrae los datos de esta factura.
            REGLAS IMPORTANTES:
            - Devuelve ÚNICAMENTE un objeto JSON válido, sin markdown.
            - Extrae el nombre del emisor.
            - Extrae la fecha en formato YYYY-MM-DD.
            - Extrae el subtotal (base imponible).
            - Identifica TODOS los tipos de IVA presentes. Para cada uno crea un objeto con "rate" (porcentaje), "base" y "amount" (cuota de IVA).
            - Calcula el "totalIva" sumando todas las cuotas.
            - Extrae el "total" de la factura.
            
            Estructura JSON requerida:
            {
              "emitter": "Nombre de Empresa",
              "date": "2023-12-31",
              "subtotal": 100.00,
              "ivaDetails": [{ "rate": 21, "base": 100.00, "amount": 21.00 }],
              "totalIva": 21.00,
              "total": 121.00
            }`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            });

            if (!response.ok) throw new Error("Error en la API");
            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            resultData = JSON.parse(rawText);
            break; 
          } catch (err) {
            attempts++;
            if (attempts >= 3) throw err;
            await new Promise(r => setTimeout(r, 2000 * attempts));
          }
        }

        setExtractedData(resultData);
        setIsProcessing(false);
      };
    } catch (err) {
        setError("Error extrayendo datos. Introduce los datos manualmente.");
        setExtractedData({ emitter: "", date: new Date().toISOString().split('T')[0], subtotal: 0, ivaDetails: [{ rate: 21, base: 0, amount: 0 }], totalIva: 0, total: 0 });
        setIsProcessing(false);
    }
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    if (!extractedData) return;
    const finalData = {
      ...extractedData,
      type: type,
      totalIva: extractedData.ivaDetails.reduce((acc, curr) => acc + Number(curr.amount), 0),
      total: Number(extractedData.subtotal) + extractedData.ivaDetails.reduce((acc, curr) => acc + Number(curr.amount), 0)
    };
    onSave(finalData);
  };

  const updateIvaDetail = (index, field, value) => {
    const newDetails = [...extractedData.ivaDetails];
    newDetails[index][field] = Number(value);
    
    if (field === 'base' || field === 'rate') {
       newDetails[index].amount = (newDetails[index].base * (newDetails[index].rate / 100));
    }
    const newSubtotal = newDetails.reduce((acc, curr) => acc + curr.base, 0);
    const newTotalIva = newDetails.reduce((acc, curr) => acc + curr.amount, 0);
    
    setExtractedData({
      ...extractedData,
      ivaDetails: newDetails,
      subtotal: newSubtotal,
      totalIva: newTotalIva,
      total: newSubtotal + newTotalIva
    });
  };

  const addIvaDetail = () => setExtractedData({ ...extractedData, ivaDetails: [...extractedData.ivaDetails, { rate: 10, base: 0, amount: 0 }] });
  
  const removeIvaDetail = (index) => {
    const newDetails = extractedData.ivaDetails.filter((_, i) => i !== index);
    const newSubtotal = newDetails.reduce((acc, curr) => acc + curr.base, 0);
    const newTotalIva = newDetails.reduce((acc, curr) => acc + curr.amount, 0);
    setExtractedData({ ...extractedData, ivaDetails: newDetails, subtotal: newSubtotal, totalIva: newTotalIva, total: newSubtotal + newTotalIva });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{type === 'expense' ? 'Subir Factura de Compra/Gasto' : 'Subir Factura de Venta/Emitida'}</h2>
        <p className="text-gray-500">Sube una imagen o PDF. Nuestra IA extraerá automáticamente el IVA.</p>
      </header>

      {!extractedData && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <UploadCloud size={48} className="mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Selecciona un documento</h3>
          <p className="text-sm text-gray-500 mb-6">Formatos soportados: JPG, PNG, PDF</p>
          <input type="file" accept="image/*,application/pdf" className="hidden" id="file-upload" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors">
            Examinar Archivos
          </label>

          {file && (
            <div className="mt-6 flex flex-col items-center">
              <p className="text-sm font-medium text-gray-800 mb-4">Archivo seleccionado: {file.name}</p>
              <button onClick={processFileWithAI} disabled={isProcessing} className="bg-black text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                <span>{isProcessing ? 'Extrayendo Datos...' : 'Extraer Datos con IA'}</span>
              </button>
            </div>
          )}
          {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg"><p className="text-sm">{error}</p></div>}
        </div>
      )}

      {extractedData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center space-x-2">
            <CheckCircle className="text-orange-600" size={20} />
            <span className="font-semibold text-orange-800">Revisión de Datos</span>
          </div>
          <form onSubmit={handleManualSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emisor / Cliente</label>
                <input type="text" required value={extractedData.emitter || ''} onChange={(e) => setExtractedData({...extractedData, emitter: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Factura</label>
                <input type="date" required value={extractedData.date || ''} onChange={(e) => setExtractedData({...extractedData, date: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Desglose de IVA</label>
                <button type="button" onClick={addIvaDetail} className="text-sm text-orange-600 flex items-center"><Plus size={16} className="mr-1"/> Añadir tipo</button>
              </div>
              <div className="space-y-3">
                {extractedData.ivaDetails?.map((iva, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Base Imponible (€)</label>
                      <input type="number" step="0.01" required value={iva.base || ''} onChange={(e) => updateIvaDetail(index, 'base', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">% IVA</label>
                      <select value={iva.rate} onChange={(e) => updateIvaDetail(index, 'rate', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm outline-none bg-white">
                        <option value="21">21%</option><option value="10">10%</option><option value="4">4%</option><option value="0">0%</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Cuota IVA (€)</label>
                      <input type="number" step="0.01" readOnly value={iva.amount ? iva.amount.toFixed(2) : '0.00'} className="w-full px-3 py-1.5 border rounded-md text-sm bg-gray-100 outline-none" />
                    </div>
                    {extractedData.ivaDetails.length > 1 && (
                      <button type="button" onClick={() => removeIvaDetail(index)} className="mt-5 text-red-500"><Trash2 size={18} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center">
              <div><p className="text-sm text-gray-400">Base Imponible</p><p className="font-semibold">€{extractedData.subtotal?.toFixed(2) || '0.00'}</p></div>
              <div><p className="text-sm text-gray-400">Total IVA</p><p className="font-semibold">€{extractedData.totalIva?.toFixed(2) || '0.00'}</p></div>
              <div className="text-right"><p className="text-sm text-gray-400">Total</p><p className="text-xl font-bold text-orange-400">€{extractedData.total?.toFixed(2) || '0.00'}</p></div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setExtractedData(null)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="bg-black text-white px-6 py-2 rounded-lg font-medium shadow-md">Guardar en la Nube</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ReportsView({ invoices, onDelete }) {
  const [filterPeriod, setFilterPeriod] = useState('all');
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterPeriod === 'all') return true;
      const date = new Date(inv.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      if (filterPeriod === 'q1') return month >= 0 && month <= 2;
      if (filterPeriod === 'q2') return month >= 3 && month <= 5;
      if (filterPeriod === 'q3') return month >= 6 && month <= 8;
      if (filterPeriod === 'q4') return month >= 9 && month <= 11;
      if (filterPeriod.startsWith('y')) return year.toString() === filterPeriod.substring(1);
      return true;
    });
  }, [invoices, filterPeriod]);

  const stats = useMemo(() => {
    const income = filteredInvoices.filter(i => i.type === 'income');
    const expense = filteredInvoices.filter(i => i.type === 'expense');
    const totalIncomeBase = income.reduce((sum, i) => sum + i.subtotal, 0);
    const totalIncomeIva = income.reduce((sum, i) => sum + i.totalIva, 0);
    const totalExpenseBase = expense.reduce((sum, i) => sum + i.subtotal, 0);
    const totalExpenseIva = expense.reduce((sum, i) => sum + i.totalIva, 0);
    return { totalIncomeBase, totalIncomeIva, totalExpenseBase, totalExpenseIva, liquidacion: totalIncomeIva - totalExpenseIva };
  }, [filteredInvoices]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reportes y Liquidación</h2>
          <p className="text-gray-500">Consulta los totales para presentar a Hacienda.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg shadow-sm border">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="bg-transparent text-sm font-medium outline-none pr-4">
            <option value="all">Todo el Histórico</option>
            <option value="q1">Primer Trimestre (Q1)</option>
            <option value="q2">Segundo Trimestre (Q2)</option>
            <option value="q3">Tercer Trimestre (Q3)</option>
            <option value="q4">Cuarto Trimestre (Q4)</option>
            <option value="y2023">Año 2023</option>
            <option value="y2024">Año 2024</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500">
          <h4 className="text-sm font-bold text-gray-500 uppercase">Ventas</h4>
          <p className="text-3xl font-bold">€{stats.totalIncomeIva.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Base: €{stats.totalIncomeBase.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500">
          <h4 className="text-sm font-bold text-gray-500 uppercase">Compras</h4>
          <p className="text-3xl font-bold">€{stats.totalExpenseIva.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Base: €{stats.totalExpenseBase.toFixed(2)}</p>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border-t-4 text-white ${stats.liquidacion >= 0 ? 'bg-orange-600 border-orange-800' : 'bg-green-600 border-green-800'}`}>
          <h4 className="text-sm font-bold uppercase mb-2">Resultado</h4>
          <p className="text-3xl font-bold">€{Math.abs(stats.liquidacion).toFixed(2)}</p>
          <p className="text-sm mt-1">{stats.liquidacion >= 0 ? 'A PAGAR A HACIENDA' : 'A DEVOLVER / COMPENSAR'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between bg-gray-50">
          <h3 className="font-semibold">Detalle de Facturas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-white border-b">
              <tr>
                <th className="px-6 py-4">Fecha</th><th className="px-6 py-4">Concepto</th><th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Base Imp.</th><th className="px-6 py-4 text-center">IVA</th>
                <th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.sort((a,b) => new Date(b.date) - new Date(a.date)).map((inv) => (
                <tr key={inv.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{inv.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.emitter}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${inv.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {inv.type === 'income' ? 'VENTA' : 'COMPRA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">€{inv.subtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {inv.ivaDetails.map((d, i) => <span key={i} className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">{d.rate}%</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">€{inv.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onDelete(inv.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No hay facturas registradas.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}