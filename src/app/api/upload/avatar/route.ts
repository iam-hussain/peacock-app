export const fetchCache = "force-no-store";

import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import sharp from "sharp";

import { requireAdmin } from "@/lib/core/auth";

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload avatar image
 *     description: Uploads and processes an avatar image. Requires admin access. Image is resized to 200x200px and converted to JPEG.
 *     tags: [Upload]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5MB, will be resized to 200x200px)
 *               oldImageUrl:
 *                 type: string
 *                 description: URL of old image to delete (optional)
 *                 example: "/image/avatar_13.jpeg"
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Public URL of the uploaded image
 *                   example: "/image/avatar_1234567890_abc123.jpg"
 *                 filename:
 *                   type: string
 *                   description: Generated filename
 *                   example: "avatar_1234567890_abc123.jpg"
 *       400:
 *         description: Invalid file or file too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: File size must be less than 5MB
 *       401:
 *         description: Unauthorized - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to upload avatar
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const oldImageUrl = formData.get("oldImageUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (MIME header check)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytesArray = await file.arrayBuffer();
    const buffer = Buffer.from(bytesArray);

    // Validate magic bytes (server-side file type verification)
    const magicBytes = buffer.subarray(0, 8);
    const isJpeg = magicBytes[0] === 0xff && magicBytes[1] === 0xd8 && magicBytes[2] === 0xff;
    const isPng =
      magicBytes[0] === 0x89 && magicBytes[1] === 0x50 &&
      magicBytes[2] === 0x4e && magicBytes[3] === 0x47;
    const isGif = magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46;
    const isWebp =
      magicBytes[0] === 0x52 && magicBytes[1] === 0x49 &&
      magicBytes[2] === 0x46 && magicBytes[3] === 0x46 &&
      magicBytes[8] === 0x57 && magicBytes[9] === 0x45;

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json(
        { error: "Invalid image file. Supported formats: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Resize and crop image to 200x200px square using sharp
    const processedImage = await sharp(buffer)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Generate unique filename
    const bytes = randomBytes(8);
    const timestamp = Date.now();
    const filename = `avatar_${timestamp}_${bytes.toString("hex")}.jpg`;

    // Save file to public/image directory
    const publicPath = path.join(process.cwd(), "public", "image");

    // Ensure directory exists
    try {
      await mkdir(publicPath, { recursive: true });
    } catch (error: any) {
      // Directory might already exist, ignore EEXIST error
      if (error.code !== "EEXIST") {
        throw error;
      }
    }

    const filePath = path.join(publicPath, filename);
    await writeFile(filePath, processedImage);

    // Delete old image if provided
    if (oldImageUrl) {
      try {
        // Extract filename from URL (e.g., /image/avatar_13.jpeg -> avatar_13.jpeg)
        const oldFilename = path.basename(oldImageUrl);
        if (oldFilename && oldFilename !== filename) {
          const oldFilePath = path.resolve(publicPath, oldFilename);
          // Prevent path traversal — ensure resolved path is within publicPath
          if (!oldFilePath.startsWith(publicPath + path.sep)) {
            console.warn("Path traversal attempt blocked:", oldImageUrl);
          } else {
            try {
              await unlink(oldFilePath);
            } catch (unlinkError: any) {
              // File might not exist, ignore error
              if (unlinkError.code !== "ENOENT") {
                console.warn("Failed to delete old image:", unlinkError);
              }
            }
          }
        }
      } catch (deleteError) {
        // Log but don't fail the request if old image deletion fails
        console.warn("Error deleting old image:", deleteError);
      }
    }

    // Return the public URL path
    const publicUrl = `/image/${filename}`;

    return NextResponse.json({ url: publicUrl, filename }, { status: 200 });
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
