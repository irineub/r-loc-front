#!/bin/bash
set -e

echo "🚀 Deploy FRONTEND forçado começando..."

# Frontend
echo "🔄 Atualizando frontend (r-loc-front)..."
git pull origin main

echo "📦 Instalando dependências frontend..."
npm install

echo "🏗️ Buildando Angular em produção..."
npm run build -- --configuration production

echo "🗂️ Copiando build para /var/www/html (somente conteúdo do browser)..."
rm -rf /var/www/html/*
cp -r dist/r-loc-front/browser/* /var/www/html/
chown -R www-data:www-data /var/www/html/
chmod -R 755 /var/www/html/

# Nginx
echo "🔄 Reiniciando nginx..."
systemctl reload nginx

echo "✅ Deploy FRONTEND finalizado!"
