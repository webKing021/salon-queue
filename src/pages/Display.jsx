import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { STATUS, barberState, currentOf, spotEta, waitingList } from '../lib/queueRules.js';
import { Avatar, Icon, LangToggle, OfflineBar, clockText } from '../components/ui.jsx';

const FLASH_MS = 5000;

export default function Display() {
  const { t } = useLang();
  const names = useNames();
  const { state, offline, serverNow } = useQueue();
  const [qr, setQr] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [flashing, setFlashing] = useState(null); // { token, barberId, until }
  const seen = useRef(null);
  const audio = useRef(null);
  useTick(1000);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/`, {
      margin: 1,
      width: 320,
      color: { dark: '#1F2937', light: '#F4EFE6' },
    }).then(setQr);
  }, []);

  // Detect newly called tokens → flash + chime.
  useEffect(() => {
    if (!state) return;
    const called = state.spots.filter((s) => s.status === STATUS.CALLED);
    if (seen.current === null) {
      seen.current = new Set(called.map((s) => s.token));
      return;
    }
    for (const s of called) {
      if (!seen.current.has(s.token)) {
        seen.current.add(s.token);
        setFlashing({ token: s.token, barberId: s.barber, until: Date.now() + FLASH_MS });
        chime(audio.current);
      }
    }
  }, [state]);

  useEffect(() => {
    if (!flashing) return;
    const id = setTimeout(() => setFlashing(null), Math.max(0, flashing.until - Date.now()));
    return () => clearTimeout(id);
  }, [flashing]);

  function enableSound() {
    if (soundOn) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audio.current = new Ctx();
      audio.current.resume();
    }
    setSoundOn(true);
  }

  if (!state) return <div className="min-h-dvh bg-coal" />;

  const now = serverNow();
  const onDuty = state.barbers.filter((b) => b.onDuty);
  const upNext = waitingList(state.spots).slice(0, 5);
  const flashBarber = flashing && state.barbers.find((b) => b.id === flashing.barberId);

  return (
    <main onClick={enableSound} className="flex h-dvh flex-col overflow-hidden bg-coal text-ivory">
      <OfflineBar offline={offline} />
      <header className="flex items-center justify-between border-b border-line px-[3vw] py-[1.6vh]">
        <div className="flex items-center gap-4">
          <span className="grid h-[5vh] w-[5vh] place-items-center rounded-full border border-gold/60 text-gold">
            <Icon.Scissors width="55%" height="55%" />
          </span>
          <h1 className="font-display text-[clamp(28px,3.2vw,64px)] font-medium tracking-tight">{t('salonName')}</h1>
        </div>
        <div className="flex items-center gap-6">
          <LangToggle />
          <p className="token text-[clamp(32px,3.6vw,72px)] text-gold">{clockText(now)}</p>
        </div>
      </header>

      {flashing && (
        <div className="animate-flash flex items-center justify-center gap-[2vw] px-[3vw] py-[1.8vh]">
          <span className="text-[clamp(22px,2vw,40px)] font-semibold">{t('nowCalling')}</span>
          <span className="token text-[clamp(56px,5.5vw,120px)] leading-none font-semibold">S-{flashing.token}</span>
          <span className="text-[clamp(22px,2vw,40px)] font-semibold">{t('goToBarber', { name: names.barber(flashBarber) })}</span>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[3fr_2fr] gap-[2.5vw] px-[3vw] py-[3vh]">
        <section className="flex min-h-0 flex-col gap-[2vh]">
          {onDuty.map((b) => {
            const st = barberState(b, state.spots);
            const cur = currentOf(b.id, state.spots);
            const isFlash = flashing && flashing.barberId === b.id;
            return (
              <div
                key={b.id}
                className={`flex flex-1 items-center gap-[2vw] rounded-[2vw] border border-line px-[2.2vw] ${
                  isFlash ? 'animate-flash' : 'bg-coal-deep'
                } ${st === 'break' ? 'opacity-60' : ''}`}
              >
                <Avatar barber={b} size={Math.round(Math.min(window.innerHeight * 0.11, 120))} />
                <div className="min-w-0 flex-1">
                  <p className="text-[clamp(26px,2.6vw,56px)] font-semibold leading-tight">{names.barber(b)}</p>
                  {cur && (
                    <p className="text-[clamp(16px,1.3vw,28px)] opacity-70">
                      {cur.status === STATUS.IN_CHAIR ? t('nowServing') : t('nowCalling')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {cur ? (
                    <>
                      <p className="text-[clamp(14px,1.1vw,24px)] font-semibold uppercase tracking-[0.2em] opacity-60 [:lang(gu)_&]:tracking-normal">{t('now')}</p>
                      <p className={`token text-[clamp(64px,6.5vw,150px)] leading-none ${isFlash ? '' : 'text-gold'}`}>S-{cur.token}</p>
                    </>
                  ) : (
                    <p className={`text-[clamp(28px,2.8vw,60px)] font-semibold ${st === 'free' ? 'text-mint' : 'text-mute'}`}>
                      {t(`st_${st}`)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="flex min-h-0 flex-col rounded-[2vw] border border-line bg-coal-deep px-[2.2vw] py-[2.5vh]">
          <h2 className="mb-[1.5vh] font-display text-[clamp(28px,2.6vw,56px)] text-gold">{t('upNext')}</h2>
          {upNext.length === 0 ? (
            <p className="my-auto text-center font-display text-[clamp(26px,2.4vw,52px)] leading-snug text-mute">{t('tvEmpty')}</p>
          ) : (
            <ol className="flex flex-1 flex-col divide-y divide-line">
              {upNext.map((s) => {
                const eta = spotEta(s, state.spots, state.barbers, now);
                return (
                  <li key={s.token} className="flex flex-1 items-center gap-[1.5vw]">
                    <span className="token w-[30%] text-[clamp(44px,4vw,96px)] leading-none">S-{s.token}</span>
                    <span className="min-w-0 flex-1 truncate text-[clamp(22px,2vw,44px)]">{s.name}</span>
                    <span className="text-[clamp(20px,1.7vw,38px)] text-mute">~{eta.wait || 5} {t('ringMin')}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <footer className="flex items-center justify-between gap-6 border-t border-line px-[3vw] py-[1.5vh]">
        <p className="text-[clamp(20px,1.8vw,40px)] font-semibold">{t('tvJoin')}</p>
        <div className="flex items-center gap-5">
          {!soundOn && (
            <span className="flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-[clamp(14px,1.1vw,22px)] text-gold-soft">
              <Icon.Sound /> {t('tapSound')}
            </span>
          )}
          {qr && <img src={qr} alt="QR code to the join page" className="h-[11vh] w-[11vh] rounded-lg" />}
        </div>
      </footer>
    </main>
  );
}

/** Two soft bell notes. */
function chime(ctx) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  [
    [880, 0],
    [1318.5, 0.22],
  ].forEach(([freq, at]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0 + at);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0 + at);
    osc.stop(t0 + at + 1.3);
  });
}
