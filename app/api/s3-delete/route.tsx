import { NextResponse } from "next/server";
import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

// Deleting a folder in S3
export async function DELETE(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");
        if (!key) {
            return NextResponse.json({ error: "Key parameter is required" }, { status: 400 });
        }
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: key
        });
        const listResponse = await s3Client.send(listCommand);
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return NextResponse.json({ error: "No files found with the specified key" }, { status: 404 });
        }

        console.log("Deleting file with key:", key);
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucketName,
            Delete : {
                Objects: listResponse.Contents.map(item => ({
                    Key: item.Key!
                })),
                Quiet: false
            }
        });

        await s3Client.send(deleteCommand);

        return NextResponse.json({ message: "File deleted successfully" });
    } catch (error) {
        console.error("Error deleting file:", error);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}



