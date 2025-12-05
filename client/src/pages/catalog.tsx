import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Cpu, HardDrive, Users, Zap, Check, Cloud, Shield, Clock, Monitor, Terminal, Code } from "lucide-react";
import type { Product } from "@shared/schema";

function ProductIcon({ type }: { type: string }) {
  switch (type) {
    case "samp-linux":
      return <Terminal className="w-5 h-5" />;
    case "samp-windows":
      return <Monitor className="w-5 h-5" />;
    case "nodejs":
      return <Code className="w-5 h-5" />;
    default:
      return <Server className="w-5 h-5" />;
  }
}

function ProductTypeBadge({ type }: { type: string }) {
  const config = {
    "samp-linux": { label: "Linux", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    "samp-windows": { label: "Windows", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    "nodejs": { label: "NodeJS", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  };
  const { label, className } = config[type as keyof typeof config] || { label: type, className: "" };
  
  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <ProductIcon type={type} />
      {label}
    </Badge>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:border-primary/50" data-testid={`card-product-${product.id}`}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <ProductTypeBadge type={product.type} />
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {product.maxPlayers} Slots
          </Badge>
        </div>
        <CardTitle className="text-2xl" data-testid={`text-product-name-${product.id}`}>{product.name}</CardTitle>
        <p className="text-muted-foreground text-sm">{product.description}</p>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <div className="text-center py-4">
          <div className="text-4xl font-bold" data-testid={`text-product-price-${product.id}`}>
            {formatPrice(product.price)}
          </div>
          <div className="text-muted-foreground text-sm">/bulan</div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Cpu className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="font-semibold">{product.cpu}%</div>
            <div className="text-xs text-muted-foreground">CPU</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Server className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="font-semibold">{product.ram} MB</div>
            <div className="text-xs text-muted-foreground">RAM</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="font-semibold">{product.disk} MB</div>
            <div className="text-xs text-muted-foreground">Disk</div>
          </div>
        </div>
        
        <div className="space-y-2">
          {product.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full" size="lg" data-testid={`button-buy-${product.id}`}>
          <Link href={`/checkout/${product.id}`}>
            <Zap className="w-4 h-4 mr-2" />
            Pesan Sekarang
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="text-center py-4">
          <Skeleton className="h-10 w-32 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-11 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function CatalogPage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Cloud className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl">OrbitCloud</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cek Status
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Server Aktif Dalam Hitungan Detik
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Hosting Server <span className="text-primary">Otomatis</span> & Instan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Pilih paket, bayar via QRIS, server langsung aktif! Tanpa setup manual, 
              tanpa waiting list. Cocok untuk SAMP & Bot NodeJS.
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>QRIS Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Auto Deploy</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                <span>Panel Pterodactyl</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <>
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak ada produk</h3>
                  <p className="text-muted-foreground">Produk belum tersedia saat ini</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} OrbitCloud. Powered by Pterodactyl & Pakasir.</p>
        </div>
      </footer>
    </div>
  );
}
