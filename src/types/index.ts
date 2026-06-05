import type { Role, RequestStatus } from "@/lib/models";

export type { Role, RequestStatus };

export interface RequestWithUsers {
  id: string;
  _id?: string;
  status: RequestStatus;
  description: string;
  issueType: string;
  latitude: number | null;
  longitude: number | null;
  address?: string | null;
  locationDescription?: string | null;
  willProvideDirections?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  acceptedAt?: string | Date | null;
  completedAt?: string | Date | null;
  driverId: string;
  mechanicId?: string | null;
  driver: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
  };
  mechanic?: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
    isPremium?: boolean;
  } | null;
}

export interface PublicMechanic {
  id: string;
  name: string | null;
  phone: string | null;
  email: string;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  isPremium: boolean;
  isAvailable?: boolean;
  serviceRadius?: number;
  responseTime?: number | null;
}

export interface PremiumMechanicProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image?: string | null;
  isAvailable: boolean;
  serviceRadius: number;
  responseTime: number;
  latitude?: number;
  longitude?: number;
  address?: string | null;
}

export const ISSUE_TYPES = [
  { value: "flat_tyre", label: "Flat Tyre" },
  { value: "engine_trouble", label: "Engine Trouble" },
  { value: "battery_dead", label: "Dead Battery" },
  { value: "out_of_fuel", label: "Out of Fuel" },
  { value: "overheating", label: "Overheating" },
  { value: "accident", label: "Accident / Collision" },
  { value: "locked_out", label: "Locked Out" },
  { value: "other", label: "Other" },
] as const;

export const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Waiting for Mechanic",
  ACCEPTED: "Mechanic Accepted",
  ON_THE_WAY: "Mechanic On The Way",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  ACCEPTED: "text-blue-400 bg-blue-400/10",
  ON_THE_WAY: "text-purple-400 bg-purple-400/10",
  COMPLETED: "text-green-400 bg-green-400/10",
  CANCELLED: "text-red-400 bg-red-400/10",
};
