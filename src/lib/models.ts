import mongoose, { Schema, model, models, type Document, type Types } from "mongoose";

/* ────────────────────────────── User ─────────────────────────────── */

export type Role = "DRIVER" | "MECHANIC" | "ADMIN";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name?: string;
  email: string;
  emailVerified?: Date;
  image?: string;
  password?: string;
  role: Role;
  phone?: string;
  isAvailable: boolean;
  isPremium: boolean;
  serviceRadius: number;
  responseTime: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Date },
    image: { type: String },
    password: { type: String },
    role: { type: String, enum: ["DRIVER", "MECHANIC", "ADMIN"], default: "DRIVER" },
    phone: { type: String },
    isAvailable: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    serviceRadius: { type: Number, default: 10 },
    responseTime: { type: Number, default: 30 },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
  },
  { timestamps: true }
);

export const User = models.User ?? model<IUser>("User", UserSchema);

/* ────────────────────────── RescueRequest ─────────────────────────── */

export type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ON_THE_WAY"
  | "COMPLETED"
  | "CANCELLED";

export interface IRescueRequest extends Document {
  _id: Types.ObjectId;
  status: RequestStatus;
  description: string;
  issueType: string;
  latitude: number;
  longitude: number;
  address?: string;
  driverId: Types.ObjectId;
  mechanicId?: Types.ObjectId;
  acceptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RescueRequestSchema = new Schema<IRescueRequest>(
  {
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "ON_THE_WAY", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    description: { type: String, required: true },
    issueType: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    driverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mechanicId: { type: Schema.Types.ObjectId, ref: "User" },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

RescueRequestSchema.index({ status: 1 });
RescueRequestSchema.index({ driverId: 1 });
RescueRequestSchema.index({ mechanicId: 1 });

export const RescueRequest =
  models.RescueRequest ?? model<IRescueRequest>("RescueRequest", RescueRequestSchema);

/* ─────────────────── NextAuth Account/Session (OAuth) ─────────────── */

export interface IAccount extends Document {
  userId: Types.ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

const AccountSchema = new Schema<IAccount>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  provider: { type: String, required: true },
  providerAccountId: { type: String, required: true },
  refresh_token: String,
  access_token: String,
  expires_at: Number,
  token_type: String,
  scope: String,
  id_token: String,
  session_state: String,
});

AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export const Account = models.Account ?? model<IAccount>("Account", AccountSchema);

/* ─────────────────────── Populated request helper ─────────────────── */

export interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  email: string;
  phone?: string;
  image?: string;
}

export interface PopulatedRequest {
  _id: Types.ObjectId;
  id: string;
  status: RequestStatus;
  description: string;
  issueType: string;
  latitude: number;
  longitude: number;
  address?: string;
  driverId: Types.ObjectId;
  mechanicId?: Types.ObjectId;
  acceptedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  driver: PopulatedUser;
  mechanic?: PopulatedUser;
}

/** Serialize a populated Mongoose request doc into a plain JSON-safe object */
export function serializeRequest(doc: mongoose.Document & { toObject: () => unknown }): unknown {
  const obj = doc.toObject({ virtuals: true }) as Record<string, unknown>;
  obj.id = String(obj._id);
  if (obj.driver && typeof obj.driver === "object") {
    const d = obj.driver as Record<string, unknown>;
    d.id = String(d._id);
  }
  if (obj.mechanic && typeof obj.mechanic === "object") {
    const m = obj.mechanic as Record<string, unknown>;
    m.id = String(m._id);
  }
  return obj;
}
