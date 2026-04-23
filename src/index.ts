import htmlTemplate from './template.html';
import { EmailMessage } from "cloudflare:email";

export interface Env {
    TURNSTILE_SITE_KEY: string;
    TURNSTILE_SECRET_KEY: string;
    DESTINATION_EMAIL: string;
    FROM_EMAIL: string;
    SEB: any; 
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method === 'GET') {
            const html = htmlTemplate.replace('{{TURNSTILE_SITE_KEY}}', env.TURNSTILE_SITE_KEY);
            return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        if (request.method === 'POST') {
            try {
                const data: any = await request.json();
                
                // 1. Validar Turnstile
                const verifyBody = new URLSearchParams();
                verifyBody.append('secret', env.TURNSTILE_SECRET_KEY);
                verifyBody.append('response', data['cf-turnstile-response'] || '');

                const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    body: verifyBody,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });
                const outcome: any = await res.json();
                if (!outcome.success) return new Response(JSON.stringify({ error: 'Captcha inválido.' }), { status: 400 });

                // 2. Construir el mensaje RFC822 (formato nativo)
                const subject = `[Web] ${data.subject}`;
                const body = `Nombre: ${data.name || 'N/A'}\n\nMensaje:\n${data.body}`;
                
                // Construimos las cabeceras manualmente para evitar dependencias extra
                const rfc822Message = [
                    `From: Contacto Web <${env.FROM_EMAIL}>`,
                    `To: ${env.DESTINATION_EMAIL}`,
                    `Subject: ${subject}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `Content-Transfer-Encoding: 7bit`,
                    ``,
                    body
                ].join('\r\n');

                // 3. Envío usando la clase EmailMessage
                try {
                    const msg = new EmailMessage(
                        env.FROM_EMAIL,
                        env.DESTINATION_EMAIL,
                        rfc822Message
                    );
                    await env.SEB.send(msg);
                    return new Response(JSON.stringify({ message: '¡Mensaje enviado con éxito!' }), { status: 200 });
                } catch (emailErr: any) {
                    return new Response(JSON.stringify({ 
                        error: 'Error en el servidor de correo.',
                        details: emailErr.message 
                    }), { status: 500 });
                }

            } catch (err: any) {
                return new Response(JSON.stringify({ error: 'Error interno.', details: err.message }), { status: 500 });
            }
        }
        return new Response('Not Found', { status: 404 });
    }
};
