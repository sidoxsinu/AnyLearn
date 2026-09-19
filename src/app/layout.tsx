import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AnyLearn — Your Living Learning Path',
  description:
    'AnyLearn turns any goal into a structured, adaptive learning environment. Powered by Gemini AI with a mastery engine, adaptive roadmap, and verified content.',
  keywords: ['learning', 'AI tutor', 'adaptive learning', 'personalized course', 'Gemini AI'],
  openGraph: {
    title: 'AnyLearn',
    description: 'Your living, adaptive learning environment',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
