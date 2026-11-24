import { Link, Route, Routes } from 'react-router-dom';
import { useLang } from './i18n/index.jsx';
import Home from './pages/Home.jsx';
import Join from './pages/Join.jsx';
import Status from './pages/Status.jsx';
import Reception from './pages/Reception.jsx';
import Barber from './pages/Barber.jsx';
import Display from './pages/Display.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join" element={<Join />} />
      <Route path="/status/:id" element={<Status />} />
      <Route path="/reception" element={<Reception />} />
      <Route path="/barber" element={<Barber />} />
      <Route path="/barber/:name" element={<Barber />} />
      <Route path="/display" element={<Display />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  const { t } = useLang();
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="token text-7xl text-gold">404</p>
        <Link to="/" className="btn-ghost mt-6">{t('backHome')}</Link>
      </div>
    </main>
  );
}
