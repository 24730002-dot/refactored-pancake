# Database Schema Updates

## Profiles Table

The profiles table needs to include a `music_data` column to store user music preferences.

```sql
-- Add music_data column to profiles table
ALTER TABLE profiles ADD COLUMN music_data TEXT;

-- The music_data column will store JSON data with the following structure:
-- {
--   "title": "Track Title",
--   "url": "https://supabase-url/music/track.mp3",
--   "artist": "Artist Name"
-- }
```

## Existing Schema
The profiles table should have these columns:
- id (uuid, primary key)
- email (text)
- username (text, nullable)  
- phone (text, nullable)
- profile_photo_url (text, nullable)
- location (text, nullable)
- is_dark_mode (boolean, nullable)
- background_data (text, nullable) - stores JSON for background preferences
- music_data (text, nullable) - stores JSON for music preferences
- created_at (timestamp)
- updated_at (timestamp)

**Note:** Temperature unit preference (`use_fahrenheit`) is stored in localStorage instead of the database for both authenticated and guest users.

## Reviews Table (Community Feature)

```sql
-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accommodation_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    images TEXT[], -- Array of image URLs
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_likes table
CREATE TABLE review_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Create review_comments table
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Review likes policies
CREATE POLICY "Anyone can view review likes" ON review_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like reviews" ON review_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike reviews" ON review_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Review comments policies
CREATE POLICY "Anyone can view review comments" ON review_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON review_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON review_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON review_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Database functions for incrementing/decrementing counts
CREATE OR REPLACE FUNCTION increment_review_likes(review_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE reviews SET likes_count = likes_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_review_likes(review_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE reviews SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_review_comments(review_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE reviews SET comments_count = comments_count + 1 WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;
```

## Storage Buckets

```sql
-- Create storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review_images', 'review_images', true);

-- Set up storage policies
CREATE POLICY "Anyone can view review images" ON storage.objects FOR SELECT
    USING (bucket_id = 'review_images');

CREATE POLICY "Authenticated users can upload review images" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'review_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own review images" ON storage.objects FOR UPDATE
    USING (bucket_id = 'review_images' AND auth.uid() = owner);

CREATE POLICY "Users can delete own review images" ON storage.objects FOR DELETE
    USING (bucket_id = 'review_images' AND auth.uid() = owner);
```

## Row Level Security (RLS) - Profiles
Ensure RLS policies are set up to allow users to read/write their own profile data:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile  
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

## Notifications Table (알림 시스템)

```sql
-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'comment', 'like', 'reservation', 'message'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- ID of related review, reservation, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);
```

## Favorites Table (즐겨찾기/북마크)

```sql
-- Create favorites table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accommodation_id TEXT NOT NULL,
    accommodation_name TEXT NOT NULL,
    accommodation_data JSONB, -- Store accommodation details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, accommodation_id)
);

-- Create index
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_created_at ON favorites(created_at DESC);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);
```

## Messages Table (실시간 채팅)

```sql
-- Create chat_rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accommodation_id TEXT NOT NULL,
    accommodation_name TEXT NOT NULL,
    guest_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    host_id UUID, -- Can be null for demo purposes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_chat_rooms_guest_id ON chat_rooms(guest_id);
CREATE INDEX idx_chat_rooms_accommodation_id ON chat_rooms(accommodation_id);
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view own chat rooms" ON chat_rooms
    FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Guests can create chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Users can update own chat rooms" ON chat_rooms
    FOR UPDATE USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Messages policies
CREATE POLICY "Room participants can view messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = messages.room_id
            AND (chat_rooms.guest_id = auth.uid() OR chat_rooms.host_id = auth.uid())
        )
    );

CREATE POLICY "Room participants can send messages" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms
            WHERE chat_rooms.id = messages.room_id
            AND (chat_rooms.guest_id = auth.uid() OR chat_rooms.host_id = auth.uid())
        )
    );

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);
```

## Database Functions for Notifications

```sql
-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_related_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification when someone likes a review
CREATE OR REPLACE FUNCTION notify_review_like()
RETURNS TRIGGER AS $$
DECLARE
    review_owner UUID;
    liker_username TEXT;
BEGIN
    -- Get review owner
    SELECT user_id INTO review_owner
    FROM reviews
    WHERE id = NEW.review_id;
    
    -- Don't notify if user likes their own review
    IF review_owner != NEW.user_id THEN
        -- Get liker's username
        SELECT COALESCE(username, '사용자')
        INTO liker_username
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (
            review_owner,
            'like',
            '새로운 좋아요',
            liker_username || '님이 회원님의 후기를 좋아합니다',
            NEW.review_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_review_like
AFTER INSERT ON review_likes
FOR EACH ROW
EXECUTE FUNCTION notify_review_like();

-- Trigger to create notification when someone comments on a review
CREATE OR REPLACE FUNCTION notify_review_comment()
RETURNS TRIGGER AS $$
DECLARE
    review_owner UUID;
    commenter_username TEXT;
BEGIN
    -- Get review owner
    SELECT user_id INTO review_owner
    FROM reviews
    WHERE id = NEW.review_id;
    
    -- Don't notify if user comments on their own review
    IF review_owner != NEW.user_id THEN
        -- Get commenter's username
        SELECT COALESCE(username, '사용자')
        INTO commenter_username
        FROM profiles
        WHERE id = NEW.user_id;
        
        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES (
            review_owner,
            'comment',
            '새로운 댓글',
            commenter_username || '님이 회원님의 후기에 댓글을 남겼습니다',
            NEW.review_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_review_comment
AFTER INSERT ON review_comments
FOR EACH ROW
EXECUTE FUNCTION notify_review_comment();
```