import { useEffect, useState } from 'react';
import { useLang, useNames } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { act } from '../lib/api.js';
import { barberState, dayStats } from '../lib/queueRules.js';
import StaffShell, { lockStaff } from '../components/StaffShell.jsx';
import { Avatar, Confirm, Icon, Loading, Modal, OfflineBar, Toggle, useToast } from '../components/ui.jsx';

export default function Admin() {
  return (
    <StaffShell active="admin" width="max-w-6xl">
      <Settings />
    </StaffShell>
  );
}

function Settings() {
  const { t } = useLang();
  const names = useNames();
  const { state, offline, refresh } = useQueue();
  const [toastNode, toast] = useToast();
  const [editing, setEditing] = useState(null);
  const [askReset, setAskReset] = useState(false);

  if (!state) return <Loading />;
  if (!state.staff) {
    lockStaff();
    return null;
  }

  const { settings, barbers, services, spots } = state;
  const stats = dayStats(spots);

  async function run(action, payload, okMsg) {
    try {
      const res = await act(action, payload);
      if (okMsg) toast(typeof okMsg === 'function' ? okMsg(res) : okMsg);
      refresh();
      return true;
    } catch (err) {
      toast(t(`err_${err.code}`));
      refresh();
      return false;
    }
  }

  return (
    <div>
      <OfflineBar offline={offline} />


      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6">
        <h1 className="text-[22px] font-bold">{t('admin')}</h1>
        {/* stats */}
        <section>
          <h2 className="text-[18px] font-semibold text-ink mb-3">{t('statsToday')}</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('statServed')} value={stats.served} gold />
            <Stat label={t('statAvgWait')} value={stats.avgWait} />
            <Stat label={t('statNoShows')} value={stats.noShows} />
            <Stat label={t('statCancelled')} value={stats.cancelled} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            {/* queue switch */}
            <section className="panel p-5">
              <h2 className="text-[18px] font-semibold text-ink mb-4">{t('queueSwitch')}</h2>
              <div className="flex items-center justify-between gap-4">
                <p className={`text-lg font-semibold ${settings.queueOpen ? 'text-green' : 'text-ink-3'}`}>
                  {settings.queueOpen ? t('queueOpenLabel') : t('queueClosedLabel')}
                </p>
                <Toggle on={settings.queueOpen} label={t('queueSwitch')} onChange={(v) => run('setQueueOpen', { value: v })} />
              </div>
              <p className="mt-2 text-[13px] text-ink-3">{t('walkInsStill')}</p>
            </section>

            {/* hours */}
            <Hours settings={settings} t={t} onSave={(h) => run('setHours', h, t('saved'))} />

            {/* barbers */}
            <section className="panel p-5">
              <h2 className="text-[18px] font-semibold text-ink mb-4">{t('barbersDuty')}</h2>
              <ul className="space-y-3">
                {barbers.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <Avatar barber={b} size={40} />
                    <div className="flex-1">
                      <p className="font-semibold">{names.barber(b)}</p>
                      <p className="text-[13px] text-ink-3">{t(`st_${barberState(b, spots)}`)}</p>
                    </div>
                    <Toggle on={b.onDuty} label={names.barber(b)} onChange={(v) => run('setDuty', { barberId: b.id, value: v })} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* services */}
          <section className="panel self-start p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-ink">{t('servicesList')}</h2>
              <button className="btn-outline min-h-10 text-sm" onClick={() => setEditing({})}>
                <Icon.Plus width={16} height={16} /> {t('addService')}
              </button>
            </div>
            <ul className="divide-y divide-line">
              {services.map((s) => (
                <li key={s.id} className={`flex items-center gap-3 py-3 ${s.active ? '' : 'opacity-50'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.nameEn}</p>
                    <p className="truncate font-gu text-[14px] text-ink-3">{s.nameGu}</p>
                  </div>
                  <span className="w-16 text-right text-[14px] text-ink-3">{t('min', { n: s.minutes })}</span>
                  <span className="w-14 text-right font-semibold">₹{s.price}</span>
                  <button className="btn-quiet min-h-10 px-2 text-sm" onClick={() => setEditing(s)}>{t('edit')}</button>
                  <Toggle on={s.active} label={s.nameEn} onChange={(v) => run('toggleService', { id: s.id, value: v })} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* day controls */}
        <section className="panel flex flex-wrap items-center gap-4 p-5">
          <div className="mr-auto">
            <h2 className="text-[18px] font-semibold text-ink mb-1">{t('dangerZone')}</h2>
            <p className="text-[13px] text-ink-3">{t('demoNote')}</p>
          </div>
          <button className="btn-outline" onClick={() => run('addDemo', {}, (r) => `+${r.added}`)}>{t('demoData')}</button>
          <button className="btn-danger" onClick={() => setAskReset(true)}>{t('resetDay')}</button>
        </section>
      </div>

      <ServiceEditor
        service={editing}
        t={t}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (await run('saveService', data, t('saved'))) setEditing(null);
        }}
      />
      <Confirm
        open={askReset}
        text={t('resetQ')}
        no={t('no')}
        yes={t('resetDay')}
        onNo={() => setAskReset(false)}
        onYes={() => {
          setAskReset(false);
          run('resetDay', {}, t('saved'));
        }}
      />
      {toastNode}
    </div>
  );
}

function Stat({ label, value, gold }) {
  return (
    <div className="panel px-5 py-4">
      <p className={`num text-[48px] ${gold ? 'text-navy' : ''}`}>{value}</p>
      <p className="mt-1 text-[13px] text-ink-3">{label}</p>
    </div>
  );
}

function Hours({ settings, t, onSave }) {
  const [open, setOpen] = useState(settings.openTime);
  const [close, setClose] = useState(settings.closeTime);
  useEffect(() => {
    setOpen(settings.openTime);
    setClose(settings.closeTime);
  }, [settings.openTime, settings.closeTime]);
  const changed = open !== settings.openTime || close !== settings.closeTime;
  return (
    <section className="panel p-5">
      <h2 className="text-[18px] font-semibold text-ink mb-4">{t('hours')}</h2>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">{t('opens')}</span>
          <input type="time" className="field" value={open} onChange={(e) => setOpen(e.target.value)} />
        </label>
        <label>
          <span className="label">{t('closes')}</span>
          <input type="time" className="field" value={close} onChange={(e) => setClose(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3">{t('hoursNote')}</p>
        {changed && (
          <button className="btn-primary min-h-10 text-sm" onClick={() => onSave({ openTime: open, closeTime: close })}>
            {t('save')}
          </button>
        )}
      </div>
    </section>
  );
}

function ServiceEditor({ service, t, onClose, onSave }) {
  const [form, setForm] = useState({ nameEn: '', nameGu: '', minutes: 30, price: 100 });
  useEffect(() => {
    if (service) setForm({ nameEn: '', nameGu: '', minutes: 30, price: 100, ...service });
  }, [service]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <Modal open={Boolean(service)} onClose={onClose} title={service?.id ? t('editService') : t('addService')}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: service.id, nameEn: form.nameEn, nameGu: form.nameGu, minutes: Number(form.minutes), price: Number(form.price) });
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="label">{t('nameEn')}</span>
          <input className="field" required maxLength={40} value={form.nameEn} onChange={set('nameEn')} />
        </label>
        <label className="block">
          <span className="label">{t('nameGu')}</span>
          <input className="field font-gu" required maxLength={40} value={form.nameGu} onChange={set('nameGu')} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">{t('minutes')}</span>
            <input className="field" type="number" min={5} max={240} step={5} required value={form.minutes} onChange={set('minutes')} />
          </label>
          <label>
            <span className="label">{t('price')}</span>
            <input className="field" type="number" min={0} max={20000} required value={form.price} onChange={set('price')} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>{t('close')}</button>
          <button type="submit" className="btn-primary">{t('save')}</button>
        </div>
      </form>
    </Modal>
  );
}
