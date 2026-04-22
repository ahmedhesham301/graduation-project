import { v7 as uuidv7 } from "uuid";
import { createPresignedUploadUrl } from "../s3/s3.js";
import { createPropertyMediaRecords } from "../models/propertyMediaModel.js";

const mimeTypeToExtension = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
};

export async function preparePropertyMediaUploads(propertyId, mediaFiles) {
    const propertyMediaRecords = mediaFiles.map((mediaFile) => ({
        ...mediaFile,
        uuid: uuidv7(),
        extension: mimeTypeToExtension[mediaFile.mimeType],
    }))

    const presignedUploadUrlPromises = propertyMediaRecords.map((mediaRecord) =>
        createPresignedUploadUrl(
            `${mediaRecord.uuid}.${mediaRecord.extension}`,
            mediaRecord.mimeType,
            mediaRecord.size
        )
    )

    const preparedUploads = await Promise.all(presignedUploadUrlPromises)
    await createPropertyMediaRecords(propertyId, propertyMediaRecords)

    return preparedUploads
}
