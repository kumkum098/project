import mongoose, { Model, Schema } from "mongoose";

// User roles supported by the ticket resale marketplace.
export enum UserRole {
  BUYER = "BUYER",
  SELLER = "SELLER",
  ADMIN = "ADMIN",
}

export interface IUserSettings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  appearance: {
    theme: "dark" | "light" | "system";
    layoutDensity: "comfortable" | "compact";
  };
  privacy: {
    profileVisibility: "public" | "private" | "connections";
    searchVisibility: boolean;
    allowDataSharing: boolean;
  };
  security: {
    twoFactorAuth: "disabled" | "sms" | "authenticator";
    sessionTimeout: "never" | "15min" | "30min" | "1hour";
  };
}

// TypeScript shape for a User document stored in MongoDB.
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  trustScore: number;
  username?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  profilePicture?: string;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  settings?: IUserSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema defines validation rules, defaults, and collection structure.
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BUYER,
      required: true,
    },
    trustScore: {
      type: Number,
      default: 0,
      min: [0, "Trust score cannot be negative"],
      max: [100, "Trust score cannot exceed 100"],
    },
    username: {
      type: String,
      trim: true,
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [50, "City cannot exceed 50 characters"],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, "State cannot exceed 50 characters"],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, "Country cannot exceed 50 characters"],
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    settings: {
      type: {
        notifications: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
        },
        appearance: {
          theme: {
            type: String,
            enum: ["dark", "light", "system"],
            default: "system",
          },
          layoutDensity: {
            type: String,
            enum: ["comfortable", "compact"],
            default: "comfortable",
          },
        },
        privacy: {
          profileVisibility: {
            type: String,
            enum: ["public", "private", "connections"],
            default: "public",
          },
          searchVisibility: { type: Boolean, default: true },
          allowDataSharing: { type: Boolean, default: false },
        },
        security: {
          twoFactorAuth: {
            type: String,
            enum: ["disabled", "sms", "authenticator"],
            default: "disabled",
          },
          sessionTimeout: {
            type: String,
            enum: ["never", "15min", "30min", "1hour"],
            default: "never",
          },
        },
      },
      default: {
        notifications: {
          email: true,
          push: true,
        },
        appearance: {
          theme: "system",
          layoutDensity: "comfortable",
        },
        privacy: {
          profileVisibility: "public",
          searchVisibility: true,
          allowDataSharing: false,
        },
        security: {
          twoFactorAuth: "disabled",
          sessionTimeout: "never",
        },
      },
    },
  },
  {
    // Automatically creates createdAt and updatedAt fields.
    timestamps: true,
  }
);

// Reuse an existing model during Next.js hot reloads to prevent overwrite errors.
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
