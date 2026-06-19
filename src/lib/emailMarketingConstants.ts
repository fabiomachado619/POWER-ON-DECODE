export const CAMPAIGN_VARIABLES =
  "{{name}}, {{email}}, {{login_url}}, {{tool_name}}, {{category}}, {{purchase_url}}, {{renewal_url}}";

export const DEFAULT_CAMPAIGN_HTML = `<h2>Novo procedimento disponível</h2>
<p>Olá, {{name}}.</p>
<p>Acabamos de adicionar uma nova ferramenta na plataforma Power On Decode:</p>
<p><strong>{{tool_name}}</strong></p>
<p>Acesse sua área para conferir:</p>
<p><a href="{{login_url}}">Entrar na plataforma</a></p>
<p>Equipe Power On Decode</p>`;

export const DEFAULT_CAMPAIGN_TEXT = `Olá, {{name}}.

Acabamos de adicionar uma nova ferramenta na plataforma Power On Decode:

{{tool_name}}

Acesse:
{{login_url}}

Equipe Power On Decode`;

export const DEFAULT_CAMPAIGN_SUBJECT =
  "Novo procedimento disponível no Power On Decode";

export const EMAIL_CAMPAIGN_AUDIENCES = [
  "all",
  "active",
  "expired",
  "expiring_soon",
  "has_tool",
  "missing_tool",
  "category",
] as const;

export type EmailCampaignAudience = (typeof EMAIL_CAMPAIGN_AUDIENCES)[number];

export const EMAIL_CAMPAIGN_STATUSES = [
  "draft",
  "sending",
  "sent",
  "failed",
] as const;
