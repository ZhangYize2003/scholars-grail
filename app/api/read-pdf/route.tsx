import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommandOutput,
} from "@aws-sdk/client-textract";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

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

// Helper: start async text detection job for a single PDF file in S3
async function startAsyncTextDetection(key: string): Promise<string> {
  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucketName, Name: key } },
  });

  const response = await textractClient.send(command);
  if (!response.JobId) throw new Error("Failed to get Textract JobId");
  return response.JobId;
}

// Helper: poll job status and get full text when done
async function getAsyncTextDetectionResult(
  jobId: string
): Promise<string> {
  let nextToken: string | undefined = undefined;
  let finished = false;
  const lines: string[] = [];

  while (!finished) {
    const command = new GetDocumentTextDetectionCommand({
      JobId: jobId,
      NextToken: nextToken,
    });

    const response: GetDocumentTextDetectionCommandOutput =
      await textractClient.send(command);

    if (response.JobStatus === "SUCCEEDED") {
      const blocks = response.Blocks ?? [];
      for (const block of blocks) {
        if (block.BlockType === "LINE" && block.Text) {
          lines.push(block.Text);
        }
      }

      if (response.NextToken) {
        nextToken = response.NextToken; // more pages available
      } else {
        finished = true; // all results received
      }
    } else if (response.JobStatus === "FAILED") {
      throw new Error("Textract job failed");
    } else {
      // Job still in progress, wait and retry
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  return lines.join("\n");
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const prefix = searchParams.get("prefix") || `usersData/${uid}/`;

    if (!uid) {
      return NextResponse.json(
        { error: "Missing uid parameter" },
        { status: 400 }
      );
    }

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const data = await s3Client.send(listCommand);

    const pdfFiles = (data.Contents || []).filter(
      (item) => item.Key && item.Key.endsWith(".pdf")
    );

    let combinedText = "";

    // Process each PDF file asynchronously using Textract async API
    for (const file of pdfFiles) {
      const key = file.Key!;
      console.log(`Starting Textract job for ${key}`);
      const jobId = await startAsyncTextDetection(key);
      console.log(`Job started with ID: ${jobId}`);

      const text = await getAsyncTextDetectionResult(jobId);
      combinedText += `\n--- ${key} ---\n${text}\n`;
    }

    return NextResponse.json({ text: combinedText });
  } catch (error) {
    console.error("Error processing PDFs with Textract async:", error);
    return NextResponse.json(
      { error: "Failed to extract text using Textract async" },
      { status: 500 }
    );
  }
}
