import { cn } from "@/lib/utils";

type PageHeroProps = {
    title: string;
    subtitle?: string;
    backgroundImage?: string;
    className?: string;
}

export function PageHero({ title, subtitle, backgroundImage, className }: PageHeroProps) {
    const bgStyle = backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {};
    
    return (
        <section 
            className={cn(
                "relative py-20 md:py-28 text-center bg-secondary/30 border-b",
                backgroundImage && "bg-cover bg-center",
                className
            )} 
            style={bgStyle}
        >
            {backgroundImage && <div className="absolute inset-0 bg-black/50" />}
            <div className={cn(
                "container mx-auto px-4 relative z-10",
                backgroundImage && "text-white"
            )}>
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-headline">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-foreground/80">
                        {subtitle}
                    </p>
                )}
            </div>
        </section>
    )
}
