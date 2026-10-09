"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Image = { id: string; url: string };

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

// Завантаження йде прямим fetch з браузера на /api/..., а не через Server
// Action: у Server Actions за замовчуванням ліміт тіла запиту 1 МБ, а
// картинки тут — до 5 МБ. Кука авторизації прикладається сама (той самий
// origin за nginx). Бекенд усе одно перевіряє тип і розмір сам — перевірка
// тут лише для швидкого відгуку.
export function ImagesManager({ productId, images }: { productId: string; images: Image[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  async function request(path: string, init: RequestInit): Promise<boolean> {
    const res = await fetch(`/api/products/${productId}/images${path}`, init);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Запит не вдався (${res.status})`);
      return false;
    }
    startRefresh(() => router.refresh());
    return true;
  }

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    if (file.size > MAX_SIZE) {
      setError("Файл завеликий. Максимум 5 МБ");
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    await request("", { method: "POST", body: form });
    setUploading(false);
  }

  async function onDelete(imageId: string) {
    setError(null);
    await request(`/${imageId}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ще немає зображень</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
              {/* Звичайний <img>: URL ведуть у зовнішнє сховище (R2/MinIO), а
                  next/image потребував би remotePatterns і сам тягнув би файл
                  із боку контейнера, де "localhost" — це не nginx. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Видалити зображення"
                disabled={isRefreshing}
                onClick={() => onDelete(image.id)}
                className="absolute right-1.5 top-1.5 rounded bg-background/90 p-1 text-muted-foreground opacity-0 shadow transition hover:text-destructive focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} onChange={onPick} className="hidden" />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="size-4" />
        {uploading ? "Завантажуємо…" : "Додати зображення"}
      </Button>
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP або GIF, до 5 МБ</p>
    </div>
  );
}
