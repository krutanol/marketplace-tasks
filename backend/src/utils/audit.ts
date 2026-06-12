import { prisma } from '../lib/prisma';

export async function createAuditLog(params: {
  taskId: string;
  userId: string;
  action: string;
  oldValue?: object | null;
  newValue?: object | null;
}) {
  await prisma.auditLog.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      action: params.action,
      oldValue: params.oldValue ? JSON.stringify(params.oldValue) : undefined,
      newValue: params.newValue ? JSON.stringify(params.newValue) : undefined,
    },
  });
}
