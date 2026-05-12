/**
 * services/wordpress.ts
 * Busca posts publicados no WordPress (escoteirosdf.org.br) via REST API
 * e os normaliza para o formato usado no feed do app.
 */

const WP_BASE_URL = 'https://escoteirosdf.org.br';
const WP_API = `${WP_BASE_URL}/wp-json/wp/v2`;
const WP_USER = 'scoutlink@escoteirosdf.org.br';
const WP_APP_PASSWORD = 'GnZi 6NwV d7bQ 1HUR xzjc iI51';

function getWpAuthHeader(): string {
  const credentials = `${WP_USER}:${WP_APP_PASSWORD}`;
  return 'Basic ' + btoa(credentials);
}

// ── Tipos ────────────────────────────────────────────────

export interface WpPost {
  id: number;
  date_gmt: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    author?: Array<{ name: string }>;
  };
}

export interface NoticiaItem {
  id: string;            // "wp-{id}"
  titulo: string;
  descricao: string;
  categoria: 'Noticia';
  data_criacao: string;  // ISO UTC
  autor_nome: string | null;
  alvo_uel_nome: null;
  alvo_perfil_nome: null;
  link: string;
  imagem_url: string | null;
  fonte: 'wordpress';
}

// ── Utilitários ──────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePost(post: WpPost): NoticiaItem {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  const autor = post._embedded?.author?.[0];
  const excerpt = stripHtml(post.excerpt.rendered) ||
    stripHtml(post.content.rendered).slice(0, 300);
  const date = post.date_gmt.endsWith('Z') ? post.date_gmt : post.date_gmt + 'Z';

  return {
    id: `wp-${post.id}`,
    titulo: stripHtml(post.title.rendered),
    descricao: excerpt,
    categoria: 'Noticia',
    data_criacao: date,
    autor_nome: autor?.name ?? null,
    alvo_uel_nome: null,
    alvo_perfil_nome: null,
    link: post.link,
    imagem_url: media?.source_url ?? null,
    fonte: 'wordpress',
  };
}

// ── API pública ──────────────────────────────────────────

export interface FetchWpPostsOptions {
  perPage?: number;
  after?: string;
}

export async function fetchWordPressPosts(
  options: FetchWpPostsOptions = {}
): Promise<NoticiaItem[]> {
  const { perPage = 10, after } = options;

  const params = new URLSearchParams({
    per_page: String(perPage),
    status: 'publish',
    orderby: 'date',
    order: 'desc',
    _embed: 'wp:featuredmedia,author',
  });
  if (after) params.set('after', after);

  const res = await fetch(`${WP_API}/posts?${params}`, {
    headers: { Authorization: getWpAuthHeader() },
  });

  if (!res.ok) throw new Error(`WordPress API erro ${res.status}`);

  const posts: WpPost[] = await res.json();
  return posts.map(normalizePost);
}

export async function fetchNewWordPressPosts(after: string): Promise<NoticiaItem[]> {
  return fetchWordPressPosts({ after, perPage: 20 });
}
