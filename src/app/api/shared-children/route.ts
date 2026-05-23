import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * GET /api/shared-children
 * 获取当前用户作为 viewer 被邀请访问的孩子列表
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  // 查找当前用户作为被邀请人且已接受的邀请
  const invitations = await db.invitation.findMany({
    where: {
      targetId: session.user.id,
      status: "accepted",
      role: "viewer",
    },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          children: {
            select: {
              id: true,
              name: true,
              birthday: true,
              gender: true,
            },
          },
        },
      },
    },
  })

  // 将邀请人的孩子列表扁平化，并标记为共享
  const sharedChildren = invitations.flatMap((inv) =>
    inv.user.children.map((child) => ({
      ...child,
      isShared: true,
      sharedBy: {
        id: inv.user.id,
        nickname: inv.user.nickname,
      },
    }))
  )

  return NextResponse.json({ success: true, data: sharedChildren })
}
