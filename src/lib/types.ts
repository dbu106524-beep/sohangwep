export type Role = "user" | "admin";

export type Profile = {
  id: string;
  discord_id: string | null;
  display_name: string;
  avatar_url: string | null;
  minecraft_uuid: string | null;
  minecraft_account_name: string | null;
  minecraft_name: string | null;
  community_role_verified: boolean;
  cash_balance: number;
  role: Role;
  created_at: string;
};

export type MinecraftLink = {
  discord_id: string;
  discord_name: string | null;
  minecraft_uuid: string;
  minecraft_account_name: string | null;
  minecraft_name: string;
  community_role_verified: boolean;
  linked_at: string;
  updated_at: string;
};

export type Notice = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: "notice" | "update" | "event";
  image_url: string | null;
  image_urls?: string[] | null;
  published: boolean;
  created_at: string;
};

export type Guide = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  icon: string;
};

export type LegalPageSlug = "service" | "privacy" | "refund";

export type LegalPage = {
  slug: LegalPageSlug;
  title: string;
  description: string;
  content: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  product_kind: "credit" | "goods";
  price_krw: number;
  discount_percent: number;
  cash_amount: number;
  image_url: string | null;
  image_urls?: string[] | null;
  minecraft_item_key: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  amount_krw: number;
  product_kind: "credit" | "goods";
  shipping_recipient: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_message: string | null;
  tracking_carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  status: "pending" | "paid" | "fulfilled" | "failed" | "refunded" | "shipped";
  payment_provider: "test" | "ready";
  payment_reference: string | null;
  created_at: string;
};

export type AdminPurchase = Purchase & {
  profile?: Pick<Profile, "display_name" | "discord_id" | "minecraft_account_name" | "minecraft_name" | "avatar_url"> | null;
};

export type CommunityCategory = "screenshot" | "free" | "tips";

export type CommunityPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  title: string;
  slug: string;
  content: string;
  category: CommunityCategory;
  image_url: string | null;
  image_urls?: string[] | null;
  view_count: number;
  featured: boolean;
  featured_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, "display_name" | "avatar_url" | "role"> | null;
  comment_count?: number;
  like_count?: number;
  liked_by_current_user?: boolean;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
};

export type CurrentUser = {
  id: string;
  email?: string;
  discordId: string | null;
  name: string;
  avatarUrl: string | null;
  profile: Profile | null;
  isAdmin: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      minecraft_links: {
        Row: MinecraftLink;
        Insert: Omit<MinecraftLink, "linked_at" | "updated_at"> & Partial<Pick<MinecraftLink, "linked_at" | "updated_at">>;
        Update: Partial<MinecraftLink>;
        Relationships: [];
      };
      notices: {
        Row: Notice;
        Insert: Omit<Notice, "id" | "created_at"> & Partial<Pick<Notice, "id" | "created_at">>;
        Update: Partial<Notice>;
        Relationships: [];
      };
      guides: {
        Row: Guide;
        Insert: Guide;
        Update: Partial<Guide>;
        Relationships: [];
      };
      legal_pages: {
        Row: LegalPage;
        Insert: LegalPage;
        Update: Partial<LegalPage>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at"> & Partial<Pick<Product, "id" | "created_at">>;
        Update: Partial<Product>;
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: Omit<Purchase, "id" | "created_at"> & Partial<Pick<Purchase, "id" | "created_at">>;
        Update: Partial<Purchase>;
        Relationships: [];
      };
      community_posts: {
        Row: CommunityPost;
        Insert: Omit<
          CommunityPost,
          "id" | "created_at" | "updated_at" | "author" | "comment_count" | "like_count" | "liked_by_current_user" | "view_count" | "featured" | "featured_at"
        > &
          Partial<
            Pick<
              CommunityPost,
              "id" | "created_at" | "updated_at" | "view_count" | "featured" | "featured_at"
            >
          >;
        Update: Partial<Omit<CommunityPost, "author">>;
        Relationships: [];
      };
      community_comments: {
        Row: CommunityComment;
        Insert: Omit<CommunityComment, "id" | "created_at"> & Partial<Pick<CommunityComment, "id" | "created_at" | "parent_id">>;
        Update: Partial<CommunityComment>;
        Relationships: [];
      };
      community_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<{ post_id: string; user_id: string; created_at: string }>;
        Relationships: [];
      };
      community_post_views: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<{ post_id: string; user_id: string; created_at: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
