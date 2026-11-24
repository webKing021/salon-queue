import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { barberState, waitingList } from '../lib/queueRules.js';
import StaffShell, { STAFF_TABS } from '../components/StaffShell.jsx';
import { Avatar, Dot, Icon, Loading } from '../components/ui.jsx';

const DEVICE = { reception: 'device_tablet', barber: 'device_phone', display: 'device_tv', admin: 'device_any' };

export default function StaffHub() {
  return (
    <StaffShell active={null} width="max-w-5xl">
      <Hub />
    </StaffShell>
  );
}

function Hub() {
  const { t } = useLang();
  const names = useNames();
  const { state } = useQueue();
  if (!state) return <Loading />;
  const waiting = waitingList(state.spots).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <p className="text-[14px] font-medium text-ink-3 mb-2">{t('waitingN', { n: waiting })}</p>
      <h1 className="display text-[34px] leading-tight font-medium tracking-tight md:text-[42px]">{t('staffHubTitle')}</h1>
      <p className="mt-2 max-w-xl text-[15px] text-ink-3">{t('staffHubSub')}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {STAFF_TABS.map((tab) => (
          <div key={tab.key} className="panel flex flex-col p-5 transition-colors hover:border-navy/40">
            <Link to={tab.to} className="group flex flex-1 items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-navy-soft text-navy">
                <tab.icon width={24} height={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[19px] font-bold">{t(tab.label)}</span>
                  <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] font-bold text-ink-3">{t(DEVICE[tab.key])}</span>
                </span>
                <span className="mt-1 block text-[14px] leading-snug text-ink-3">{t(tab.hint)}</span>
              </span>
              <span className="mt-1 text-ink-3 transition-colors group-hover:text-navy">
                <Icon.Arrow />
              </span>
            </Link>
            {tab.key === 'barber' && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                <span className="mr-1 self-center text-[12px] font-semibold text-ink-3">{t('openAs')}</span>
                {state.barbers.map((b) => {
                  const st = barberState(b, state.spots);
                  return (
                    <Link key={b.id} to={`/barber/${b.id}`} className="flex min-h-11 items-center gap-2 rounded-full border border-line-strong py-1 pr-4 pl-1 text-[14px] font-semibold hover:border-navy/60">
                      <Avatar barber={b} size={32} />
                      {names.barber(b)}
                      <Dot state={st} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
