import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { getMySpot } from '../lib/api.js';
import { STATUS, barberState, currentOf, isActive, queueSummary, spotEta } from '../lib/queueRules.js';
import { Avatar, CustomerShell, Icon, Loading, OfflineBar, Pole, fmtTime } from '../components/ui.jsx';

export default function Home() {
  const { t } = useLang();
  const names = useNames();
  const saved = getMySpot();
  const { state, offline, serverNow } = useQueue({ spotId: saved });

  const staffBtn = (
    <Link to="/staff" className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-ink-2 hover:bg-sunk hover:text-ink">
      <Icon.Lock width={16} height={16} />
      <span className="hidden min-[380px]:inline">{t('staffBtn')}</span>
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
  const open = settings.isOpen;

  const closedMsg = {
    switchedOff: t('onlineClosedMsg'),
    closingSoon: t('closingSoonMsg'),
    salonClosed: t('salonClosedMsg', { open: fmtTime(settings.openTime) }),
  }[settings.reason];

  const barberLine = (b) => {
    const st = barberState(b, spots);
    const cur = currentOf(b.id, spots);
    if (cur?.status === STATUS.CALLED) return <span className="font-semibold text-red">{t('nowCalling')} <span className="num text-[24px]">S-{cur.token}</span></span>;
    if (cur) return <span className="font-semibold text-navy">{t('nowServing')} <span className="num text-[24px]">S-{cur.token}</span></span>;
    return <span className={`font-semibold ${st === 'free' ? 'text-green' : st === 'break' ? 'text-amber' : 'text-ink-3'}`}>{t(`st_${st}`)}</span>;
  };

  return (
    <CustomerShell right={staffBtn} open={open} width="max-w-[520px] lg:max-w-6xl">
      <OfflineBar offline={offline} />

      <div className="grid flex-1 gap-x-16 lg:grid-cols-[1fr_1fr] lg:pt-10">
        {/* Left: who we are + the main action */}
        <div>
          <section className="flex items-stretch gap-5 pt-7 pb-8 lg:pt-4">
            <Pole height={148} width={20} spinning={open} />
            <div className="flex min-w-0 flex-col justify-center">
              <h1 className="display text-[44px] leading-[0.95] sm:text-[52px]">{t('salonName')}</h1>
              <p className={`mt-3 flex items-center gap-2 text-[16px] font-semibold ${open ? 'text-green' : 'text-ink-3'}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${open ? 'bg-green' : 'bg-ink-3'}`} />
                {open ? t('openUntil', { time: fmtTime(settings.closeTime) }) : t('closedNow', { time: fmtTime(settings.openTime) })}
              </p>
              <p className="mt-1 text-[16px] text-ink-3">{t('tagline')}</p>
            </div>
          </section>

          {active ? (
            <Link to={`/status/${active.id}`} className="animate-rise mb-8 block overflow-hidden rounded-2xl bg-navy text-white shadow-[0_14px_30px_-14px_rgb(30_42_90/0.7)]">
              <div className="flex items-center gap-4 px-5 pt-5 pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-white/70">{t('yourTicket')}</p>
                  <p className="mt-1 text-[18px] font-semibold">
                    {active.status === STATUS.CALLED
                      ? t('yourTurn')
                      : myEta.position === 1
                        ? t('youAreNext')
                        : `${t('inLine', { n: myEta.position })}, ${t('aboutMin', { n: myEta.wait })}`}
                  </p>
                </div>
                <p className="num text-[64px]">S-{active.token}</p>
              </div>
              <p className="border-t border-white/15 px-5 py-3.5 text-[16px] font-semibold">{t('openTicket')}</p>
            </Link>
          ) : (
            <section className="mb-8">
              {settings.onlineOpen ? (
                <Link to="/join" className="btn-primary min-h-[72px] w-full flex-col gap-0 rounded-2xl text-[20px] shadow-[0_14px_30px_-14px_rgb(30_42_90/0.7)]">
                  {t('joinQueue')}
                  <span className="text-[14px] font-medium text-white/75">
                    {summary.waiting === 0 ? t('joinSubNow') : t('joinSub', { n: summary.wait })}
                  </span>
                </Link>
              ) : (
                <p className="rounded-2xl border border-line-strong bg-surface px-5 py-5 text-center text-[17px] font-semibold text-ink-2">{closedMsg}</p>
              )}
              {saved && mine && (
                <Link to={`/status/${saved}`} className="mt-2 flex min-h-11 items-center justify-center text-[15px] text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
                  {t('alreadyIn')}
                </Link>
              )}
            </section>
          )}

          <section className="mb-10 hidden lg:block">
            <HowItWorks t={t} />
          </section>
        </div>

        {/* Right: live queue + prices */}
        <div>
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="text-[20px] font-semibold">{t('queueNow')}</h2>
              <span className="flex items-center gap-2 text-[14px] text-ink-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
                </span>
                {t('liveShort')}
              </span>
            </div>

            {summary.waiting === 0 ? (
              <p className="display mb-2 text-[28px] leading-tight">{t('nobodyWaiting')}</p>
            ) : (
              <p className="mb-2 text-[20px] leading-snug text-ink-2">
                <span className="num mr-1.5 align-[-0.08em] text-[64px] text-ink">{summary.waiting}</span>
                {t('waitingWord', { n: summary.waiting })}
                <span className="mx-2 text-line-strong">/</span>
                {t('ringAbout')} <span className="num text-[40px] text-ink">{summary.wait}</span> {t('ringMin')}
              </p>
            )}

            {onDuty.length > 0 && (
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {onDuty.map((b) => (
                  <li key={b.id} className="flex min-h-[60px] items-center gap-3">
                    <Avatar barber={b} size={36} />
                    <span className="flex-1 text-[17px] font-semibold">{names.barber(b)}</span>
                    <span className="text-[16px]">{barberLine(b)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-10 lg:hidden">
            <HowItWorks t={t} />
          </section>

          <section className="mb-12">
            <div className="mb-1 flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
              <h2 className="text-[20px] font-semibold">{t('priceList')}</h2>
              <span className="text-right text-[13px] text-ink-3">{t('priceNote')}</span>
            </div>
            <ul className="divide-y divide-line">
              {services
                .filter((s) => s.active)
                .map((s) => (
                  <li key={s.id} className="flex items-baseline gap-3 py-3 text-[17px]">
                    <span className="flex-1 font-medium">{names.service(s)}</span>
                    <span className="text-[14px] text-ink-3">{t('min', { n: s.minutes })}</span>
                    <span className="w-16 text-right font-semibold">₹{s.price}</span>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>

      <footer className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-t border-line py-6 text-[15px]">
        <p>
          <span className="font-semibold">Krutarth Raychura</span>
          <span className="text-ink-3"> ({t('studentId')} 202612078)</span>
        </p>
        <p className="text-ink-3">{t('credit')}</p>
      </footer>
    </CustomerShell>
  );
}

function HowItWorks({ t }) {
  return (
    <>
      <h2 className="mb-4 text-[20px] font-semibold">{t('howTitle')}</h2>
      <ol className="space-y-4">
        {[t('how1'), t('how2'), t('how3')].map((line, i) => (
          <li key={i} className="flex items-start gap-4">
            <span className="num w-5 shrink-0 pt-0.5 text-[28px] text-red">{i + 1}</span>
            <span className="text-[17px] leading-snug text-ink-2">{line}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
