import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Quiz, QuizAttempt } from "@/models/Quiz";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { quizId, answers, timeTaken } = await req.json();
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const score = quiz.questions.reduce((acc: number, q: any, i: number) => {
    return acc + (answers[i] === q.correctIndex ? 1 : 0);
  }, 0);

  const attempt = await QuizAttempt.create({
    userId: (session.user as any).id,
    quizId,
    answers,
    score,
    timeTaken,
  });
  return NextResponse.json({ score, total: quiz.questions.length, attemptId: attempt._id });
}
