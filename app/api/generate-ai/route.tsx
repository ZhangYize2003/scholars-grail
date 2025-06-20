import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

type RequestBody = {
  body: string;
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const data: RequestBody = await req.json();
    const prompt = data.body;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = await response.text();
    console.log(output);
    let cleanedOutput = output.trim();
    if (cleanedOutput.startsWith("```json")) {
      cleanedOutput = cleanedOutput.replace(/```json\s*/, '').replace(/```$/, '').trim();
    } else {
        return NextResponse.json(
          { error: "Failed to generate content" },
          { status: 500 }
        );
    }

    const parsedOutput = JSON.parse(cleanedOutput);
    return NextResponse.json(parsedOutput);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
