import { DUMMY_POSTS, DUMMY_COMMENTS } from "../data/communityDummy";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Loader2, Heart, MessageCircle, Star, Plus } from "lucide-react";
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
    username: string |null;
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

  // -------------------------------
  // Fetch all posts + load profiles
  // -------------------------------
const fetchPosts = async () => {
  setLoading(true);

  // 1) Supabase posts 불러오기
  const { data: supaPosts, error } = await supabase
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
  }

  const supabasePosts = supaPosts || [];

  // 2) 더미 데이터 + Supabase 데이터 합치기
  const merged = [
    ...DUMMY_POSTS.map((p) => ({
      ...p,
      profiles: {
        username: p.username || "익명",
        profile_photo_url: p.profile_photo_url || null,
      },
    })),
    ...supabasePosts,
  ];

  setPosts(merged);

  // 3) 좋아요 정보 + 댓글 정보도 합쳐서 불러오기
  await fetchLikeInfo(merged);
  await fetchAllComments(merged);

  setLoading(false);
};


  // ------------------------
  // Fetch like counts + mine
  // ------------------------
  const fetchLikeInfo = async (posts: Post[]) => {
    const likeMap: Record<number, boolean> = {};
    const countMap: Record<number, number> = {};

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    for (const post of posts) {
      const { count } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
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

  // ------------------------
  // Fetch comments per post
  // ------------------------
const fetchAllComments = async (posts: Post[]) => {
  const map: Record<number, Comment[]> = {};

  for (const post of posts) {
    // Supabase 댓글
    const { data: supaComments } = await supabase
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

    // 더미 댓글
    const dummy = (DUMMY_COMMENTS[post.id] || []).map((c: any) => ({
      ...c,
      profiles: {
        username: c.username,
        profile_photo_url: c.profile_photo_url,
      },
    }));

    // 합치기
    map[post.id] = [...dummy, ...(supaComments || [])];
  }

  setComments(map);
};


  useEffect(() => {
    fetchPosts();
  }, []);
  // ------------------------
  // Create new post
  // ------------------------
  const handleCreatePost = async () => {
    if (!isAuthenticated) return onShowAuth("login");

    const { accommodation_name, rating, title, content } = newPost;

    if (!accommodation_name || !title || !content) {
      return toast.error("모든 필드를 입력해주세요.");
    }

    setCreatingPost(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      accommodation_name,
      rating,
      title,
      content,
      images: null,
    });

    if (error) {
      console.error(error);
      toast.error("게시글 작성 실패");
    } else {
      toast.success("게시글이 등록되었습니다!");
      setNewPost({
        accommodation_name: "",
        rating: 5,
        title: "",
        content: "",
      });
      fetchPosts();
    }

    setCreatingPost(false);
  };

  // ------------------------
  // Toggle like
  // ------------------------
  const toggleLike = async (postId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return onShowAuth("login");

    const alreadyLiked = likes[postId];

    if (alreadyLiked) {
      // Unlike
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      setLikes({ ...likes, [postId]: false });
      setLikeCounts({
        ...likeCounts,
        [postId]: (likeCounts[postId] || 1) - 1,
      });
    } else {
      // Like
      const { error } = await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
      });

      if (error) {
        console.error(error);
        return toast.error("좋아요 실패");
      }

      setLikes({ ...likes, [postId]: true });
      setLikeCounts({
        ...likeCounts,
        [postId]: (likeCounts[postId] || 0) + 1,
      });
    }
  };

  // ------------------------
  // Add comment
  // ------------------------
  const addComment = async (postId: number) => {
    const text = commentInput[postId];
    if (!text || text.trim() === "") return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return onShowAuth("login");

    setAddingComment(postId);

    const { error } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    if (error) {
      console.error(error);
      toast.error("댓글 등록 실패");
    } else {
      toast.success("댓글이 추가되었습니다!");
      setCommentInput({ ...commentInput, [postId]: "" });
      fetchPosts();
    }

    setAddingComment(null);
  };

  // ------------------------
  // Helper: format date
  // ------------------------
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };
  // ------------------------
  // RENDER
  // ------------------------
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* -------------------------
          글 작성 영역
      -------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>반려동물과 함께한 숙소 경험을 공유해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {!isAuthenticated && (
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                로그인 후 후기를 작성할 수 있습니다.
              </p>
              <Button onClick={() => onShowAuth("login")} size="sm">
                로그인하기
              </Button>
            </div>
          )}

          {isAuthenticated && (
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
                <span className="text-sm">평점:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-5 w-5 cursor-pointer ${
                        newPost.rating >= n
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      onClick={() =>
                        setNewPost({ ...newPost, rating: n })
                      }
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
                    <Plus className="h-4 w-4 mr-2" />
                    작성하기
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* -------------------------
          게시글 목록
      -------------------------- */}
      <div className="space-y-6">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading &&
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-6 space-y-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={post.profiles?.profile_photo_url || ""}
                    />
                    <AvatarFallback>
                      {post.profiles?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-medium">
                      {post.profiles?.username || "익명"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {post.accommodation_name} · {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Title + Content */}
                <div>
                  <h4 className="font-semibold mb-1">{post.title}</h4>
                  <p className="text-sm text-muted-foreground">
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

                {/* Like + Comment buttons */}
                <div className="flex items-center gap-6 pt-2 border-t">
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

                {/* 댓글 목록 */}
                {expandedPostId === post.id && (
                  <div className="pt-4 space-y-4">

                    {comments[post.id]?.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={c.profiles?.profile_photo_url || ""} />
                          <AvatarFallback>
                            {c.profiles?.username?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/40 rounded-lg p-3">
                          <p className="text-sm font-medium">
                            {c.profiles?.username || "익명"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* 댓글 입력 */}
                    {isAuthenticated ? (
                      <div className="flex gap-2 pt-2">
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
                      <div className="text-muted-foreground text-sm pt-2">
                        로그인 후 댓글을 작성할 수 있습니다.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
