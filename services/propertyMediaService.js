import { v7 as uuidv7 } from "uuid";
import { createPresignedUploadUrl } from "../s3/s3.js";
import { createPropertyMediaRecords, getAllMedia } from "../models/propertyMediaModel.js";
import mime from 'mime';

export async function preparePropertyMediaUploads(propertyId, mediaFiles) {
    const propertyMediaRecords = mediaFiles.map((mediaFile) => ({
        ...mediaFile,
        uuid: uuidv7(),
        extension: mime.getExtension(mime.getType(mediaFile.fileName)),
        mimeType: mime.getType(mediaFile.fileName),
    }))

    const presignedUploadUrlPromises = propertyMediaRecords.map((mediaRecord) =>
        createPresignedUploadUrl(
            propertyId,
            mediaRecord.uuid,
            mediaRecord.extension,
            mediaRecord.mimeType,
            mediaRecord.size,
            mediaRecord.fileName
        )
    )

    const preparedUploads = await Promise.all(presignedUploadUrlPromises)
    await createPropertyMediaRecords(propertyId, propertyMediaRecords)

    return preparedUploads
}


function convertMediaToUrls(media) {
    return `${media.s3_key}.${media.extension}`
}

export async function getMediaUrls(propertyId) {
    let media = await getAllMedia(propertyId)
    const urls = media.map(obj => convertMediaToUrls(obj))
    return urls
}

