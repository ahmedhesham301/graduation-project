import { z } from "zod";

export function handleValidationError(result, res) {
    let validationErrors = {}
    let tree = z.treeifyError(result).properties
    console.log(tree)
    for (const e in tree) {
        if (tree[e].errors.length == 0) {
            for (const nestedE in tree[e].properties) {
                validationErrors[nestedE] = tree[e].properties[nestedE].errors
            }
        } else {
            validationErrors[e] = tree[e].errors
        }

    }
    res.status(400).json({ message: "Invalid input format", errors: validationErrors })
}