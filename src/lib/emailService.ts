import { prisma } from "@/lib/prisma";
import { renderTemplate } from "@/lib/templateEngine";
import { EMAIL_TEMPLATE_SLUGS, DEFAULT_USER_PASSWORD } from "@/lib/constants";
import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function getEmailSettings() {
  const settings = await prisma.emailSettings.findUnique({
    where: { id: "default" },
  });

  if (settings) return settings;

  return {
    id: "default",
    smtpHost: process.env.SMTP_HOST ?? "localhost",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPassword: process.env.SMTP_PASSWORD ?? "",
    smtpFromName: process.env.SMTP_FROM_NAME ?? "Power On Decode",
    smtpFromEmail: process.env.SMTP_FROM_EMAIL ?? "noreply@powerondecode.local",
    smtpSecure: process.env.SMTP_SECURE === "true",
    updatedAt: new Date(),
  };
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const settings = await getEmailSettings();

  if (!settings.smtpHost) {
    console.warn("[emailService] SMTP não configurado. E-mail não enviado:", params.subject);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: settings.smtpUser
        ? {
            user: settings.smtpUser,
            pass: settings.smtpPassword,
          }
        : undefined,
    });

    await transporter.sendMail({
      from: `"${settings.smtpFromName}" <${settings.smtpFromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return true;
  } catch (error) {
    console.error("[emailService] Falha ao enviar e-mail:", error);
    return false;
  }
}

async function getTemplate(slug: string) {
  return prisma.emailTemplate.findUnique({ where: { slug } });
}

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export async function sendWelcomeAccessEmail(params: {
  name: string;
  email: string;
  password: string;
  toolName: string;
  expiresAt?: Date | null;
}): Promise<boolean> {
  const template =
    (await getTemplate(EMAIL_TEMPLATE_SLUGS.WELCOME)) ??
    ({
      subject: "Seu acesso ao Power On Decode foi liberado",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso ao Power On Decode foi liberado.</p><p>Ferramenta: {{tool_name}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p><p>Email: {{email}}<br/>Senha inicial: {{password}}</p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso foi liberado.\nFerramenta: {{tool_name}}\nLogin: {{login_url}}\nEmail: {{email}}\nSenha: {{password}}`,
    } as const);

  const variables = {
    name: params.name,
    email: params.email,
    password: params.password,
    login_url: `${getAppUrl()}/login`,
    tool_name: params.toolName,
    expires_at: params.expiresAt
      ? params.expiresAt.toLocaleDateString("pt-BR")
      : "",
    renewal_url: `${getAppUrl()}/dashboard`,
  };

  return sendEmail({
    to: params.email,
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.bodyHtml, variables),
    text: renderTemplate(template.bodyText, variables),
  });
}

export async function sendPasswordResetEmail(params: {
  name: string;
  email: string;
  resetUrl: string;
}): Promise<boolean> {
  const template =
    (await getTemplate(EMAIL_TEMPLATE_SLUGS.PASSWORD_RESET)) ??
    ({
      subject: "Redefinição de senha — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p><a href="{{login_url}}">Redefinir senha</a></p>`,
      bodyText: `Olá, {{name}}.\nRedefinir senha: {{login_url}}`,
    } as const);

  const variables = {
    name: params.name,
    email: params.email,
    login_url: params.resetUrl,
    password: "",
    tool_name: "",
    expires_at: "",
    renewal_url: "",
  };

  return sendEmail({
    to: params.email,
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.bodyHtml, variables),
    text: renderTemplate(template.bodyText, variables),
  });
}

export async function sendAccessExpirationWarningEmail(params: {
  name: string;
  email: string;
  toolName: string;
  expiresAt: Date;
  templateSlug: string;
}): Promise<boolean> {
  const template = await getTemplate(params.templateSlug);
  if (!template) return false;

  const variables = {
    name: params.name,
    email: params.email,
    password: "",
    login_url: `${getAppUrl()}/login`,
    tool_name: params.toolName,
    expires_at: params.expiresAt.toLocaleDateString("pt-BR"),
    renewal_url: `${getAppUrl()}/account/access`,
  };

  return sendEmail({
    to: params.email,
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.bodyHtml, variables),
    text: renderTemplate(template.bodyText, variables),
  });
}

export async function sendAccessExpiredEmail(params: {
  name: string;
  email: string;
  toolName: string;
}): Promise<boolean> {
  return sendAccessExpirationWarningEmail({
    ...params,
    expiresAt: new Date(),
    templateSlug: EMAIL_TEMPLATE_SLUGS.EXPIRED,
  });
}

export async function sendAccessGrantedEmail(params: {
  name: string;
  email: string;
  toolName: string;
  isNewUser: boolean;
  password?: string;
  expiresAt?: Date | null;
}): Promise<boolean> {
  const loginUrl = `${getAppUrl()}/login`;
  const expiresText = params.expiresAt
    ? params.expiresAt.toLocaleDateString("pt-BR")
    : "";

  const subject = "Acesso liberado - Power On Decode";
  const passwordBlock = params.isNewUser
    ? `\n\nSenha inicial: ${params.password ?? DEFAULT_USER_PASSWORD}\nRecomendamos alterar sua senha após o primeiro acesso.`
    : "\n\nUtilize sua senha atual para entrar na plataforma.";

  const text = `Olá, ${params.name}.

Seu acesso ao Power On Decode foi liberado.

Ferramenta liberada: ${params.toolName}
E-mail: ${params.email}${passwordBlock}

Acesse: ${loginUrl}
${expiresText ? `\nValidade: ${expiresText}` : ""}`;

  const html = `
    <p>Olá, <strong>${params.name}</strong>.</p>
    <p>Seu acesso ao Power On Decode foi liberado.</p>
    <p><strong>Ferramenta liberada:</strong> ${params.toolName}</p>
    <p><strong>E-mail:</strong> ${params.email}</p>
    ${
      params.isNewUser
        ? `<p><strong>Senha inicial:</strong> ${params.password ?? DEFAULT_USER_PASSWORD}</p>
           <p>Recomendamos alterar sua senha após o primeiro acesso.</p>`
        : "<p>Utilize sua senha atual para entrar na plataforma.</p>"
    }
    <p><a href="${loginUrl}">Acessar plataforma</a></p>
    ${expiresText ? `<p><strong>Validade:</strong> ${expiresText}</p>` : ""}
  `;

  return sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}

export async function sendWebhookAccessGrantedEmail(params: {
  name: string;
  email: string;
  toolNames: string[];
  isNewUser: boolean;
  password?: string;
  expiresAt?: Date | null;
}): Promise<boolean> {
  const loginUrl = `${getAppUrl()}/login`;
  const toolsList = params.toolNames.join(", ");
  const expiresText = params.expiresAt
    ? params.expiresAt.toLocaleDateString("pt-BR")
    : "";

  const templateSlug = params.isNewUser
    ? EMAIL_TEMPLATE_SLUGS.ACCESS_GRANTED_NEW_USER
    : EMAIL_TEMPLATE_SLUGS.ACCESS_GRANTED_EXISTING_USER;

  const template =
    (await getTemplate(templateSlug)) ??
    (params.isNewUser
      ? ({
          subject: "Acesso liberado - Power On Decode",
          bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso ao Power On Decode foi liberado.</p><p><strong>Ferramentas liberadas:</strong> {{tool_name}}</p><p><strong>E-mail:</strong> {{email}}</p><p><strong>Senha inicial:</strong> {{password}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p>`,
          bodyText: `Olá, {{name}}.\n\nFerramentas liberadas: {{tool_name}}\nE-mail: {{email}}\nSenha inicial: {{password}}\nAcesse: {{login_url}}`,
        } as const)
      : ({
          subject: "Novo acesso liberado - Power On Decode",
          bodyHtml: `<p>Olá, {{name}}.</p><p>Novos acessos foram liberados na sua conta Power On Decode.</p><p><strong>Ferramentas liberadas:</strong> {{tool_name}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p>`,
          bodyText: `Olá, {{name}}.\n\nFerramentas liberadas: {{tool_name}}\nAcesse: {{login_url}}`,
        } as const));

  const variables = {
    name: params.name,
    email: params.email,
    password: params.isNewUser
      ? params.password ?? DEFAULT_USER_PASSWORD
      : "",
    login_url: loginUrl,
    tool_name: toolsList,
    expires_at: expiresText,
    renewal_url: `${getAppUrl()}/account/access`,
  };

  return sendEmail({
    to: params.email,
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.bodyHtml, variables),
    text: renderTemplate(template.bodyText, variables),
  });
}
