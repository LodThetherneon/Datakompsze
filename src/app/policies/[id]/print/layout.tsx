export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body style={{ margin: 0, padding: 0, background: '#fff' }}>
        {children}
      </body>
    </html>
  )
}
