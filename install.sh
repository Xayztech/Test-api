#!/usr/bin/env bash
set -e

echo "======================================================"
echo "  Machine API - VPS Installer (by XYCoolcraft)"
echo "======================================================"
echo ""

if ! command -v python3 &> /dev/null; then
  echo "[!] python3 tidak ditemukan, menginstal..."
  sudo apt-get update -y && sudo apt-get install -y python3
fi

read -p "Masukkan domain Anda (contoh: api.domainku.com, kosongkan jika pakai IP saja): " DOMAIN
read -p "Masukkan port aplikasi [default: 3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}
read -p "Aktifkan SSL otomatis via Certbot? (y/n) [n]: " ENABLE_SSL
ENABLE_SSL=${ENABLE_SSL:-n}

echo ""
echo "[*] Menjalankan setup lengkap via Python..."
python3 "$(dirname "$0")/scripts/vps_setup.py" \
  --domain "$DOMAIN" \
  --port "$APP_PORT" \
  --ssl "$ENABLE_SSL" \
  --project-dir "$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "======================================================"
echo "  Selesai! Machine API sudah berjalan."
echo "  Cek status: pm2 status"
echo "  Lihat log : pm2 logs machine-api"
echo "======================================================"
