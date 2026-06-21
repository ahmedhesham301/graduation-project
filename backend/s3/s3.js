import {
    S3Client,
    CreateBucketCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    GetObjectCommand,
    PutPublicAccessBlockCommand,
    PutBucketPolicyCommand,
    PutObjectCommand,
    PutBucketCorsCommand
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
let s3Config = {}
let s3PresignConfig = {}
if (process.env.ENV === "dev") {
    s3Config = {
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
    }
    // Presigned URLs need localhost for browser access
    const presignEndpoint = "http://" + process.env.S3_ENDPOINT.replace("rustfs", "localhost");
    s3PresignConfig = {
        ...s3Config,
        endpoint: presignEndpoint,
    }
} else if (process.env.ENV === "prod") {
    s3Config = {
        region: "eu-central-1",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        },
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 3000,
            socketTimeout: 5000,
        }),
    }
    s3PresignConfig = s3Config
}

const s3 = new S3Client(s3Config);
const s3Presign = new S3Client(s3PresignConfig);

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
            await s3.send(new PutBucketCorsCommand({
                Bucket: process.env.BUCKET_NAME,
                CORSConfiguration: {
                    CORSRules: [
                        {
                            AllowedHeaders: ["*"],
                            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                            AllowedOrigins: ["*"], // Allows all domains
                            ExposeHeaders: ["ETag"],
                            MaxAgeSeconds: 3000
                        }
                    ]
                }}))
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

export async function createPresignedUploadUrl(propertyId, uuid, extension, mimeType, fileSize, fileName) {
    const presignedUrl = await getSignedUrl(
        s3Presign,
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
        presignedUrl,
        fileName
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

export async function getObjectStream(key) {
    const response = await s3.send(new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
    }));
    return response;
}