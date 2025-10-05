#!/usr/bin/env bash
set -eux

VPN_USER="dali"           # имя нового VPN-пользователя
VPN_PASS="MyVPNpass123"   # задай пароль
VPN_HOST="51.250.90.228"  # IP сервера

echo "== Добавляю пользователя в OpenVPN Access Server =="
sudo sacli --user "$VPN_USER" --new_pass "$VPN_PASS" SetLocalPassword
sudo sacli --user "$VPN_USER" --key "type" --value "user_connect" UserPropPut
sudo sacli --user "$VPN_USER" --key "conn_group" --value "Default" UserPropPut
sudo sacli --user "$VPN_USER" --key "auto_login" --value "true" UserPropPut
sudo sacli start

echo "== Проверяю, что профиль создан =="
sudo sacli --user "$VPN_USER" GetUserLoginProfile > "/tmp/${VPN_USER}.json"
PROFILE_URL=$(grep -o 'https://.*autologin_profile' "/tmp/${VPN_USER}.json" | head -1)
echo "Профиль доступен по ссылке:"
echo "$PROFILE_URL"

echo "== Скачиваю .ovpn файл =="
curl -k -u "${VPN_USER}:${VPN_PASS}" -o "${VPN_USER}.ovpn" "https://${VPN_HOST}:943/rest/GetAutologin?user=${VPN_USER}"
ls -lh "${VPN_USER}.ovpn"

echo
echo "✅ Готово! Файл ${VPN_USER}.ovpn сохранён в текущей директории."
echo "Используй его для подключения к VPN-клиенту."
