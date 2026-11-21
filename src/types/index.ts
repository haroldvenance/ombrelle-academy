// ─── Rôles ──────────────────────────────────────────────────────
export type Role = "student" | "instructor" | "admin" | "superadmin";

// ─── Blocs de leçon ─────────────────────────────────────────────
export type BlockType =
  | "heading"
  | "text"
  | "definition"
  | "example"
  | "warning"
  | "image"
  | "table"
  | "quote"
  | "summary"
  | "list"
  | "question"
  | "activity";

export type Block =
  | { type: "heading" | "text" | "definition" | "example" | "warning" | "quote" | "summary" | "question"; text?: string }
  | { type: "list"; items?: string[] }
  | { type: "image"; url?: string; caption?: string }
  | { type: "table"; headers?: string[]; rows?: string[][] }
  | { type: "activity"; activity_id?: string; text?: string };

// ─── Profil ─────────────────────────────────────────────────────
export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  role: Role;
  is_suspended: boolean;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  bio: string | null;
  timezone: string | null;
  created_at: string;
};

// ─── Formation ──────────────────────────────────────────────────
// Aligné sur le CHECK SQL : draft | review | published | archived
export type FormationStatus = "draft" | "review" | "published" | "archived";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LearningMode = "classic" | "interactive" | "intensive";

export type Formation = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  price: number;
  currency: string;
  difficulty: Difficulty;
  status: FormationStatus;
  duration_days: number | null;
  objectives: string[] | null;
  allow_partial_access: boolean;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
};

// ─── Leçon ──────────────────────────────────────────────────────
export type LessonStatus = "draft" | "review" | "published" | "archived";

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: Block[] | null;
  status: LessonStatus;
  version: number;
  position: number;
  xp_reward: number;
  estimated_duration: number | null;
  created_by: string | null;
};

// ─── Activité / Quiz ────────────────────────────────────────────
// Aligné sur le CHECK SQL (11 types autorisés).
export type ActivityType =
  | "quiz"
  | "true_false"
  | "multiple_choice"
  | "single_choice"
  | "matching"
  | "sorting"
  | "fill_blank"
  | "challenge"
  | "simulation"
  | "exercise"
  | "memory";

export type Activity = {
  id: string;
  formation_id: string;
  module_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  type: ActivityType;
  status: "draft" | "review" | "published" | "archived";
  xp_reward: number;
  configuration: {
    passing_score?: number;
    max_attempts?: number | null;
    shuffle_questions?: boolean;
    shuffle_answers?: boolean;
  };
};

// ─── Question ───────────────────────────────────────────────────
// Aligné sur le CHECK SQL : 3 types pour l'instant (autres prévus)
export type QuestionType = "single_choice" | "multiple_choice" | "true_false";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  feedback: string | null;
  position: number;
};

export type Question = {
  id: string;
  formation_id: string;
  module_id: string | null;
  question_text: string;
  question_type: QuestionType;
  difficulty: QuestionDifficulty;
  points: number;
  explanation: string | null;
  tags: string[] | null;
  created_by: string | null;
  options?: QuestionOption[];
};

// ─── Paiement ───────────────────────────────────────────────────
// Aligné sur le CHECK SQL : snake_case.
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod =
  | "orange_money"
  | "mtn_momo"
  | "bank_transfer"
  | "cash"
  | "other";

export type Payment = {
  id: string;
  enrollment_id: string | null; // NULL si le compte étudiant a été supprimé
  user_id: string | null;       // NULL si le compte étudiant a été supprimé
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  proof_url: string | null;
  admin_comment: string | null;
  paid_on: string | null;
  created_at: string;
};

// ─── Inscription ────────────────────────────────────────────────
export type EnrollmentStatus = "pending" | "active" | "suspended" | "completed" | "cancelled";

export type Enrollment = {
  id: string;
  user_id: string;
  formation_id: string;
  status: EnrollmentStatus;
  learning_mode: LearningMode;
  payment_status: PaymentStatus | "partially_paid";
  enrolled_at: string;
  completed_at: string | null;
};