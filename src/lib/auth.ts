import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"

/** 是否为开发环境 */
const isDev = process.env.NODE_ENV === "development"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // 手机号 + 验证码登录
    CredentialsProvider({
      id: "phone",
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
          return { id: user.id, name: user.nickname ?? user.phone ?? "用户" }
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

        await db.smsCode.update({
          where: { id: smsCode.id },
          data: { used: true },
        })

        const user = await db.user.upsert({
          where: { phone },
          create: { phone },
          update: {},
        })

        return { id: user.id, name: user.nickname ?? user.phone ?? "用户" }
      },
    }),
    // 邮箱 + 密码登录
    CredentialsProvider({
      id: "email",
      name: "email",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        if (!email || !password) return null

        const user = await db.user.findUnique({
          where: { email },
        })
        if (!user || !user.passwordHash) return null

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) return null

        return { id: user.id, name: user.nickname ?? email.split("@")[0] }
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
