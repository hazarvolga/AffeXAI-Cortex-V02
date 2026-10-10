import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React from "react";

type BreadcrumbItem = {
    name: string;
    href: string;
};

type BreadcrumbProps = {
    items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="bg-secondary/20">
            <div className="container mx-auto px-4">
                <ol className="flex items-center space-x-2 py-3 text-sm text-muted-foreground">
                    <li>
                        <Link href="/" className="hover:text-primary">Ana Sayfa</Link>
                    </li>
                    {items.map((item, index) => (
                        <li key={item.name} className="flex items-center">
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            <Link 
                                href={item.href} 
                                className={`ml-2 ${index === items.length - 1 ? 'font-medium text-foreground' : 'hover:text-primary'}`}
                                aria-current={index === items.length - 1 ? 'page' : undefined}
                            >
                                {item.name}
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>
        </nav>
    );
}
