export default function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AuraDeploy</p>
        <p>Made for creators and communities.</p>
      </div>
    </footer>
  )
}
