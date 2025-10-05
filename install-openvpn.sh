#!/usr/bin/env bash
set -eux

# Обновляем пакеты
sudo apt update -y
sudo apt install -y ca-certificates wget net-tools gnupg

# Добавляем репозиторий OpenVPN AS
sudo wget -qO - https://as-repository.openvpn.net/as-repo-public.gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/openvpn-as.gpg

echo "deb [signed-by=/usr/share/keyrings/openvpn-as.gpg] https://as-repository.openvpn.net/as/debian jammy main" | \
  sudo tee /etc/apt/sources.list.d/openvpn-as.list

# Устанавливаем OpenVPN Access Server
sudo apt update -y
sudo DEBIAN_FRONTEND=noninteractive apt install -y openvpn-as

# Создаем временный пароль для входа в админку
echo "openvpn:OpenVPN-Temp-Admin-123" | sudo chpasswd || true

# Проверяем, что сервер запущен
sudo systemctl status openvpnas --no-pager

# Узнаем IP и выводим адрес админ-панели
PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
echo
echo "✅ Установка завершена!"
echo "Теперь зайди в браузер:"
echo "👉 https://${PUBLIC_IP}:943/admin  (для админки)"
echo "👉 https://${PUBLIC_IP}:943/  (для клиента)"
echo "Логин: openvpn"
echo "Пароль: OpenVPN-Temp-Admin-123"
