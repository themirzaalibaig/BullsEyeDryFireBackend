import { emailConfig, transporter } from '@/config';

export const sendEmail = async (to: string, subject: string, html?: string, text?: string) => {
  const info = await transporter.sendMail({ from: emailConfig.from, to, subject, html, text });
  return info;
};
