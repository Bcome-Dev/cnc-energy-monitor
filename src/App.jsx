import {Routes,Route,Navigate} from 'react-router-dom';import Layout from './layouts/Layout';import {useMonitor} from './hooks/useMonitor';
import Dashboard from './pages/Dashboard';import Energy from './pages/Energy';import Control from './pages/Control';import Analytics from './pages/Analytics';import Alerts from './pages/Alerts';import SettingsPage from './pages/SettingsPage';
export default function App(){const{loading,error}=useMonitor();
return<Routes><Route element={<Layout/>}>
<Route index element={loading?<p className="text-slate-500">Memuat data...</p>:error?<p className="text-red-600">Gagal memuat data: {error}</p>:<Dashboard/>}/>
<Route path="energi" element={<Energy/>}/><Route path="kontrol" element={<Control/>}/><Route path="analitik" element={<Analytics/>}/><Route path="peringatan" element={<Alerts/>}/><Route path="pengaturan" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/"/>}/></Route></Routes>}
