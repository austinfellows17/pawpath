import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "OWNER" | "WALKER" | "ADMIN";
      emailVerified?: boolean;
    };
  }

  interface User {
    role?: "OWNER" | "WALKER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "OWNER" | "WALKER" | "ADMIN";
    emailVerified?: boolean;
  }
}
