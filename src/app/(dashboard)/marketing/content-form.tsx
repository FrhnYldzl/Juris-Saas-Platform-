"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Field, Input, TextArea, Select, FormCard, FormRow, FormActions, FormError,
} from "@/components/ui/form";
import { createContentItem, type ContentState } from "./actions";

export function ContentForm() {
  const [state, formAction, pending] = useActionState<ContentState, FormData>(
    createContentItem,
    { ok: false },
  );
  const err = (f: string) => state.fieldErrors?.[f]?.[0];

  return (
    <form action={formAction}>
      <FormCard>
        <Field label="Başlık" error={err("title")} required>
          <Input
            name="title"
            placeholder="Örn: KVKK Madde 12 uygulaması — 2026 güncel rehber"
            required
          />
        </Field>

        <Field label="Özet / Giriş" error={err("summary")}>
          <TextArea
            name="summary"
            rows={3}
            placeholder="Kısa özet (arama motorlarında görünür)"
          />
        </Field>

        <FormRow cols={3}>
          <Field label="Kanal" required>
            <Select name="channel" defaultValue="BLOG">
              <option value="BLOG">Blog</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="X">X (Twitter)</option>
              <option value="NEWSLETTER">Bülten</option>
              <option value="PODCAST">Podcast</option>
              <option value="VIDEO">Video</option>
              <option value="OTHER">Diğer</option>
            </Select>
          </Field>
          <Field label="Durum">
            <Select name="status" defaultValue="IDEA">
              <option value="IDEA">Fikir</option>
              <option value="DRAFT">Taslak</option>
              <option value="REVIEW">Onay Bekliyor</option>
              <option value="SCHEDULED">Zamanlandı</option>
              <option value="PUBLISHED">Yayında</option>
            </Select>
          </Field>
          <Field label="Yazar" hint="Av. Adı Soyadı">
            <Input name="author" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Yayın Tarihi" hint="Planlanan ya da yayınlandığı gün">
            <Input type="date" name="publishAt" />
          </Field>
          <Field label="Yayın URL" error={err("url")} hint="Yayına girince ekle">
            <Input type="url" name="url" placeholder="https://juris.com.tr/blog/…" />
          </Field>
        </FormRow>

        <Field label="Etiketler" hint="Virgülle ayır: KVKK, sözleşme, tahkim">
          <Input name="tags" />
        </Field>

        {state.error && <FormError>{state.error}</FormError>}

        <FormActions>
          <Link href="/marketing" className="btn btn-ghost">İptal</Link>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Kaydediliyor…" : "İçeriği Oluştur"}
          </button>
        </FormActions>
      </FormCard>
    </form>
  );
}
