const PUBLIC_IMAGE = (file: string) => `/images/${file}`

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  dell: PUBLIC_IMAGE('dell.jpg'),
  dell16: PUBLIC_IMAGE('dell16.jpg'),
  hp14s: PUBLIC_IMAGE('hp14s.jpg'),
  hp360: PUBLIC_IMAGE('hp360.jpg'),
  lenovoloq: PUBLIC_IMAGE('lenovoloq.jpg'),
  clavier: PUBLIC_IMAGE('clavier.jpg'),
  clavier2: PUBLIC_IMAGE('clavier2.jpg'),
  clavier3: PUBLIC_IMAGE('clavier3.jpg'),
  clavier4: PUBLIC_IMAGE('clavier4.jpg'),
  souris: PUBLIC_IMAGE('souris.jpg'),
  souris2: PUBLIC_IMAGE('souris2.jpg'),
  souris3: PUBLIC_IMAGE('souris3.jpg'),
  souris4: PUBLIC_IMAGE('souris4.jpg'),
  souris5: PUBLIC_IMAGE('souris5.jpg'),
  tapissouris: PUBLIC_IMAGE('tapissouris.jpg'),
  tapissouris2: PUBLIC_IMAGE('tapissouris2.jpg'),
  tapissouris3: PUBLIC_IMAGE('tapissouris3.jpg'),
  ram1: PUBLIC_IMAGE('ram1.jpg'),
  ram2: PUBLIC_IMAGE('ram2.jpg'),
  ram3: PUBLIC_IMAGE('ram3.jpg'),
  ram4: PUBLIC_IMAGE('ram4.jpg'),
  casque: PUBLIC_IMAGE('casque.jpg'),
  casque2: PUBLIC_IMAGE('casque2.jpg'),
  windows11: PUBLIC_IMAGE('windows11.jpg'),
  office2021: PUBLIC_IMAGE('office2021.jpg'),
  office2024: PUBLIC_IMAGE('office2024.jpg'),
  windows11office2021: PUBLIC_IMAGE('windows11office2021.jpg'),
  windows11office2024: PUBLIC_IMAGE('windows11office2024.jpg'),
}

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  computers: PUBLIC_IMAGE('dell.jpg'),
  accessories: PUBLIC_IMAGE('souris.jpg'),
  components: PUBLIC_IMAGE('ram1.jpg'),
  networking: PUBLIC_IMAGE('hp14s.jpg'),
  software: PUBLIC_IMAGE('windows11.jpg'),
  robotics: PUBLIC_IMAGE('hp360.jpg'),
}

const LOGO_IMAGE = PUBLIC_IMAGE('logo.jpg')

const HERO_IMAGE = PUBLIC_IMAGE('dell16.jpg')

const SERVICE_IMAGE_MAP: Record<string, string> = {
  repair: PUBLIC_IMAGE('dell.jpg'),
  sales: PUBLIC_IMAGE('clavier.jpg'),
  support: PUBLIC_IMAGE('hp14s.jpg'),
  robotics: PUBLIC_IMAGE('hp360.jpg'),
}

type ProductLike = {
  name?: string | null
  sku?: string | null
  slug?: string | null
  brand?: string | null
  image?: string | null
  category_name?: string | null
}

function normalizeKey(value: unknown): string {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

function pickFromMap(map: Record<string, string>, candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    const key = normalizeKey(candidate)
    if (!key) continue
    const direct = map[key]
    if (direct) return direct
    for (const mapKey of Object.keys(map)) {
      if (key.includes(mapKey) || mapKey.includes(key)) {
        return map[mapKey]
      }
    }
  }
  return undefined
}

export function resolveProductImage(product: ProductLike): string {
  if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
    return product.image
  }
  const mapped = pickFromMap(PRODUCT_IMAGE_MAP, [product.sku, product.name, product.brand, product.slug])
  if (mapped) return mapped
  return PUBLIC_IMAGE('dell.jpg')
}

export function resolveCategoryImage(category: { name?: string | null; slug?: string | null }): string {
  const mapped = pickFromMap(CATEGORY_IMAGE_MAP, [category.slug, category.name])
  if (mapped) return mapped
  return PUBLIC_IMAGE('dell.jpg')
}

export function resolveServiceImage(service: { title?: string | null; slug?: string | null }): string {
  const mapped = pickFromMap(SERVICE_IMAGE_MAP, [service.slug, service.title])
  if (mapped) return mapped
  return PUBLIC_IMAGE('dell.jpg')
}

export { PUBLIC_IMAGE, PRODUCT_IMAGE_MAP, CATEGORY_IMAGE_MAP, LOGO_IMAGE, HERO_IMAGE, SERVICE_IMAGE_MAP }
