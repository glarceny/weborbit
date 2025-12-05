import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cloud, Search, Loader2, CheckCircle2, Clock, AlertCircle, XCircle, Server } from "lucide-react";
import type { Order } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { label: "Menunggu Pembayaran", icon: Clock, className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    processing: { label: "Memproses Server", icon: Loader2, className: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse" },
    completed: { label: "Server Aktif", icon: CheckCircle2, className: "bg-green-500/10 text-green-500 border-green-500/20" },
    failed: { label: "Gagal", icon: XCircle, className: "bg-red-500/10 text-red-500 border-red-500/20" },
    expired: { label: "Expired", icon: AlertCircle, className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  };
  
  const { label, icon: Icon, className } = config[status as keyof typeof config] || config.pending;
  
  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <Icon className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}

export default function StatusPage() {
  const [, navigate] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["/api/orders", searchId],
    enabled: searchId.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      setSearchId(orderId.trim());
    }
  };

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

      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Cek Status Order</h1>
            <p className="text-muted-foreground">
              Masukkan Order ID untuk melihat status pesanan Anda
            </p>
          </div>

          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan Order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1"
                data-testid="input-order-id"
              />
              <Button type="submit" disabled={!orderId.trim() || isLoading} data-testid="button-search">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>

          {searchId && (
            <>
              {isLoading && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Mencari order...</p>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Server className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">Order Tidak Ditemukan</h3>
                    <p className="text-sm text-muted-foreground">
                      Pastikan Order ID yang Anda masukkan benar
                    </p>
                  </CardContent>
                </Card>
              )}

              {order && !isLoading && (
                <Card data-testid={`card-order-${order.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <StatusBadge status={order.status} />
                    </div>
                    <CardDescription>
                      Server: {order.serverName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Email</div>
                        <div className="font-medium">{order.customerEmail}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Username</div>
                        <div className="font-medium">{order.customerUsername}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            minimumFractionDigits: 0,
                          }).format(order.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dibuat</div>
                        <div className="font-medium">
                          {new Date(order.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </div>
                    </div>

                    {order.status === "completed" && (
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/client/${order.id}`)}
                        data-testid="button-view-server"
                      >
                        <Server className="w-4 h-4 mr-2" />
                        Lihat Detail Server
                      </Button>
                    )}

                    {order.status === "pending" && (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => navigate(`/checkout/${order.productId}`)}
                        data-testid="button-continue-payment"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Lanjutkan Pembayaran
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
