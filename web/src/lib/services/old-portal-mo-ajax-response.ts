function truncateDetail(message: string, max = 8000): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max)}…`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Interpret `mo_ajax.php` body (same markup as `#result` on the legacy page).
 * Live checks: success `Записано товаров: N из M.`; error `<p style="color:red">…</p>`.
 */
export function interpretMoAjaxResponseBody(body: string): void {
  const raw = body.trim();
  if (!raw) {
    throw new Error('Пустой ответ от mo_ajax.php');
  }

  const lower = raw.toLowerCase();
  if (
    lower.includes('color:red') ||
    lower.includes('color: red') ||
    /style\s*=\s*["'][^"']*color\s*:\s*red/i.test(raw)
  ) {
    throw new Error(truncateDetail(stripHtml(raw)));
  }

  const plain = stripHtml(raw);

  const recorded = plain.match(/Записано\s+товаров:\s*(\d+)\s*из\s*(\d+)/i);
  if (recorded) {
    const n = parseInt(recorded[1], 10);
    const total = parseInt(recorded[2], 10);
    if (!Number.isFinite(n) || !Number.isFinite(total)) {
      throw new Error(
        `Некорректные числа в ответе: ${truncateDetail(plain.slice(0, 400))}`
      );
    }
    if (n !== total) {
      throw new Error(
        `Частичная загрузка на старый портал: записано ${n} из ${total}.`
      );
    }
    return;
  }

  throw new Error(
    `Не удалось разобрать ответ старого портала: ${truncateDetail(plain.slice(0, 500))}`
  );
}
