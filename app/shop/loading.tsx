import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/shop/product-grid";

export default function ShopLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-4 h-10 w-64" />
      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="hidden space-y-3 lg:col-span-3 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div className="lg:col-span-9">
          <ProductGridSkeleton count={9} />
        </div>
      </div>
    </Container>
  );
}
