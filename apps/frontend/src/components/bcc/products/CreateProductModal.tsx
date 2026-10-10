import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { commerceService } from "@/lib/api/commerceService";
import { productCreateInput } from "./product-contract";

interface CreateProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateProductModal({ isOpen, onClose, onSuccess }: CreateProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await commerceService.createProduct(productCreateInput(name, description, price));
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create product", error);
            setError(error instanceof Error ? error.message : "Product could not be created.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#121212] border border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-mono uppercase tracking-widest text-[#9df425]">Create New SKU</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right text-xs uppercase tracking-wider text-white/60">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3 bg-white/5 border-white/10 text-white font-mono text-xs focus:border-[#9df425]"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="desc" className="text-right text-xs uppercase tracking-wider text-white/60">
                            Desc
                        </Label>
                        <Input
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3 bg-white/5 border-white/10 text-white font-mono text-xs focus:border-[#9df425]"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right text-xs uppercase tracking-wider text-white/60">
                            Monthly price ($)
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            max="99999999.99"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="col-span-3 bg-white/5 border-white/10 text-white font-mono text-xs focus:border-[#9df425]"
                            required
                        />
                    </div>
                    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={loading} className="bg-[#9df425] text-black hover:bg-white font-bold uppercase tracking-widest text-xs">
                            {loading ? "Forging..." : "Create Product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
