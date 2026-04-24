import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    PutPublicAccessBlockCommand,
    PutBucketPolicyCommand,
    PutObjectCommand
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    endpoint: "http://" + process.env.S3_ENDPOINT, // RustFS endpoint
    region: "eu-central-1", // Any value is accepted
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // Must be enabled for RustFS compatibility
    requestHandler: new NodeHttpHandler({
        connectionTimeout: 3000,
        socketTimeout: 5000,
    }),
});

export async function s3Init() {
    // Create a bucket if the env is dev
    if (process.env.ENV === "dev") {
        try {
            await s3.send(new CreateBucketCommand({
                Bucket: process.env.BUCKET_NAME,
                CreateBucketConfiguration: { LocationConstraint: "eu-central-1" }
            }));
            await s3.send(new PutPublicAccessBlockCommand({
                Bucket: process.env.BUCKET_NAME,
                PublicAccessBlockConfiguration: {
                    BlockPublicAcls: false,
                    IgnorePublicAcls: false,
                    BlockPublicPolicy: false,
                    RestrictPublicBuckets: false,
                },
            }));
            await s3.send(new PutBucketPolicyCommand({
                Bucket: process.env.BUCKET_NAME,
                Policy: JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Sid: "PublicRead",
                            Effect: "Allow",
                            Principal: "*",
                            Action: ["s3:GetObject"],
                            Resource: [`arn:aws:s3:::${process.env.BUCKET_NAME}/*`],
                        },
                    ],
                }),
            }));
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    // Check if BUcket exists and has access to it
    try {
        await s3.send(new HeadBucketCommand({ Bucket: process.env.BUCKET_NAME }));
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export async function createPresignedUploadUrl(propertyId, uuid, extension, mimeType, fileSize) {
    const presignedUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `media/${propertyId}/${uuid}.${extension}`,
            ContentType: mimeType,
            ContentLength: fileSize
        }),
        { expiresIn: 600 }
    );

    return {
        objectKey: `${uuid}.${extension}`,
        mimeType,
        fileSize,
        presignedUrl
    }
}

export async function checkFileExists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }));
        return true
    } catch (error) {
        if (error.name === "NotFound") return false;
        throw error
    }
}