import { PrismaClient } from "@prisma/client"
import { conceptArticles } from "../src/constants/articles/concept"
import { checklistArticles } from "../src/constants/articles/checklist"
import { subjectArticles } from "../src/constants/articles/subject"
import { guideArticles } from "../src/constants/articles/guide"
import { faqArticles } from "../src/constants/articles/faq"
import { ACHIEVEMENTS } from "../src/constants/achievements"

const prisma = new PrismaClient()

/** 写入文章种子数据 */
async function seedArticles() {
  const allArticles = [
    ...conceptArticles,
    ...checklistArticles,
    ...subjectArticles,
    ...guideArticles,
    ...faqArticles,
  ]

  console.log(`开始写入 ${allArticles.length} 篇文章...`)

  for (const article of allArticles) {
    await prisma.article.upsert({
      where: { id: article.id },
      update: {
        category: article.category,
        title: article.title,
        content: article.content,
        summary: article.summary,
        tags: article.tags,
        sortOrder: article.sortOrder,
      },
      create: {
        id: article.id,
        category: article.category,
        title: article.title,
        content: article.content,
        summary: article.summary,
        tags: article.tags,
        sortOrder: article.sortOrder,
      },
    })
  }

  console.log(`成功写入 ${allArticles.length} 篇文章`)
}

/** 写入成就种子数据 */
async function seedAchievements() {
  console.log(`开始写入 ${ACHIEVEMENTS.length} 个成就定义...`)

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: {
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        condition: JSON.stringify(achievement.condition),
      },
      create: {
        code: achievement.code,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        condition: JSON.stringify(achievement.condition),
      },
    })
  }

  console.log(`成功写入 ${ACHIEVEMENTS.length} 个成就定义`)
}

async function main() {
  await seedArticles()
  await seedAchievements()
}

main()
  .catch((e) => {
    console.error("种子数据写入失败:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
