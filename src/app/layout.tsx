import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '山河同名 (Echoes of Heroes in Our Land) | 抗日战争英烈命名现代地名图鉴',
  description:
    '纪念以 1931–1945 年抗日战争英烈命名的中国现代县市、乡镇与城市街道的开源静态可视化史料档案。铭记历史，致敬英烈。',
  keywords: [
    '山河同名',
    '抗日战争',
    '抗战英烈',
    '地名历史',
    '左权县',
    '靖宇县',
    '尚志市',
    '张自忠路',
    '民族英雄',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full dark">
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased selection:bg-cinnabar selection:text-white">
        {children}
      </body>
    </html>
  );
}
