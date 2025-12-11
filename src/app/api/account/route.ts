export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { unlink } from "fs/promises";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import path from "path";

import prisma from "@/db";
import { newZoneDate } from "@/lib/date";
import { generateVendorUsername, getDefaultPassbookData } from "@/lib/helper";

export async function POST(request: Request) {
  try {
    const { requireAdmin, hashPassword } = await import("@/lib/auth");

    const data = await request.json();
    const {
      id,
      firstName,
      lastName,
      username,
      password,
      phone,
      email,
      avatar,
      active,
      startAt,
      endAt,
      isMember,
      readAccess,
      writeAccess,
    } = data;

    // Check user permissions
    let currentUser;
    let isAdminUser = false;

    // Creating new account requires admin
    if (!id) {
      currentUser = await requireAdmin();
      isAdminUser = true;
    } else {
      // Updating existing account - only admins can edit members/vendors
      // Write users can only edit transactions, not accounts
      if (isMember === false) {
        // Vendor updates require admin
        currentUser = await requireAdmin();
        isAdminUser = true;
      } else {
        // Member updates require admin (Write users cannot edit members)
        currentUser = await requireAdmin();
        isAdminUser =
          currentUser.kind === "admin" || currentUser.kind === "admin-member";
      }
    }

    // Validate required fields
    if (!firstName && !id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine username: for vendors, auto-generate; for members, use provided username
    let finalUsername: string;
    if (!id) {
      // Creating new account
      if (isMember === false) {
        // Vendor: auto-generate username
        finalUsername = generateVendorUsername(firstName, lastName);
      } else {
        // Member: username is required
        if (!username) {
          return NextResponse.json(
            { error: "Username is required for members" },
            { status: 400 }
          );
        }
        finalUsername = username;
      }
    } else {
      // Updating existing account
      if (username) {
        finalUsername = username;
      } else {
        // If no username provided, keep existing username
        const existingAccount = await prisma.account.findUnique({
          where: { id },
          select: { username: true },
        });
        if (!existingAccount?.username) {
          return NextResponse.json(
            { error: "Username is required" },
            { status: 400 }
          );
        }
        finalUsername = existingAccount.username;
      }
    }

    // Validate username format
    if (finalUsername) {
      if (!/^[a-z0-9_-]+$/.test(finalUsername)) {
        return NextResponse.json(
          {
            error:
              "Username can only contain lowercase letters, numbers, hyphens, and underscores",
          },
          { status: 400 }
        );
      }
      if (finalUsername.length < 3 || finalUsername.length > 50) {
        return NextResponse.json(
          { error: "Username must be between 3 and 50 characters" },
          { status: 400 }
        );
      }

      // Check username uniqueness (excluding current account if updating)
      const existingAccount = await prisma.account.findUnique({
        where: { username: finalUsername },
        select: { id: true },
      });

      if (existingAccount && existingAccount.id !== id) {
        return NextResponse.json(
          {
            error:
              "Username already exists. Please choose a different username.",
          },
          { status: 400 }
        );
      }
    }

    const commonData: Parameters<typeof prisma.account.update>[0]["data"] = {
      firstName: firstName || undefined,
      lastName: lastName ?? undefined,
      username: finalUsername,
      phone: phone ?? undefined,
      email: email ?? undefined,
      avatar: avatar ?? undefined,
      startAt: newZoneDate(startAt || undefined),
      endAt: endAt ? newZoneDate(endAt) : undefined,
      active: active ?? true,
      isMember: isMember ?? true,
      // Only admins can change access control fields
      readAccess: isAdminUser ? (readAccess ?? true) : undefined,
      writeAccess: isAdminUser ? (writeAccess ?? false) : undefined,
    };

    if (id) {
      // Get existing account to check for old avatar and verify it's a member
      const existingAccount = await prisma.account.findUnique({
        where: { id },
        select: { avatar: true, isMember: true },
      });

      if (!existingAccount) {
        return NextResponse.json(
          { error: "Account not found" },
          { status: 404 }
        );
      }

      // Ensure writeAccess users can only update members, not vendors
      if (!isAdminUser && existingAccount.isMember === false) {
        return NextResponse.json(
          { error: "Only admins can update vendors" },
          { status: 403 }
        );
      }

      // Update existing member
      const updateData: any = { ...commonData };

      // Only update password if provided
      if (password) {
        updateData.passwordHash = await hashPassword(password);
      }

      const updated = await prisma.account.update({
        where: { id },
        data: updateData,
      });

      // Delete old avatar if it was removed or replaced
      if (existingAccount?.avatar) {
        const oldAvatar = existingAccount.avatar;
        const newAvatar = avatar || "";

        // If avatar was removed or changed, delete the old file
        if (!newAvatar || oldAvatar !== newAvatar) {
          try {
            // Extract filename from avatar URL
            const oldFilename = oldAvatar
              .replace("/image/", "")
              .replace(/^\//, "");
            if (
              oldFilename &&
              oldFilename !==
              newAvatar.replace("/image/", "").replace(/^\//, "")
            ) {
              const publicPath = path.join(process.cwd(), "public", "image");
              const oldFilePath = path.join(publicPath, oldFilename);
              try {
                await unlink(oldFilePath);
              } catch (unlinkError: any) {
                // File might not exist, ignore ENOENT error
                if (unlinkError.code !== "ENOENT") {
                  console.warn("Failed to delete old avatar:", unlinkError);
                }
              }
            }
          } catch (deleteError) {
            // Log but don't fail the request if old avatar deletion fails
            console.warn("Error deleting old avatar:", deleteError);
          }
        }
      }

      return NextResponse.json({ account: updated }, { status: 200 });
    }

    // Create a new member
    // Default access: Read ON, Write OFF, Admin OFF
    const defaultReadAccess = isAdminUser ? (readAccess ?? true) : true;
    const defaultWriteAccess = isAdminUser ? (writeAccess ?? false) : false;
    const defaultRole = isAdminUser && writeAccess ? "ADMIN" : "MEMBER";
    const defaultCanLogin =
      defaultReadAccess || defaultWriteAccess || defaultRole === "ADMIN";

    const createData: any = {
      ...commonData,
      username: finalUsername, // Required, validated above
      readAccess: defaultReadAccess,
      writeAccess: defaultWriteAccess,
      role: defaultRole,
      canLogin: defaultCanLogin,
      passbook: {
        create: {
          type: isMember ? "MEMBER" : "VENDOR",
          payload: getDefaultPassbookData(isMember ? "MEMBER" : "VENDOR"),
          joiningOffset: 0,
          delayOffset: 0,
        },
      },
    };

    // Hash password if provided
    if (password) {
      createData.passwordHash = await hashPassword(password);
    }

    await prisma.account.create({
      data: createData,
    });

    revalidatePath("*");
    revalidateTag("api");
    return NextResponse.json({ account: commonData }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating/updating member:", error);
    if (
      error.message === "Unauthorized" ||
      error.message.includes("Forbidden")
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
