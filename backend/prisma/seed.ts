import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@marketplace.com',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
      apiKey: uuidv4(),
    },
  });

  // Manager user
  const managerHash = await bcrypt.hash('Manager1234!', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@marketplace.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'manager@marketplace.com',
      name: 'Manager User',
      passwordHash: managerHash,
      role: 'MANAGER',
    },
  });

  // Executor user
  const executorHash = await bcrypt.hash('Executor1234!', 12);
  await prisma.user.upsert({
    where: { email: 'executor@marketplace.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'executor@marketplace.com',
      name: 'Executor User',
      passwordHash: executorHash,
      role: 'EXECUTOR',
    },
  });

  // Sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { article: 'ART-001' },
      update: {},
      create: { article: 'ART-001', name: 'Product Alpha' },
    }),
    prisma.product.upsert({
      where: { article: 'ART-002' },
      update: {},
      create: { article: 'ART-002', name: 'Product Beta' },
    }),
    prisma.product.upsert({
      where: { article: 'ART-003' },
      update: {},
      create: { article: 'ART-003', name: 'Product Gamma' },
    }),
  ]);

  // Sample task
  const task = await prisma.task.create({
    data: {
      title: 'Update product photos',
      description: 'Add new high-quality photos for all listed products',
      priority: 'HIGH',
      status: 'TODO',
      creatorId: manager.id,
      assigneeId: admin.id,
      taskArticles: {
        create: products.map((p) => ({ productId: p.id })),
      },
      subtasks: {
        create: [
          { title: 'Prepare photo studio', status: 'DONE' },
          { title: 'Shoot new photos', status: 'IN_PROGRESS' },
          { title: 'Upload to CDN', status: 'TODO' },
        ],
      },
    },
  });

  console.log('✅ Seed complete');
  console.log('  Admin:', admin.email);
  console.log('  Manager:', manager.email);
  console.log('  Task:', task.title);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
