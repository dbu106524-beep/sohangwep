"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ImageUploadInputProps = {
  className?: string;
  accept?: string;
  multiple?: boolean;
};

const maxFiles = 5;
const maxDimension = 1200;
const imageQuality = 0.72;

export function ImageUploadInput({
  className = "file-input",
  accept = "image/png,image/jpeg,image/webp,image/gif",
  multiple = true,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.closest("form");
    const buttons = Array.from(form?.querySelectorAll("button") ?? []);

    for (const button of buttons) {
      button.disabled = processing;
    }

    return () => {
      for (const button of buttons) {
        button.disabled = false;
      }
    };
  }, [processing]);

  async function handleChange() {
    const input = inputRef.current;
    const form = input?.closest("form");
    const files = Array.from(input?.files ?? []).slice(0, maxFiles);

    if (!input || !form || files.length === 0) {
      setStatus("");
      return;
    }

    setProcessing(true);
    setStatus("이미지를 Storage에 업로드하는 중...");

    try {
      const supabase = createSupabaseBrowserClient();
      const urls: string[] = [];
      let totalSize = 0;

      for (const file of files) {
        const normalized = await normalizeImageFile(file);
        totalSize += normalized.size;
        const signedUpload = await createSignedUpload(normalized);
        const { error } = await supabase.storage
          .from("shop-images")
          .uploadToSignedUrl(signedUpload.path, signedUpload.token, normalized);

        if (error) {
          throw new Error(error.message);
        }

        urls.push(signedUpload.publicUrl);
      }

      setFormImageValues(form, urls);
      input.value = "";
      setStatus(`${urls.length}개 업로드 완료 · 약 ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
    } catch (error) {
      console.error(error);
      setStatus(`이미지 업로드에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <input ref={inputRef} className={className} type="file" accept={accept} multiple={multiple} onChange={handleChange} />
      {status ? <small className="field-help">{status}</small> : null}
    </>
  );
}

async function createSignedUpload(file: File) {
  const response = await fetch("/api/admin/shop-images/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "image/webp",
    }),
  });
  const data = (await response.json().catch(() => null)) as { path?: string; token?: string; publicUrl?: string; error?: string } | null;

  if (!response.ok || !data?.path || !data.token || !data.publicUrl) {
    throw new Error(data?.error || "업로드 URL을 만들 수 없습니다.");
  }

  return {
    path: data.path,
    token: data.token,
    publicUrl: data.publicUrl,
  };
}

function setFormImageValues(form: HTMLFormElement, urls: string[]) {
  const imageUrlInput = form.querySelector<HTMLInputElement>('input[name="image_url"]');
  let currentImageUrlsInput = form.querySelector<HTMLInputElement>('input[name="current_image_urls"]');

  if (!currentImageUrlsInput) {
    currentImageUrlsInput = document.createElement("input");
    currentImageUrlsInput.type = "hidden";
    currentImageUrlsInput.name = "current_image_urls";
    form.appendChild(currentImageUrlsInput);
  }

  if (imageUrlInput) {
    imageUrlInput.value = urls[0] ?? "";
  }

  currentImageUrlsInput.value = JSON.stringify(urls);
}

async function normalizeImageFile(file: File) {
  if (file.type === "image/gif" || !file.type.startsWith("image/")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mimeType = "image/webp";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, imageQuality));

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.webp`, { type: mimeType, lastModified: Date.now() });
}
