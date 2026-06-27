"use client";

import { useMemo } from "react";
import { useFormStatus } from "react-dom";
import { createCommunityPostAction, updateCommunityPostAction } from "@/app/community/actions";
import type { CommunityPost } from "@/lib/types";

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

  return (
    <form action={action} className="admin-panel community-form">
      <input type="hidden" name="submission_id" value={submissionId} />

      {post ? (
        <>
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <input type="hidden" name="current_image_url" value={post.image_url ?? ""} />
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
        <input name="image_file" className="admin-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
        <small className="field-help">PNG, JPG, WEBP, GIF / 최대 6MB. 스크린샷 게시판은 이미지가 있을 때 가장 예쁘게 표시됩니다.</small>
      </label>

      {post?.image_url ? (
        <div className="community-current-image">
          <img src={post.image_url} alt="" />
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
