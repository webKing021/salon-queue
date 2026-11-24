import { Link } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';
import { clearPin } from '../lib/api.js';
import StaffGate from './StaffGate.jsx';
import { Icon, LangToggle, Wordmark } from './ui.jsx';

export const STAFF_TABS = [
  { key: 'reception', to: '/reception', icon: Icon.Users, label: 'navReception', hint: 'navReceptionHint' },
  { key: 'barber', to: '/barber', icon: Icon.Scissors, label: 'navBarbers', hint: 'navBarbersHint' },
  { key: 'display', to: '/display', icon: Icon.Tv, label: 'navTv', hint: 'navTvHint' },
  { key: 'admin', to: '/admin', icon: Icon.Settings, label: 'navSettings', hint: 'navSettingsHint' },
];

export function lockStaff() {
  clearPin();
  window.location.assign('/staff');
}

/**
 * Every staff screen sits in this frame: PIN gate + the same navigation everywhere.
 * Tablet/desktop: tabs in the top bar. Phone: tab bar at the bottom (thumb reach).
 */
export default function StaffShell({ active, children, width = 'max-w-7xl' }) {
  return (
    <StaffGate>
      <Frame active={active} width={width}>
        {children}
      </Frame>
    </StaffGate>
  );
}

function Frame({ active, width, children }) {
  const { t } = useLang();
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-page/92 backdrop-blur">
        <div className={`mx-auto flex items-center gap-4 px-4 py-2.5 md:px-6 ${width}`}>
          <Wordmark to="/staff" sub={t('staffArea')} />
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label={t('staffArea')}>
            {STAFF_TABS.map((tab) => (
              <Link
                key={tab.key}
                to={tab.to}
                aria-current={active === tab.key ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-[15px] font-semibold transition-colors ${
                  active === tab.key ? 'bg-navy text-white' : 'text-ink-2 hover:bg-sunk hover:text-ink'
                }`}
              >
                <tab.icon width={18} height={18} />
                {t(tab.label)}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <LangToggle />
            <Link to="/" title={t('customerView')} aria-label={t('customerView')} className="hidden h-11 items-center gap-2 rounded-xl px-3 text-[14px] font-semibold text-ink-2 hover:bg-sunk hover:text-ink sm:flex">
              <Icon.Home width={18} height={18} />
              <span className="hidden lg:inline">{t('customerView')}</span>
            </Link>
            <button type="button" onClick={lockStaff} title={t('logout')} aria-label={t('logout')} className="grid h-11 w-11 place-items-center rounded-xl text-ink-2 hover:bg-sunk hover:text-ink">
              <Icon.Lock />
            </button>
          </div>
        </div>
      </header>

      {children}

      <nav
        aria-label={t('staffArea')}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 shadow-[0_-8px_24px_-12px_rgb(22_26_38/0.25)] pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {STAFF_TABS.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            aria-current={active === tab.key ? 'page' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] font-semibold ${
              active === tab.key ? 'text-navy' : 'text-ink-3'
            }`}
          >
            <tab.icon width={22} height={22} />
            {t(tab.label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
