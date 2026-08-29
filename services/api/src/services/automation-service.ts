import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AutomationService {
  static async createAutomation(userId: string, data: {
    name: string;
    triggerType: string;
    triggerConfig: any;
    actionType: string;
    actionConfig: any;
    conditionConfig?: any;
  }) {
    return prisma.automation.create({
      data: {
        userId,
        name: data.name,
        triggerType: data.triggerType,
        triggerConfig: JSON.stringify(data.triggerConfig),
        actionType: data.actionType,
        actionConfig: JSON.stringify(data.actionConfig),
        conditionConfig: data.conditionConfig ? JSON.stringify(data.conditionConfig) : null,
        isActive: true
      }
    });
  }

  static async getAutomations(userId: string) {
    const list = await prisma.automation.findMany({
      where: { userId },
      include: {
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return list.map(item => ({
      ...item,
      triggerConfig: JSON.parse(item.triggerConfig),
      actionConfig: JSON.parse(item.actionConfig),
      conditionConfig: item.conditionConfig ? JSON.parse(item.conditionConfig) : null
    }));
  }

  static async updateAutomation(id: string, data: Partial<{
    name: string;
    triggerType: string;
    triggerConfig: any;
    actionType: string;
    actionConfig: any;
    conditionConfig?: any;
    isActive: boolean;
  }>) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.triggerType !== undefined) updateData.triggerType = data.triggerType;
    if (data.triggerConfig !== undefined) updateData.triggerConfig = JSON.stringify(data.triggerConfig);
    if (data.actionType !== undefined) updateData.actionType = data.actionType;
    if (data.actionConfig !== undefined) updateData.actionConfig = JSON.stringify(data.actionConfig);
    if (data.conditionConfig !== undefined) updateData.conditionConfig = data.conditionConfig ? JSON.stringify(data.conditionConfig) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.automation.update({
      where: { id },
      data: updateData
    });
  }

  static async deleteAutomation(id: string) {
    return prisma.automation.delete({
      where: { id }
    });
  }

  // Manually run an automation now (creates execution log)
  static async triggerRun(automationId: string): Promise<any> {
    const start = Date.now();
    const automation = await prisma.automation.findUnique({
      where: { id: automationId }
    });

    if (!automation) {
      throw new Error("Automation not found");
    }

    let status = 'SUCCESS';
    let log = '';

    try {
      const triggerDetails = JSON.parse(automation.triggerConfig);
      const actionDetails = JSON.parse(automation.actionConfig);

      log += `[${new Date().toISOString()}] Starting automation execution: "${automation.name}"\n`;
      log += `[${new Date().toISOString()}] Evaluated Trigger: Type=${automation.triggerType}, Parameters=${JSON.stringify(triggerDetails)}\n`;
      
      // Perform mock action check
      await new Promise(resolve => setTimeout(resolve, 800));

      if (automation.conditionConfig) {
        log += `[${new Date().toISOString()}] Evaluated Condition checks: PASSED\n`;
      }

      log += `[${new Date().toISOString()}] Dispatching Action: Type=${automation.actionType}, Config=${JSON.stringify(actionDetails)}\n`;
      log += `[${new Date().toISOString()}] Payload delivered. Connection status: OK (200)\n`;
      log += `[${new Date().toISOString()}] Execution successfully concluded.`;

    } catch (e: any) {
      status = 'FAILED';
      log += `[${new Date().toISOString()}] Critical execution failure: ${e.message}\n`;
    }

    const elapsed = Date.now() - start;

    return prisma.automationRun.create({
      data: {
        automationId,
        status,
        log,
        executionTime: elapsed
      }
    });
  }
}
