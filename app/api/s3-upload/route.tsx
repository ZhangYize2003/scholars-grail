import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.NEXT_PUBLIC_AWS_S3_REGION!;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY!;
// const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!;

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId,
        secretAccessKey
    }
});

async function uploadFileToS3(buffer: Buffer<ArrayBuffer>, paper: string, paperFolder: string, uid: string, subject: string) {
    const fileBuffer = buffer;
    console.log("Uploading file to S3:", `usersData/${uid}/${subject}/${paperFolder}/${paper}`);
    const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
        Key: `usersData/${uid}/${subject}/${paperFolder}/${paper}`,
        Body: fileBuffer,
        ContentType: "file/pdf"
    }

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    return paper;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const paper = formData.get("paper");
        const paperFolder = formData.get("paperFolder");
        const uid = formData.get("uid");
        const subject = formData.get("subject");
        if (!paper || typeof paper === "string") {
            return NextResponse.json({ error: "No file provided or file is not a Blob" }, { status: 400 });
        }

        const buffer = Buffer.from(await paper.arrayBuffer());
        const fileName = await uploadFileToS3(buffer, paper.name, paperFolder as string, uid as string, subject as string);

        return NextResponse.json({ success: true, fileName });

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}



