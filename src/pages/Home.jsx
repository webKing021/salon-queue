import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { getMySpot } from '../lib/api.js';
import { STATUS, barberState, currentOf, isActive, queueSummary, spotEta } from '../lib/queueRules.js';
import { Avatar, CustomerShell, Icon, Loading, OfflineBar, STATE_TEXT, fmtTime } from '../components/ui.jsx';

export default function Home() {
  const { t } = useLang();
  const names = useNames();
  const saved = getMySpot();
  const { state, offline, serverNow } = useQueue({ spotId: saved });

  const staffBtn = (
    <Link to="/staff" className="flex h-11 items-center gap-1.5 rounded-full border border-line-strong px-3.5 text-[13px] font-bold text-mute hover:border-gold/50 hover:text-ivory">
      <Icon.Lock width={15} height={15} />
      {t('staffBtn')}
    </Link>
  );

  if (!state) {
    return (
      <CustomerShell right={staffBtn}>
        <OfflineBar offline={offline} />
        <Loading />
      </CustomerShell>
    );
  }

  const now = serverNow();
  const { settings, barbers, spots, services, mine } = state;
  const onDuty = barbers.filter((b) => b.onDuty);
  const summary = queueSummary(spots, barbers, now);
  const active = mine && isActive(mine) ? mine : null;
  const myEta = active && active.status === STATUS.WAITING ? spotEta(active, spots, barbers, now) : null;

  const closedMsg = {
    switchedOff: t('onlineClosedMsg'),
    closingSoon: t('closingSoonMsg'),
    salonClosed: t('salonClosedMsg', { open: fmtTime(settings.openTime) }),
  }[settings.reason];

  return (
    <CustomerShell right={staffBtn}>
      <OfflineBar offline={offline} />

      {/* Salon */}
      <section className="pt-5 pb-6">
        <p className="eyebrow mb-2">{t('tagline')}</p>
        <h1 className="font-display text-[40px] leading-[1.02] font-medium tracking-tight">{t('salonName')}</h1>
        <p className={`mt-3 inline-flex items-center gap-2 text-[14px] font-semibold ${settings.isOpen ? 'text-mint' : 'text-mute'}`}>
          <span className={`h-2 w-2 rounded-full ${settings.isOpen ? 'bg-mint' : 'bg-mute'}`} />
          {settings.isOpen
            ? t('openUntil', { time: fmtTime(settings.closeTime) })
            : t('closedNow', { time: fmtTime(settings.openTime) })}
        </p>
      </section>

      {/* My ticket (if this phone is in the queue) */}
      {active && (
        <Link to={`/status/${active.id}`} className="ticket animate-rise mb-5 block overflow-hidden" style={{ '--notch': 'var(--color-coal)' }}>
          <div className="flex items-center gap-4 px-5 pt-4 pb-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold tracking-[0.14em] text-ink-soft uppercase">{t('yourTicket')}</p>
              <p className="mt-1 text-[15px] font-semibold">
                {active.status === STATUS.CALLED
                  ? t('yourTurn')
                  : myEta.position === 1
                    ? t('youAreNext')
                    : `${t('inLine', { n: myEta.position })} · ${t('aboutMin', { n: myEta.wait })}`}
              </p>
            </div>
            <p className="token text-[52px] text-ink">S-{active.token}</p>
          </div>
          <div className="perf" />
          <p className="flex items-center justify-between px-5 py-3 text-[14px] font-bold text-ink">
            {t('openTicket')} <Icon.Arrow />
          </p>
        </Link>
      )}

      {/* Live queue board */}
      <section className="card mb-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            <span className="eyebrow">{t('queueNow')}</span>
          </span>
          <span className="text-[12px] text-faint">{t('liveShort')}</span>
        </div>

        {summary.waiting === 0 ? (
          <p className="px-5 py-6 font-display text-[24px] leading-snug">{t('nobodyWaiting')}</p>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="px-5 py-5">
              <p className="token text-[64px] text-gold">{summary.waiting}</p>
              <p className="mt-2 text-[14px] text-mute">{t('peopleWaiting', { n: summary.waiting })}</p>
            </div>
            <div className="px-5 py-5">
              <p className="token text-[64px]">
                {summary.wait}
                <span className="ml-1 font-sans text-[15px] font-semibold tracking-normal text-mute">{t('ringMin')}</span>
              </p>
              <p className="mt-2 text-[14px] text-mute">{t('ringAbout')}</p>
            </div>
          </div>
        )}

        {onDuty.length > 0 && (
          <div className="border-t border-line px-5 pt-3 pb-2">
            <p className="eyebrow mb-1">{t('nowServingTitle')}</p>
            <ul className="divide-y divide-line">
              {onDuty.map((b) => {
                const st = barberState(b, spots);
                const cur = currentOf(b.id, spots);
                return (
                  <li key={b.id} className="flex min-h-14 items-center gap-3">
                    <Avatar barber={b} size={34} />
                    <span className="flex-1 text-[15px] font-semibold">{names.barber(b)}</span>
                    {cur ? (
                      <span className="token text-[28px] text-gold-soft">S-{cur.token}</span>
                    ) : (
                      <span className={`text-[14px] font-semibold ${STATE_TEXT[st]}`}>{t(`st_${st}`)}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Main action */}
      {!active && (
        <section className="mb-8">
          {settings.onlineOpen ? (
            <Link to="/join" className="btn-gold min-h-[68px] w-full flex-col gap-0.5 rounded-2xl text-[18px]">
              <span className="flex items-center gap-2">
                {t('joinQueue')} <Icon.Arrow />
              </span>
              <span className="text-[13px] font-semibold opacity-75">
                {summary.waiting === 0 ? t('joinSubNow') : t('joinSub', { n: summary.wait })}
              </span>
            </Link>
          ) : (
            <div className="rounded-2xl border border-line-strong px-5 py-5 text-center">
              <p className="text-[16px] font-semibold">{closedMsg}</p>
            </div>
          )}
          {saved && mine && (
            <Link to={`/status/${saved}`} className="mt-2 flex min-h-11 items-center justify-center text-[14px] text-mute underline decoration-line-strong underline-offset-4 hover:text-ivory">
              {t('alreadyIn')}
            </Link>
          )}
        </section>
      )}

      {/* How it works */}
      <section className="mb-8">
        <h2 className="mb-3 text-[17px] font-bold">{t('howTitle')}</h2>
        <ol className="space-y-3">
          {[t('how1'), t('how2'), t('how3')].map((line, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="token grid h-8 w-8 shrink-0 place-items-center rounded-full border border-gold/40 text-[18px] text-gold">{i + 1}</span>
              <span className="pt-1 text-[15px] leading-snug text-mute">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Price list */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[17px] font-bold">{t('priceList')}</h2>
          <span className="text-[12px] text-faint">{t('priceNote')}</span>
        </div>
        <ul className="card px-5 py-2">
          {services
            .filter((s) => s.active)
            .map((s) => (
              <li key={s.id} className="flex items-baseline gap-2 py-2.5 text-[15px]">
                <span className="font-semibold">{names.service(s)}</span>
                <span className="text-[13px] text-faint">{t('min', { n: s.minutes })}</span>
                <span className="leaders" />
                <span className="font-bold text-gold-soft">₹{s.price}</span>
              </li>
            ))}
        </ul>
      </section>

      <footer className="mt-auto border-t border-line pt-5 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[15px] font-bold text-ivory">Krutarth Raychura</p>
            <p className="mt-0.5 text-[13px] text-mute">{t('credit')}</p>
          </div>
          <p className="shrink-0 rounded-lg border border-gold/35 px-2.5 py-1 font-mono text-[13px] tracking-wider text-gold-soft">202612078</p>
        </div>
      </footer>
    </CustomerShell>
  );
}
