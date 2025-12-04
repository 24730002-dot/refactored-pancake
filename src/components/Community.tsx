import React, { useEffect, useState } from "react";
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

// -------------------------------
// 숙소 더미 데이터 (검색 제거 버전)
// -------------------------------
const ACC_LIST = [
  "제주 오션뷰 펫 리조트",
  "강릉 바다 애견 호텔",
  "서울 펫 프렌들리 호텔",
  "포항 힐링 애견 리조트",
  "부산 해변 애견 펜션",
];

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

export function Community({ isAuthenticated, onShowAuth }: CommunityProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showAccList, setShowAccList] = useState(false);

  const [newPost, setNewPost] = useState({
    accommodation_name: "",
    rating: 5,
    title: "",
    content: "",
  });

  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [addingComment, setAddingComment] = useState<number | null>(null);

  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

  // 로그인한 사용자 불러오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // -------------------------------
  // 게시글 불러오기
  // -------------------------------
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
      toast.error("게시글 불러오기 실패");
      setLoading(false);
      return;
    }

    setPosts(data || []);
    await fetchLikeInfo(data || []);
    await fetchAllComments(data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // -------------------------------
  // 좋아요/댓글 불러오기
  // -------------------------------
  const fetchLikeInfo = async (posts: Post[]) => {
    const likeMap: Record<number, boolean> = {};
    const countMap: Record<number, number> = {};

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    for (const post of posts) {
      const { count } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
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

  const fetchAllComments = async (posts: Post[]) => {
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
      profiles:user_id(username, profile_photo_url)
    `
        )
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      map[post.id] = data || [];
    }

    setComments(map);
  };

  // -------------------------------
  // 게시글 작성
  // -------------------------------
  const handleCreatePost = async () => {
    if (!isAuthenticated) return onShowAuth("login");

    const { accommodation_name, title, content } = newPost;

    if (!accommodation_name || !title || !content) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setCreatingPost(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    await supabase.from("community_posts").insert({
      user_id: data.user.id,
      ...newPost,
      images: null,
    });

    toast.success("작성 완료!");

    setNewPost({ accommodation_name: "", rating: 5, title: "", content: "" });
    setShowAccList(false);
    fetchPosts();
    setCreatingPost(false);
  };

  // -------------------------------
  // 댓글 작성
  // -------------------------------
  const addComment = async (postId: number) => {
    const text = commentInput[postId];
    if (!text?.trim()) return;

    const { data } = await supabase.auth.getUser();
    if (!data.user) return onShowAuth("login");

    setAddingComment(postId);

    await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: data.user.id,
      content: text,
    });

    setCommentInput({ ...commentInput, [postId]: "" });
    fetchPosts();

    setAddingComment(null);
  };

  // -------------------------------
  // 날짜 포맷
  // -------------------------------
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* ------------------- 작성 박스 ------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>반려동물과 머문 숙소를 공유해주세요!</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* 숙소 선택 */}
          <div className="relative">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowAccList(!showAccList)}
            >
              {newPost.accommodation_name || "숙소 선택하기"}
            </Button>

            {showAccList && (
              <div className="absolute z-10 w-full bg-white border rounded-lg shadow-md mt-2 max-h-48 overflow-y-auto">
                {ACC_LIST.map((name) => (
                  <button
                    key={name}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setNewPost({ ...newPost, accommodation_name: name });
                      setShowAccList(false);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 제목 */}
          <Input
            placeholder="제목"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />

          {/* 내용 */}
          <Textarea
            placeholder="내용을 입력하세요"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />

          {/* 평점 */}
          <div className="flex items-center gap-2">
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

          {/* 작성 버튼 */}
          <Button
            onClick={handleCreatePost}
            className="w-full"
            disabled={creatingPost}
          >
            {creatingPost ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" /> 작성하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ------------------- 게시글 목록 ------------------- */}
      {!loading &&
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

                {currentUserId === post.user_id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div>
                <h4 className="font-semibold">{post.title}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {post.content}
                </p>
              </div>

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

              {/* Buttons */}
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

              {/* 댓글 영역 */}
              {expandedPostId === post.id && (
                <div className="space-y-4 pt-3 bg-muted/20 p-4 rounded-lg">
                  {/* 댓글 리스트 */}
                  {comments[post.id]?.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 bg-white p-3 rounded-lg border"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={c.profiles?.profile_photo_url || ""}
                        />
                        <AvatarFallback>
                          {c.profiles?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="text-sm font-medium">
                          {c.profiles?.username || "익명"}
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* 댓글 입력창 (수정됨) */}
                  {isAuthenticated ? (
                    <div className="flex items-center gap-3 mt-2">
                      <Input
                        className="flex-1"
                        placeholder="댓글 입력…"
                        value={commentInput[post.id] || ""}
                        onChange={(e) =>
                          setCommentInput({
                            ...commentInput,
                            [post.id]: e.target.value,
                          })
                        }
                      />
                      <Button
                        className="h-10 px-4"
                        onClick={() => addComment(post.id)}
                        disabled={addingComment === post.id}
                      >
                        등록
                      </Button>
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
        ))}
    </div>
  );
}
