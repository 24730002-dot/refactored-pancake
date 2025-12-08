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

  // 숙소 선택 Popover 열림/닫힘
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // 새 글 이미지 URL들
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // file input 리셋용 key
  const [fileInputKey, setFileInputKey] = useState(0);

  // 파일 인풋 ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ 이미지 확대 보기용 상태
  const [previewImage, setPreviewImage] = useState<string | null>(null);


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
  // Render
  // ------------------------------------------------------
return (
  <>
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* -------------------- 글쓰기 폼 -------------------- */}
      <Card className="mb-8">   {/* 👈 후기 작성 카드 아래 여백 추가 */}
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>
            반려동물과 머문 숙소를 공유해주세요
          </CardDescription>
        </CardHeader>

         <CardContent className="space-y-4 pb-8">
            {!isAuthenticated ? (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-sm mb-3">로그인 후 작성할 수 있습니다.</p>
                <Button onClick={() => onShowAuth("login")}>로그인</Button>
              </div>
              
            ) : (
              <>
                {/* 숙소 선택 */}
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {newPost.accommodation_name || "숙소 선택하기"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="p-0 w-[200px]">
                    <div className="max-h-60 overflow-y-auto">
                      {ACC_LIST.map((name) => (
                        <button
                          key={name}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setNewPost({
                              ...newPost,
                              accommodation_name: name,
                            });
                            setIsPopoverOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 평점 */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm">평점 :</span>
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

{/* 커스텀 파일 업로드 UI */}
<div>
<button
  type="button"
  className="
  w-full py-2 px-3 rounded-md border
  bg-white
  text-sm text-left cursor-pointer
  hover:bg-muted
  text-black
  dark:text-black
  "
  onClick={() => fileInputRef.current?.click()}
>
  📷 사진 선택 (여러 장 가능)
</button>



  <input
    key={fileInputKey}
    type="file"
    accept="image/*"
    multiple
    onChange={handleImageUpload}
    disabled={uploadingImages}
    ref={fileInputRef}
    className="hidden"
  />

  {/* 선택된 파일 표시 */}
  {newPostImages.length > 0 && (
    <p className="text-xs text-muted-foreground mt-1">
      {newPostImages.length}개의 사진 선택됨
    </p>
  )}
</div>


   {/* 미리보기 */}
    {newPostImages.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-2">
        {newPostImages.map((url, idx) => (
          <img
            key={idx}
            src={url}
            className="w-20 h-20 rounded-md object-cover border"
          />
        ))}
      </div>
    )}

    <Button className="w-full mt-2" onClick={createPost}>
      <Plus className="h-4 w-4 mr-2" />
      작성하기
    </Button>

    
{/* 🔥 버튼 아래 여백 추가 */}
<div className="h-4"></div> 

  </>
            )}
          </CardContent>
        </Card>

        {/* -------------------- 게시글 리스트 -------------------- */}
{loading ? (
  <div className="flex justify-center py-10">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
) : (
  posts.map((post) => {
    const commentCount = comments[post.id]?.length || 0;

    return (
      <Card key={post.id} className="shadow-sm rounded-2xl">
        <CardContent className="p-6 md:p-7 space-y-4 md:space-y-5">
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

            {/* 글 삭제 버튼 */}
            {currentUserId === post.user_id && (
              <button
                onClick={() => deletePost(post.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* ⭐ 평점 (제목 위로 이동) */}
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

          {/* 제목 + 내용 */}
          <h4 className="font-semibold text-base md:text-lg">{post.title}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {post.content}
          </p>

          {/* 이미지 (클릭하면 확대) */}
          {post.images && post.images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {post.images.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full h-24 rounded-md overflow-hidden bg-muted"
                  onClick={() => setPreviewImage(url)}
                >
                  <img
                    src={url}
                    alt={`후기 이미지 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 좋아요 + 댓글 버튼 */}
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
              <span>
                댓글{commentCount > 0 ? ` ${commentCount}` : ""}
              </span>
            </button>
          </div>

          {/* 댓글 영역 */}
          {expandedPostId === post.id && (
            <div className="space-y-4 pt-3 bg-muted/20 p-4 rounded-lg">
              {/* 댓글 리스트 */}
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

                  {/* 댓글 삭제 */}
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

              {/* 댓글 입력 */}
              {isAuthenticated ? (
                <div className="mt-2 space-y-2">
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
    );
  })
)}

      </div>

      {/* -------------------- 🔥 이미지 확대 모달 -------------------- */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
