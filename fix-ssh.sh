#!/usr/bin/env bash
set -euo pipefail

# === Настрой под себя ===
VM_NAME="openvpn-as-1"                         # имя твоей ВМ
LOGIN="ubuntu"                                 # логин пользователя
PRIV_KEY="${HOME}/.ssh/id_ed25519"             # приватный ключ (НЕ .pub)
PUB_KEY_FILE="${PRIV_KEY}.pub"                 # публичный ключ

# --- проверки окружения ---
command -v yc >/dev/null || { echo "yc не найден. Установи и запусти: yc init"; exit 1; }
command -v jq >/dev/null || { echo "jq не найден. Установи: brew install jq (или apt/yum)"; exit 1; }
[[ -f "$PRIV_KEY" ]] || { echo "Нет приватного ключа: $PRIV_KEY"; exit 1; }
[[ -f "$PUB_KEY_FILE" ]] || { echo "Нет публичного ключа: $PUB_KEY_FILE"; exit 1; }

echo "== Получаю ID инстанса =="
INST_JSON="$(yc compute instance get --name "$VM_NAME" --format json 2>/dev/null || true)"
if [[ -z "$INST_JSON" ]]; then
  # Если команда выше не поддерживает --name в твоей версии yc:
  INST_JSON="$(yc compute instance list --format json | jq -c --arg n "$VM_NAME" '.[] | select(.name==$n)')"
fi
[[ -n "$INST_JSON" ]] || { echo "ВМ $VM_NAME не найдена"; exit 1; }
INST_ID="$(jq -r '.id' <<<"$INST_JSON")"
IP="$(jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address' <<<"$INST_JSON")"
echo "ID: $INST_ID  IP: ${IP:-<нет внешнего IP>}"

echo "== Включаю serial-port (на всякий случай) =="
yc compute instance update "$INST_ID" --serial-port-enable >/dev/null || true

echo "== Обновляю метаданные ssh-keys (динамично) =="
TMP_KEYS="$(mktemp)"
echo "${LOGIN}:$(cat "$PUB_KEY_FILE")" > "$TMP_KEYS"
yc compute instance update "$INST_ID" --metadata-from-file "ssh-keys=$TMP_KEYS" >/dev/null
rm -f "$TMP_KEYS"

echo "== Жду применения ключа и доступности порта 22 =="
if [[ -z "${IP:-}" || "$IP" == "null" ]]; then
  IP="$(yc compute instance get "$INST_ID" --format json | jq -r '.network_interfaces[0].primary_v4_address.one_to_one_nat.address')"
fi
for i in {1..30}; do
  if nc -z -w 2 "$IP" 22 2>/dev/null; then echo "SSH порт доступен"; break; fi
  sleep 2
done

echo "== Пробую подключиться ключом (строгий выбор ключа) =="
chmod 600 "$PRIV_KEY"
set +e
ssh -vvv -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -i "$PRIV_KEY" "${LOGIN}@${IP}" 'echo "SSH OK"; uname -a'
RC=$?
set -e

if [[ $RC -ne 0 ]]; then
  echo
  echo "❌ Подключиться не удалось. Диагностика:"
  echo "— Проверяю, что yc действительно записал метаданные 'ssh-keys':"
  yc compute instance get "$INST_ID" --full | sed -n '/metadata:/,/^ *[a-z_]\+:/p' | sed -n '1,30p'
  echo
  echo "— Снимаю последние строки cloud-init (через serial-port):"
  yc compute instance get-serial-port-output "$INST_ID" --lines 200 | tail -n 200 || true
  echo
  echo "Подскажи мне последние 30–50 строк из ssh -vvv (Cursor покажет выше) — скажу, что именно не так."
  exit $RC
fi

echo "✅ Готово: доступ по SSH работает."
