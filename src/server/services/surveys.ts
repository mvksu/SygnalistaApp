import { db } from "@/db"
import { surveys, surveyOptions, surveyQuestions } from "@/db/schema/surveys"
import { eq, and } from "drizzle-orm"

export async function createSurvey(orgId: string, input: {
  title: string
  description?: string
  questions: Array<{ text: string; options: string[] }>
}) {
  const [s] = await db.insert(surveys).values({ orgId, title: input.title, description: input.description }).returning()
  if (!s) throw new Error("Failed to create survey")

  for (let qi = 0; qi < input.questions.length; qi++) {
    const q = input.questions[qi]
    const [sq] = await db.insert(surveyQuestions).values({ surveyId: s.id, idx: qi, question: q.text }).returning()
    if (!sq) continue
    for (let oi = 0; oi < q.options.length; oi++) {
      const label = q.options[oi]
      await db.insert(surveyOptions).values({ questionId: sq.id, idx: oi, label })
    }
  }

  return s
}

export async function listSurveys(orgId: string) {
  return db.query.surveys.findMany({ where: eq(surveys.orgId, orgId), orderBy: (t, { desc }) => [desc(t.createdAt)] })
}

export async function getSurveyWithQuestions(surveyId: string) {
  const s = await db.query.surveys.findFirst({ where: eq(surveys.id, surveyId) })
  if (!s) return null
  const questions = await db.query.surveyQuestions.findMany({ where: eq(surveyQuestions.surveyId, surveyId), orderBy: (t, { asc }) => [asc(t.idx)] })
  const byQ: Record<string, Awaited<ReturnType<typeof db.query.surveyOptions.findMany>>> = {}
  for (const q of questions) {
    byQ[q.id] = await db.query.surveyOptions.findMany({ where: eq(surveyOptions.questionId, q.id), orderBy: (t, { asc }) => [asc(t.idx)] })
  }
  return { survey: s, questions: questions.map(q => ({ ...q, options: byQ[q.id] || [] })) }
}

export async function submitSurveyAnswers(surveyId: string, answers: { questionId: string; optionId: string }[]) {
  for (const a of answers) {
    await db.update(surveyOptions).set({ count: surveyOptions.count.plus(1) }).where(and(eq(surveyOptions.id, a.optionId), eq(surveyOptions.questionId, a.questionId)))
  }
}


