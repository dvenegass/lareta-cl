// Tipos que reflejan las respuestas JSON del backend.

import type { ThemeMode } from "./theme/theme";

export type User = {
  id: number;
  username: string;
  avatar: string | null;
};

export type CurrentUser = User & {
  email: string;
  theme_color: string;
  theme_mode: ThemeMode;
  show_decor: boolean;
};

// ---------- Juntas ----------

export type AttendanceStatus = "going" | "not_going";
export type Arrival = "on_time" | "late" | "absent";
export type MoneyMode = "none" | "fixed" | "shared";

export type Participant = {
  user: User;
  status: AttendanceStatus;
  arrival: Arrival | null;
  fee_paid: boolean;
  updated_at: string;
};

export type GroupRef = {
  id: number;
  name: string;
  photo: string | null;
};

export type EventSummary = {
  id: string;
  title: string;
  starts_at: string; // ISO 8601
  location: string;
  creator: User;
  group: GroupRef | null;
  going_count: number;
  my_status: AttendanceStatus | null;
  is_cancelled: boolean;
};

/** Una junta del historial: además, cuántas fotos tiene su álbum y su portada. */
export type HistoryEvent = EventSummary & {
  photo_count: number;
  cover_image: string | null;
};

export type EventDetail = EventSummary & {
  description: string;
  money_mode: MoneyMode;
  fee_amount: number | null;
  bring_list_enabled: boolean;
  polls_enabled: boolean;
  comments_enabled: boolean;
  cancelled_at: string | null;
  cancel_reason: string;
  participants: Participant[];
  is_creator: boolean;
  has_started: boolean;
  /** false si la junta es de un grupo del que no eres miembro. */
  can_join: boolean;
  created_at: string;
  updated_at: string;
};

export type EventInput = {
  title: string;
  description: string;
  starts_at: string;
  location: string;
  group: number | null;
  money_mode: MoneyMode;
  fee_amount: number | null;
  bring_list_enabled: boolean;
  polls_enabled: boolean;
  comments_enabled: boolean;
  /** Solo al crear: la lista inicial de "qué llevar". */
  bring_items?: string[];
};

export type EventListScope = "upcoming" | "created";

export type ParticipantUpdate = {
  arrival?: Arrival | null;
  fee_paid?: boolean;
};

// ---------- Amigos ----------

export type Relationship = "friends" | "request_sent" | "request_received" | "none";

export type FriendRequest = {
  id: number;
  user: User; // la otra persona
  created_at: string;
};

export type FriendRequests = {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export type UserSearchResult = {
  user: User;
  relationship: Relationship;
};

// ---------- Notificaciones ----------

export type NotificationKind =
  | "friend_request"
  | "friend_accepted"
  | "group_added"
  | "group_event"
  | "event_changed"
  | "event_reminder"
  | "event_cancelled"
  | "event_reactivated";

export type NotificationTarget =
  | { type: "friends" }
  | { type: "user"; username: string }
  | { type: "group"; id: number }
  | { type: "event"; id: string };

export type AppNotification = {
  id: number;
  kind: NotificationKind;
  text: string;
  target: NotificationTarget | null;
  actor: User | null;
  created_at: string;
  is_read: boolean;
};

// ---------- Perfil de otra persona ----------

export type ProfileRelationship = Relationship | "self";

export type UserProfile = {
  user: User;
  date_joined: string;
  relationship: ProfileRelationship;
  /** Id de la solicitud pendiente (enviada o recibida), para aceptar o cancelar. */
  pending_request_id: number | null;
  friends_count: number;
  points: number;
  level: Level;
  /** null si no son amigos: las estadísticas solo las ven los amigos. */
  stats: { attended: number; on_time: number; events_organized: number; places: number } | null;
  common_groups: GroupRef[];
  shared_upcoming: EventSummary[];
};

// ---------- Grupos ----------

export type GroupSummary = GroupRef & {
  description: string;
  member_count: number;
  members_preview: User[];
};

export type GroupDetail = GroupRef & {
  description: string;
  owner: User | null;
  members: { user: User; joined_at: string; is_owner: boolean }[];
  is_owner: boolean;
  created_at: string;
};

// ---------- Votaciones ----------

export type PollOption = {
  id: number;
  text: string;
  votes: number;
};

export type Poll = {
  id: number;
  question: string;
  created_by: User;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  my_vote: number | null;
  can_delete: boolean;
};

// ---------- Qué llevar ----------

export type BringItem = {
  id: number;
  name: string;
  assigned_to: User | null;
  can_delete: boolean;
  can_release: boolean;
  created_at: string;
};

// ---------- Comentarios ----------

export type EventComment = {
  id: number;
  author: User;
  body: string;
  created_at: string;
  can_delete: boolean;
};

// ---------- Álbum de fotos ----------

export type EventPhoto = {
  id: number;
  image: string;
  width: number | null;
  height: number | null;
  uploaded_by: User;
  created_at: string;
  can_delete: boolean;
};

// ---------- Chat de grupo ----------

export type ChatMessage = {
  id: number;
  author: User;
  body: string;
  /** Imagen subida (con sus dimensiones, para reservar el espacio). */
  image: string | null;
  image_width: number | null;
  image_height: number | null;
  /** GIF de KLIPY. */
  gif_url: string;
  gif_width: number | null;
  gif_height: number | null;
  created_at: string;
  can_delete: boolean;
};

/** Un GIF del buscador de KLIPY (ya simplificado por el backend). */
export type Gif = {
  id: string;
  title: string;
  url: string;
  width: number | null;
  height: number | null;
  preview_url: string;
  preview_width: number | null;
  preview_height: number | null;
};

/** Lo que se envía al chat: texto y, opcionalmente, una imagen o un GIF. */
export type ChatDraft = {
  body: string;
  image?: File | null;
  gif?: Gif | null;
};

/** Avisos que llegan por el WebSocket del chat. */
export type ChatSocketEvent =
  | { type: "message.created"; message: ChatMessage }
  | { type: "message.deleted"; id: number }
  | { type: "typing"; user: Pick<User, "id" | "username"> };

// ---------- Gastos compartidos ----------

export type Expense = {
  id: number;
  description: string;
  amount: number;
  paid_by: User;
  created_at: string;
  can_delete: boolean;
};

export type ExpenseSummary = {
  expenses: Expense[];
  total: number;
  people_count: number;
  per_person: number;
  balances: { user: User; paid: number; share: number; balance: number }[];
  settlements: { from_user: User; to_user: User; amount: number }[];
};

export type ExpenseInput = {
  description: string;
  amount: number;
  paid_by: number;
};

// ---------- Puntos y rankings ----------

export type Level = {
  number: number;
  name: string;
  min_points: number;
};

export type ProfileStats = {
  points: number;
  level: Level;
  next_level: Level | null;
  max_level: number;
  breakdown: { label: string; count: number; points: number }[];
  stats: Record<string, number>;
};

export type Ranking = {
  key: string;
  title: string;
  unit: string;
  entries: { user: User; value: number }[];
};

export type Rankings = {
  group: GroupRef | null; // null = entre amigos
  people_count: number;
  rankings: Ranking[];
};
