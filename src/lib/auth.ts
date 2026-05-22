import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"

/** 是否为开发环境 */
const isDev = process.env.NODE_ENV === "development"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "phone",
      credentials: {
        phone: { label: "手机号", type: "text" },
        code: { label: "验证码", type: "text" },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string
        const code = credentials?.code as string
        if (!phone || !code) return null

        // 开发模式：任意6位数字验证码均可通过
        if (isDev && /^\d{6}$/.test(code)) {
          const user = await db.user.upsert({
            where: { phone },
            create: { phone },
            update: {},
          })
          return { id: user.id, name: user.nickname ?? user.phone }
        }

        // 生产模式：验证短信验证码
        const smsCode = await db.smsCode.findFirst({
          where: {
            phone,
            code,
            used: false,
            expiresAt: { gt: new Date() },
          },
        })
        if (!smsCode) return null

        // 标记已使用
        await db.smsCode.update({
          where: { id: smsCode.id },
          data: { used: true },
        })

        // 查找或创建用户
        const user = await db.user.upsert({
          where: { phone },
          create: { phone },
          update: {},
        })

        return { id: user.id, name: user.nickname ?? user.phone }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
})
