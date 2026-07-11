#!/bin/bash
# detect-wsl-ip.sh
# Detecta la IP de WSL y configura las variables de entorno para E2E con móvil físico
set -e

WSL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$WSL_IP" ]; then
  echo "❌ No se pudo detectar la IP de WSL"
  exit 1
fi

echo "✅ WSL IP detectada: $WSL_IP"
echo ""
echo "Para construir el APK con esta IP, ejecuta:"
echo "  export EXPO_PUBLIC_API_URL=http://${WSL_IP}:8000/api"
echo "  npx detox build -c android.att.debug"
echo ""
echo "Para correr los tests:"
echo "  npx detox test -c android.att.debug"
echo ""
echo "O en un solo paso:"
echo "  EXPO_PUBLIC_API_URL=http://${WSL_IP}:8000/api npx detox build -c android.att.debug && npx detox test -c android.att.debug"
