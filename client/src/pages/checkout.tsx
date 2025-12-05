import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Cloud, Loader2, Server, Cpu, HardDrive, Users, QrCode, Clock, CheckCircle2, AlertCircle, Shield, Monitor, Terminal, Code } from "lucide-react";
import { createOrderSchema, type Product, type Order, type CreateOrderInput } from "@shared/schema";
import QRCodeDisplay from "@/components/qr-code-display";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

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

interface CheckoutFormProps {
  product: Product;
  onOrderCreated: (order: Order) => void;
}

function CheckoutForm({ product, onOrderCreated }: CheckoutFormProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      productId: product.id,
      customerEmail: "",
      customerUsername: "",
      serverName: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: (order: Order) => {
      onOrderCreated(order);
      toast({
        title: "Order berhasil dibuat!",
        description: "Silakan scan QR Code untuk melakukan pembayaran.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateOrderInput) => {
    createOrderMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ProductIcon type={product.type} />
              </div>
              <div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <Cpu className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="font-medium">{product.cpu}%</div>
              </div>
              <div>
                <Server className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="font-medium">{product.ram} MB</div>
              </div>
              <div>
                <HardDrive className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="font-medium">{product.disk} MB</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Pembelian</CardTitle>
            <CardDescription>Masukkan informasi untuk server Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="email@example.com" 
                      type="email"
                      data-testid="input-email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customerUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username Panel</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="johndoe" 
                      data-testid="input-username"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="serverName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Server</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="My Awesome Server" 
                      data-testid="input-server-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={createOrderMutation.isPending}
          data-testid="button-generate-qr"
        >
          {createOrderMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Generate QR Code
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>Pembayaran aman via QRIS</span>
        </div>
      </form>
    </Form>
  );
}

interface PaymentViewProps {
  order: Order;
  product: Product;
}

function PaymentView({ order: initialOrder, product }: PaymentViewProps) {
  const [, navigate] = useLocation();
  const [order, setOrder] = useState(initialOrder);
  const [countdown, setCountdown] = useState(0);

  const { data: orderStatus } = useQuery<Order>({
    queryKey: ["/api/orders", order.id, "status"],
    refetchInterval: order.status === "pending" ? 3000 : false,
    enabled: order.status === "pending",
  });

  useEffect(() => {
    if (orderStatus) {
      setOrder(orderStatus);
      if (orderStatus.status === "completed") {
        setCountdown(3);
      }
    }
  }, [orderStatus]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && order.status === "completed") {
      navigate(`/client/${order.id}`);
    }
  }, [countdown, order.status, order.id, navigate]);

  const expiresAt = new Date(order.expiresAt);
  const now = new Date();
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));
  const remainingSeconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  if (order.status === "completed") {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 animate-pulse">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pembayaran Berhasil!</CardTitle>
          <CardDescription>
            Server Anda sedang diaktifkan. Redirecting dalam {countdown}...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Menyiapkan server...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "processing") {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Menyiapkan Server</CardTitle>
          <CardDescription>
            Pembayaran diterima! Server Anda sedang dibuat...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Proses ini biasanya membutuhkan waktu 10-30 detik.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "expired" || order.status === "failed") {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {order.status === "expired" ? "Pembayaran Expired" : "Pembayaran Gagal"}
          </CardTitle>
          <CardDescription>
            {order.status === "expired" 
              ? "Waktu pembayaran telah habis. Silakan buat order baru."
              : "Terjadi kesalahan saat memproses pembayaran."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" data-testid="button-back-catalog">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Katalog
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{formatPrice(order.amount)}</CardTitle>
          <CardDescription>Scan QR Code untuk membayar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <QRCodeDisplay 
            value={order.qrCode || ""} 
            status={order.status}
          />
          
          <div className="flex items-center justify-center gap-2 text-amber-500">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">
              {String(remainingMinutes).padStart(2, "0")}:{String(remainingSeconds).padStart(2, "0")}
            </span>
          </div>

          <div className="text-center">
            <Badge variant="outline" className="gap-1.5 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Menunggu Pembayaran
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Cara Pembayaran</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Buka aplikasi e-wallet atau mobile banking Anda</p>
          <p>2. Pilih menu Scan QR atau QRIS</p>
          <p>3. Arahkan kamera ke QR Code di atas</p>
          <p>4. Konfirmasi pembayaran</p>
          <p>5. Server akan aktif otomatis setelah pembayaran berhasil</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
  });

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
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>Produk Tidak Ditemukan</CardTitle>
            <CardDescription>
              Produk yang Anda cari tidak tersedia atau sudah dihapus.
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
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
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {order ? (
          <PaymentView order={order} product={product} />
        ) : (
          <CheckoutForm product={product} onOrderCreated={setOrder} />
        )}
      </main>
    </div>
  );
}
