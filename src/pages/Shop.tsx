import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, ShoppingBag, Tag, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  seller: string;
  rating: number;
  isFavorite: boolean;
}

const mockProducts: Product[] = [
  {
    id: "prod-1",
    title: "Handmade Basket",
    price: 450,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=basket",
    seller: "ሳራ ተክሌ",
    rating: 4.5,
    isFavorite: false,
  },
  {
    id: "prod-2",
    title: "Ethiopian Coffee",
    price: 850,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=coffee",
    seller: "አበበ ከበደ",
    rating: 4.8,
    isFavorite: true,
  },
  {
    id: "prod-3",
    title: "Traditional Dress",
    price: 2500,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=dress",
    seller: "መሰረት ገብረ",
    rating: 4.2,
    isFavorite: false,
  },
  {
    id: "prod-4",
    title: "Leather Bag",
    price: 1200,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=bag",
    seller: "ዳዊት አለማየሁ",
    rating: 4.6,
    isFavorite: false,
  },
  {
    id: "prod-5",
    title: "Habesha Kemis",
    price: 3500,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=kemis",
    seller: "ቤዛዊት ሞገስ",
    rating: 4.9,
    isFavorite: true,
  },
  {
    id: "prod-6",
    title: "Spice Collection",
    price: 680,
    currency: "ETB",
    image: "https://api.dicebear.com/7.x/shapes/svg?seed=spice",
    seller: "ሰላም ታደሰ",
    rating: 4.3,
    isFavorite: false,
  },
];

const Shop = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState(mockProducts);

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Shop</h1>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0 rounded-full"
            />
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl overflow-hidden border border-border group"
            >
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-16 h-16 opacity-50 group-hover:scale-110 transition-transform"
                />
                <button
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/60 backdrop-blur-sm"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      product.isFavorite
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>
              <div className="p-3">
                <h3 className="font-medium text-foreground text-sm truncate">
                  {product.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate mb-1">
                  {product.seller}
                </p>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    {product.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary font-semibold text-sm">
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-4 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 z-20"
        onClick={() => {/* TODO: Add product */}}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Shop;
