import bcrypt from "bcryptjs";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import User, { type IUser, UserRole } from "@/models/User";

// Extend NextAuth types so the app can safely read marketplace-specific user data.
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      trustScore: number;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    trustScore: number;
  }
}

// Mirror the same custom claims on the JWT so the session callback can rehydrate them.
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    trustScore: number;
  }
}

type CredentialsInput = {
  email?: string;
  password?: string;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trustScore: number;
};

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "development-secret-key";

export const authOptions: NextAuthOptions = {
  // Use JWT sessions so login state stays stateless and works without a session table.
  session: {
    strategy: "jwt",
  },

  // Credentials Provider enables email/password authentication for marketplace users.
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "alex@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        // Read and normalize the submitted login fields before querying MongoDB.
        const { email, password } = credentials as CredentialsInput;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
          return null;
        }

        // Connect to MongoDB only when we have enough data to perform authentication.
        await connectDB();

        // Password is hidden by default in the schema, so request it explicitly here.
        const user = await User.findOne({ email: normalizedEmail })
          .select("+password")
          .exec();

        if (!user) {
          return null;
        }

        // Compare the plaintext password with the stored bcrypt hash.
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Return only the fields that should flow into the JWT and session.
        const authenticatedUser: AuthUser = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          trustScore: user.trustScore,
        };

        return authenticatedUser;
      },
    }),
  ],

  callbacks: {
    // Persist marketplace user fields into the JWT after a successful login.
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.id = user.id;
        token.role = user.role;
        token.trustScore = user.trustScore;
      }

      return token;
    },

    // Rehydrate the client session from the JWT so the UI can read user metadata.
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email;
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.trustScore = token.trustScore;
      }

      return session;
    },
  },

  // Route users back to the custom login page when NextAuth needs a sign-in screen.
  pages: {
    signIn: "/login",
  },

  // Keep the secret explicit so the JWT signing key is stable in all environments.
  secret: NEXTAUTH_SECRET,
};

export type { AuthUser, CredentialsInput, IUser };
