import { createQueue, createWorker, defaultJobOptions } from '@/config';
import { logger, sendEmail } from '@/utils';
import { Job } from 'bullmq';

export const testQueue = createQueue('testQueue');
export const emailQueue = createQueue('emailQueue');

export const addTestJob = async (name: string, data: any) => {
  return testQueue.add(name, data, defaultJobOptions);
};

export const addEmailJob = async (name: string, data: any) => {
  return emailQueue.add(name, data, defaultJobOptions);
};

export const initTestWorker = () => {
  try {
    const worker = createWorker('testQueue', async (job: Job) => {
      logger.info({ id: job.id, name: job.name, data: job.data }, 'Processing job');
    });
    worker.on('completed', (job) => logger.info({ id: job.id }, 'Job completed'));
    worker.on('failed', (job, err) => logger.error({ id: job?.id, error: err }, 'Job failed'));
    return worker;
  } catch (err) {
    logger.error({ error: err }, 'Failed to initialize test worker');
    return undefined as any;
  }
};

export const initEmailWorker = () => {
  try {
    const worker = createWorker('emailQueue', async (job: Job) => {
      const { to, subject, html, text } = job.data;
      await sendEmail(to, subject, html, text);
      logger.info({ id: job.id, type: job.name, to }, 'Email sent');
    });
    worker.on('completed', (job) => logger.info({ id: job.id }, 'Email job completed'));
    worker.on('failed', (job, err) => logger.error({ id: job?.id, err }, 'Email job failed'));
    return worker;
  } catch (err) {
    logger.error({ error: err }, 'Failed to initialize email worker');
    return undefined as any;
  }
};
