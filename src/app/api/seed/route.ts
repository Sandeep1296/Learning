import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Quiz } from "@/models/Quiz";
import { AnswerPrompt } from "@/models/AnswerWriting";
import { Article } from "@/models/Article";
import { Flashcard, StudyNote, PYQ } from "@/models/Study";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Quiz.deleteMany({}),
      AnswerPrompt.deleteMany({}),
      Article.deleteMany({}),
      Flashcard.deleteMany({}),
      StudyNote.deleteMany({}),
      PYQ.deleteMany({}),
    ]);

    // 2. Create Users
    const hashedAdminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@learning.com",
      password: hashedAdminPassword,
      role: "admin",
    });

    const hashedStudentPassword = await bcrypt.hash("student123", 10);
    const studentUser = await User.create({
      name: "Sandeep Reddy",
      email: "student@learning.com",
      password: hashedStudentPassword,
      role: "student",
    });

    const todayStr = new Date().toISOString().split("T")[0];

    // 3. Create Daily Quizzes
    await Quiz.create([
      {
        title: "Daily Prelims Test: History & Polity",
        date: todayStr,
        isPublished: true,
        createdBy: adminUser._id,
        questions: [
          {
            question: "Which Act introduced the system of dyarchy in the provinces during British Rule?",
            options: [
              "Indian Councils Act, 1909",
              "Government of India Act, 1919",
              "Government of India Act, 1935",
              "Indian Independence Act, 1947",
            ],
            correctIndex: 1,
            explanation: "The Government of India Act, 1919 introduced dyarchy in the provinces, dividing provincial subjects into Transferred and Reserved.",
            tags: ["constitution", "modern-history"],
          },
          {
            question: "Who among the following presided over the Karachi Session of the Indian National Congress in 1931?",
            options: [
              "Sardar Vallabhbhai Patel",
              "Jawaharlal Nehru",
              "Subhas Chandra Bose",
              "Mahatma Gandhi",
            ],
            correctIndex: 0,
            explanation: "Sardar Vallabhbhai Patel presided over the Karachi Session of the Congress in 1931, which adopted resolutions on Fundamental Rights and the National Economic Programme.",
            tags: ["modern-history"],
          },
          {
            question: "Under the Indian Constitution, the power to dissolve the Lok Sabha is vested in:",
            options: [
              "The Prime Minister",
              "The President on the advice of the Prime Minister",
              "The Speaker of Lok Sabha",
              "The Chief Justice of India",
            ],
            correctIndex: 1,
            explanation: "According to Article 85 of the Indian Constitution, the President has the power to dissolve the Lok Sabha on the advice of the Council of Ministers headed by the Prime Minister.",
            tags: ["constitution", "polity"],
          },
        ],
      },
      {
        title: "Mock Prelims: Economy & Environment",
        date: "2026-06-25",
        isPublished: true,
        createdBy: adminUser._id,
        questions: [
          {
            question: "Which of the following describes the 'Carbon Border Adjustment Mechanism' sometimes seen in the news?",
            options: [
              "A global tax levied by the UN on carbon emitters",
              "The European Union's proposed tariff on carbon-intensive imports",
              "An offset scheme under the Paris Agreement",
              "A subsidy program for green energy projects",
            ],
            correctIndex: 1,
            explanation: "The Carbon Border Adjustment Mechanism (CBAM) is the European Union's landmark tool to put a fair price on the carbon emitted during the production of carbon-intensive goods entering the EU.",
            tags: ["economy", "environment"],
          },
        ],
      },
    ]);

    // 4. Create Daily GS Mains prompts
    await AnswerPrompt.create([
      {
        question: "Discuss the major challenges in Indian federalism with special reference to the financial relations between Union and States in recent years.",
        date: todayStr,
        paper: "GS2",
        tags: ["constitution", "governance"],
        wordLimit: 250,
        idealPoints: [
          "Introduction to financial federalism (Article 280, Finance Commission, GST).",
          "Challenges: Cess and surcharges skewing divisible pool, delays in GST compensation.",
          "Over-dependence of States on central transfers (vertical fiscal imbalance).",
          "Impact of Terms of Reference (ToR) of recent Finance Commissions.",
          "Way Forward: Rationalizing Centrally Sponsored Schemes, strengthening Inter-State Council.",
        ],
        isPublished: true,
        createdBy: adminUser._id,
      },
    ]);

    // 5. Create Daily Articles/Editorials
    await Article.create([
      {
        title: "Navigating the New Trade Order: Challenges for Indian Exports",
        content: `Global trade is undergoing structural changes characterized by friend-shoring, carbon tariffs, and supply chain disruptions. India needs to reposition its trade policies to boost export competitiveness. 

Key challenges include high logistics costs, stringent environmental regulations in the European Union (like the Carbon Border Adjustment Mechanism), and rising protectionism. 

To overcome these, India must expand its Free Trade Agreement (FTA) network, invest in export-focused infrastructure, and encourage export diversification into high-value technology and green products.`,
        source: "The Hindu",
        sourceUrl: "https://www.thehindu.com",
        type: "editorial",
        tags: ["economic-development", "international-relations"],
        summary: "An analysis of emerging global trade hurdles and strategic solutions for India's export growth.",
        createdBy: adminUser._id,
      },
      {
        title: "Protecting the Western Ghats: A Balance of Conservation and Livelihoods",
        content: `The Kasturirangan and Madhav Gadgil committee reports on the Western Ghats continue to trigger debates. The Western Ghats, a global biodiversity hotspot, requires immediate ecological safeguards against deforestation, mining, and climate-induced landslides.

However, local populations express anxieties over potential restrictions on agricultural practices and developmental activities. 

An inclusive conservation model involving local communities (Gram Sabhas) and promoting sustainable eco-tourism is essential to resolve the deadlock.`,
        source: "Indian Express",
        sourceUrl: "https://indianexpress.com",
        type: "news",
        tags: ["environment", "biodiversity"],
        summary: "Examining the ecological sensitivity of the Western Ghats and the friction between conservation policies and local community livelihood.",
        createdBy: adminUser._id,
      },
    ]);

    // 6. Create Flashcards
    await Flashcard.create([
      {
        front: "What is Article 356 of the Indian Constitution?",
        back: "Article 356 provides for the imposition of President's Rule in a State if its constitutional machinery fails.",
        tags: ["constitution", "polity"],
        createdBy: adminUser._id,
      },
      {
        front: "Name the three pillars of the Basel III norms for banking supervision.",
        back: "1. Minimum Capital Requirements\n2. Supervisory Review Process\n3. Market Discipline",
        tags: ["economy", "economic-development"],
        createdBy: adminUser._id,
      },
      {
        front: "What is the primary target of the Montreal Protocol?",
        back: "To protect the ozone layer by phasing out the production of numerous substances that are responsible for ozone depletion (e.g., CFCs).",
        tags: ["environment", "biodiversity"],
        createdBy: adminUser._id,
      },
    ]);

    // 7. Create Study Notes
    await StudyNote.create([
      {
        title: "Constitutional Bodies vs. Statutory Bodies",
        content: `### Constitutional Bodies
Bodies mentioned directly in the Constitution of India. Any change requires a constitutional amendment under Article 368.
*   **Examples**: Election Commission of India (Art 324), Finance Commission (Art 280), UPSC (Art 315-323), CAG (Art 148).

### Statutory Bodies
Created by an Act of Parliament (legislative statutes). They are not mentioned in the Constitution.
*   **Examples**: National Human Rights Commission (NHRC), SEBI, NGT, UIDAI.`,
        tags: ["constitution", "polity"],
        paper: "GS2",
        createdBy: adminUser._id,
      },
      {
        title: "Monetary Policy Committee (MPC) Composition & Mandate",
        content: `The MPC is responsible for setting the benchmark policy interest rate (Repo Rate) to contain inflation within the target level (4% +/- 2%).

*   **Structure**: 6 members (3 from RBI, including the Governor as Ex-officio Chairperson, and 3 appointed by the Government of India).
*   **Voting**: Each member has one vote. In case of a tie, the Governor has a casting vote.
*   **Meeting Frequency**: Must meet at least four times a year.`,
        tags: ["economy", "economic-development"],
        paper: "GS3",
        createdBy: adminUser._id,
      },
    ]);

    // 8. Create Previous Year Questions (PYQs)
    await PYQ.create([
      {
        question: "With reference to the Indian economy, consider the following statements:\n1. Commercial Paper is a short-term unsecured promissory note.\n2. Certificate of Deposit is a long-term instrument issued by the RBI.\n3. Call Money is a short-term finance used for interbank transactions.\nWhich of the statements given above is/are correct?",
        year: 2020,
        paper: "Prelims GS1",
        type: "prelims",
        options: ["1 and 2 only", "4 only", "1 and 3 only", "1, 2 and 3"],
        correctIndex: 2,
        explanation: "Statement 1 is correct: Commercial paper is a short-term unsecured promissory note issued by corporations. Statement 2 is incorrect: Certificates of Deposit are money market instruments issued by scheduled commercial banks and select financial institutions, not long-term. Statement 3 is correct: Call money is short-term finance used for interbank transactions.",
        tags: ["economy"],
        createdBy: adminUser._id,
      },
      {
        question: "Evaluate the role of the Finance Commission of India in strengthening the fiscal capacity of local governments. (Answer in 150 words)",
        year: 2021,
        paper: "GS2",
        type: "mains",
        answer: "The Finance Commission plays a critical role under Article 280(3)(bb) and (c) to recommend measures to augment the Consolidated Fund of a State to supplement the resources of Panchayats and Municipalities. Key contributions include recommending untied grants, performance-based grants, and institutional reforms for property tax administration at the local body level.",
        explanation: "Model Mains response highlights: constitutional mandate, Finance Commission local body allocations, issues of functional devolution, and accountability measures.",
        tags: ["constitution", "governance"],
        createdBy: adminUser._id,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: { email: "admin@learning.com", password: "admin123" },
        student: { email: "student@learning.com", password: "student123" },
      },
      details: {
        quizzesCreated: 2,
        promptsCreated: 1,
        articlesCreated: 2,
        flashcardsCreated: 3,
        notesCreated: 2,
        pyqsCreated: 2,
      },
    });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
