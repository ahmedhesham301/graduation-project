import { checkFileExists } from "../s3/s3.js";
import { setUploadedToNow, isMediaFullyUploaded } from "../models/propertyMediaModel.js";
import { publishProperty } from "../models/propertyModel.js";

export async function verifyUpload(req, res) {
    try {
        let fileExists = await checkFileExists(`media/${req.validated.media.propertyId}/${req.validated.media.uuid}.${req.validated.media.ext}`)
        if (!fileExists) {
            res.status(403).json({ error: "media is not uploaded to s3" })
            return
        }
        const didUpdate = await setUploadedToNow(req.validated.media.propertyId, req.validated.media.uuid)
        if (!didUpdate) {
            return res.status(500).json({ error: "internal server error." })
        }
        if (await isMediaFullyUploaded(req.validated.media.propertyId)) {
            await publishProperty(req.validated.media.propertyId)
            res.status(201).json({ message: "property created" })
            return
        }
        res.status(201).send()
    } catch (error) {
        console.error(error)
        res.status(500).send()
    }


}
