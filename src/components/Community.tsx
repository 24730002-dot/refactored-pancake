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
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Loader2, Heart, MessageCircle, Star, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [newPost, setNewPost] = useState({
    accommodation_name: "",
    rating: 5,
    title: "",
    content: "",
  });

  const [commentInput, setCommentInput] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [likes, setLikes] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
  const [addingComment, setAddingComment] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // -------------------------------
  // LOAD CURRENT USER
  // -------------------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // -------------------------------
  // FETCH POSTS
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
        profiles:user_id (
          username,
          profile_photo_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("게시글을 불러오는 데 실패했습니다.");
      setLoading(false);
      return;
    }

    setPosts(data || []);
    await fetchLikeInfo(data || []);
    await fetchAllComments(data || []);

    setLoading(false);
  };

  // -------------------------------
  // FETCH LIKE COUNTS
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

  // -------------------------------
  // FETCH COMMENTS
  // -------------------------------
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

  useEffect(() => {
    fetchPosts();
  }, []);

  // -------------------------------
  // CREATE POST
  // -------------------------------
  const handleCreatePost = async () => {
    if (!isAuthenticated) return onShowAuth("login");

    const { accommodation_name, rating, title, content } = newPost;

    if (!accommodation_name || !title || !content) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setCreatingPost(true);

    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { error } = await supabase.from("community_posts").insert({
      user_id: data.user.id,
      accommodation_name,
      rating,
      title,
      content,
      images: null,
    });

    if (error) {
      toast.error("게시글 작성 실패");
    } else {
      toast.success("게시글이 등록되었습니다!");
      setNewPost({ accommodation_name: "", rating: 5, title: "", content: "" });
      fetchPosts();
    }

    setCreatingPost(false);
  };

  // -------------------------------
  // DELETE POST
  // -------------------------------
  const deletePost = async (postId: number) => {
    const ok = confirm("정말 삭제하시겠습니까?");
    if (!ok) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast.error("삭제 실패");
    } else {
      toast.success("삭제되었습니다.");
      fetchPosts();
    }
  };

  // -------------------------------
  // LIKE TOGGLE
  // -------------------------------
  const toggleLike = async (postId: number) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return onShowAuth("login");

    const already = likes[postId];

    if (already) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", data.user.id);

      setLikes({ ...likes, [postId]: false });
      setLikeCounts({ ...likeCounts, [postId]: likeCounts[postId] - 1 });
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: data.user.id,
      });

      setLikes({ ...likes, [postId]: true });
      setLikeCounts({ ...likeCounts, [postId]: likeCounts[postId] + 1 });
    }
  };

  // -------------------------------
  // ADD COMMENT
  // -------------------------------
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

    toast.success("댓글이 추가되었습니다.");
    setCommentInput({ ...commentInput, [postId]: "" });
    fetchPosts();
    setAddingComment(null);
  };

  // -------------------------------
  // DATE FORMAT
  // -------------------------------
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
    });
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* 작성 박스 */}
      <Card>
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>반려동물과 머물렀던 숙소에 대해 작성해주세요.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm mb-3 text-muted-foreground">
                로그인 후 후기를 작성할 수 있습니다.
              </p>
              <Button onClick={() => onShowAuth("login")}>로그인하기</Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="숙소 이름"
                value={newPost.accommodation_name}
                onChange={(e) =>
                  setNewPost({ ...newPost, accommodation_name: e.target.value })
                }
              />

              <Input
                placeholder="제목"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost({ ...newPost, title: e.target.value })
                }
              />

              <Textarea
                placeholder="내용을 입력하세요"
                value={newPost.content}
                onChange={(e) =>
                  setNewPost({ ...newPost, content: e.target.value })
                }
              />

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
            </>
          )}
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading &&
        posts.map((post) => (
          <Card key={post.id} className="shadow-sm">
            <CardContent className="p-5 space-y-4">
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

                {/* 내 글일 때 삭제 */}
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
              <div className="space-y-1">
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

              {/* Like + Comment */}
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

              {/* 댓글 */}
              {expandedPostId === post.id && (
                <div className="space-y-4 pt-3 bg-muted/30 p-4 rounded-lg">
                  {comments[post.id]?.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 bg-white p-3 rounded-lg border"
                    >
                      <Avatar className="h-6 w-6">
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

                  {/* 댓글 입력 */}
                  {isAuthenticated ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="댓글 입력..."
                        value={commentInput[post.id] || ""}
                        onChange={(e) =>
                          setCommentInput({
                            ...commentInput,
                            [post.id]: e.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={() => addComment(post.id)}
                        disabled={addingComment === post.id}
                      >
                        {addingComment === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "등록"
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p classname="text-sm text-muted-foreground">
                      로그인 후 댓글을 작성할 수 있습니다.
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
