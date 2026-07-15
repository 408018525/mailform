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
            const html = htmlTemplate.replace(
                '{{TURNSTILE_SITE_KEY}}',
                env.TURNSTILE_SITE_KEY
            );

            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html; charset=utf-8'
                }
            });
        }

        if (request.method === 'POST') {
            try {
                const data: any = await request.json();

                // 1. 服务端验证 Turnstile
                const verifyBody = new URLSearchParams();
                verifyBody.append('secret', env.TURNSTILE_SECRET_KEY);
                verifyBody.append(
                    'response',
                    data['cf-turnstile-response'] || ''
                );

                const res = await fetch(
                    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    {
                        method: 'POST',
                        body: verifyBody,
                        headers: {
                            'Content-Type':
                                'application/x-www-form-urlencoded'
                        }
                    }
                );

                const outcome: any = await res.json();

                if (!outcome.success) {
                    return new Response(
                        JSON.stringify({
                            error: '人机验证失败，请重新验证后发送。'
                        }),
                        { status: 400 }
                    );
                }

                // 2. 构建邮件内容
                const subject = `[mailform.flore.top留言消息] ${data.subject}`;

                const body = [
                    `姓名：${data.name || '未填写'}`,
                    `联系方式：${data.contact || '未填写'}`,
                    '',
                    '留言：',
                    data.body
                ].join('\n');

                const rfc822Message = [
                    `From: 网站联系表单 <${env.FROM_EMAIL}>`,
                    `To: ${env.DESTINATION_EMAIL}`,
                    `Subject: ${subject}`,
                    `Content-Type: text/plain; charset=utf-8`,
                    `Content-Transfer-Encoding: 8bit`,
                    ``,
                    body
                ].join('\r\n');

                // 3. 发送邮件
                try {
                    const msg = new EmailMessage(
                        env.FROM_EMAIL,
                        env.DESTINATION_EMAIL,
                        rfc822Message
                    );

                    await env.SEB.send(msg);

                    return new Response(
                        JSON.stringify({
                            message: '消息发送成功！ 我们会在72小时内进行查看'
                        }),
                        {
                            status: 200,
                            headers: {
                                'Content-Type':
                                    'application/json; charset=utf-8'
                            }
                        }
                    );
                } catch (emailErr: any) {
                    return new Response(
                        JSON.stringify({
                            error: '邮件发送失败，请稍后重试。',
                            details: emailErr.message
                        }),
                        {
                            status: 500,
                            headers: {
                                'Content-Type':
                                    'application/json; charset=utf-8'
                            }
                        }
                    );
                }
            } catch (err: any) {
                return new Response(
                    JSON.stringify({
                        error: '服务器内部错误。',
                        details: err.message
                    }),
                    {
                        status: 500,
                        headers: {
                            'Content-Type':
                                'application/json; charset=utf-8'
                        }
                    }
                );
            }
        }

        return new Response('Not Found', {
            status: 404
        });
    }
};
