import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { getMySpot } from '../lib/api.js';
import { barberState, isActive, queueSummary } from '../lib/queueRules.js';
import { Dot, Loading, OfflineBar, PhoneBar, fmtTime } from '../components/ui.jsx';

export default function Home() {
  const { t } = useLang();
  const names = useNames();
  const saved = getMySpot();
  const { state, offline, serverNow } = useQueue({ spotId: saved });

  if (!state) return <Page><OfflineBar offline={offline} /><Loading /></Page>;

  const { settings, barbers, spots, mine } = state;
  const onDuty = barbers.filter((b) => b.onDuty);
  const summary = queueSummary(spots, barbers, serverNow());
  const hasActive = mine && isActive(mine);

  const closedMsg = {
    switchedOff: t('onlineClosedMsg'),
    closingSoon: t('closingSoonMsg'),
    salonClosed: t('salonClosedMsg', { open: fmtTime(settings.openTime) }),
  }[settings.reason];

  return (
    <Page>
      <OfflineBar offline={offline} />
      <PhoneBar />

      <section className="pt-4 pb-7">
        <p className="eyebrow mb-3">{t('tagline')}</p>
        <h1 className="font-display text-[42px] font-medium leading-[1.02] tracking-tight">{t('salonName')}</h1>
        <div className="rule-double mt-5 mb-4 w-16" />
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
            settings.isOpen ? 'bg-mint/12 text-mint' : 'bg-white/5 text-mute'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${settings.isOpen ? 'bg-mint' : 'bg-mute'}`} />
          {settings.isOpen
            ? t('openUntil', { time: fmtTime(settings.closeTime) })
            : t('closedNow', { time: fmtTime(settings.openTime) })}
        </span>
      </section>

      <section className="card mb-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          <span className="eyebrow">{t('liveNow')}</span>
        </div>
        <div className="px-5 py-5">
          {summary.waiting === 0 ? (
            <p className="font-display text-2xl leading-snug">{t('nobodyWaiting')}</p>
          ) : (
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="token text-6xl leading-none text-gold">{summary.waiting}</p>
                <p className="mt-2 text-[15px] text-mute">{t('peopleWaiting', { n: summary.waiting })}</p>
              </div>
              <div className="text-right">
                <p className="text-[13px] text-mute">{t('ringAbout')}</p>
                <p className="mt-1 font-display text-3xl leading-none">
                  {summary.wait} <span className="text-base text-mute">{t('ringMin')}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {onDuty.length > 0 && (
        <section className="mb-8">
          <p className="eyebrow mb-3">{t('barbersToday')}</p>
          <ul className="flex flex-wrap gap-2">
            {onDuty.map((b) => {
              const st = barberState(b, spots);
              return (
                <li key={b.id} className="flex items-center gap-2 rounded-full border border-line bg-coal-deep py-2 pr-4 pl-3 text-[15px]">
                  <Dot state={st} />
                  <span className="font-semibold">{names.barber(b)}</span>
                  <span className="text-mute">· {t(`st_${st}`)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mb-4">
        {hasActive ? (
          <Link to={`/status/${mine.id}`} className="btn-gold min-h-14 w-full text-[17px]">
            {t('viewMySpot')} · <span className="token">S-{mine.token}</span>
          </Link>
        ) : settings.onlineOpen ? (
          <Link to="/join" className="btn-gold min-h-14 w-full text-[17px]">
            {t('joinQueue')}
          </Link>
        ) : (
          <>
            <button className="btn-gold min-h-14 w-full text-[17px]" disabled>
              {t('joinQueue')}
            </button>
            <p className="mt-3 rounded-xl border border-line bg-coal-deep px-4 py-3 text-center text-[15px] text-mute">{closedMsg}</p>
          </>
        )}
        {saved && mine && !hasActive && (
          <Link to={`/status/${saved}`} className="mt-3 block py-2 text-center text-sm text-mute underline decoration-line-strong underline-offset-4 hover:text-ivory">
            {t('alreadyIn')}
          </Link>
        )}
      </section>

      {settings.onlineOpen && !hasActive && <p className="mb-10 text-center text-sm leading-relaxed text-faint">{t('howItWorks')}</p>}

      <footer className="mt-auto border-t border-line pt-6 pb-8">
        <nav className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
          <span className="eyebrow w-full">{t('screens')}</span>
          <Link className="py-1 hover:text-gold" to="/reception">{t('reception')}</Link>
          <Link className="py-1 hover:text-gold" to="/barber">{t('barber')}</Link>
          <Link className="py-1 hover:text-gold" to="/display">TV</Link>
          <Link className="py-1 hover:text-gold" to="/admin">{t('admin')}</Link>
        </nav>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-ivory">Krutarth Raychura</p>
            <p className="mt-0.5 text-[13px] text-mute">{t('credit')}</p>
          </div>
          <p className="shrink-0 rounded-lg border border-gold/30 px-2.5 py-1 font-mono text-[13px] tracking-wider text-gold-soft">202612078</p>
        </div>
      </footer>
    </Page>
  );
}

function Page({ children }) {
  return <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-5">{children}</main>;
}
