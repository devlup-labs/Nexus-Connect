export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
        image.src = url;
    });

export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * This helper function returns a Base64 string of the cropped image.
 *
 * @param {string} imageSrc - base64 or URL of the image
 * @param {Object} pixelCrop - { width, height, x, y }
 * @param {number} rotation - rotation angle
 * @param {Object} flip - { horizontal, vertical }
 */
export default async function getCroppedImg(
    imageSrc,
    pixelCrop,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // croppedArea format required by react-easy-crop
    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d");

    if (!croppedCtx) {
        return null;
    }

    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image onto the crop canvas
    croppedCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve, reject) => {
        croppedCanvas.toBlob((file) => {
            resolve(URL.createObjectURL(file));
        }, "image/jpeg");
    });
}

// Convert blob URL to base64
export async function convertBlobToBase64(blobUrl) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
