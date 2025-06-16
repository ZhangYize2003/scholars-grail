import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
  DetectDocumentTextCommandOutput,
} from "@aws-sdk/client-textract";
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

// pass over the bytes stored in s3 directly to textract -> helps to extract text faster
async function getPdfBytesFromS3(key: string): Promise<Uint8Array> {
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(getObjectCommand);
  const stream = response.Body as ReadableStream<Uint8Array> | NodeJS.ReadableStream;

  // support for both browser and Node.js stream types:
  if ("getReader" in stream) {
    // Browser ReadableStream
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    let done: boolean | undefined = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (value) chunks.push(value);
      done = doneReading;
    }
    // Concatenate all chunks into one Uint8Array
    const length = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  } else {
    // Node.js ReadableStream
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

async function extractTextFromPDFUsingTextractSync(key: string): Promise<string> {
  const documentBytes = await getPdfBytesFromS3(key);

  const detectCommand = new DetectDocumentTextCommand({
    Document: { Bytes: documentBytes },
  });

  const response: DetectDocumentTextCommandOutput = await textractClient.send(detectCommand);

  const blocks = response.Blocks ?? [];
  const text = blocks
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((line) => line.Text!)
    .join("\n");

  return text;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const prefix = searchParams.get("prefix") || `usersData/${uid}/`;

    console.log("Fetching PDF files for user ID:", uid);

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const data = await s3Client.send(listCommand);

    const pdfFiles = (data.Contents || []).filter(
      (item) => item.Key && item.Key.endsWith(".pdf")
    );

    console.log("Found PDF files:", pdfFiles.map((f) => f.Key));

    let combinedText = "";

    for (const file of pdfFiles) {
      const text = await extractTextFromPDFUsingTextractSync(file.Key!);
      combinedText += `\n--- ${file.Key} ---\n${text}\n`;
    }

    console.log("Combined extracted text length:", combinedText.length);
    console.log(combinedText);
    return NextResponse.json({ text: combinedText });
  } catch (error) {
    console.error("Error processing PDFs with Textract:", error);
    return NextResponse.json(
      { error: "Failed to extract text using Textract" },
      { status: 500 }
    );
  }
}
