export type Block = {
  type: "heading" | "text" | "definition" | "example" | "warning" | "image" | "table" | "quote" | "summary" | "list" | "question" | "activity";
  text?: string; items?: string[]; url?: string; caption?: string; headers?: string[]; rows?: string[][]; activity_id?: string;
};
export type Role = "student" | "instructor" | "admin" | "superadmin";
