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

type BoundingBox = {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
};

type TextractBlock = {
  Id: string;
  BlockType: string;
  Text?: string;
  Geometry?: {
    BoundingBox: BoundingBox;
  };
  Relationships?: Array<{
    Type: string;
    Ids: string[];
  }>;
  Page?: number;
};

type LineData = {
  text: string;
  boundingBox: BoundingBox;
  page: number;
};

// Combine Ques + Options
function mergeBoundingBoxes(boxes: BoundingBox[]): BoundingBox {
  const minX = Math.min(...boxes.map(b => b.Left));
  const minY = Math.min(...boxes.map(b => b.Top));
  const maxX = Math.max(...boxes.map(b => b.Left + b.Width));
  const maxY = Math.max(...boxes.map(b => b.Top + b.Height));

  return {
    Left: minX,
    Top: minY,
    Width: maxX - minX,
    Height: maxY - minY,
  };
}

// Send command to start job and wait for jobid
async function startAsyncTextDetection(key: string): Promise<string> {
  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucketName, Name: key } },
  });

  const response = await textractClient.send(command);
  if (!response.JobId) throw new Error("Failed to get Textract JobId");
  return response.JobId;
}

// Use jobid to repeatedly check whether textract is complete
async function getAsyncTextDetectionResult(
  jobId: string
): Promise<{ text: string; boundingBoxes: LineData[] }> {
  let nextToken: string | undefined = undefined;
  let finished = false;
  const allBlocks: TextractBlock[] = [];

  while (!finished) {
    const command = new GetDocumentTextDetectionCommand({
      JobId: jobId,
      NextToken: nextToken,
    });
    const response: GetDocumentTextDetectionCommandOutput = await textractClient.send(command);

    if (response.JobStatus === "SUCCEEDED") {
      allBlocks.push(...(response.Blocks as TextractBlock[] ?? []));
      if (response.NextToken) {
        nextToken = response.NextToken;
      } else {
        finished = true;
      }
    } else if (response.JobStatus === "FAILED") {
      throw new Error("Textract job failed");
    } else {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  
  //creates map from block ID to block object -> Easily look up children of a LINE block -> WORD
  const blockMap = new Map<string, TextractBlock>();
  allBlocks.forEach(block => blockMap.set(block.Id, block));
  //push all the words in the line block into the same bounding box
  function getWordBoundingBoxes(lineBlock: TextractBlock): BoundingBox[] {
    const wordBoxes: BoundingBox[] = [];
    if (lineBlock.Relationships) {
      for (const rel of lineBlock.Relationships) {
        if (rel.Type === "CHILD") {
          rel.Ids.forEach((id: string) => {
            const child = blockMap.get(id);
            if (child?.BlockType === "WORD" && child.Geometry?.BoundingBox) {
              wordBoxes.push(child.Geometry.BoundingBox);
            }
          });
        }
      }
    }
    return wordBoxes;
  }

  const allLines: LineData[] = [];

  for (const block of allBlocks) {
    if (block.BlockType === "LINE" && block.Text && block.Geometry?.BoundingBox) {
      const text = block.Text.trim();
      const page = block.Page || 1;
      const wordBoxes = getWordBoundingBoxes(block);

      const mergedBox = wordBoxes.length > 0
        ? mergeBoundingBoxes(wordBoxes)
        : block.Geometry.BoundingBox;

      allLines.push({
        text,
        boundingBox: mergedBox,
        page
      });
    }
  }

  return {
    text: allLines.map(q => q.text).join("\n"),
    boundingBoxes: allLines
  };
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
    const allBoundingBoxes: { file: string; boxes: LineData[] }[] = [];

    // Process each file in the repo
    for (const file of pdfFiles) {
      const key = file.Key!;
      console.log(`Starting Textract job for ${key}`);
      const jobId = await startAsyncTextDetection(key);
      console.log(`Job started with ID: ${jobId}`);

      const { text, boundingBoxes } = await getAsyncTextDetectionResult(jobId);
      combinedText += `\n--- ${key} ---\n${text}\n`;
      allBoundingBoxes.push({ file: key, boxes: boundingBoxes });
    }

    return NextResponse.json({ text: combinedText, boundingBoxes: allBoundingBoxes });
  } catch (error) {
    console.error("Error processing PDFs with Textract async:", error);
    return NextResponse.json(
      { error: "Failed to extract text using Textract async" },
      { status: 500 }
    );
  }
}
