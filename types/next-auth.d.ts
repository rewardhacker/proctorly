import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      name?: string | null;
      email?: string | null;
    };
  }
  interface User {
    isAdmin?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    tutorId?: string;
    isAdmin?: boolean;
  }
}
