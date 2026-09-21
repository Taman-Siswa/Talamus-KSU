'use client';

import { useAuth } from '@/lib/auth';
import Icon from '@/components/Icon';
import css from '@/components/ui.module.css';

export default function ProfilPage() {
  const logout = useAuth(s => s.logout);
  return (
    <div>
      <h1 className={css.h1}>Profil</h1>
      <div className={css.profileCol}>
        <div className={css.card} style={{ marginTop: 28 }}>
          <div className={css.cardHeadIcon}>
            <Icon name="user" size={18} />
            <h2 className={css.cardTitle}>Akun</h2>
          </div>
          <div className={css.col} style={{ gap: 8 }}>
            {/* Signing out clears the session; Shell's route guard then sends the user to /login. */}
            <button type="button" className={css.btnGhost} onClick={logout}>
              <Icon name="logout" size={16} />Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
