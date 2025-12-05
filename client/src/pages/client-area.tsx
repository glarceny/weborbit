import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Cloud, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Server, 
  Globe,
  User,
  Key,
  Network,
  MessageCircle,
  HelpCircle
} from "lucide-react";
import type { Order, Product } from "@shared/schema";

function CopyButton({ value, label }: { value: string; label: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: "Berhasil disalin!",
        description: `${label} telah disalin ke clipboard.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Gagal menyalin",
        description: "Tidak dapat menyalin ke clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleCopy}
      data-testid={`button-copy-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      {copied ? (
        <CheckCircle2 className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );
}

function CredentialField({ 
  icon: Icon, 
  label, 
  value, 
  secret = false,
  testId 
}: { 
  icon: typeof Server; 
  label: string; 
  value: string; 
  secret?: boolean;
  testId: string;
}) {
  const [visible, setVisible] = useState(!secret);

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <div className="p-2 rounded-lg bg-background">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-mono text-sm truncate" data-testid={testId}>
          {secret && !visible ? "••••••••••••" : value}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {secret && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisible(!visible)}
            data-testid={`button-toggle-${label.toLowerCase()}`}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        )}
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}

export default function ClientAreaPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
  });

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ["/api/products", order?.productId],
    enabled: !!order?.productId,
  });

  const isLoading = orderLoading || productLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-primary" />
              <span className="font-bold">OrbitCloud</span>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!order || order.status !== "completed" || !order.serverCredentials) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Server Tidak Ditemukan</CardTitle>
            <CardDescription>
              Order tidak ditemukan atau server belum aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild data-testid="button-back-home">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Katalog
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { serverCredentials } = order;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-primary" />
              <span className="font-bold">OrbitCloud</span>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500 text-white gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Server Aktif
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Server Anda Telah Aktif!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Selamat! Server <span className="font-semibold">{order.serverName}</span> berhasil dibuat. 
              Gunakan kredensial berikut untuk mengakses panel.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Detail Server
              </CardTitle>
              <CardDescription>
                Informasi akses panel dan koneksi server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CredentialField
                icon={Globe}
                label="Panel URL"
                value={serverCredentials.panelUrl}
                testId="text-panel-url"
              />
              <CredentialField
                icon={User}
                label="Username"
                value={serverCredentials.username}
                testId="text-username"
              />
              <CredentialField
                icon={Key}
                label="Password"
                value={serverCredentials.password}
                secret
                testId="text-password"
              />
              <CredentialField
                icon={Network}
                label="Server IP:Port"
                value={`${serverCredentials.serverIp}:${serverCredentials.serverPort}`}
                testId="text-server-ip"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild size="lg" className="w-full" data-testid="button-access-panel">
              <a href={serverCredentials.panelUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Akses Panel
              </a>
            </Button>
            <Button variant="outline" asChild size="lg" className="w-full" data-testid="button-download-client">
              <a href="https://sa-mp.com/download.php" target="_blank" rel="noopener noreferrer">
                <Server className="w-4 h-4 mr-2" />
                Download SA-MP Client
              </a>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Butuh Bantuan?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="w-full justify-start" data-testid="button-discord">
                <MessageCircle className="w-4 h-4 mr-2" />
                Join Discord
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-whatsapp">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Support
              </Button>
            </CardContent>
          </Card>

          {product && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Ringkasan Paket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.ram} MB RAM • {product.disk} MB Disk • {product.cpu}% CPU
                    </div>
                  </div>
                  <Badge variant="secondary" data-testid="text-order-id">
                    Order #{order.id.slice(0, 8)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="border-t py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} OrbitCloud. Powered by Pterodactyl & Pakasir.</p>
        </div>
      </footer>
    </div>
  );
}
