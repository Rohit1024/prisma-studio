// prisma/seed.ts
import { PrismaClient, User, Category, Post } from '@prisma/client';
import { faker } from '@faker-js/faker'; // Import faker

// Initialize Prisma Client
const prisma = new PrismaClient();

// --- Configuration ---
const NUM_USERS = 10;
const NUM_CATEGORIES = 5;
const NUM_POSTS = 25; // Create more posts than users/categories

async function main() {
  console.log(`🌱 Start seeding ...`);

  // --- 1. Clean the Database ---
  // Delete posts first due to foreign key constraints
  console.log(`🧹 Deleting existing posts...`);
  await prisma.post.deleteMany({});
  console.log(`🧹 Deleting existing categories...`);
  await prisma.category.deleteMany({});
  console.log(`🧹 Deleting existing users...`);
  await prisma.user.deleteMany({});
  console.log(`✅ Database cleaned.`);

  // --- 2. Seed Users ---
  console.log(`👤 Seeding ${NUM_USERS} users...`);
  const createdUsers: User[] = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
        }),
        name: faker.person.fullName(),
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ ${createdUsers.length} users seeded.`);

  // --- 3. Seed Categories ---
  console.log(`📚 Seeding ${NUM_CATEGORIES} categories...`);
  const categoryNames = new Set<string>(); // Use a Set to ensure uniqueness
  while (categoryNames.size < NUM_CATEGORIES) {
    categoryNames.add(faker.commerce.department()); // Generate unique department names
  }

  const categories: Category[] = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name },
    });
    categories.push(category);
  }
  console.log(`✅ ${categories.length} categories seeded.`);

  // --- 4. Seed Posts ---
  console.log(`📝 Seeding ${NUM_POSTS} posts...`);
  const createdPosts: Post[] = [];
  for (let i = 0; i < NUM_POSTS; i++) {
    // Select a random user
    const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];

    // Select 1 to 3 random categories
    const numCategoriesToLink = Math.min(
      faker.number.int({ min: 1, max: 3 }),
      categories.length
    );
    
    // Shuffle and take first n categories
    const shuffledCategories = [...categories].sort(() => 0.5 - Math.random());
    const selectedCategories = shuffledCategories.slice(0, numCategoriesToLink);
    
    const categoriesToConnect = selectedCategories.map(category => ({
      id: category.id
    }));

    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 10 }), // Random sentence title
        content: faker.lorem.paragraphs({ min: 1, max: 3 }), // Random paragraphs
        published: faker.datatype.boolean({ probability: 0.75 }), // 75% chance of being published
        author: { 
          connect: { id: randomUser.id }, // Connect to the random user's ID
        },
        categories: {
          connect: categoriesToConnect, // Connect to the random categories by ID
        },
      },
    });
    createdPosts.push(post);
  }
  console.log(`✅ ${createdPosts.length} posts seeded.`);

  console.log(`🎉 Seeding finished successfully!`);
}

// Execute the main function, handle potential errors, and ensure Prisma Client disconnects
main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting Prisma Client...');
    await prisma.$disconnect();
  });