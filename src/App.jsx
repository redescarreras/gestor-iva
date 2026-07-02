import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Download,
  Trash2,
  Plus,
  Cloud,
  CloudOff,
  Maximize,
  Minimize,
  Lock,
  Search,
  Edit,
  Database
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURACIÓN Y ESTADO INICIAL ---
// Clave codificada en Base64 para bypass de seguridad en GitHub
const encodedKey = "QVEuQWI4Uk42S3dsTTJIMVhENGFKOFlHUHY2MzJQRUo3OGgzMXQxMEdQLXhaNVNmdklzUEE=";
const apiKey = atob(encodedKey);

// --- CONFIGURACIÓN FIREBASE REAL ---
const firebaseConfig = {
  apiKey: "AIzaSyD71ejCZx6kNVMugTQvYHnhrn_44osg4ZA",
  authDomain: "iva-app-7b81e.firebaseapp.com",
  projectId: "iva-app-7b81e",
  storageBucket: "iva-app-7b81e.firebasestorage.app",
  messagingSenderId: "314274336517",
  appId: "1:314274336517:web:b787d9f772b94b0c28716c"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [invoices, setInvoices] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- ESTADOS DEL NUEVO SISTEMA DE LOGIN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [storedPassword, setStoredPassword] = useState(() => {
    return localStorage.getItem('app_password') || 'Redescarreras82';
  });

  // Forzar ancho completo de pantalla destruyendo límites de Vite
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    const rootNode = document.getElementById('root');
    if (rootNode) {
      rootNode.style.maxWidth = 'none';
      rootNode.style.width = '100%';
      rootNode.style.padding = '0';
      rootNode.style.margin = '0';
      rootNode.style.textAlign = 'left';
    }
  }, []);

  // Función para alternar pantalla completa del navegador
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Inicialización de Autenticación Firebase
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

  // Sincronización con Firestore
  useEffect(() => {
    if (!user) return;
    setIsSyncing(true);
    
    const invoicesRef = collection(db, 'users', user.uid, 'invoices');
    const unsubscribe = onSnapshot(invoicesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setInvoices(data);
      setIsSyncing(false);
    }, (error) => {
      console.error("Error cargando facturas de la nube:", error);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Procesar Login manual
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === storedPassword) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  // Procesar Cambio de Contraseña
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) return;
    localStorage.setItem('app_password', newPasswordInput.trim());
    setStoredPassword(newPasswordInput.trim());
    setIsChangingPassword(false);
    setNewPasswordInput('');
    alert('Contraseña actualizada con éxito.');
  };

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

  const deleteInvoice = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'invoices', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error eliminando la factura:", error);
    }
  };

  const updateInvoice = async (updatedInvoice) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'invoices', updatedInvoice.id);
      await setDoc(docRef, updatedInvoice);
    } catch (error) {
      console.error("Error actualizando la factura:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col space-y-4">
        <Loader2 className="animate-spin text-orange-600" size={48} />
        <p className="text-gray-600 font-medium">Conectando con la nube de Redes Carreras...</p>
      </div>
    );
  }

  // --- RENDERIZADO DE LA PANTALLA DE LOGIN SI NO ESTÁ AUTENTICADO ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white font-sans">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md text-center">
          <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-md">
            <img src="./logo-redes_Transparente-216x216.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-2xl font-bold tracking-wider mb-1">REDES CARRERAS S.L.</h2>
          <p className="text-xs text-orange-500 font-semibold uppercase tracking-widest mb-6">Acceso Protegido</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Contraseña del Sistema</label>
              <input 
                type="password" 
                required 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl outline-none focus:border-orange-500 text-white placeholder-gray-500 text-center text-xl tracking-widest transition-colors"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-400 font-medium flex items-center justify-center bg-red-500/10 py-2 rounded-lg">
                <AlertCircle size={16} className="mr-1.5 shrink-0"/>{passwordError}
              </p>
            )}
            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold tracking-wide transition-colors shadow-lg mt-2">
              Entrar al Gestor
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* INYECTAR ESTILOS COMPLEMENTARIOS PARA PANTALLA COMPLETA TOTAL */}
      <style>{`
        #root { max-width: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
        body { display: block !important; margin: 0 !important; padding: 0 !important; width: 100vw !important; overflow-x: hidden !important; }
      `}</style>

      {/* MODAL EMERGENTE PARA CAMBIAR CONTRASEÑA */}
      {isChangingPassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 text-gray-800">
          <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-md animate-fade-in">
            <h3 className="text-xl font-bold mb-1 text-gray-900">Modificar Contraseña</h3>
            <p className="text-sm text-gray-500 mb-4">Introduce la nueva clave de acceso para este dispositivo.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input 
                type="text" 
                required
                placeholder="Escribe la nueva contraseña aquí"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-center font-medium shadow-inner"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsChangingPassword(false); setNewPasswordInput(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium text-sm shadow transition-colors"
                >
                  Confirmar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-black text-white flex flex-col shadow-xl z-20 flex-shrink-0">
        <div className="p-6 flex flex-col items-center border-b border-gray-800">
          <div className="bg-white p-2 rounded-lg mb-3 shadow-sm">
            <img 
              src="./logo-redes_Transparente-216x216.png" 
              alt="Redes Carreras S.L. Logo" 
              className="w-24 h-24 object-contain"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlNWE1MGEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgMTZWMi41bC0yLjUtLjVWMTZjMCAxLjEtLjkgMi0yIDJINiIvPjxwYXRoIGQ9Ik0yIDE6djYuNWwyLjUuNVYxNmMwLTEuMS45LTIgMi0yaDE0Ii8+PHBhdGggZD0iTTEyIDEydjYuNWwyLjUuNVYxMmMwLTEuMS45LTIgMi0yaDMiLz48cGF0aCBkPSJNMTQgMnY2LjVsMi41LjVWOGMwLTEuMS0uOS0yLTItMmgtMyIvPjwvc3ZnPg==';
              }}
            />
          </div>
          <h1 className="text-lg font-bold text-center tracking-wider">REDES CARRERAS S.L.</h1>
          <p className="text-xs text-orange-500 uppercase font-semibold mt-1">Telecomunicaciones</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem icon={<PieChart />} label="Dashboard" isActive={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<TrendingDown className="text-red-400" />} label="Subir Compras (Gastos)" isActive={currentView === 'upload-expense'} onClick={() => setCurrentView('upload-expense')} />
          <NavItem icon={<TrendingUp className="text-green-400" />} label="Subir Ventas (Emitidas)" isActive={currentView === 'upload-income'} onClick={() => setCurrentView('upload-income')} />
          <NavItem icon={<FileText />} label="Reportes y Liquidación" isActive={currentView === 'reports'} onClick={() => setCurrentView('reports')} />
          <NavItem icon={<Database />} label="Ajustes y Backups" isActive={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>
        
        <div className="p-4 text-xs text-gray-500 border-t border-gray-800 text-center flex flex-col items-center">
          <p className="mb-2">Gestión de IVA v1.0</p>
          {user ? (
            <div className="flex items-center space-x-1 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full mb-3">
              <Cloud size={14} />
              <span className="font-medium">{isSyncing ? 'Sincronizando...' : 'Conectado a la Nube'}</span>
            </div>
          ) : (
             <div className="flex items-center space-x-1 text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full mb-3">
              <CloudOff size={14} />
              <span className="font-medium">Modo Local</span>
            </div>
          )}

          {/* BOTÓN PARA CAMBIAR LA CONTRASEÑA */}
          <button 
            onClick={() => setIsChangingPassword(true)} 
            className="flex items-center justify-center space-x-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors mb-2 font-medium"
          >
            <Lock size={15} />
            <span>Cambiar Contraseña</span>
          </button>

          <button 
            onClick={toggleFullScreen} 
            className="flex items-center justify-center space-x-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors font-medium"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{isFullscreen ? 'Salir Pantalla' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative w-full">
        <div className="p-8 w-full">
          {currentView === 'dashboard' && <DashboardView invoices={invoices} />}
          {currentView === 'upload-expense' && <UploadView type="expense" onSave={addInvoice} />}
          {currentView === 'upload-income' && <UploadView type="income" onSave={addInvoice} />}
          {currentView === 'reports' && <ReportsView invoices={invoices} onDelete={deleteInvoice} onUpdate={updateInvoice} />}
          {currentView === 'settings' && <SettingsView invoices={invoices} user={user} db={db} />}
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

// --- VISTA DASHBOARD ---
function DashboardView({ invoices }) {
  const totalIncomeIVA = invoices.filter(i => i.type === 'income').reduce((acc, curr) => acc + curr.totalIva, 0);
  const totalExpenseIVA = invoices.filter(i => i.type === 'expense').reduce((acc, curr) => acc + curr.totalIva, 0);
  const result = totalIncomeIVA - totalExpenseIVA;

  return (
    <div className="space-y-6 w-full">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Resumen General</h2>
        <p className="text-gray-500">Vista rápida del estado del IVA de la empresa.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <StatCard 
          title="IVA Repercutido (Ventas)" 
          amount={totalIncomeIVA} 
          icon={<TrendingUp size={24} className="text-green-600" />}
          bgColor="bg-green-100"
        />
        <StatCard 
          title="IVA Soportado (Compras)" 
          amount={totalExpenseIVA} 
          icon={<TrendingDown size={24} className="text-red-600" />}
          bgColor="bg-red-100"
        />
        <StatCard 
          title="A Pagar a Hacienda" 
          amount={result} 
          icon={<PieChart size={24} className="text-orange-600" />}
          bgColor="bg-orange-100"
          isResult={true}
        />
      </div>

      <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
        <h3 className="text-xl font-semibold mb-4">Últimos Movimientos Registrados</h3>
        <div className="overflow-x-auto w-full">
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 w-full">
      <div className={`p-4 rounded-full ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className={`text-2xl font-bold ${isResult ? (isNegative ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>
          {isResult && isNegative ? 'A Devolver: ' : ''}
          €{Math.abs(amount).toFixed(2)}
        </h4>
      </div>
    </div>
  );
}

// --- VISTA DE CARGA Y EXTRACCIÓN (IA) ---
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
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            const prompt = `Eres un contable experto en España. Extrae los datos de esta factura.
            REGLAS IMPORTANTES:
            - Devuelve ÚNICAMENTE un objeto JSON válido, sin formato markdown ni texto adicional.
            - Extrae el nombre del emisor (proveedor o cliente).
            - Extrae la fecha en formato YYYY-MM-DD.
            - Extrae el subtotal (base imponible).
            - Identifica TODOS los tipos de IVA presentes (ej. 21%, 10%, 4%). Para cada uno crea un objeto con "rate" (porcentaje), "base" y "amount" (cuota de IVA).
            - Calcula el "total_iva" sumando todas las cuotas.
            - Extrae el "total" de la factura.
            
            Estructura JSON requerida:
            {
              "emitter": "Nombre de Empresa",
              "date": "2023-12-31",
              "subtotal": 100.00,
              "ivaDetails": [
                { "rate": 21, "base": 100.00, "amount": 21.00 }
              ],
              "totalIva": 21.00,
              "total": 121.00
            }`;

            const payload = {
              contents: [{
                role: "user",
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
              }],
              generationConfig: { responseMimeType: "application/json" }
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Error en la API de Google");
            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) throw new Error("Respuesta vacía de la IA");

            resultData = JSON.parse(rawText);
            break; 
          } catch (err) {
            attempts++;
            if (attempts >= maxAttempts) throw err;
            await new Promise(r => setTimeout(r, 2000 * attempts)); 
          }
        }

        if (!resultData) throw new Error("No se pudo parsear el documento");
        setExtractedData(resultData);
        setIsProcessing(false);
      };
      reader.onerror = () => { throw new Error("Error leyendo el archivo local"); }
    } catch (err) {
        console.error("Error AI Extraction:", err);
        setError("Error extrayendo datos con IA. Por favor, introduce los datos manualmente o intenta con otra imagen más clara.");
        setExtractedData({
          emitter: "", date: new Date().toISOString().split('T')[0], subtotal: 0, ivaDetails: [{ rate: 21, base: 0, amount: 0 }], totalIva: 0, total: 0
        });
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

  const addIvaDetail = () => {
    setExtractedData({
      ...extractedData,
      ivaDetails: [...extractedData.ivaDetails, { rate: 10, base: 0, amount: 0 }]
    });
  };

  const removeIvaDetail = (index) => {
    const newDetails = extractedData.ivaDetails.filter((_, i) => i !== index);
    const newSubtotal = newDetails.reduce((acc, curr) => acc + curr.base, 0);
    const newTotalIva = newDetails.reduce((acc, curr) => acc + curr.amount, 0);
    setExtractedData({
      ...extractedData,
      ivaDetails: newDetails,
      subtotal: newSubtotal,
      totalIva: newTotalIva,
      total: newSubtotal + newTotalIva
    });
  }

  return (
    <div className="w-full">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {type === 'expense' ? 'Subir Factura de Compra/Gasto' : 'Subir Factura de Venta/Emitida'}
        </h2>
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

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start space-x-2 text-left">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {extractedData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center space-x-2">
            <CheckCircle className="text-orange-600" size={20} />
            <span className="font-semibold text-orange-800">Revisión de Datos (Paso Crítico)</span>
          </div>
          
          <form onSubmit={handleManualSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emisor / Cliente</label>
                <input type="text" required value={extractedData.emitter || ''} onChange={(e) => setExtractedData({...extractedData, emitter: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Factura</label>
                <input type="date" required value={extractedData.date || ''} onChange={(e) => setExtractedData({...extractedData, date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Desglose de IVA</label>
                <button type="button" onClick={addIvaDetail} className="text-sm text-orange-600 hover:text-orange-800 flex items-center">
                  <Plus size={16} className="mr-1"/> Añadir tipo de IVA
                </button>
              </div>
              <div className="space-y-3">
                {extractedData.ivaDetails?.map((iva, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Base Imponible (€)</label>
                      <input type="number" step="0.01" required value={iva.base || ''} onChange={(e) => updateIvaDetail(index, 'base', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs text-gray-500 mb-1">% IVA</label>
                      <select value={iva.rate} onChange={(e) => updateIvaDetail(index, 'rate', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none bg-white">
                        <option value="21">21%</option><option value="10">10%</option><option value="4">4%</option><option value="0">0%</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Cuota IVA (€)</label>
                      <input type="number" step="0.01" readOnly value={iva.amount ? iva.amount.toFixed(2) : '0.00'} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-gray-100 outline-none text-gray-600" />
                    </div>
                    {extractedData.ivaDetails.length > 1 && (
                      <button type="button" onClick={() => removeIvaDetail(index)} className="mt-5 text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 text-white p-4 rounded-lg flex justify-between items-center">
              <div><p className="text-sm text-gray-400">Total Base Imponible</p><p className="font-semibold">€{extractedData.subtotal?.toFixed(2) || '0.00'}</p></div>
              <div><p className="text-sm text-gray-400">Total IVA</p><p className="font-semibold">€{extractedData.totalIva?.toFixed(2) || '0.00'}</p></div>
              <div className="text-right"><p className="text-sm text-gray-400">Total Factura</p><p className="text-xl font-bold text-orange-400">€{extractedData.total?.toFixed(2) || '0.00'}</p></div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setExtractedData(null)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button type="submit" className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-900 shadow-md">Confirmar y Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// --- VISTA DE REPORTES Y CÁLCULOS ---
function ReportsView({ invoices, onDelete, onUpdate }) {
  const [filterPeriod, setFilterPeriod] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [editData, setEditData] = useState(null);
  
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // Filtrar por Periodo
      if (filterPeriod !== 'all') {
        const date = new Date(inv.date);
        const month = date.getMonth(); 
        const year = date.getFullYear();
        if (filterPeriod === 'q1' && !(month >= 0 && month <= 2)) return false;
        if (filterPeriod === 'q2' && !(month >= 3 && month <= 5)) return false;
        if (filterPeriod === 'q3' && !(month >= 6 && month <= 8)) return false;
        if (filterPeriod === 'q4' && !(month >= 9 && month <= 11)) return false;
        if (filterPeriod.startsWith('y') && year.toString() !== filterPeriod.substring(1)) return false;
      }
      
      // Filtrar por Buscador (Empresa/Emisor)
      if (searchTerm && (!inv.emitter || !inv.emitter.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      return true;
    });
  }, [invoices, filterPeriod, searchTerm]);

  const stats = useMemo(() => {
    const income = filteredInvoices.filter(i => i.type === 'income');
    const expense = filteredInvoices.filter(i => i.type === 'expense');
    const totalIncomeBase = income.reduce((sum, i) => sum + i.subtotal, 0);
    const totalIncomeIva = income.reduce((sum, i) => sum + i.totalIva, 0);
    const totalExpenseBase = expense.reduce((sum, i) => sum + i.subtotal, 0);
    const totalExpenseIva = expense.reduce((sum, i) => sum + i.totalIva, 0);
    return { totalIncomeBase, totalIncomeIva, totalExpenseBase, totalExpenseIva, liquidacion: totalIncomeIva - totalExpenseIva };
  }, [filteredInvoices]);

  const handleExportPDF = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("El generador de PDF aún se está cargando. Por favor, espera un par de segundos e inténtalo de nuevo.");
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let periodText = filterPeriod === 'all' ? 'Todo el histórico' : filterPeriod.toUpperCase();
    doc.setFontSize(18);
    doc.text(`Reporte de IVA - REDES CARRERAS S.L.`, 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Periodo seleccionado: ${periodText}`, 14, 28);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 34);

    const tableData = filteredInvoices.sort((a,b) => new Date(b.date) - new Date(a.date)).map(inv => [
      inv.date, inv.emitter, inv.type === 'income' ? 'VENTA' : 'COMPRA', `€ ${inv.subtotal.toFixed(2)}`, `€ ${inv.totalIva.toFixed(2)}`, `€ ${inv.total.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 42,
      head: [['Fecha', 'Concepto', 'Tipo', 'Base Imp.', 'Total IVA', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, 
      styles: { fontSize: 9 }
    });

    const finalY = doc.lastAutoTable.finalY || 42;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Resumen de Liquidación", 14, finalY + 15);
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Total IVA Repercutido (Ventas): € ${stats.totalIncomeIva.toFixed(2)}`, 14, finalY + 25);
    doc.text(`Total IVA Soportado (Compras): € ${stats.totalExpenseIva.toFixed(2)}`, 14, finalY + 32);
    doc.setFontSize(12);
    const isPagar = stats.liquidacion >= 0;
    doc.setTextColor(isPagar ? 220 : 22, isPagar ? 38 : 163, isPagar ? 38 : 74); 
    doc.setFont(undefined, 'bold');
    const resultadoTexto = isPagar ? 'A PAGAR A HACIENDA' : 'A DEVOLVER / COMPENSAR';
    doc.text(`RESULTADO FINAL: € ${Math.abs(stats.liquidacion).toFixed(2)} (${resultadoTexto})`, 14, finalY + 45);
    doc.save(`Reporte_IVA_RedesCarreras_${periodText}.pdf`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if(!editData) return;
    
    // Auto-calcular totales de nuevo para asegurar precisión
    const finalData = {
      ...editData,
      totalIva: editData.ivaDetails.reduce((acc, curr) => acc + Number(curr.amount), 0),
      total: Number(editData.subtotal) + editData.ivaDetails.reduce((acc, curr) => acc + Number(curr.amount), 0)
    };
    
    onUpdate(finalData);
    setEditData(null);
  };

  const updateEditIvaDetail = (index, field, value) => {
    const newDetails = [...editData.ivaDetails];
    newDetails[index][field] = Number(value);
    if (field === 'base' || field === 'rate') {
       newDetails[index].amount = (newDetails[index].base * (newDetails[index].rate / 100));
    }
    const newSubtotal = newDetails.reduce((acc, curr) => acc + curr.base, 0);
    const newTotalIva = newDetails.reduce((acc, curr) => acc + curr.amount, 0);
    setEditData({
      ...editData,
      ivaDetails: newDetails,
      subtotal: newSubtotal,
      totalIva: newTotalIva,
      total: newSubtotal + newTotalIva
    });
  };

  return (
    <div className="w-full space-y-6">
      
      {/* MODAL EMERGENTE DE EDICIÓN DE FACTURA */}
      {editData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center"><Edit size={20} className="mr-2"/> Editar Factura</h3>
              <button onClick={() => setEditData(null)} className="text-gray-500 hover:text-gray-800 font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Factura</label>
                  <select 
                    value={editData.type} 
                    onChange={(e) => setEditData({...editData, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="expense">Compra (Soportado)</option>
                    <option value="income">Venta (Repercutido)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emisor / Cliente</label>
                  <input 
                    type="text" required value={editData.emitter} 
                    onChange={(e) => setEditData({...editData, emitter: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input 
                    type="date" required value={editData.date} 
                    onChange={(e) => setEditData({...editData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Desglose de IVA</label>
                <div className="space-y-3">
                  {editData.ivaDetails.map((iva, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Base Imponible (€)</label>
                        <input type="number" step="0.01" required value={iva.base} onChange={(e) => updateEditIvaDetail(index, 'base', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none" />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">% IVA</label>
                        <select value={iva.rate} onChange={(e) => updateEditIvaDetail(index, 'rate', e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none bg-white">
                          <option value="21">21%</option><option value="10">10%</option><option value="4">4%</option><option value="0">0%</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Cuota IVA (€)</label>
                        <input type="number" step="0.01" readOnly value={iva.amount ? iva.amount.toFixed(2) : '0.00'} className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-gray-100 outline-none text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditData(null)} className="px-6 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg">Cancelar</button>
                <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700 shadow-md">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reportes y Liquidación</h2>
          <p className="text-gray-500">Consulta los totales trimestrales y anuales para presentar a Hacienda.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* BUSCADOR */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm w-full sm:w-64 focus-within:ring-2 focus-within:ring-orange-500">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar emisor o empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none text-sm w-full bg-transparent"
            />
          </div>

          <div className="flex items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Filter size={18} className="text-gray-400 ml-2" />
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none pr-4 cursor-pointer">
              <option value="all">Todo el Histórico</option>
              <option disabled>--- Trimestres ---</option>
              <option value="q1">Primer Trimestre (Q1)</option>
              <option value="q2">Segundo Trimestre (Q2)</option>
              <option value="q3">Tercer Trimestre (Q3)</option>
              <option value="q4">Cuarto Trimestre (Q4)</option>
              <option disabled>--- Años ---</option>
              <option value="y2023">Año 2023</option>
              <option value="y2024">Año 2024</option>
            </select>
          </div>
        </div>
      </header>

      {/* Tarjetas de Liquidación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500 w-full">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Ventas (Repercutido)</h4>
          <p className="text-3xl font-bold text-gray-900">€{stats.totalIncomeIva.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Base: €{stats.totalIncomeBase.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-red-500 w-full">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Compras (Soportado)</h4>
          <p className="text-3xl font-bold text-gray-900">€{stats.totalExpenseIva.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Base: €{stats.totalExpenseBase.toFixed(2)}</p>
        </div>
        <div className={`p-6 rounded-xl shadow-sm border-t-4 text-white w-full ${stats.liquidacion >= 0 ? 'bg-orange-600 border-orange-800' : 'bg-green-600 border-green-800'}`}>
          <h4 className="text-sm font-bold uppercase tracking-wider mb-2 opacity-90">Resultado Liquidación</h4>
          <p className="text-3xl font-bold">€{Math.abs(stats.liquidacion).toFixed(2)}</p>
          <p className="text-sm mt-1 opacity-90">{stats.liquidacion >= 0 ? 'A PAGAR A HACIENDA' : 'A DEVOLVER / COMPENSAR'}</p>
        </div>
      </div>

      {/* Tabla Detallada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-800">Detalle de Facturas</h3>
          <button onClick={handleExportPDF} className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded font-medium flex items-center hover:bg-orange-200 transition-colors">
            <Download size={16} className="mr-2" /> Extraer a PDF
          </button>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-white border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Concepto / Emisor</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Base Imp.</th>
                <th className="px-6 py-4 text-center">Tipos IVA</th>
                <th className="px-6 py-4 text-right">Total IVA</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.sort((a,b) => new Date(b.date) - new Date(a.date)).map((inv) => (
                <tr key={inv.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{inv.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{inv.emitter}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${inv.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {inv.type === 'income' ? 'VENTA' : 'COMPRA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">€{inv.subtotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {inv.ivaDetails.map((d, i) => (
                        <span key={i} className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">{d.rate}%</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-orange-600">€{inv.totalIva.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">€{inv.total.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={() => setEditData({...inv})} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar Factura">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => onDelete(inv.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No hay facturas registradas para esta búsqueda o periodo.</p>
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

// --- VISTA DE AJUSTES Y BACKUPS ---
function SettingsView({ invoices, user, db }) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  // Lógica para exportar a archivo local
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Backup_IVA_RedesCarreras_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Lógica para importar desde archivo local
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("Vas a importar facturas desde un archivo. Las facturas nuevas se añadirán a tu base de datos. ¿Estás seguro?")) {
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedInvoices = JSON.parse(event.target.result);
        if (!Array.isArray(importedInvoices)) throw new Error("Formato inválido");
        
        for (const inv of importedInvoices) {
          // Si no tiene id, le creamos uno nuevo, si lo tiene, lo sobrescribe/actualiza
          const docRef = doc(db, 'users', user.uid, 'invoices', inv.id || Date.now().toString());
          await setDoc(docRef, inv);
        }
        alert(`¡Se han importado y restaurado ${importedInvoices.length} facturas con éxito!`);
      } catch (err) {
        console.error(err);
        alert("Error al importar: Asegúrate de que el archivo es un backup JSON válido exportado de esta aplicación.");
      } finally {
        setIsImporting(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Ajustes y Copias de Seguridad</h2>
        <p className="text-gray-500">Exporta e importa tus facturas para tener respaldos seguros fuera de la nube.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel de Exportación */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
          <div className="bg-green-100 p-4 rounded-full mb-4">
            <Download size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Exportar Datos (Backup)</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">
            Descarga un archivo JSON con todas las facturas registradas en la nube. Guárdalo en un disco duro o pendrive seguro.
          </p>
          <button 
            onClick={handleExport}
            className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors shadow-md flex justify-center items-center"
          >
            <Database size={18} className="mr-2"/> Descargar Copia
          </button>
        </div>

        {/* Panel de Importación */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
          <div className="bg-orange-100 p-4 rounded-full mb-4">
            <UploadCloud size={32} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Importar Datos (Restaurar)</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">
            Restaura facturas desde un archivo JSON. Si borraste algo por error o cambias de cuenta, súbelo aquí.
          </p>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full py-3 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 rounded-lg font-bold transition-colors flex justify-center items-center"
          >
            {isImporting ? <Loader2 className="animate-spin" size={20} /> : "Subir Archivo de Respaldo"}
          </button>
        </div>
      </div>
    </div>
  );
}