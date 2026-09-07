import Link from 'next/link';
import { UI, pathForLocale, type Locale } from '@/lib/i18n';

/**
 * Language switcher.
 *
 * A plain link to the same page in the other language, not a dropdown and not
 * a JavaScript toggle: it works before hydration, it is one tab stop, and a
 * crawler follows it, which is how the Hindi pages get discovered.
 *
 * It shows the name of the language you would switch TO, written in that
 * language — someone who cannot read English needs to recognise "हिन्दी", not
 * the word "Hindi".
 */
export function LanguageSwitcher({ locale, pathname }: { locale: Locale; pathname: string }) {
  const other: Locale = locale === 'en' ? 'hi' : 'en';

  return (
    <Link
      href={pathForLocale(pathname, other)}
      className="lang-switch"
      hrefLang={other === 'hi' ? 'hi-IN' : 'en-IN'}
      aria-label={UI[locale].switchToLabel}
    >
      {UI[locale].switchTo}
    </Link>
  );
}
