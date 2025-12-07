import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
} from "./ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

import {
  Loader2,
  Heart,
  MessageCircle,
  Star,
  Plus,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";

// Popover + Command for accommodation selection
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import {
  Command,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandInput,
} from "./ui/command";

const ACC_LIST = [
  "코지 펫 리조트",
  "럭셔리 도그 하우스",
  "캣 프렌들리 아파트",
  "포레스트 펫 코티지",
  "버드 프렌들리 스튜디오",
  "스몰 펫 가든 하우스",
  "해운대 펫 리조트",
  "송도 펫 호텔",
  "팔공산 힐링 펜션",
  "전주 한옥 펫 스테이",
  "여수 오션뷰 빌라",
  "경주 역사공원 펫 하우스",
  "속초 설악 펫 캠핑장",
  "남이섬 펫 카페 스테이",
  "담양 죽녹원 펫 스테이"
];

// ------------------------------------------------------
// Types
// ------------------------------------------------------
interface CommunityProps {
  isAuthenticated: boolean;
  onShowAuth: (mode?: "login" | "signup") => void;
}

interface Post {
  id: number;
  user_id: string;
  accommodation_name: string;
  rating: number;
  title: string;
  content: string;
  images: string[] | null;
  created_at: string;
  profiles?: {
    username: string | null;
    profile_photo_url: string | null;
  };
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string | null;
    profile_photo_url: string | null;
  };
}

// ------------------------------------------------------
// Component
// ------------------------------------------------------
export function Community({ isAuthenticated, onShowAuth }: CommunityProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Post State
  const [newPost, setNewPost] = useState({
    accommodation_name: "",
    rating: 5,
    title: "",
    content: "",
  });

  // 새 글 이미지 URL들
const [newPostImages, setNewPostImages] = useState<string[]>([]);
const [uploadingImages, setUploadingImages] = useState(false);

// 🔹 file input을 강제로 리셋하기 위한 key
const [fileInputKey, setFileInputKey] = useState(0);   // ⭐ 이 줄 추가

// 🔹 파일 인풋 ref
const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------------------------------------------
  // 이미지 업로드 (Supabase Storage)
  // ------------------------------------------------------
 const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  if (!isAuthenticated) {
    toast.error("로그인 후 이미지를 업로드할 수 있습니다.");
    onShowAuth("login");
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) {
    toast.error("유저 정보를 불러오지 못했습니다.");
    console.error(userError);
    return;
  }

  setUploadingImages(true);
  const uploadedUrls: string[] = [];

  try {
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("comm") // ✅ 버킷 이름 맞추기
        .upload(filePath, file);

      if (uploadError || !uploadData) {
        console.error("upload error:", uploadError);
        toast.error("이미지 업로드 중 오류가 발생했어요.");
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("comm") // ✅ 여기도
        .getPublicUrl(uploadData.path);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      setNewPostImages((prev) => [...prev, ...uploadedUrls]);
      toast.success("이미지 업로드 완료!");
    }
  } finally {
    setUploadingImages(false);
    // 일단 이 줄은 빼두자. 파일 이름 사라져서 헷갈림.
    // e.target.value = "";
  }
};



  // Comment
  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [addingComment, setAddingComment] = useState<number | null>(null);

  // Likes
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

    // ------------------------------------------------------
  // Toggle Like
  // ------------------------------------------------------
  const toggleLike = async (postId: number) => {
    if (!isAuthenticated) {
      onShowAuth("login");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;

    const alreadyLiked = likes[postId];

    if (alreadyLiked) {
      // 좋아요 취소
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      setLikes((prev) => ({ ...prev, [postId]: false }));
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: Math.max((prev[postId] || 1) - 1, 0),
      }));
    } else {
      // 좋아요 추가
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      setLikes((prev) => ({ ...prev, [postId]: true }));
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    }
  };


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // ------------------------------------------------------
  // Fetch Posts
  // ------------------------------------------------------
  const fetchPosts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_posts")
      .select(
        `
        id,
        user_id,
        accommodation_name,
        rating,
        title,
        content,
        images,
        created_at,
        profiles:user_id(
          username,
          profile_photo_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("게시글을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setPosts(data || []);
    await fetchLikeInfo(data || []);
    await fetchComments(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ------------------------------------------------------
  // Likes
  // ------------------------------------------------------
  const fetchLikeInfo = async (posts: Post[]) => {
    const likeMap: Record<number, boolean> = {};
    const countMap: Record<number, number> = {};

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    for (const post of posts) {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { head: true, count: "exact" })
        .eq("post_id", post.id);
      countMap[post.id] = count || 0;

      if (userId) {
        const { data: mine } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        likeMap[post.id] = !!mine;
      }
    }

    setLikes(likeMap);
    setLikeCounts(countMap);
  };

  // ------------------------------------------------------
  // Comments
  // ------------------------------------------------------
  const fetchComments = async (posts: Post[]) => {
    const map: Record<number, Comment[]> = {};

    for (const post of posts) {
      const { data } = await supabase
        .from("community_comments")
        .select(
          `
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles:user_id(
            username,
            profile_photo_url
          )
        `
        )
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      map[post.id] = data || [];
    }

    setComments(map);
  };

  // ------------------------------------------------------
  // Create Post
  // ------------------------------------------------------
const createPost = async () => {
  if (!isAuthenticated) return onShowAuth("login");

  const { accommodation_name, rating, title, content } = newPost;
  if (!accommodation_name || !title || !content) {
    toast.error("모든 필드를 입력해주세요.");
    return;
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { error } = await supabase.from("community_posts").insert({
    user_id: data.user.id,
    accommodation_name,
    rating,
    title,
    content,
    images: newPostImages.length > 0 ? newPostImages : null,
  });

if (error) toast.error("작성 실패");
else {
  toast.success("작성 완료!");
  setNewPost({ accommodation_name: "", rating: 5, title: "", content: "" });
  setNewPostImages([]);

  // ⭐ file input을 완전히 새로 렌더 → 파일 이름/값 싹 초기화
  setFileInputKey((prev) => prev + 1);



  fetchPosts();
}
};



  // ------------------------------------------------------
  // Delete Post
  // ------------------------------------------------------
  const deletePost = async (postId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    await supabase.from("community_posts").delete().eq("id", postId);
    toast.success("삭제되었습니다.");
    fetchPosts();
  };

  // ------------------------------------------------------
  // Delete Comment
  // ------------------------------------------------------
  const deleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    await supabase.from("community_comments").delete().eq("id", commentId);

    toast.success("댓글 삭제됨");
    fetchPosts();
  };

  // ------------------------------------------------------
  // Add Comment
  // ------------------------------------------------------
  const addComment = async (postId: number) => {
    const text = commentInput[postId];
    if (!text || text.trim() === "") return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) return onShowAuth("login");

    setAddingComment(postId);

    await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: data.user.id,
      content: text,
    });

    setCommentInput({ ...commentInput, [postId]: "" });
    toast.success("댓글 작성됨");
    fetchPosts();

    setAddingComment(null);
  };

  // ------------------------------------------------------
  // Date Format
  // ------------------------------------------------------
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

      {/* Write Form */}
      <Card>
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>반려동물과 머문 숙소를 공유해주세요</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {!isAuthenticated ? (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm mb-3">로그인 후 작성할 수 있습니다.</p>
              <Button onClick={() => onShowAuth("login")}>로그인</Button>
            </div>
          ) : (
            <>
  
{/* 숙소 선택 */}
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className="w-full justify-between"
    >
      {newPost.accommodation_name || "숙소 선택하기"}
    </Button>
  </PopoverTrigger>

  <PopoverContent
    align="start"
    sideOffset={4}
    className="p-0 w-[var(--radix-popover-trigger-width)] min-w-0"
  >
    <div className="max-h-60 overflow-y-auto">
      <div className="px-3 py-2 text-sm text-muted-foreground">
        숙소 목록
      </div>

      {ACC_LIST.map((name) => (
        <button
          key={name}
          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
          onClick={() =>
            setNewPost({ ...newPost, accommodation_name: name })
          }
        >
          {name}
        </button>
      ))}
    </div>
  </PopoverContent>
</Popover>


              {/* 제목 */}
              <Input
                placeholder="제목"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost({ ...newPost, title: e.target.value })
                }
              />

              {/* 내용 */}
              <Textarea
                placeholder="내용을 입력하세요"
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
              />

              {/* 평점 */}
              <div className="flex items-center gap-3">
                <span className="text-sm">평점 :</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-5 w-5 cursor-pointer ${
                        newPost.rating >= n
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      onClick={() => setNewPost({ ...newPost, rating: n })}
                    />
                  ))}
                </div>
              </div>

              {/* 이미지 업로드 */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium">사진 추가 (선택)</span>
    {uploadingImages && (
      <span className="text-xs text-muted-foreground">
        업로드 중...
      </span>
    )}
  </div>

<Input
  key={fileInputKey}          // ⭐ 이 줄 추가
  type="file"
  accept="image/*"
  multiple
  onChange={handleImageUpload}
  disabled={uploadingImages}
  ref={fileInputRef}
/>

  {/* 미리보기 */}
  {newPostImages.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-2">
      {newPostImages.map((url, idx) => (
        <div
          key={idx}
          className="w-20 h-20 rounded-md overflow-hidden border bg-muted"
        >
          <img
            src={url}
            alt={`업로드 이미지 ${idx + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  )}
</div>


              {/* 작성 버튼 */}
              <Button className="w-full" onClick={createPost}>
                <Plus className="h-4 w-4 mr-2" /> 작성하기
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------
          POSTS
      ------------------------------------------------------ */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={post.profiles?.profile_photo_url || ""} />
                    <AvatarFallback>
                      {post.profiles?.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-medium text-sm">
                      {post.profiles?.username || "익명"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.accommodation_name} • {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Delete Post */}
                {currentUserId === post.user_id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Title + Content */}
              <h4 className="font-semibold">{post.title}</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {post.content}
              </p>

              {/* 이미지 영역 */}
{post.images && post.images.length > 0 && (
  <div className="mt-3 grid grid-cols-3 gap-2">
    {post.images.map((url, idx) => (
      <div
        key={idx}
        className="w-full h-24 rounded-md overflow-hidden bg-muted"
      >
        <img
          src={url}
          alt={`후기 이미지 ${idx + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
    ))}
  </div>
)}


              {/* Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      post.rating >= n
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Like + Comment Buttons */}
              <div className="flex gap-6 items-center border-t pt-3">
                <button
                  className="flex items-center gap-1 text-sm"
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      likes[post.id]
                        ? "fill-red-500 text-red-500"
                        : "text-muted-foreground"
                    }`}
                  />
                  {likeCounts[post.id] || 0}
                </button>

                <button
                  className="flex items-center gap-1 text-sm"
                  onClick={() =>
                    setExpandedPostId(
                      expandedPostId === post.id ? null : post.id
                    )
                  }
                >
                  <MessageCircle className="h-5 w-5" />
                  댓글
                </button>
              </div>

              {/* Comments */}
              {expandedPostId === post.id && (
                <div className="space-y-4 pt-3 bg-muted/20 p-4 rounded-lg">

                  {/* Comment List */}
                  {comments[post.id]?.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 bg-white p-3 rounded-lg border relative"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={c.profiles?.profile_photo_url || ""} />
                        <AvatarFallback>
                          {c.profiles?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {c.profiles?.username || "익명"}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {c.content}
                        </p>
                      </div>

                      {/* Delete comment */}
                      {currentUserId === c.user_id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

{/* Comment Input */}
{isAuthenticated ? (
  <div className="mt-2 space-y-2">
    {/* 댓글 입력칸: 가로 꽉 + 적당한 높이 */}
    <Textarea
      className="w-full min-h-[70px] text-sm resize-none"
      placeholder="댓글 입력..."
      value={commentInput[post.id] || ""}
      onChange={(e) =>
        setCommentInput({
          ...commentInput,
          [post.id]: e.target.value,
        })
      }
    />

    {/* 등록 버튼: 아래에 작게 / 오른쪽 정렬 */}
    <div className="flex justify-end">
      <Button
        size="sm"
        className="px-4"
        onClick={() => addComment(post.id)}
        disabled={addingComment === post.id}
      >
        등록
      </Button>
    </div>
  </div>
) : (
  <p className="text-sm text-muted-foreground">
    로그인 후 댓글 작성 가능
  </p>
)}

                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
