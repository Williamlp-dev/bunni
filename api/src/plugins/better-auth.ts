import { auth } from "@/auth";
import Elysia from "elysia";

export const authMacro = new Elysia({ name: "auth-macro" })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    const headerObj = new Headers()
    for (const [key, value] of Object.entries(headers)) {
      if (value) headerObj.set(key, value)
    }

    const result = await auth.api.getSession({ headers: headerObj })

    return {
      user: result?.user,
      session: result?.session
    }
  })
  .macro({
    auth: {
      resolve({ user }) {
        if (!user) throw new Error("Unauthorized")
        return { user }
      }
    }
  })

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .use(authMacro)
  .mount(auth.handler)

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/auth') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>
} as const