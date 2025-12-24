import { createQueue, createWorker, defaultJobOptions } from '@/config';
import {
  logger,
  sendEmail,
  getVerificationEmailTemplate,
  getForgotPasswordEmailTemplate,
} from '@/utils';
import { Job } from 'bullmq';
import {
  EmailJobType,
  EmailJobData,
  VerificationEmailJobData,
  ForgotPasswordEmailJobData,
  EmailJobResult,
} from '@/types/email.type';

export const testQueue = createQueue('testQueue');
export const emailQueue = createQueue('emailQueue');

export const addTestJob = async (name: string, data: any) => {
  return testQueue.add(name, data, defaultJobOptions);
};

/**
 * Add email job to queue
 */
export const addEmailJob = async (
  jobType: EmailJobType,
  data: EmailJobData,
  options?: { priority?: number; delay?: number },
) => {
  const jobOptions = {
    ...defaultJobOptions,
    ...(options?.priority && { priority: options.priority }),
    ...(options?.delay && { delay: options.delay }),
  };

  return emailQueue.add(jobType, data, jobOptions);
};

/**
 * Queue verification email
 */
export const queueVerificationEmail = async (
  email: string,
  otpCode: string,
  options?: { priority?: number; delay?: number },
) => {
  const html = getVerificationEmailTemplate(otpCode);
  const data: VerificationEmailJobData = {
    to: email,
    subject: 'Verify Your Email Address',
    html,
    otpCode,
    type: 'emailVerification',
  };
  return addEmailJob(EmailJobType.VERIFICATION_EMAIL, data, options);
};

/**
 * Queue forgot password email
 */
export const queueForgotPasswordEmail = async (
  email: string,
  otpCode: string,
  options?: { priority?: number; delay?: number },
) => {
  const html = getForgotPasswordEmailTemplate(otpCode);
  const data: ForgotPasswordEmailJobData = {
    to: email,
    subject: 'Reset Your Password',
    html,
    otpCode,
    type: 'forgotPassword',
  };
  return addEmailJob(EmailJobType.FORGOT_PASSWORD_EMAIL, data, options);
};

/**
 * Queue generic email
 */
export const queueGenericEmail = async (
  to: string,
  subject: string,
  html?: string,
  text?: string,
  options?: { priority?: number; delay?: number },
) => {
  const data: EmailJobData = {
    to,
    subject,
    html,
    text,
  };
  return addEmailJob(EmailJobType.GENERIC_EMAIL, data, options);
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

/**
 * Initialize email worker to process email jobs
 */
export const initEmailWorker = () => {
  try {
    const worker = createWorker(
      'emailQueue',
      async (job: Job<EmailJobData>): Promise<EmailJobResult> => {
        const { to, subject, html, text } = job.data;
        const jobType = job.name as EmailJobType;

        try {
          // Generate email content based on job type if not provided
          let emailHtml = html;
          let emailText = text;

          if (!emailHtml && jobType === EmailJobType.VERIFICATION_EMAIL) {
            const verificationData = job.data as VerificationEmailJobData;
            emailHtml = getVerificationEmailTemplate(verificationData.otpCode);
          } else if (!emailHtml && jobType === EmailJobType.FORGOT_PASSWORD_EMAIL) {
            const forgotPasswordData = job.data as ForgotPasswordEmailJobData;
            emailHtml = getForgotPasswordEmailTemplate(forgotPasswordData.otpCode);
          }

          // Send email
          const info = await sendEmail(to, subject, emailHtml, emailText);

          logger.info(
            { id: job.id, type: jobType, to, messageId: info.messageId },
            'Email sent successfully',
          );

          return {
            success: true,
            messageId: info.messageId,
          };
        } catch (error: any) {
          logger.error(
            { id: job.id, type: jobType, to, error: error.message },
            'Failed to send email',
          );

          // Re-throw to trigger retry mechanism
          throw error;
        }
      },
      5, // Process up to 5 emails concurrently
    );

    worker.on('completed', (job, result: EmailJobResult) => {
      logger.info(
        { id: job.id, type: job.name, to: job.data.to, messageId: result.messageId },
        'Email job completed',
      );
    });

    worker.on('failed', (job, err) => {
      logger.error(
        {
          id: job?.id,
          type: job?.name,
          to: job?.data?.to,
          error: err.message,
          attemptsMade: job?.attemptsMade,
          attemptsRemaining: job?.opts?.attempts ? job.opts.attempts - (job.attemptsMade || 0) : 0,
        },
        'Email job failed',
      );
    });

    worker.on('error', (err) => {
      logger.error({ error: err.message }, 'Email worker error');
    });

    logger.info('Email worker initialized successfully');
    return worker;
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to initialize email worker');
    return undefined as any;
  }
};
