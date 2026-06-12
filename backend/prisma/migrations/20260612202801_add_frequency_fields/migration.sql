-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT 'ONCE',
ADD COLUMN     "repeatUntil" TIMESTAMP(3);
