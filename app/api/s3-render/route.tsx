import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

const getContentType = (key: string) => {
  if (key.endsWith(".pdf")) return "application/pdf";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  if (key.endsWith(".png")) return "image/png";
  return "application/octet-stream";
};

// type ResponseData = {
//     url: string;
// }

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const uid = searchParams.get("uid");
        const prefix = searchParams.get("prefix") || `usersData/${uid}/`;
        console.log("Fetching files for user ID:", uid);
        const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: prefix,
            Delimiter: '/'
        });
        const data = await s3Client.send(listCommand);

        if (!data.Contents){
            return NextResponse.json({ files: [] });
        }
        const folders = (data.CommonPrefixes || []).map(prefix => ({
            prefix: prefix.Prefix,
        }));
        const files = await Promise.all(
            (data.Contents || [])
                .filter(item => !item.Key!.endsWith('/'))
                .map(async (item) => {
                    const contentType = getContentType(item.Key!);
                    const getCommand = new GetObjectCommand({
                        Bucket: bucketName,
                        Key: item.Key,
                        ResponseContentDisposition: 'inline',
                        ResponseContentType: contentType
                    });
                    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
                    return {
                        key: item.Key,
                        lastModified: item.LastModified,
                        size: item.Size,
                        url: signedUrl
                    };
                })
        );

        return NextResponse.json({ folders, files });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}
