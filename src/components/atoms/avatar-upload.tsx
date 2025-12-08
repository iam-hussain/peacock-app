"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AvatarUploadProps {
  value?: string;
  onChange?: (value: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
  oldImageUrl?: string | null;
}

export function AvatarUpload({
  value,
  onChange,
  onFileSelect,
  className,
  disabled = false,
  oldImageUrl: _oldImageUrl,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      // Format the URL properly
      // If it's already a full path (/image/... or http...), use as-is
      // If it's just a filename (avatar_13.jpeg), prefix with /image/
      let url = value;
      if (!value.startsWith("/") && !value.startsWith("http")) {
        // It's just a filename, add /image/ prefix
        url = `/image/${value}`;
      } else if (value.startsWith("/image/")) {
        // Already has /image/ prefix, use as-is
        url = value;
      } else if (!value.startsWith("http")) {
        // It's a relative path but not /image/, ensure it starts with /
        url = value.startsWith("/") ? value : `/${value}`;
      }
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Call onFileSelect callback
    if (onFileSelect) {
      setIsUploading(true);
      try {
        await onFileSelect(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const _getInitials = (_url: string) => {
    // Extract initials from URL or return default
    return "AV";
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={handleClick}>
            <AvatarImage src={preview || undefined} alt="Avatar preview" />
            <AvatarFallback className="text-lg bg-muted text-muted-foreground">
              AV
            </AvatarFallback>
          </Avatar>
          {preview && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center hover:bg-destructive/90"
              aria-label="Remove avatar"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading
              ? "Uploading..."
              : preview
                ? "Change Avatar"
                : "Upload Avatar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WEBP (max 5MB)
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      {value && !preview?.startsWith("data:") && (
        <div className="text-xs text-muted-foreground">Current: {value}</div>
      )}
    </div>
  );
}
