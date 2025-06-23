import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

const region = process.env.NEXT_PUBLIC_AWS_S3_REGION!;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!;
const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

async function uploadJSONToS3(jsonData: string, url: string) {
    console.log("Uploading file to S3:", `${url}`);
    const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
        Key: url,
        Body: jsonData,
        ContentType: "application/json"
    }

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return jsonData;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const hardQues = formData.get("hardQues");
        console.log(hardQues);
        const url = formData.get("url");
        if (typeof hardQues !== "string") {
            return NextResponse.json({ error: "hardQues must be a string." }, { status: 400 });
        }
        if (typeof url !== 'string') {
            return NextResponse.json({ error: "url must be a string." }, { status: 400 });
        }

        const fileName = await uploadJSONToS3(hardQues, url);
        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        console.log("url:", url);
        if (!url) {
            return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
        }
        const data = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: url }));
        if (!data.Body) {
            return NextResponse.json({ error: "File has no content" }, { status: 404 });
        }
        const jsonStr = await data.Body.transformToString("utf-8");
        const hardQuesFromS3 = JSON.parse(jsonStr);
        console.log(hardQuesFromS3);
        return NextResponse.json({ hardQuesFromS3 });
    } catch (error) {
        console.error("Error reading file from S3:", error);
        return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
    }
}