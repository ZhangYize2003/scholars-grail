import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";


const region = process.env.NEXT_PUBLIC_AWS_S3_REGION!;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!;

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

async function uploadFileToS3(buffer: Buffer<ArrayBuffer>, name: string, uid: string) {
    const fileBuffer = buffer;
    console.log("Uploading file to S3:", name);

    const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
        Key: `usersData/${uid}/${Date.now()}-${name}`,
        Body: fileBuffer,
        ContentType: "file/pdf"
    }

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return name
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const uid = formData.get("uid");
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No file provided or file is not a Blob" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = await uploadFileToS3(buffer, file.name, uid as string);

        return NextResponse.json({ success: true, fileName });

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}


