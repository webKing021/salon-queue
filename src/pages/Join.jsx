import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/index.jsx';
import { useQueue } from '../lib/useQueue.js';
import { getMySpot, saveMySpot } from '../lib/api.js';
import { isActive } from '../lib/queueRules.js';
import JoinForm from '../components/JoinForm.jsx';
import { CustomerShell, Loading, Modal, OfflineBar, fmtTime, useToast } from '../components/ui.jsx';

export default function Join() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { state, offline, serverNow } = useQueue({ spotId: getMySpot() });
  const mine = state?.mine && isActive(state.mine) ? state.mine : null;
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
    <CustomerShell back="/" title={t('joinTitle')}>
      <OfflineBar offline={offline} />
      <div className="pt-3">
        {!state ? (
          <Loading />
        ) : !state.settings.onlineOpen ? (
          <div className="panel mt-6 px-6 py-10 text-center">
            <p className="display text-2xl leading-snug">
              {state.settings.reason === 'salonClosed'
                ? t('salonClosedMsg', { open: fmtTime(state.settings.openTime) })
                : state.settings.reason === 'closingSoon'
                  ? t('closingSoonMsg')
                  : t('onlineClosedMsg')}
            </p>
            <Link to="/" className="btn-outline mt-8">{t('backHome')}</Link>
          </div>
        ) : mine ? (
          <div className="panel mt-6 px-6 py-10 text-center">
            <p className="num text-[80px] text-navy">S-{mine.token}</p>
            <p className="display mt-4 text-[24px] leading-tight">{t('haveTicketTitle', { token: `S-${mine.token}` })}</p>
            <p className="mt-3 text-ink-3">{t('haveTicketSub')}</p>
            <Link to={`/status/${mine.id}`} className="btn-primary mt-8 w-full">{t('openTicket')}</Link>
          </div>
        ) : (
          <JoinForm state={state} serverNow={serverNow} onResult={onResult} toast={toast} />
        )}
      </div>
      {toastNode}
      <Modal open={Boolean(existing)} onClose={() => setExisting(null)}>
        {existing && (
          <>
            <p className="mb-6 text-[17px] leading-relaxed">{t('alreadyInQueue', { token: `S-${existing.token}` })}</p>
            <button className="btn-primary w-full" onClick={openExisting}>{t('seeMySpot')}</button>
          </>
        )}
      </Modal>
    </CustomerShell>
  );
}
