#!/bin/bash

echo "===================================================="
echo "                     Mailform                       "
echo "===================================================="

# 0. Preparación
if [ ! -d "node_modules" ]; then
    echo -e "\n0. Instalando dependencias..."
    npm install --silent
fi

# Función para preguntar si se mantiene un valor
ask_keep() {
    local var_name=$1
    local current_val=$2
    if [[ -n "$current_val" && "$current_val" != "1x00000000000000000000AA" && "$current_val" != "cambiame@ejemplo.com" ]]; then
        echo -e "\nHe detectado $var_name: $current_val"
        read -p "¿Quieres mantenerlo? (S/n): " keep
        if [[ "$keep" == "s" || "$keep" == "S" || -z "$keep" ]]; then
            return 0 # Mantener
        fi
    fi
    return 1 # Cambiar
}

# 1. Leer valores actuales
curr_site_key=$(grep "TURNSTILE_SITE_KEY =" wrangler.toml | cut -d'"' -f2)
curr_dest_email=$(grep "DESTINATION_EMAIL =" wrangler.toml | cut -d'"' -f2)
curr_from_email=$(grep "FROM_EMAIL =" wrangler.toml | cut -d'"' -f2)

# 2. Lógica de preguntas
if ! ask_keep "Site Key" "$curr_site_key"; then
    read -p "Introduce tu TURNSTILE_SITE_KEY: " site_key
else
    site_key=$curr_site_key
fi

if ! ask_keep "Email de Destino" "$curr_dest_email"; then
    read -p "Introduce el email donde recibirás mensajes: " dest_email
else
    dest_email=$curr_dest_email
fi

if ! ask_keep "Email Remitente" "$curr_from_email"; then
    read -p "Introduce el dominio (ej. midominio.com): " domain
    read -p "Introduce el nombre del buzón (ej. contacto): " mailbox
    from_email="${mailbox}@${domain}"
else
    from_email=$curr_from_email
fi

# 3. Guardar cambios
sed -i.bak "s/TURNSTILE_SITE_KEY = .*/TURNSTILE_SITE_KEY = \"$site_key\"/" wrangler.toml
sed -i.bak "s/DESTINATION_EMAIL = .*/DESTINATION_EMAIL = \"$dest_email\"/" wrangler.toml
sed -i.bak "s/FROM_EMAIL = .*/FROM_EMAIL = \"$from_email\"/" wrangler.toml
rm wrangler.toml.bak

# 4. Secretos
echo -e "\n¿Necesitas actualizar la TURNSTILE_SECRET_KEY en Cloudflare? (s/N)"
read -r update_secret
if [[ "$update_secret" == "s" || "$update_secret" == "S" ]]; then
    echo "Selecciona tu cuenta con las flechas y pega la clave secreta:"
    npx wrangler secret put TURNSTILE_SECRET_KEY
fi

# 5. Despliegue
echo -e "\n¿Deseas desplegar el Worker ahora? (s/N)"
read -r deploy_now
if [[ "$deploy_now" == "s" || "$deploy_now" == "S" ]]; then
    npx wrangler deploy
fi

echo -e "\nConfiguración finalizada."
