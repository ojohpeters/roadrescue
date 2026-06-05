/**
 * Seed / upsert the premium mechanic directory.
 *
 * These are real mechanics people can call directly when no in-app mechanic
 * is available. They are stored as MECHANIC users with isPremium=true so they
 * show up in the public directory and the offline PWA list.
 *
 * Run from the project root:
 *   node --env-file=.env.local scripts/seed-premium-mechanics.mjs
 *
 * Idempotent: re-running updates existing entries (matched by phone) instead
 * of creating duplicates.
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("✗ MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/seed-premium-mechanics.mjs");
  process.exit(1);
}

// Mirrors the relevant fields of src/lib/models.ts (collection: "users")
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    image: String,
    password: String,
    role: { type: String, enum: ["DRIVER", "MECHANIC", "ADMIN"], default: "DRIVER" },
    phone: String,
    isAvailable: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    serviceRadius: { type: Number, default: 10 },
    responseTime: { type: Number, default: 30 },
    latitude: Number,
    longitude: Number,
    address: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

// Parsed from the supplied contact cards (.vcf). Phones normalised to E.164.
const MECHANICS = [
  { name: "Tijjani Suleiman", phone: "+2348034053802", address: "Nigeria" },
  { name: "Peter Petro", phone: "+2348069335174", address: "Nigeria" },
  { name: "Shola", phone: "+2348069657441", address: "Nigeria" },
  { name: "Abubakar Umar", phone: "+2347061047470", address: "Waterboard area, Nigeria" },
  { name: "Sunday (Toyota specialist)", phone: "+2349167474519", address: "Nigeria" },
  { name: "Adamu", phone: "+2348033708171", address: "Nigeria" },
  { name: "Alh. Umar", phone: "+2348060626867", address: "Nigeria" },
  { name: "Ocheche Anebi", phone: "+2348036917164", address: "Nigeria" },
  { name: "Blessing (Honda specialist)", phone: "+2347030928886", address: "Nigeria" },
  { name: "Mike", phone: "+2347038927195", address: "Nigeria" },
  { name: "Alaba", phone: "+2348137918163", address: "Otukpo, Nigeria" },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB");

  let created = 0;
  let updated = 0;

  for (const m of MECHANICS) {
    const digits = m.phone.replace(/\D/g, "");
    const email = `m-${digits}@directory.roadrescue.app`;

    const res = await User.updateOne(
      { phone: m.phone },
      {
        $set: {
          name: m.name,
          email,
          phone: m.phone,
          address: m.address,
          role: "MECHANIC",
          isPremium: true,
          isAvailable: true,
          responseTime: 30,
          serviceRadius: 15,
        },
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) {
      created += 1;
      console.log(`  + ${m.name} (${m.phone})`);
    } else {
      updated += 1;
      console.log(`  ~ ${m.name} (${m.phone})`);
    }
  }

  const total = await User.countDocuments({ role: "MECHANIC", isPremium: true });
  console.log(`\n✓ Done. ${created} created, ${updated} updated.`);
  console.log(`✓ ${total} premium mechanics now in the directory.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("✗ Seed failed:", err.message);
  process.exit(1);
});
