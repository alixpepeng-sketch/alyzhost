import { getGroupSettings, requireGroupAdmin, setGroupSetting } from '../lib/groups.js';
import { reply } from '../utils.js';

function makeToggle({ key, command, label, description, needsBotAdmin }) {
  return async function toggle(sock, m, args, sessionDir) {
    const info = await requireGroupAdmin(sock, m, sessionDir);
    if (!info) return undefined;

    const option = (args[0] || '').toLowerCase();
    if (option !== 'on' && option !== 'off') {
      const status = getGroupSettings(sessionDir, info.jid)[key] ? 'ON' : 'OFF';
      return reply(
        sock,
        m,
        `Status ${label} di grup ini: ${status}\n${description}\nGunakan .${command} on atau .${command} off`,
      );
    }

    const enabled = option === 'on';
    setGroupSetting(sessionDir, info.jid, key, enabled);

    let text = `${label} ${enabled ? 'diaktifkan' : 'dimatikan'} di grup ini.`;
    if (enabled && needsBotAdmin && !info.isBotAdmin) {
      text += '\nCatatan: jadikan bot admin grup supaya fitur ini bisa berjalan.';
    }
    return reply(sock, m, text);
  };
}

// .antilink on/off - non-admin yang kirim link, pesannya dihapus. Admin boleh.
export const antilink = makeToggle({
  key: 'antilink',
  command: 'antilink',
  label: 'Antilink',
  description: 'Member biasa tidak bisa mengirim link, admin tetap bisa.',
  needsBotAdmin: true,
});

// .adminonly on/off - hanya admin yang bisa memakai bot di grup ini.
export const adminonly = makeToggle({
  key: 'adminonly',
  command: 'adminonly',
  label: 'Adminonly',
  description: 'Bot hanya merespons admin grup.',
  needsBotAdmin: false,
});
