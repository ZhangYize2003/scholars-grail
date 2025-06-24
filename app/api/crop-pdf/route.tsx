import { NextRequest, NextResponse } from "next/server";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { bucket, uid, subject, subfolder } = await request.json();

    const payload = {
      bucket,
      uid,
      subject,
      subfolder,
    };
    console.log("Payload:", payload);

    const command = new InvokeCommand({
      FunctionName: "scholar-grail-cropper",
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambdaClient.send(command);

    let lambdaPayload = null;
    if (response.Payload) {
      const uint8Array = new Uint8Array(response.Payload);
      const text = new TextDecoder().decode(uint8Array);
      lambdaPayload = JSON.parse(text);
    }

    return NextResponse.json({ message: "Lambda invoked", result: lambdaPayload });
  } catch (error: any) {
    console.error("Lambda invocation error:", error);
    return NextResponse.json({ error: "Lambda invocation failed", details: error.message }, { status: 500 });
  }
}
