import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EMAIL_TEMPLATE_SLUGS } from "../src/lib/constants";
import { SSANGYONG_PROCEDURES } from "../src/modules/ssangyong/procedures";
import {
  CATEGORIES,
  getManufacturersForMode,
  getModulesForMode,
  type SeedMode,
} from "./seed-data";
import { seedProductMappings } from "./seed-product-mappings";
import { seedToolsMetadata } from "./seed-tools";

const SUPER_ADMIN_EMAIL = "eletricapoweron@gmail.com";

export async function runSeed(prisma: PrismaClient, mode: SeedMode) {
  console.log(`Iniciando seed idempotente (${mode})...`);

  for (const moduleData of getModulesForMode(mode)) {
    await prisma.module.upsert({
      where: { slug: moduleData.slug },
      create: moduleData,
      update: {
        name: moduleData.name,
        description: moduleData.description,
        active: true,
      },
    });
  }

  for (const manufacturer of getManufacturersForMode(mode)) {
    await prisma.manufacturer.upsert({
      where: { slug: manufacturer.slug },
      create: manufacturer,
      update: {
        name: manufacturer.name,
        logoUrl: manufacturer.logoUrl,
        displayOrder: manufacturer.displayOrder,
        active: true,
      },
    });
  }

  for (const category of CATEGORIES) {
    await prisma.toolCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {
        name: category.name,
        description: category.description,
        icon: category.icon,
        displayOrder: category.displayOrder,
        active: true,
      },
    });
  }

  const ssangyongModule = await prisma.module.findUniqueOrThrow({
    where: { slug: "ssangyong" },
  });

  for (const procedure of SSANGYONG_PROCEDURES) {
    await prisma.decodeProcedure.upsert({
      where: {
        moduleId_slug: {
          moduleId: ssangyongModule.id,
          slug: procedure.slug,
        },
      },
      create: {
        moduleId: ssangyongModule.id,
        slug: procedure.slug,
        name: procedure.name,
        ecuName: procedure.ecuName,
        eepromType: procedure.eepromType,
        expectedSize: procedure.expectedSize,
        offsetHex: procedure.offsetHex,
        writeBytesHex: procedure.writeBytesHex,
        active: true,
      },
      update: {
        name: procedure.name,
        ecuName: procedure.ecuName,
        eepromType: procedure.eepromType,
        expectedSize: procedure.expectedSize,
        offsetHex: procedure.offsetHex,
        writeBytesHex: procedure.writeBytesHex,
        active: true,
      },
    });
  }

  await seedToolsMetadata(prisma, mode);
  await seedProductMappings(prisma);

  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? "Saga@2011";
  const superAdminName =
    process.env.SEED_SUPER_ADMIN_NAME ?? "Power On Super Admin";

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL.toLowerCase() },
    create: {
      email: SUPER_ADMIN_EMAIL.toLowerCase(),
      name: superAdminName,
      role: "super_admin",
      passwordHash: await bcrypt.hash(superAdminPassword, 12),
    },
    update: {
      name: superAdminName,
      role: "super_admin",
    },
  });

  if (mode === "dev") {
    const adminEmail =
      process.env.SEED_ADMIN_EMAIL ?? "admin@powerondecode.local";
    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
    const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";

    if (adminEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()) {
      await prisma.user.upsert({
        where: { email: adminEmail.toLowerCase() },
        create: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          role: "admin",
          passwordHash: await bcrypt.hash(adminPassword, 12),
        },
        update: {
          name: adminName,
          role: "admin",
        },
      });
    }
  }

  await ensureSuperAdminModuleAccess(prisma, superAdminUser.id, ssangyongModule.id, mode);

  if (mode === "dev") {
    const adminEmail =
      process.env.SEED_ADMIN_EMAIL ?? "admin@powerondecode.local";
    const legacyAdmin = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (
      legacyAdmin &&
      legacyAdmin.id !== superAdminUser.id &&
      adminEmail.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase()
    ) {
      await ensureSuperAdminModuleAccess(
        prisma,
        legacyAdmin.id,
        ssangyongModule.id,
        mode
      );
    }
  }

  await seedEmailTemplates(prisma);
  await seedPwaSettings(prisma);

  console.log("Seed concluído sem apagar usuários, acessos, logs ou webhooks.");
  if (!existingSuperAdmin) {
    console.log(`Super admin criado: ${SUPER_ADMIN_EMAIL}`);
    console.log(`Senha inicial: ${superAdminPassword}`);
  } else {
    console.log(`Super admin garantido: ${SUPER_ADMIN_EMAIL}`);
  }
}

async function ensureSuperAdminModuleAccess(
  prisma: PrismaClient,
  userId: string,
  moduleId: string,
  mode: SeedMode
) {
  const existing = await prisma.userModule.findUnique({
    where: {
      userId_moduleId: {
        userId,
        moduleId,
      },
    },
  });

  if (existing) {
    if (mode === "dev") {
      const accessExpires = new Date();
      accessExpires.setDate(accessExpires.getDate() + 365);
      await prisma.userModule.update({
        where: { id: existing.id },
        data: {
          status: "active",
          accessStatus: "active",
          expiresAt: accessExpires,
        },
      });
    }
    return;
  }

  const accessExpires = new Date();
  accessExpires.setDate(accessExpires.getDate() + 365);

  await prisma.userModule.create({
    data: {
      userId,
      moduleId,
      status: "active",
      accessStatus: "active",
      startsAt: new Date(),
      expiresAt: accessExpires,
      source: "seed",
      sourcePayment: "seed",
      externalProductId: "prod_ssangyong",
    },
  });
}

async function seedEmailTemplates(prisma: PrismaClient) {
  const emailTemplates = [
    {
      slug: EMAIL_TEMPLATE_SLUGS.WELCOME,
      name: "Boas-vindas / acesso liberado",
      subject: "Seu acesso ao Power On Decode foi liberado",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso ao Power On Decode foi liberado.</p><p><strong>Ferramenta liberada:</strong> {{tool_name}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p><p>E-mail: {{email}}<br/>Senha inicial: {{password}}</p><p>Recomendamos alterar sua senha após o primeiro acesso.</p><p>Atenciosamente,<br/>Equipe Power On Decode</p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso ao Power On Decode foi liberado.\n\nFerramenta liberada:\n{{tool_name}}\n\nAcesse:\n{{login_url}}\n\nE-mail:\n{{email}}\n\nSenha inicial:\n{{password}}\n\nRecomendamos alterar sua senha após o primeiro acesso.\n\nAtenciosamente,\nEquipe Power On Decode`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.PASSWORD_RESET,
      name: "Redefinição de senha",
      subject: "Redefinição de senha — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Clique no link abaixo para redefinir sua senha:</p><p><a href="{{login_url}}">Redefinir senha</a></p>`,
      bodyText: `Olá, {{name}}.\n\nRedefinir senha: {{login_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.EXPIRES_30D,
      name: "Aviso — vence em 30 dias",
      subject: "Seu acesso vence em 30 dias — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso à ferramenta <strong>{{tool_name}}</strong> vence em {{expires_at}}.</p><p><a href="{{renewal_url}}">Renovar acesso</a></p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso à {{tool_name}} vence em {{expires_at}}.\nRenovar: {{renewal_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.EXPIRES_7D,
      name: "Aviso — vence em 7 dias",
      subject: "Seu acesso vence em 7 dias — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso à ferramenta <strong>{{tool_name}}</strong> vence em {{expires_at}}.</p><p><a href="{{renewal_url}}">Renovar acesso</a></p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso à {{tool_name}} vence em {{expires_at}}.\nRenovar: {{renewal_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.EXPIRES_1D,
      name: "Aviso — vence amanhã",
      subject: "Seu acesso vence amanhã — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso à ferramenta <strong>{{tool_name}}</strong> vence em {{expires_at}}.</p><p><a href="{{renewal_url}}">Renovar acesso</a></p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso à {{tool_name}} vence em {{expires_at}}.\nRenovar: {{renewal_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.EXPIRED,
      name: "Acesso vencido",
      subject: "Seu acesso venceu — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso à ferramenta <strong>{{tool_name}}</strong> venceu.</p><p><a href="{{renewal_url}}">Renovar acesso</a></p>`,
      bodyText: `Olá, {{name}}.\n\nSeu acesso à {{tool_name}} venceu.\nRenovar: {{renewal_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.RENEWAL_DISCOUNT,
      name: "Renovação com desconto",
      subject: "Renove seu acesso com desconto — Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Renove seu acesso à <strong>{{tool_name}}</strong> com condição especial.</p><p><a href="{{renewal_url}}">Renovar agora</a></p>`,
      bodyText: `Olá, {{name}}.\n\nRenove {{tool_name}}: {{renewal_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.ACCESS_GRANTED_NEW_USER,
      name: "Acesso liberado — novo usuário",
      subject: "Acesso liberado - Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Seu acesso ao Power On Decode foi liberado.</p><p><strong>Ferramentas liberadas:</strong> {{tool_name}}</p><p><strong>E-mail:</strong> {{email}}</p><p><strong>Senha inicial:</strong> {{password}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p>`,
      bodyText: `Olá, {{name}}.\n\nFerramentas liberadas: {{tool_name}}\nE-mail: {{email}}\nSenha inicial: {{password}}\nAcesse: {{login_url}}`,
    },
    {
      slug: EMAIL_TEMPLATE_SLUGS.ACCESS_GRANTED_EXISTING_USER,
      name: "Novo acesso liberado — usuário existente",
      subject: "Novo acesso liberado - Power On Decode",
      bodyHtml: `<p>Olá, {{name}}.</p><p>Novos acessos foram liberados na sua conta Power On Decode.</p><p><strong>Ferramentas liberadas:</strong> {{tool_name}}</p><p><a href="{{login_url}}">Acessar plataforma</a></p>`,
      bodyText: `Olá, {{name}}.\n\nFerramentas liberadas: {{tool_name}}\nAcesse: {{login_url}}`,
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      create: template,
      update: {
        name: template.name,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
        active: true,
      },
    });
  }
}

async function seedPwaSettings(prisma: PrismaClient) {
  await prisma.pwaSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      appName: "Power On Decode",
      shortName: "Decode",
      description:
        "Ferramentas técnicas automotivas para decode, reset, odômetro e checksum.",
      themeColor: "#10B981",
      backgroundColor: "#F5F7FA",
      promptText:
        "Instale o Power On Decode no seu computador para acessar suas ferramentas com mais facilidade.",
      active: true,
    },
    update: {},
  });
}
