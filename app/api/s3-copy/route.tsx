import { NextResponse } from "next/server";
import { S3Client, CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

// Copying a folder in S3
export async function PUT(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const sourceKey = searchParams.get("sourceKey");
        const destinationKey = searchParams.get("destinationKey");

        console.log("Copying from:", sourceKey, "to:", destinationKey);

        if (!sourceKey || !destinationKey) {
            return NextResponse.json({ 
                error: "Source and destination keys are required" 
            }, { status: 400 });
        }

        // List all objects in source folder
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
            Prefix: sourceKey
        });

        const listResponse = await s3Client.send(listCommand);
        
        if (!listResponse.Contents) {
            return NextResponse.json({ error: "Source folder is empty" }, { status: 400 });
        }

        // Copy each object
        await Promise.all(listResponse.Contents.map(async (item) => {
            if (!item.Key) return;
            
            const newKey = item.Key.replace(sourceKey, destinationKey);
            const copyCommand = new CopyObjectCommand({
                Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME!,
                CopySource: `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}/${item.Key}`,
                Key: newKey
            });

            await s3Client.send(copyCommand);
        }));

        return NextResponse.json({ 
            success: true, 
            message: "Folder copied successfully" 
        });

    } catch (error) {
        console.error("Error copying folder:", error);
        return NextResponse.json({ error: "Failed to copy folder" }, { status: 500 });
    }
}