import {
  ListingTier,
  PrismaClient,
  ReviewStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { walkerSeedReviews } from "./seed-reviews";

const db = new PrismaClient();

const demoWalkers = [
  {
    email: "maria.santos@pawpath.demo",
    name: "Maria Santos",
    headline: "Solana Beach · coastal trail expert",
    bio: "I've walked dogs along the Solana Beach bluffs and Cedros Design District for six years. Your pup gets ocean breezes, variety, and routes that skip the crowded tourist paths.",
    services: ["Dog walking", "Adventure hikes", "Multi-dog walks"],
    rate30Min: "$22",
    rate60Min: "$35",
    phone: "(760) 555-0101",
    zipCode: "92075",
    city: "Solana Beach",
    neighborhood: "Solana Beach",
    latitude: 33.037,
    longitude: -117.2746,
    listingTier: ListingTier.FEATURED,
    verificationStatus: VerificationStatus.APPROVED,
  },
  {
    email: "james.chen@pawpath.demo",
    name: "James Chen",
    headline: "Cardiff · patient with anxious pups",
    bio: "Former vet tech assistant based in Cardiff-by-the-Sea. I specialize in nervous and reactive dogs — slow introductions, consistent routines, and calm walks near the lagoon.",
    services: ["Dog walking", "Puppy visits", "Drop-in visits"],
    rate30Min: "$20",
    rate60Min: "$32",
    phone: "(760) 555-0102",
    zipCode: "92007",
    city: "Encinitas",
    neighborhood: "Cardiff",
    latitude: 33.0231,
    longitude: -117.281,
    listingTier: ListingTier.STANDARD,
    verificationStatus: VerificationStatus.APPROVED,
  },
  {
    email: "alex.rivera@pawpath.demo",
    name: "Alex Rivera",
    headline: "Encinitas · sunrise beach walks",
    bio: "Morning walker covering Encinitas, Leucadia, and Old Encinitas. I send photo updates and keep a consistent route so your dog knows what to expect every day.",
    services: ["Dog walking", "Adventure hikes"],
    rate30Min: "$24",
    rate60Min: "$38",
    phone: "(760) 555-0103",
    zipCode: "92024",
    city: "Encinitas",
    neighborhood: "Leucadia",
    latitude: 33.0369,
    longitude: -117.2919,
    listingTier: ListingTier.STANDARD,
    verificationStatus: VerificationStatus.APPROVED,
  },
  {
    email: "taylor.brooks@pawpath.demo",
    name: "Taylor Brooks",
    headline: "San Marcos · evenings & weekends",
    bio: "Just inland from the coast with flexible evening and weekend availability. Great with high-energy breeds that need a real workout on San Marcos trails and neighborhood loops.",
    services: ["Dog walking", "Multi-dog walks"],
    rate30Min: "$18",
    rate60Min: "$28",
    phone: "(760) 555-0104",
    zipCode: "92069",
    city: "San Marcos",
    neighborhood: "San Marcos",
    latitude: 33.1434,
    longitude: -117.1661,
    listingTier: ListingTier.BASIC,
    verificationStatus: VerificationStatus.PENDING,
    verificationSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    email: "sam.okonkwo@pawpath.demo",
    name: "Sam Okonkwo",
    headline: "Vista · adventure hikes & park routes",
    bio: "Based in Vista with quick access to inland trails and open space. Available from 6am for pups that need to burn energy before you start work — without the coastal commute.",
    services: ["Dog walking", "Adventure hikes"],
    rate30Min: "$20",
    rate60Min: "$30",
    phone: "(760) 555-0105",
    zipCode: "92081",
    city: "Vista",
    neighborhood: "Vista",
    latitude: 33.2,
    longitude: -117.2425,
    listingTier: ListingTier.FEATURED,
    verificationStatus: VerificationStatus.APPROVED,
  },
] as const;

async function seedWalkerReviews(
  walkerEmail: string,
  walkerProfileId: string,
  demoOwnerId: string
) {
  const reviews = walkerSeedReviews[walkerEmail];
  if (!reviews?.length) return;

  await db.review.deleteMany({
    where: {
      walkerProfileId,
      status: ReviewStatus.APPROVED,
    },
  });

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    const slug = review.ownerName.toLowerCase().replace(/[^a-z]+/g, "-");
    const reviewerEmail = `reviewer.${slug}.${walkerEmail.split("@")[0]}@pawpath.demo`;

    const reviewer = await db.user.upsert({
      where: { email: reviewerEmail },
      update: { name: review.ownerName },
      create: {
        email: reviewerEmail,
        name: review.ownerName,
        role: UserRole.OWNER,
        termsAcceptedAt: new Date(),
      },
    });

    await db.ownerProfile.upsert({
      where: { userId: reviewer.id },
      update: {
        dogName: review.dogName,
        zipCode: "92024",
        city: "Encinitas",
        latitude: 33.0369,
        longitude: -117.2919,
      },
      create: {
        userId: reviewer.id,
        dogName: review.dogName,
        zipCode: "92024",
        city: "Encinitas",
        latitude: 33.0369,
        longitude: -117.2919,
      },
    });

    if (reviewer.id === demoOwnerId) continue;

    await db.review.upsert({
      where: {
        authorId_walkerProfileId: {
          authorId: reviewer.id,
          walkerProfileId,
        },
      },
      update: {
        rating: review.rating,
        body: review.body,
        status: ReviewStatus.APPROVED,
      },
      create: {
        authorId: reviewer.id,
        walkerProfileId,
        rating: review.rating,
        body: review.body,
        status: ReviewStatus.APPROVED,
        createdAt: new Date(Date.now() - (reviews.length - i) * 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
}

async function main() {
  const adminPassword = await bcrypt.hash("admin-change-me", 12);
  const demoPassword = await bcrypt.hash("demo-walker", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@pawpath.local" },
    update: {},
    create: {
      email: "admin@pawpath.local",
      name: "PawPath Admin",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      termsAcceptedAt: new Date(),
    },
  });

  const demoOwner = await db.user.upsert({
    where: { email: "owner.demo@pawpath.local" },
    update: {},
    create: {
      email: "owner.demo@pawpath.local",
      name: "Demo Owner",
      passwordHash: demoPassword,
      role: UserRole.OWNER,
      termsAcceptedAt: new Date(),
    },
  });

  await db.ownerProfile.upsert({
    where: { userId: demoOwner.id },
    update: {
      zipCode: "92024",
      city: "Encinitas",
      neighborhood: "Leucadia",
      latitude: 33.0369,
      longitude: -117.2919,
    },
    create: {
      userId: demoOwner.id,
      zipCode: "92024",
      city: "Encinitas",
      neighborhood: "Leucadia",
      latitude: 33.0369,
      longitude: -117.2919,
      dogName: "Biscuit",
    },
  });

  for (const walker of demoWalkers) {
    const user = await db.user.upsert({
      where: { email: walker.email },
      update: { name: walker.name },
      create: {
        email: walker.email,
        name: walker.name,
        passwordHash: demoPassword,
        role: UserRole.WALKER,
        termsAcceptedAt: new Date(),
      },
    });

    const profile = await db.walkerProfile.upsert({
      where: { userId: user.id },
      update: {
        headline: walker.headline,
        bio: walker.bio,
        services: [...walker.services],
        rate30Min: walker.rate30Min,
        rate60Min: walker.rate60Min,
        phone: walker.phone,
        zipCode: walker.zipCode,
        city: walker.city,
        neighborhood: walker.neighborhood,
        latitude: walker.latitude,
        longitude: walker.longitude,
        listingTier: walker.listingTier,
        verificationStatus: walker.verificationStatus,
        verificationSubmittedAt:
          "verificationSubmittedAt" in walker
            ? walker.verificationSubmittedAt
            : null,
        listingReviewStatus: "APPROVED",
        lastApprovedBio: walker.bio,
        isPro: walker.email === "james.chen@pawpath.demo",
        isActive: true,
        email: walker.email,
        photoUrls: [],
      },
      create: {
        userId: user.id,
        headline: walker.headline,
        bio: walker.bio,
        services: [...walker.services],
        rate30Min: walker.rate30Min,
        rate60Min: walker.rate60Min,
        phone: walker.phone,
        zipCode: walker.zipCode,
        city: walker.city,
        neighborhood: walker.neighborhood,
        latitude: walker.latitude,
        longitude: walker.longitude,
        listingTier: walker.listingTier,
        verificationStatus: walker.verificationStatus,
        verificationSubmittedAt:
          "verificationSubmittedAt" in walker
            ? walker.verificationSubmittedAt
            : null,
        listingReviewStatus: "APPROVED",
        lastApprovedBio: walker.bio,
        isPro: walker.email === "james.chen@pawpath.demo",
        isActive: true,
        email: walker.email,
        photoUrls: [],
      },
    });

    await seedWalkerReviews(walker.email, profile.id, demoOwner.id);
  }

  const taylorUser = await db.user.findUnique({
    where: { email: "taylor.brooks@pawpath.demo" },
    include: { walkerProfile: true },
  });

  if (taylorUser?.walkerProfile) {
    const conversation = await db.conversation.upsert({
      where: {
        ownerId_walkerUserId: {
          ownerId: demoOwner.id,
          walkerUserId: taylorUser.id,
        },
      },
      update: { contactRevealed: true },
      create: {
        ownerId: demoOwner.id,
        walkerUserId: taylorUser.id,
        contactRevealed: true,
      },
    });

    const existingMessage = await db.message.count({
      where: { conversationId: conversation.id },
    });

    if (existingMessage === 0) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderId: demoOwner.id,
          body: "Hi Taylor — Biscuit needs a few evening walks this week. Are you available?",
        },
      });
    }

    await db.review.upsert({
      where: {
        authorId_walkerProfileId: {
          authorId: demoOwner.id,
          walkerProfileId: taylorUser.walkerProfile.id,
        },
      },
      update: {
        rating: 5,
        body: "Taylor was fantastic with our high-energy cattle dog mix. Flexible scheduling, great communication, and Biscuit came home happy every time.",
        status: ReviewStatus.PENDING,
      },
      create: {
        authorId: demoOwner.id,
        walkerProfileId: taylorUser.walkerProfile.id,
        rating: 5,
        body: "Taylor was fantastic with our high-energy cattle dog mix. Flexible scheduling, great communication, and Biscuit came home happy every time.",
        status: ReviewStatus.PENDING,
      },
    });
  }

  console.log("Seeded admin:", admin.email);
  console.log("Seeded demo owner:", demoOwner.email);
  console.log(`Seeded ${demoWalkers.length} demo walkers`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
