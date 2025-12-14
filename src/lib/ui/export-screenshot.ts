import { toPng } from "html-to-image";

/**
 * Export a screenshot of the element with id "export-root" as PNG
 *
 * @param filename - The filename for the downloaded image (without extension)
 * @param options - Optional configuration for the export
 * @returns Promise that resolves when the download is triggered
 */
export async function exportScreenshot(
  filename: string,
  options?: {
    pixelRatio?: number;
    quality?: number;
  }
): Promise<void> {
  const node = document.getElementById("export-root");
  if (!node) {
    throw new Error(
      "export-root element not found. Ensure ScreenshotArea is rendered."
    );
  }

  const pixelRatio = options?.pixelRatio ?? 2;
  const quality = options?.quality ?? 1.0;

  // Store original styles
  const originalStyles = {
    position: (node as HTMLElement).style.position,
    left: (node as HTMLElement).style.left,
    top: (node as HTMLElement).style.top,
    opacity: (node as HTMLElement).style.opacity,
    zIndex: (node as HTMLElement).style.zIndex,
  };

  try {
    // Temporarily make element visible for capture
    const originalDisplay = (node as HTMLElement).style.display;
    (node as HTMLElement).style.position = "fixed";
    (node as HTMLElement).style.left = "0";
    (node as HTMLElement).style.top = "0";
    (node as HTMLElement).style.opacity = "1";
    (node as HTMLElement).style.zIndex = "9999";
    (node as HTMLElement).style.display = "block";

    // Wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Preload the peacock.svg logo to ensure it's loaded
    const logoImg = new Image();
    logoImg.src = "/peacock.svg";
    await new Promise((resolve) => {
      if (logoImg.complete) {
        resolve(undefined);
      } else {
        logoImg.onload = () => resolve(undefined);
        logoImg.onerror = () => resolve(undefined);
        setTimeout(() => resolve(undefined), 2000);
      }
    });

    // Wait for all images to load
    const images = node.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) {
              resolve(undefined);
            } else {
              img.onload = () => resolve(undefined);
              img.onerror = () => resolve(undefined);
              setTimeout(() => resolve(undefined), 2000);
            }
          })
      )
    );

    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio,
      quality,
      backgroundColor: "#F6F7FB",
    });

    // Restore original styles
    (node as HTMLElement).style.position = originalStyles.position;
    (node as HTMLElement).style.left = originalStyles.left;
    (node as HTMLElement).style.top = originalStyles.top;
    (node as HTMLElement).style.opacity = originalStyles.opacity;
    (node as HTMLElement).style.zIndex = originalStyles.zIndex;
    (node as HTMLElement).style.display = originalDisplay;

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    // Restore original styles on error
    const originalDisplay = (node as HTMLElement).style.display;
    (node as HTMLElement).style.position = originalStyles.position;
    (node as HTMLElement).style.left = originalStyles.left;
    (node as HTMLElement).style.top = originalStyles.top;
    (node as HTMLElement).style.opacity = originalStyles.opacity;
    (node as HTMLElement).style.zIndex = originalStyles.zIndex;
    (node as HTMLElement).style.display = originalDisplay;

    console.error("Error exporting screenshot:", error);
    throw new Error("Failed to export screenshot");
  }
}
