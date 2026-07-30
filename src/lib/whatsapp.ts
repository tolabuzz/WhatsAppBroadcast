/**
 * Builds a WhatsApp click-to-chat URL. This is WhatsApp's public, ToS-compliant
 * "click to chat" API — it opens a chat with the pre-filled text for the user
 * to review and send manually. No message is sent automatically.
 * https://faq.whatsapp.com/425247423114725 (Click to Chat)
 */
export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  const text = encodeURIComponent(message);
  if (phoneDigits) {
    return `https://wa.me/${phoneDigits}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

export function openWhatsApp(phoneDigits: string, message: string): void {
  const url = buildWhatsAppLink(phoneDigits, message);
  window.open(url, "_blank", "noopener,noreferrer");
}
