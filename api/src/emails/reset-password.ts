type ResetPasswordEmailParams = {
  userEmail: string
  resetLink: string
}

export function buildResetPasswordHtml({ userEmail, resetLink }: ResetPasswordEmailParams): string {
  return `<!DOCTYPE html>
<html lang="pt-BR" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
  </style>
</head>
<body style="margin:0;padding:0;font-family:'Outfit',system-ui,-apple-system,sans-serif;background-color:#f7f5f8;color:#3b3340;">
  <div style="max-width:560px;margin:0 auto;padding:40px 16px;">

    <!-- Logo + Brand -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:900;letter-spacing:-0.05em;color:#EC5556;text-transform:uppercase;">BUNI</span>
    </div>

    <!-- Card -->
    <div style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eae7ec;">

      <!-- Accent bar -->
      <div style="height:4px;background-color:#EC5556;"></div>

      <!-- Content -->
      <div style="padding:40px 32px;">

        <h1 style="font-size:22px;font-weight:700;letter-spacing:-0.025em;color:#1a1520;margin-bottom:8px;">
          Redefinição de senha
        </h1>

        <p style="font-size:14px;font-weight:400;line-height:1.7;color:#7a7280;margin-bottom:24px;">
          Recebemos uma solicitação para redefinir a senha da conta associada a
          <strong style="color:#1a1520;font-weight:600;">${userEmail}</strong>.
        </p>

        <p style="font-size:14px;font-weight:400;line-height:1.7;color:#7a7280;margin-bottom:32px;">
          Clique no botão abaixo para criar uma nova senha. Este link expira em 24 horas.
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:32px;">
          <a href="${resetLink}"
             style="display:inline-block;font-family:'Outfit',system-ui,sans-serif;font-size:14px;font-weight:600;padding:14px 40px;background-color:#EC5556;color:#ffffff;text-decoration:none;letter-spacing:0.02em;text-transform:uppercase;">
            Redefinir senha
          </a>
        </div>

        <!-- Divider -->
        <div style="height:1px;background-color:#eae7ec;margin:0 0 24px 0;"></div>

        <!-- Security notice -->
        <div style="padding:16px;background-color:#faf9fb;border-left:3px solid #EC5556;border-radius:0 8px 8px 0;">
          <p style="font-size:13px;font-weight:500;color:#1a1520;margin-bottom:4px;">
            Não solicitou essa alteração?
          </p>
          <p style="font-size:12px;font-weight:400;line-height:1.6;color:#7a7280;">
            Ignore este email. Sua conta permanece segura e nenhuma alteração será feita.
          </p>
        </div>

        <!-- Fallback link -->
        <p style="font-size:11px;font-weight:400;line-height:1.6;color:#a09ba6;margin-top:24px;">
          Problemas com o botão? Copie e cole o link abaixo no seu navegador:<br />
          <a href="${resetLink}" style="color:#EC5556;word-break:break-all;text-decoration:none;">${resetLink}</a>
        </p>

      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 0 0;">
      <p style="font-size:11px;font-weight:400;color:#a09ba6;line-height:1.6;">
        © 2026 Buni · Todos os direitos reservados
      </p>
    </div>

  </div>
</body>
</html>`
}
