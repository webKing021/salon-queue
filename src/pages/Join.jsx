import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { saveMySpot } from '../lib/api.js';
import JoinForm from '../components/JoinForm.jsx';
import { Loading, Modal, OfflineBar, PhoneBar, fmtTime, useToast } from '../components/ui.jsx';

export default function Join() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { state, offline, serverNow } = useQueue();
  const [toastNode, toast] = useToast();
  const [existing, setExisting] = useState(null);

  function onResult(res) {
    if (res.spot) {
      saveMySpot(res.spot.id);
      navigate(`/status/${res.spot.id}`);
    } else if (res.existing) {
      setExisting(res.existing);
    }
  }

  function openExisting() {
    saveMySpot(existing.id);
    navigate(`/status/${existing.id}`);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-[480px] px-5">
      <OfflineBar offline={offline} />
      <PhoneBar back="/" title={t('joinTitle')} />
      {!state ? (
        <Loading />
      ) : !state.settings.onlineOpen ? (
        <div className="card mt-6 px-6 py-10 text-center">
          <p className="font-display text-2xl leading-snug">
            {state.settings.reason === 'salonClosed'
              ? t('salonClosedMsg', { open: fmtTime(state.settings.openTime) })
              : state.settings.reason === 'closingSoon'
                ? t('closingSoonMsg')
                : t('onlineClosedMsg')}
          </p>
          <Link to="/" className="btn-ghost mt-8">{t('backHome')}</Link>
        </div>
      ) : (
        <JoinForm state={state} serverNow={serverNow} onResult={onResult} toast={toast} />
      )}
      {toastNode}
      <Modal open={Boolean(existing)} onClose={() => setExisting(null)}>
        {existing && (
          <>
            <p className="mb-6 text-[17px] leading-relaxed">
              {t('alreadyInQueue', { token: `S-${existing.token}` })}
            </p>
            <button className="btn-gold w-full" onClick={openExisting}>{t('seeMySpot')}</button>
          </>
        )}
      </Modal>
    </main>
  );
}
