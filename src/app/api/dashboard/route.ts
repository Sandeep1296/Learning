import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { QuizAttempt } from "@/models/Quiz";
import { AnswerSubmission } from "@/models/AnswerWriting";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;

  const [quizAttempts, answerSubmissions] = await Promise.all([
    QuizAttempt.find({ userId }).populate("quizId").sort({ completedAt: -1 }).limit(30),
    AnswerSubmission.find({ userId }).sort({ submittedAt: -1 }).limit(30),
  ]);

  const totalQuizzes = quizAttempts.length;
  const avgScore = totalQuizzes
    ? Math.round(
        quizAttempts.reduce((acc, a) => {
          const total = (a.quizId as any)?.questions?.length || 1;
          return acc + (a.score / total) * 100;
        }, 0) / totalQuizzes
      )
    : 0;

  return NextResponse.json({
    totalQuizzes,
    avgScore,
    totalAnswers: answerSubmissions.length,
    recentQuizzes: quizAttempts.slice(0, 5),
    recentAnswers: answerSubmissions.slice(0, 5),
  });
}
