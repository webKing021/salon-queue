import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue, useTick } from '../lib/useQueue.js';
import { STATUS, barberState, currentOf, spotEta, waitingList } from '../lib/queueRules.js';
import { Avatar, Icon, LangToggle, OfflineBar, Pole, clockText, fmtTime } from '../components/ui.jsx';

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
  const [showExit, setShowExit] = useState(false);
  const exitTimer = useRef(null);
  useTick(1000);

  // The exit button only appears when someone moves the mouse / touches the screen.
  function wake() {
    setShowExit(true);
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setShowExit(false), 4000);
  }

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

  if (!state) return <div className="min-h-dvh bg-navy-deep" />;

  const now = serverNow();
  const onDuty = state.barbers.filter((b) => b.onDuty);
  const upNext = waitingList(state.spots).slice(0, 5);
  const flashBarber = flashing && state.barbers.find((b) => b.id === flashing.barberId);

  return (
    <main onClick={() => { enableSound(); wake(); }} onMouseMove={wake} className="flex min-h-dvh flex-col bg-navy-deep text-white md:h-dvh md:overflow-hidden">
      <OfflineBar offline={offline} />
      <Link
        to="/staff"
        className={`fixed top-4 left-1/2 z-50 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold text-ink shadow-xl transition-opacity ${
          showExit ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <Icon.Back width={18} height={18} /> {t('exitTv')}
      </Link>
      <header className="flex items-center justify-between border-b border-white/10 px-[3vw] py-[1.6vh]">
        <div className="flex items-center gap-4">
          <Pole height={Math.round(Math.min(window.innerHeight * 0.08, 84))} width={Math.round(Math.min(window.innerHeight * 0.022, 22))} spinning={state.settings.isOpen} />
          <h1 className="display text-[clamp(28px,3.2vw,64px)] ">{t('salonName')}</h1>
        </div>
        <div className="flex items-center gap-6">
          <LangToggle dark />
          <p className="num text-[clamp(40px,4.4vw,88px)] text-white">{clockText(now)}</p>
        </div>
      </header>

      {flashing && (
        <div className="flex items-center bg-red justify-center gap-[2vw] px-[3vw] py-[1.8vh]">
          <span className="text-[clamp(22px,2vw,40px)] font-semibold">{t('nowCalling')}</span>
          <span className="num text-[clamp(72px,7vw,150px)] leading-none">S-{flashing.token}</span>
          <span className="text-[clamp(22px,2vw,40px)] font-semibold">{t('goToBarber', { name: names.barber(flashBarber) })}</span>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[3fr_2fr] md:gap-[2.5vw] px-[3vw] py-[3vh]">
        <section className="flex min-h-0 flex-col gap-[2vh]">
          {onDuty.map((b) => {
            const st = barberState(b, state.spots);
            const cur = currentOf(b.id, state.spots);
            const isFlash = flashing && flashing.barberId === b.id;
            return (
              <div
                key={b.id}
                className={`flex min-h-[112px] flex-1 items-center gap-4 rounded-2xl border px-4 md:min-h-0 md:gap-[2vw] md:rounded-[2vw] md:px-[2.2vw] ${
                  isFlash ? 'animate-flash border-red' : 'border-white/10 bg-white/[0.04]'
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
                      <p className="text-[clamp(14px,1.1vw,24px)] font-semibold opacity-60">{t('now')}</p>
                      <p className={`num text-[clamp(80px,8vw,180px)] leading-none ${isFlash ? '' : cur.status === STATUS.CALLED ? 'text-[#ff7a70]' : 'text-white'}`}>S-{cur.token}</p>
                    </>
                  ) : (
                    <p className={`text-[clamp(28px,2.8vw,60px)] font-semibold ${st === 'free' ? 'text-[#5fd39a]' : st === 'break' ? 'text-[#f2b544]' : 'text-white/45'}`}>
                      {t(`st_${st}`)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl bg-white px-5 py-4 text-ink md:rounded-[2vw] md:px-[2.2vw] md:py-[2.5vh]">
          <h2 className="mb-[1.5vh] display text-[clamp(28px,2.6vw,56px)] text-navy">{t('upNext')}</h2>
          {upNext.length === 0 ? (
            <p className="my-auto text-center display text-[clamp(26px,2.4vw,52px)] leading-snug text-ink-3">{state.settings.isOpen ? t('tvEmpty') : t('closedBoard', { time: fmtTime(state.settings.openTime) })}</p>
          ) : (
            <ol className="flex flex-1 flex-col divide-y divide-line">
              {upNext.map((s) => {
                const eta = spotEta(s, state.spots, state.barbers, now);
                return (
                  <li key={s.token} className="flex flex-1 items-center gap-[1.5vw]">
                    <span className="num w-[30%] text-[clamp(56px,5vw,120px)] leading-none">S-{s.token}</span>
                    <span className="min-w-0 flex-1 truncate text-[clamp(22px,2vw,44px)]">{s.name}</span>
                    <span className="text-[clamp(20px,1.7vw,38px)] text-ink-3">~{eta.wait || 5} {t('ringMin')}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 md:gap-6 border-t border-white/10 px-[3vw] py-[1.5vh]">
        <p className="text-[clamp(20px,1.8vw,40px)] font-semibold">{t('tvJoin')}</p>
        <div className="flex items-center gap-5">
          {!soundOn && (
            <span className="hidden items-center gap-2 rounded-full border border-white/30 md:flex px-4 py-2 text-[clamp(14px,1.1vw,22px)] text-white/80">
              <Icon.Sound /> {t('tapSound')}
            </span>
          )}
          {qr && <img src={qr} alt={t('qrAlt')} className="h-[11vh] w-[11vh] rounded-lg bg-white p-1" />}
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
