/**
 * Prisma database seed — creates demo users and a sample chat.
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  const passwordHash = await bcrypt.hash('Demo1234!', 12);

  // Create demo users
  const alice = await prisma.user.upsert({
    where: { email: 'alice@iwa.app' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@iwa.app',
      passwordHash,
      displayName: 'Alice',
      bio: 'Hey there! I am using iWa.',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@iwa.app' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@iwa.app',
      passwordHash,
      displayName: 'Bob',
      bio: 'Available',
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@iwa.app' },
    update: {},
    create: {
      username: 'carol',
      email: 'carol@iwa.app',
      passwordHash,
      displayName: 'Carol',
    },
  });

  // Create a private chat between Alice and Bob
  const privateChat = await prisma.chat.create({
    data: {
      type: 'PRIVATE',
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id,   role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { chatId: privateChat.id, senderId: alice.id, content: 'Hey Bob! 👋' },
      { chatId: privateChat.id, senderId: bob.id,   content: 'Hi Alice! How are you?' },
      { chatId: privateChat.id, senderId: alice.id, content: 'Great, thanks! Just testing iWa 🚀' },
    ],
  });

  // Create a group chat
  const groupChat = await prisma.chat.create({
    data: {
      type: 'GROUP',
      name: 'iWa Dev Team',
      description: 'Development discussion',
      createdBy: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id,   role: 'ADMIN' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: alice.id,
      type: 'SYSTEM',
      content: 'Group "iWa Dev Team" created',
    },
  });

  console.log('✅ Seed complete!');
  console.log('Demo accounts (password: Demo1234!):');
  console.log(`  alice@iwa.app`);
  console.log(`  bob@iwa.app`);
  console.log(`  carol@iwa.app`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
