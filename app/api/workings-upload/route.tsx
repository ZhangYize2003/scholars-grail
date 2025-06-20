import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommandOutput,
} from "@aws-sdk/client-textract";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { Buffer } from "buffer";

const region = process.env.NEXT_PUBLIC_AWS_S3_REGION!;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!;
const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

const s3Client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const textractClient = new TextractClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

// Send Request and wait for JobID
async function startAsyncTextDetection(key: string): Promise<string> {
  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucketName, Name: key } },
  });

  const response = await textractClient.send(command);
  if (!response.JobId) throw new Error("Textract failed to return JobId");
  return response.JobId;
}

// Wait for response back from textract
async function getAsyncTextDetectionResult(jobId: string): Promise<string> {
  let nextToken: string | undefined = undefined;
  let finished = false;
  const lines: string[] = [];

  while (!finished) {
    const command = new GetDocumentTextDetectionCommand({
      JobId: jobId,
      NextToken: nextToken,
    });

    const response: GetDocumentTextDetectionCommandOutput = await textractClient.send(command);

    if (response.JobStatus === "SUCCEEDED") {
      const blocks = response.Blocks ?? [];
      for (const block of blocks) {
        if (block.BlockType === "LINE" && block.Text) {
          lines.push(block.Text);
        }
      }

      if (response.NextToken) {
        nextToken = response.NextToken;
      } else {
        finished = true;
      }
    } else if (response.JobStatus === "FAILED") {
      throw new Error("Textract job failed");
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  return lines.join("\n");
}

// Upload to S3
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uid = formData.get("uid");
    const repository = formData.get("repository");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided or file is not a Blob" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `usersData/${uid}/${repository}/${Date.now()}-${file.name}`;

    const params = {
      Bucket: bucketName,
      Key: url,
      Body: buffer,
      ContentType: "application/pdf",
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

// Textract the file
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    // Textract Async Job
    console.log(`Starting Textract job for: ${key}`);
    const jobId = await startAsyncTextDetection(key);
    console.log(`JobID: ${jobId}`);

    const text = await getAsyncTextDetectionResult(jobId);

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("Textract async error:", error);
    return NextResponse.json({ error: "Textract extraction failed" }, { status: 500 });
  }
}
