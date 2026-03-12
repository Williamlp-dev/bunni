import { betterAuth } from "better-auth"
import { Resend } from "resend"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./database/client"
import { openAPI, bearer, username } from "better-auth/plugins"
import { buildResetPasswordHtml } from "./emails/reset-password"
import { env } from "@/env"

const resend = new Resend(process.env.RESEND)

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN,
  plugins: [
    openAPI(),
    bearer(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 20,
      usernameValidator: (usernameValue) => {
        return /^[a-z0-9_]+$/.test(usernameValue)
      },

      validationOrder: {
        username: "post-normalization"
      }
    })
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,

  }),
  advanced: {
    database: {
      generateId: false,
    }
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    password: {
      hash: (password: string) => Bun.password.hash(password),
      verify: ({ password, hash }) => Bun.password.verify(password, hash)
    },
    sendResetPassword: async ({ user, url }) => {
      console.log("🔗 Reset Password URL:", url)
      try {
        const { error } = await resend.emails.send({
          from: "Buni <onboarding@resend.dev>",
          to: user.email,
          subject: "Redefinição de Senha",
          html: buildResetPasswordHtml({ userEmail: user.email, resetLink: url })
        })
        if (error) console.error("❌ Erro ao enviar email:", error)
      } catch (err) {
        console.error("❌ Erro no Resend:", err)
      }
    }
  },

})