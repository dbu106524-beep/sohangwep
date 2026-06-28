"use client";

import { useMemo } from "react";
import { useFormStatus } from "react-dom";
import { createCommunityPostAction, updateCommunityPostAction } from "@/app/community/actions";
import type { CommunityPost } from "@/lib/types";
import { getImageUrls } from "@/lib/utils";

const categoryOptions = [
  { value: "screenshot", label: "스크린샷" },
  { value: "free", label: "자유게시판" },
  { value: "tips", label: "팁과 노하우" },
] as const;

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button primary" disabled={pending} aria-disabled={pending}>
      {pending ? "처리 중..." : editing ? "수정 완료" : "글 올리기"}
    </button>
  );
}

export function CommunityForm({ post }: { post?: CommunityPost }) {
  const action = post ? updateCommunityPostAction : createCommunityPostAction;
  const submissionId = useMemo(() => crypto.randomUUID().slice(0, 12), []);
  const imageUrls = post ? getImageUrls(post) : [];

  return (
    <form action={action} className="admin-panel community-form">
      <input type="hidden" name="submission_id" value={submissionId} />

      {post ? (
        <>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <input type="hidden" name="current_image_url" value={post.image_url ?? ""} />
          <input type="hidden" name="current_image_urls" value={JSON.stringify(imageUrls)} />
        </>
      ) : null}

      <label className="admin-field">
        <span>게시판</span>
        <select name="category" className="admin-select" defaultValue={post?.category ?? "screenshot"}>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="admin-field">
        <span>제목</span>
        <input name="title" className="admin-input" defaultValue={post?.title} maxLength={80} required />
      </label>

      <label className="admin-field">
        <span>이미지</span>
        <input name="image_files" className="admin-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
        <small className="field-help">PNG, JPG, WEBP, GIF / 최대 5장, 장당 6MB. 새 이미지를 선택하면 기존 이미지를 대체합니다.</small>
      </label>

      {imageUrls.length ? (
        <div className="admin-image-grid">
          {imageUrls.map((url) => (
            <img key={url} src={url} alt="" />
          ))}
        </div>
      ) : null}

      <label className="admin-field">
        <span>내용</span>
        <textarea name="content" className="admin-textarea" defaultValue={post?.content} minLength={2} required />
      </label>

      <div className="admin-actions">
        <SubmitButton editing={Boolean(post)} />
      </div>
    </form>
  );
}
